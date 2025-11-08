// Central PDF HTML generator.
// Renders a generic, print-ready HTML for all form payloads (single exporter).

import generateBakeryCleaningChecklistHtml from './htmlGenerators/generateBakeryCleaningChecklistHtml';
import captureAndExport from './captureAndExport';



export default function generatePdfHtml(formData = {}, options = {}) {
  // Single generic renderer handles all payload shapes now.

  // Generic renderer
  const title = escapeHtml(formData.title || formData.name || 'Saved Form');
  const date = escapeHtml(formData.date || formData.issueDate || new Date().toLocaleDateString());

  // Prefer rendering user-visible field containers if present (values/fields/meta)
  const source = formData.values || formData.fields || formData.meta || formData || {};
  // Keys commonly rendered outside the main tables in presentational components
  const headerKeys = ['title', 'name', 'date', 'issueDate', 'shift', 'location', 'verifiedBy', 'verifiedBySign', 'complexManager', 'complexManagerSign', 'manager', 'verified', 'frequency', 'baristaSign'];

  // Build key/value rows for top-level properties (including images/signatures). Keep them separate
  // from array tables so header fields and standalone signatures are always rendered.
  const kvRows = [];
  try {
    const excludedKv = new Set(['id', '_id', 'formUUID', 'formId', 'tableWidth', '_tableWidth', 'templateVersion', 'formType', 'version', 'savedAt', 'payloadHtmlFallback', 'logoDataUri', 'meta', 'values', 'fields', 'layoutHints', 'assets', 'formData', 'handlers']);

    // Some presentational components render fields from nested objects like metadata, verification or meta.
    // Prefer a small, curated set of top-level header fields so header/footer text (shift, location, verifiedBy, manager) is shown.
    const headerKeys = ['title', 'name', 'date', 'issueDate', 'shift', 'location', 'verifiedBy', 'verifiedBySign', 'complexManager', 'complexManagerSign', 'manager', 'verified'];
    const nestedSources = [source, source.meta || {}, source.metadata || {}, source.verification || {}, source.verificationMetadata || {}, source.formData || {}];

    // Collect header-like fields first (preserve order in headerKeys)
    headerKeys.forEach((hk) => {
      for (let s of nestedSources) {
        if (s && Object.prototype.hasOwnProperty.call(s, hk) && s[hk] != null) {
          const v = s[hk];
          const html = renderCell(v, hk);
          kvRows.push({ k: hk, html });
          break;
        }
      }
    });

    // Then add other scalar top-level fields (excluding large internal keys)
    Object.keys(source || {}).forEach((k) => {
      // Avoid repeating fields that are explicitly shown elsewhere (title/date)
      if (k === 'title' || k === 'name' || k === 'date' || k === 'issueDate') return;
      // Exclude internal or debug keys
      if (excludedKv.has(k)) return;
      if (k.startsWith('_') || k.toLowerCase().includes('uuid') || k.toLowerCase().includes('template')) return;
      // Skip if already included in headerKeys
      if (headerKeys.includes(k)) return;
      const v = source[k];
      if (v == null) return;
      // For scalars and images/signatures render using renderCell so images are shown
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'object' && !Array.isArray(v))) {
        // renderCell will convert booleans/images/objects into appropriate HTML
        const html = renderCell(v, k);
        kvRows.push({ k, html });
      }
    });
  } catch (e) {
    // ignore
  }

  // Render all array-of-object tables found in the source (some forms have multiple tables)
  let arrayTableHtml = '';
  try {
    const excludedCols = new Set(['id', '_id', 'formUUID', 'formId', 'tableWidth', '_tableWidth', 'templateVersion', 'formType']);
    const arrayKeys = Object.keys(source || {}).filter(k => Array.isArray(source[k]) && source[k].length && typeof source[k][0] === 'object');
    const tableHtmlParts = [];
    arrayKeys.forEach((arrayKey) => {
      const arr = source[arrayKey] || [];
      // Prefer column order from the first non-empty row (preserves author order). Append any extra keys afterwards.
      const firstRow = arr.find(r => r && typeof r === 'object') || {};
      const firstCols = Object.keys(firstRow).filter(c => !excludedCols.has(c));
      const otherCols = Array.from(new Set(arr.flatMap(o => Object.keys(o || {})))).filter(c => !excludedCols.has(c) && !firstCols.includes(c));
      const baseCols = firstCols.concat(otherCols);

      // Detect expandable columns (object-valued like checks)
      const expansions = {};
      baseCols.forEach((col) => {
        const innerKeySets = arr.map(r => (r && r[col] && typeof r[col] === 'object' && !Array.isArray(r[col]) ? Object.keys(r[col]).map(String) : null)).filter(Boolean);
        if (innerKeySets.length === 0) return;
        const normalized = innerKeySets.map(keys => keys.join('|'));
        const counts = {};
        normalized.forEach(k => counts[k] = (counts[k] || 0) + 1);
        const common = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
        if (!common) return;
        const [commonKeyStr, freq] = common;
        const keyList = commonKeyStr.split('|').filter(Boolean);
        if (freq >= Math.max(1, Math.floor(arr.length / 2)) && keyList.length > 0) {
          expansions[col] = keyList;
        }
      });

      // Determine boolean-majority columns
      const finalCols = [];
      const booleanColumnCandidates = {};
      baseCols.forEach((col) => {
        let boolCount = 0, total = 0;
        arr.forEach(r => {
          const v = r && Object.prototype.hasOwnProperty.call(r, col) ? r[col] : undefined;
          if (v !== undefined) {
            total++;
            if (typeof v === 'boolean') boolCount++;
          }
        });
        booleanColumnCandidates[col] = (total > 0 && boolCount / total >= 0.5);
      });
      baseCols.forEach((col) => {
        if (expansions[col]) {
          expansions[col].forEach((inner) => finalCols.push({ parent: col, inner, narrow: false }));
        } else {
          finalCols.push({ parent: col, inner: null, narrow: !!booleanColumnCandidates[col] });
        }
      });

      const th = finalCols.map(des => (des.inner ? `<th>${escapeHtml(des.inner)}</th>` : `<th class="${des.narrow ? 'checkbox-col' : ''}">${escapeHtml(des.parent)}</th>`)).join('');

      const rows = arr.map(row => `<tr>${finalCols.map(des => {
        if (des.inner) {
          const parentVal = row && row[des.parent];
          const cellVal = parentVal && typeof parentVal === 'object' && !Array.isArray(parentVal) ? parentVal[des.inner] : null;
          if (typeof cellVal === 'boolean') return `<td>${cellVal ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>'}</td>`;
          return `<td>${escapeHtml(cellVal)}</td>`;
        }
        return `<td class="${des.narrow ? 'checkbox-col' : ''}">${renderCell(row[des.parent], des.parent)}</td>`;
      }).join('')}</tr>`).join('\n');

      tableHtmlParts.push(`<h3>${escapeHtml(arrayKey)}</h3><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`);
    });

    arrayTableHtml = tableHtmlParts.join('\n');
  } catch (e) {
    // ignore table rendering errors
  }

  // Render header-like fields in a controlled bordered block so signatures and header text
  // outside tables appear inside fixed boxes similar to the app UI. Remaining kv rows render below.
  const headerRowEntries = kvRows.filter(r => headerKeys.includes(r.k));
  const otherRowEntries = kvRows.filter(r => !headerKeys.includes(r.k));

  const headerHtml = headerRowEntries.length ? `<table class="header-table" style="width:100%;border-collapse:collapse;margin-top:8px;"><tbody>${headerRowEntries.map(r => {
    // For signature-like keys ensure a fixed-size bordered cell for visual parity
    const isSig = /sig|sign|signature|verified|barista|manager/i.test(r.k);
    if (isSig) {
      return `<tr><td style="width:20%;vertical-align:top;padding:6px;border:1px solid #ddd"><strong>${escapeHtml(r.k)}</strong></td><td style="padding:6px;border:1px solid #ddd"><div style="display:flex;align-items:center;justify-content:flex-start;gap:12px">${typeof r.html === 'string' && r.html.includes('img') ? `<div style=\"border:1px solid #ccc;padding:6px;display:inline-block;\">${r.html}</div>` : `<div style=\"width:160px;height:80px;border:1px solid #ccc;background:#fff;display:inline-block;\"></div>`}</div></td></tr>`;
    }
    return `<tr><td style="width:20%;vertical-align:top;padding:6px;border:1px solid #ddd"><strong>${escapeHtml(r.k)}</strong></td><td style="padding:6px;border:1px solid #ddd">${r.html}</td></tr>`;
  }).join('')}</tbody></table>` : '';

  const otherKvHtml = otherRowEntries.length ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;"><tbody>${otherRowEntries.map(r => `<tr><td style="width:30%"><strong>${escapeHtml(r.k)}</strong></td><td>${r.html}</td></tr>`).join('')}</tbody></table>` : '';

  const kvHtml = headerHtml + otherKvHtml;

  const logoDataUri = formData.logoDataUri || options.logoDataUri || '';

  // Default inline SVG logo used when no logoDataUri is provided.
  const defaultLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="36" viewBox="0 0 120 36"><rect width="120" height="36" fill="#0B4F8C" rx="4"/><text x="12" y="24" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#fff">Bravo</text></svg>`;

  const styles = `
    <style>
      /* Canonical A4 landscape print sizing (width x height in mm) */
      @page { size: 297mm 210mm; margin: 10mm; }
      html,body{margin:0;padding:0;background:#fff}
      body{font-family: Arial, Helvetica, sans-serif; font-size:10pt;color:#111;width:297mm}
      .page{box-sizing:border-box;padding:6mm}
      h1{font-size:16pt;margin:0 0 6px}
      /* Table safety: fixed layout, break long words, repeat headers where supported */
      table{width:100%;border-collapse:collapse;margin-top:8px;table-layout:fixed}
      thead{display:table-header-group}
      tbody tr{page-break-inside:avoid}
      th,td{border:1px solid #ddd;padding:6px;font-size:9pt;word-break:break-word;overflow-wrap:anywhere}
      thead th{background:#f6f9fb}
      .sig{max-width:120px;max-height:60px;border:1px solid #ccc}
      .footer{margin-top:8mm;font-size:9pt;color:#666;text-align:center}
      /* Checkbox styling for print - dark tick to ensure visibility */
      .checkbox{display:inline-block;width:12pt;height:12pt;border:1.2pt solid #222;background:#fff;box-sizing:border-box;vertical-align:middle;margin-right:4px}
      .checkbox.checked{position:relative}
      .checkbox.checked:after{content:'✓';position:absolute;left:1pt;top:-1pt;font-size:11pt;line-height:12pt;color:#000;font-weight:800}
      td .checkbox{display:inline-block;margin:6px auto}
      th.checkbox-col, td.checkbox-col{width:36px;text-align:center}
    </style>
  `;

  // Try to resolve bundled asset for default logo when running in React Native
  let resolvedLogo = logoDataUri;
  // Prefer logo from payload assets if present
  try {
    if (!resolvedLogo && (formData.assets && (formData.assets.logoDataUri || formData.assets.logoDataURI))) {
      resolvedLogo = formData.assets.logoDataUri || formData.assets.logoDataURI;
    }
    if (!resolvedLogo && (source && source.assets && (source.assets.logoDataUri || source.assets.logoDataURI))) {
      resolvedLogo = source.assets.logoDataUri || source.assets.logoDataURI;
    }
  } catch (e) {
    // ignore
  }
  if (!resolvedLogo) {
    try {
      // eslint-disable-next-line global-require
      const { Image } = require('react-native');
      // relative path to src/assets/logo.jpeg
      // eslint-disable-next-line global-require
      const asset = require('../assets/logo.jpeg');
      const src = Image.resolveAssetSource(asset);
      if (src && src.uri) resolvedLogo = src.uri;
    } catch (e) {
      // ignore - fallback to inline SVG below
    }
  }

  const html = `<!doctype html>

  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      ${styles}
    </head>
    <body>
      <div class="page">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;">
            ${resolvedLogo ? `<img src="${resolvedLogo}" style="height:36px;margin-right:8px;object-fit:contain;" alt="logo"/>` : defaultLogoSvg}
            <h1 style="margin:0">${title}</h1>
          </div>
          <div style="font-size:11pt;color:#333">${date}</div>
        </div>
        ${kvHtml}
        ${arrayTableHtml}
        <div class="footer">Generated by ChecklistApp</div>
      </div>
    </body>
  </html>`;


  // Node.js template loading is not supported in React Native. Always use generic renderer here.

  return html;

  function renderCell(val, key) {
    if (val == null) return '';
    const isSignatureKey = key && /sig|sign|signature|verified|signed|staffsign|supsign|supSign|manager|approv/i.test(key);
    function isUrlString(s) {
      if (typeof s !== 'string') return false;
      const t = s.trim();
      return /^(https?:|file:|content:|\/)/i.test(t);
    }
    // If this is a data URI image
    if (typeof val === 'string' && isDataUri(val)) return `<img class="sig" src="${val}"/>`;

    // If string looks like an image URL (http/file/content or ends with common image ext) render as image
    if (typeof val === 'string' && isImageUrl(val)) return `<img class="sig" src="${escapeHtml(val)}"/>`;

    // If the value is a boolean, render as checkbox glyph
    if (typeof val === 'boolean') return val ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>';

    // If the string is a raw base64 blob (no data: prefix) and the key suggests a signature, render as image.
    // For signature fields be more permissive about length (some signature blobs are shorter).
    if (typeof val === 'string' && isSignatureKey && looksLikeBase64Image(val, 40)) {
      return `<img class="sig" src="data:image/png;base64,${escapeHtml(val)}"/>`;
    }

    // If the string looks like a URL and the key suggests it's a signature, render as an image tag
    if (typeof val === 'string' && isSignatureKey && isUrlString(val)) {
      return `<img class="sig" src="${escapeHtml(val)}"/>`;
    }

    // If the value is a JSON-ish string representing an array/object (e.g. timeslots), try to parse it
    if (typeof val === 'string') {
      const s = val.trim();
      // attempt a tolerant parse for JSON-like strings
      if ((s.startsWith('{') || s.startsWith('[') || s.startsWith('('))) {
        try {
          const normalized = s.replace(/^\(/, '{').replace(/\)$/, '}').replace(/'/g, '"');
          const parsed = JSON.parse(normalized);
          return renderParsedValue(parsed);
        } catch (e) {
          // fallthrough
        }
      }
    }

    if (typeof val === 'object') {
      // Arrays handled specially
      if (Array.isArray(val)) return renderParsedValue(val);

      // Common RN signature shapes
      if (val.uri) return `<img class="sig" src="${escapeHtml(val.uri)}"/>`;
      if (val.base64) return `<img class="sig" src="data:image/png;base64,${escapeHtml(val.base64)}"/>`;
      // Some saved objects nest signature under keys like 'signature' or 'sig'
      if (val.signature && typeof val.signature === 'string') {
        const s = val.signature;
        if (isDataUri(s) || isImageUrl(s) || looksLikeBase64Image(s)) return `<img class="sig" src="${isDataUri(s) ? escapeHtml(s) : (looksLikeBase64Image(s) ? `data:image/png;base64,${escapeHtml(s)}` : escapeHtml(s)) }"/>`;
      }
      if (val.sig && typeof val.sig === 'string') {
        const s = val.sig;
        if (isDataUri(s) || isImageUrl(s) || looksLikeBase64Image(s)) return `<img class="sig" src="${isDataUri(s) ? escapeHtml(s) : (looksLikeBase64Image(s) ? `data:image/png;base64,${escapeHtml(s)}` : escapeHtml(s)) }"/>`;
      }

      // If the parent key strongly suggests this is a signature container, inspect nested candidate fields
      if (isSignatureKey) {
        const sigCandidates = ['image', 'img', 'data', 'dataUri', 'dataURI', 'base64', 'uri', 'signature', 'sig'];
        for (let ck of sigCandidates) {
          if (val[ck] && typeof val[ck] === 'string') {
            const s = val[ck];
            if (isDataUri(s) || isImageUrl(s) || looksLikeBase64Image(s, 40)) {
              return `<img class="sig" src="${isDataUri(s) ? escapeHtml(s) : (looksLikeBase64Image(s) ? `data:image/png;base64,${escapeHtml(s)}` : escapeHtml(s)) }"/>`;
            }
          }
        }
      }

      // If this object looks like a map of time=>boolean (e.g., checks), let renderParsedValue render a checkbox grid
      try {
        const entries = Object.entries(val || {});
        if (entries.length && entries.every(([k, v]) => typeof v === 'boolean')) {
          return renderParsedValue(val);
        }
      } catch (e) {
        // ignore and fallback
      }

      return escapeHtml(JSON.stringify(val));
    }

      // If we reached here and the key looks like a signature, render a visible placeholder box
      if (isSignatureKey) {
        try {
          if (typeof val === 'string') {
            const s = val.trim();
            // If the string looks like a human name, show the name beside an empty signature box
            const looksLikeName = /^[A-Za-z\s.'\-]{1,60}$/.test(s) && s.split(/\s+/).length <= 4;
            if (looksLikeName) {
              return `<div style="display:flex;align-items:center;gap:8px;"><div style="min-width:140px">${escapeHtml(s)}</div><div style="width:160px;height:80px;border:1px solid #ccc;background:#fff"></div></div>`;
            }
            // Otherwise show an empty bordered signature box (label optional)
            return `<div style="width:160px;height:80px;border:1px solid #ccc;background:#fafafa;text-align:center;line-height:80px;color:#999">Signature</div>`;
          }
          // For objects where we didn't find an image, show an empty box
          if (typeof val === 'object') {
            return `<div style="width:160px;height:80px;border:1px solid #ccc;background:#fff"></div>`;
          }
        } catch (e) {
          // fallthrough to text fallback
        }
      }

      return escapeHtml(String(val));
  }

  function renderParsedValue(parsed) {
    // If parsed is an array of booleans or primitives, render compact checkboxes or joined values
    if (Array.isArray(parsed)) {
      // If array of booleans, render checkbox sequence
      if (parsed.length && parsed.every(v => typeof v === 'boolean')) {
        return parsed.map(v => v ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>').join(' ');
      }
      // If array of objects that include signature-like fields, render a compact list with images
      if (parsed.length && parsed.every(v => typeof v === 'object')) {
        return parsed.map(item => {
          // try common signature keys aggressively
          const sigKeys = ['signature', 'sig', 'uri', 'image', 'img', 'base64', 'data', 'dataUri'];
          for (let sk of sigKeys) {
            if (item && item[sk] && typeof item[sk] === 'string') {
              const s = item[sk];
              if (isDataUri(s) || isImageUrl(s) || looksLikeBase64Image(s, 40)) return `<div><img class="sig" src="${isDataUri(s) ? escapeHtml(s) : (looksLikeBase64Image(s,40) ? `data:image/png;base64,${escapeHtml(s)}` : escapeHtml(s)) }"/></div>`;
            }
          }
          return `<div>${escapeHtml(JSON.stringify(item))}</div>`;
        }).join('');
      }
      // Otherwise join simple values
      return escapeHtml(parsed.map(p => (p == null ? '' : String(p))).join(', '));
    }

    // If parsed is an object with time=>bool keys, render checkbox grid with optional labels hidden
    if (typeof parsed === 'object') {
      const entries = Object.entries(parsed);
      if (entries.length && entries.every(([k, v]) => typeof v === 'boolean')) {
        return entries.map(([k, v]) => `${v ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>'}<span style="font-size:8pt;margin-left:3px;margin-right:6px;">${escapeHtml(k)}</span>`).join(' ');
      }
      // fallback: stringify
      return escapeHtml(JSON.stringify(parsed));
    }

    return escapeHtml(String(parsed));
  }

  function isDataUri(s) {
    return typeof s === 'string' && s.startsWith('data:');
  }

  function looksLikeBase64Image(s, minLen = 100) {
    if (typeof s !== 'string') return false;
    const trimmed = s.trim();
    // base64 image payloads are usually long; require length > minLen
    if (trimmed.length < minLen) return false;
    // allow common base64 chars, possibly with newlines
    return /^[A-Za-z0-9+/=\s]+$/.test(trimmed);
  }

  function isImageUrl(s) {
    if (typeof s !== 'string') return false;
    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('file:') || lower.startsWith('content:') || lower.startsWith('/')) return true;
    return /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/.test(lower);
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function exportFormWithViewShot({ ref, formData, filenameBase, onProgress }) {
  // Use captureAndExport for view shot logic
  return await captureAndExport({ ref, filenameBase, payloadHtmlFallback: generatePdfHtml(formData), onProgress });
}

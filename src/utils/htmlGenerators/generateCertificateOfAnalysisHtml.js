const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function renderValueCell(v) {
  if (!v && v !== 0) return '';
  if (typeof v === 'object') {
    const sig = renderSignatureHtml(v, { width: 220, height: 80 });
    if (sig) return sig;
    return `<pre>${escapeHtml(JSON.stringify(v, null, 2))}</pre>`;
  }
  if (typeof v === 'string' && /^data:image\/.+;base64,/.test(v)) return `<img src="${escapeHtml(v)}" style="max-width:320px;height:auto;object-fit:contain;border:1px solid #ddd"/>`;
  return escapeHtml(String(v));
}

function generateCertificateOfAnalysisHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const data = p.formData || p || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const title = escapeHtml(p.title || p.name || 'Certificate Of Analysis');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial;color:#111}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}
      thead th{background:#f6f6f6}
      .sig{max-width:320px}
    </style>
  `;

  const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(metadata.lab||data.lab||'')}<div style="font-size:12px">${escapeHtml(metadata.date||data.date||'')}</div></div></div><h2>${title}</h2>`;

  const tableRows = (rows.length ? rows : [{ note: 'No structured data; see raw below', raw: p.formData || p }]).map(r => {
    if (typeof r === 'object' && !Array.isArray(r)) {
      const cells = Object.keys(r).map(k => `<tr><th style="width:28%">${escapeHtml(k)}</th><td>${renderValueCell(r[k])}</td></tr>`).join('');
      return cells;
    }
    return `<tr><th>Value</th><td>${renderValueCell(r)}</td></tr>`;
  }).join('');

  const verification = `
    <div style="margin-top:12px;display:flex;justify-content:space-between;gap:12px">
      <div><div style="font-weight:700">Sampled By</div>${renderSignatureHtml(data.sampledBySign||data.sampledBy||metadata.sampledBySign||metadata.sampledBy||'', { width:220, height:80 }) || escapeHtml(data.sampledBy||metadata.sampledBy||'')}</div>
      <div><div style="font-weight:700">HSEQ Manager</div>${renderSignatureHtml(data.hseqManagerSign||data.hseqManager||metadata.hseqManagerSign||metadata.hseqManager||'', { width:220, height:80 }) || escapeHtml(data.hseqManager||metadata.hseqManager||'')}</div>
      <div><div style="font-weight:700">Complex Manager</div>${renderSignatureHtml(data.complexManagerSign||data.complexManager||metadata.complexManagerSign||metadata.complexManager||'', { width:220, height:80 }) || escapeHtml(data.complexManager||metadata.complexManager||'')}</div>
    </div>
  `;

  const rawDump = `<pre style="margin-top:12px;background:#f8fafc;padding:8px;border:1px solid #eee">${escapeHtml(JSON.stringify(p.formData || p, null, 2))}</pre>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<table><tbody>${tableRows}</tbody></table>${verification}${rawDump}</div></body></html>`;
}

module.exports = generateCertificateOfAnalysisHtml;

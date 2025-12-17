// Generates a print-ready HTML document for MouldingProofingBakingLog payloads
const { escapeHtml, normalizeSignature, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

export default function generateMouldingProofingBakingLogHtml(formData = {}, options = {}) {
  const title = escapeHtml(formData.title || formData.name || 'Moulding Proofing and Baking Log');
  const date = escapeHtml(formData.date || formData.issueDate || options.date || new Date().toLocaleDateString());

  // Determine paper size and orientation. Defaults to A4 landscape for full-width tables.
  const paperSize = (options.paperSize || 'A4').toString().toLowerCase();
  const orientation = (options.orientation || 'landscape').toString().toLowerCase();
  const sizes = {
    a4: { w: '297mm', h: '210mm' },
    letter: { w: '11in', h: '8.5in' }
  };
  const chosen = paperSize === 'letter' ? sizes.letter : sizes.a4;
  const pageWidth = orientation === 'portrait' ? (chosen.h) : (chosen.w);
  const pageHeight = orientation === 'portrait' ? (chosen.w) : (chosen.h);

  const rows = Array.isArray(formData.formData) ? formData.formData : (Array.isArray(formData.formDataRows) ? formData.formDataRows : []);

  const styles = `
    <style>
      @page { size: ${pageWidth} ${pageHeight}; margin: 10mm; }
      html,body{margin:0;padding:0;background:#fff}
      body{font-family: Arial, Helvetica, sans-serif; font-size:10pt;color:#111;width:${pageWidth}}
      .page{box-sizing:border-box;padding:6mm}
      h1{font-size:14pt;margin:0 0 6px}
      table{width:100%;border-collapse:collapse;margin-top:8px;table-layout:fixed}
      th,td{border:1px solid #ddd;padding:6px;font-size:9pt;word-break:break-word}
      thead th{background:#f6f9fb}
      .sig{max-width:140px;max-height:70px;border:1px solid #ccc}
      .checkbox{display:inline-block;width:12pt;height:12pt;border:1.2pt solid #222;background:#fff}
      .checkbox.checked:after{content:'✓';display:block;text-align:center;font-weight:800}
      .small{font-size:9pt;color:#333}
    </style>
  `;

  // Respect layout hints saved by the form (pixel widths) to ensure exported PDF
  // matches the on-screen table column widths. Fallback to sensible defaults.
  const defaultWidths = { num: 40, food: 220, mouldingTime: 90, mouldingSign: 110, proofTimeIn: 90, proofTimeOut: 90, proofSign: 110, bakeTimeIn: 90, bakeTemp: 70, bakeTimeOut: 90, staff: 140 };
  const hints = (formData && formData.layoutHints) || {};
  const cw = { ...defaultWidths, ...hints };

  const cols = [
    { key: 'num', label: 'No' },
    { key: 'food', label: 'Food' },
    { key: 'mouldingTime', label: 'Moulding Time' },
    { key: 'mouldingSign', label: 'Moulding Sign' },
    { key: 'proofTimeIn', label: 'Proof In' },
    { key: 'proofTimeOut', label: 'Proof Out' },
    { key: 'proofSign', label: 'Proof Sign' },
    { key: 'bakeTimeIn', label: 'Bake In' },
    { key: 'bakeTemp', label: 'Bake Temp' },
    { key: 'bakeTimeOut', label: 'Bake Out' },
    { key: 'staff', label: 'Staff' }
  ];

  const ths = cols.map(c => `<th style="width:${(cw[c.key] || 80)}px">${escapeHtml(c.label)}</th>`).join('');

  const tr = rows.map((r, idx) => {
    const cellVal = (r, k) => {
      const v = r && (r[k] || r[k.toLowerCase()] || r[k.replace(/ /g,'')]);
      if (v == null) return '';
      // try signature/image rendering first
      const sigHtml = renderSignatureHtml(v, { width: 140, height: 70 });
      if (sigHtml) return sigHtml;
      if (typeof v === 'boolean') return v ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>';
      return renderSimple(v);
    };

    const cells = cols.map(c => {
      if (c.key === 'num') return `<td style="width:${cw.num}px;text-align:center">${idx+1}</td>`;
      // map probable field names to cell content
      const mapping = {
        food: ['product','food','Food'],
        mouldingTime: ['mouldingTime','mouldingTimeIn','mouldingtime'],
        mouldingSign: ['mouldingSign','mouldingSig','mouldingsign'],
        proofTimeIn: ['proofTimeIn','proofTimeIn','prooftimein'],
        proofTimeOut: ['proofTimeOut','proofTimeOut','prooftimeout'],
        proofSign: ['proofSign','proofSig','proofsign'],
        bakeTimeIn: ['bakeTimeIn','bakeIn','baketimein'],
        bakeTemp: ['bakeTemp','bakeTemperature','baketemp'],
        bakeTimeOut: ['bakeTimeOut','bakeOut','baketimeout'],
        staff: ['staffName','staff','staffname']
      };
      const candidates = mapping[c.key] || [c.key];
      let value = '';
      for (let k of candidates) {
        value = cellVal(r, k);
        if (value) break;
      }
      return `<td style="width:${(cw[c.key] || 80)}px">${value}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('\n');

  const headerSigs = [];
  // attach header-level signatures if present
  const maybeSig = (k) => {
    const v = formData[k] || (formData.metadata && formData.metadata[k]) || '';
    if (!v) return '';
    const sigHtml = renderSignatureHtml(v, { width: 140, height: 70 });
    if (sigHtml) return sigHtml;
    return escapeHtml(String(v));
  };
  const headChef = maybeSig('headChefSign') || maybeSig('headChef') || maybeSig('headChefSignature');
  const verified = maybeSig('verifiedBySign') || maybeSig('verifiedBy');
  const complex = maybeSig('complexManagerSign') || maybeSig('complexManager');

  if (headChef) headerSigs.push(`<div><strong>Head Chef:</strong> ${headChef}</div>`);
  if (verified) headerSigs.push(`<div><strong>Verified By:</strong> ${verified}</div>`);
  if (complex) headerSigs.push(`<div><strong>Manager:</strong> ${complex}</div>`);

  // Build header matching the original form layout: logo + title + doc box
  // Use embedded logo data URI if provided, otherwise leave empty (generators should rely on injected data URI)
  const logoUri = (formData && formData.assets && formData.assets.logoDataUri) || '';
  const issueDate = escapeHtml((formData && formData.issueDate) || (formData && formData.metadata && formData.metadata.issueDate) || '');
  const revisionDate = escapeHtml((formData && formData.revisionDate) || (formData && formData.metadata && formData.metadata.revisionDate) || '');
  const location = escapeHtml((formData && formData.metadata && formData.metadata.location) || '');
  const compiledBy = escapeHtml((formData && formData.metadata && formData.metadata.compiledBy) || (formData && formData.compiledBy) || '');
  const approvedBy = escapeHtml((formData && formData.metadata && formData.metadata.approvedBy) || (formData && formData.approvedBy) || '');

  const headerHtml = `
    <div style="display:flex;align-items:center;border:1px solid #ddd;padding:8px;border-radius:4px;background:#fff;margin-bottom:8px;">
      <div style="display:flex;align-items:center;flex:1">
        <div style="width:56px;height:44px;margin-right:8px">${logoUri ? `<img src="${logoUri}" style="width:56px;height:44px;object-fit:contain"/>` : `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='44' viewBox='0 0 120 36'><rect width='120' height='36' fill='#0B4F8C' rx='4'/><text x='12' y='24' font-family='Arial' font-size='12' fill='#fff'>Bravo</text></svg>`}</div>
        <div style="flex:1;padding-left:8px">
          <div style="font-weight:800;color:#185a9d;font-size:14px">BRAVO BRANDS LIMITED</div>
          <div style="font-weight:800;font-size:16px">MOULDING PROOFING AND BAKING LOG SHEET</div>
          <div style="font-size:11px;color:#374151;margin-top:4px">Subject: MOULDING PROOFING AND BAKING LOG SHEET</div>
        </div>
      </div>
      <div style="width:260px;border-left:1px solid #eee;padding-left:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><div style="font-weight:700;font-size:11px;color:#374151">Issue Date:</div><div style="font-size:11px">${issueDate}</div></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><div style="font-weight:700;font-size:11px;color:#374151">Revision Date:</div><div style="font-size:11px">${revisionDate}</div></div>
        <div style="display:flex;justify-content:space-between"><div style="font-weight:700;font-size:11px;color:#374151">Location:</div><div style="font-size:11px">${location}</div></div>
      </div>
    </div>`;

  const sigBlock = `
    <div style="margin-top:8px;display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1">
        <div style="font-weight:700;font-size:11px">Compiled By:</div>
        <div style="font-size:12px;margin-top:6px">${compiledBy}</div>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:11px">Approved By:</div>
        <div style="font-size:12px;margin-top:6px">${approvedBy}</div>
      </div>
      <div style="flex:1">
        ${headerSigs.length ? headerSigs.join('') : ''}
      </div>
    </div>`;

  const html = `<!doctype html>
  <html>
    <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>${styles}</head>
    <body>
      <div class="page">
        ${headerHtml}
        ${sigBlock}
        <table>
          <thead><tr>${ths}</tr></thead>
          <tbody>
            ${tr}
          </tbody>
        </table>
        <div style="margin-top:8mm;font-size:9pt;color:#666;text-align:center">Generated by ChecklistApp</div>
      </div>
    </body>
  </html>`;

  return html;
}

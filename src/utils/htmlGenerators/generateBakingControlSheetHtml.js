const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateBakingControlSheetHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const title = escapeHtml(p.title || p.name || 'BAKING CONTROL SHEET');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  // Define columns similar to presentational component
  const columns = [
    { key: 'prodDate', label: 'PRODUCTION DATE', width: 120 },
    { key: 'prodName', label: 'PRODUCT NAME', width: 220 },
    { key: 'batchNo', label: 'BATCH NO.', width: 120 },
    { key: 'proofingTemp', label: 'PROOFING TEMP', width: 140 },
    { key: 'proofingTime', label: 'PROOFING TIME', width: 120 },
    { key: 'ovenTemp', label: 'OVEN TEMP', width: 140 },
    { key: 'bakingTime', label: 'BAKING TIME', width: 120 },
    { key: 'bakerSign', label: 'BAKER SIGN', width: 160 },
    { key: 'supervisorSign', label: 'SUPERVISOR SIGN', width: 160 },
  ];

  const tableWidth = columns.reduce((s, c) => s + (c.width || 120), 0);

  // orientation heuristic
  const pxPerMm = 96 / 25.4;
  const portraitMm = 210; const portraitPx = portraitMm * pxPerMm;
  const orientationToUse = (options.orientation === 'auto' || !options.orientation) ? (tableWidth > portraitPx * 0.95 ? 'landscape' : 'portrait') : options.orientation;

  const styles = `
    <style>
      @page { size: A4 ${orientationToUse}; margin:10mm }
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial,Helvetica,sans-serif;color:#111}
      .container{padding:12px}
      .header{display:flex;justify-content:space-between;align-items:center}
      .brand{font-weight:700;color:#185a9d}
      table{border-collapse:collapse;width:100%;table-layout:fixed}
      th{background:#f3f5f7;padding:8px;border:1px solid #333;font-weight:700;text-align:center}
      td{padding:8px;border:1px solid #333}
      .sig{max-width:240px}
    </style>
  `;

  const headerHtml = `
    <div class="header">
      <div style="display:flex;align-items:center;gap:12px"><div>${logo?`<img src="${logo}" style="width:48px;height:48px;object-fit:contain"/>`:''}</div><div><div class="brand">Bravo Brands Limited</div><div style="color:#43cea2">Food Safety Management System</div></div></div>
      <div style="text-align:right">Issue Date: ${escapeHtml(metadata.issueDate || metadata.date || '')}</div>
    </div>
    <h2 style="text-align:center;margin:8px 0">SUBJECT: BAKING CONTROL SHEET</h2>
  `;

  const headerCols = columns.map(c => `<th style="width:${c.width}px">${escapeHtml(c.label)}</th>`).join('');
  const rowsHtml = (formData.length ? formData : []).map(row => {
    const cells = columns.map(col => {
      if (col.key === 'bakerSign' || col.key === 'supervisorSign') {
        return `<td style="width:${col.width}px;text-align:center">${renderSignatureHtml(row[col.key] || row[col.key.replace('Sign','Signature')] || '', { width: 140, height: 64 }) || ''}</td>`;
      }
      return `<td style="width:${col.width}px">${renderSimple(row[col.key] || '')}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const tableHtml = `
    <div style="overflow-x:auto"><table><thead><tr>${headerCols}</tr></thead><tbody>${rowsHtml}</tbody></table></div>
  `;

  const signHtml = `
    <div style="display:flex;justify-content:space-between;margin-top:12px">
      <div><div style="font-weight:700">Compiled By:</div>${renderSignatureHtml(metadata.compiledBy || metadata.compiledBySign || '', { width: 220, height: 96 }) || ''}</div>
      <div style="text-align:right"><div style="font-weight:700">Approved By:</div>${renderSignatureHtml(metadata.approvedBy || metadata.approvedBySign || '', { width: 220, height: 96 }) || ''}</div>
    </div>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${headerHtml}${tableHtml}${signHtml}</div></body></html>`;
}

module.exports = generateBakingControlSheetHtml;

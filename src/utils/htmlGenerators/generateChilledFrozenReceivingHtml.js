const { escapeHtml, renderSignatureHtml, renderSimple, extractBool } = require('../../utils/exportHelpers');

function generateChilledFrozenReceivingHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const meta = p.metadata || {};
  const title = escapeHtml(p.title || p.name || 'CHILLED/FROZEN RECEIVING CHECKLIST');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:8px;text-align:center}
      thead th{background:#f3f3f3}
    </style>
  `;

  const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">Issue Date: ${escapeHtml(meta.date||'')}</div></div><h3 style="text-align:center">${title}</h3>`;

  const ths = `<th>Name</th><th>Supplier</th><th>Temp</th><th>State</th><th>Expiry</th><th>Remarks</th>`;

  const rowsHtml = (rows.length ? rows : []).map(r => `<tr><td>${renderSimple(r.nameOfProduct||r.name||'')}</td><td>${renderSimple(r.supplier||'')}</td><td>${renderSimple(r.temp||'')}</td><td>${renderSimple(r.stateOfProduct||'')}</td><td>${renderSimple(r.expiryDate||'')}</td><td>${renderSimple(r.remarks||'')}</td></tr>`).join('');

  const verification = `<div style="margin-top:12px;display:flex;justify-content:space-between"><div>Compiled By: ${renderSignatureHtml(meta.compiledBySign||meta.compiledBy||'', { width:220, height:80 })||escapeHtml(meta.compiledBy||'')}</div><div>Approved By: ${renderSignatureHtml(meta.approvedBySign||meta.approvedBy||'', { width:220, height:80 })||escapeHtml(meta.approvedBy||'')}</div></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<div style="overflow-x:auto"><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>${verification}</div></body></html>`;
}

module.exports = generateChilledFrozenReceivingHtml;

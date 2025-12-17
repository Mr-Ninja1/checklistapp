const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateDryGoodsReceivingHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const meta = p.metadata || {};
  const title = escapeHtml(p.title || p.name || 'DRY GOODS RECEIVING CHECKLIST');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:8px}
      thead th{background:#f3f3f4}
    </style>
  `;

  const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">Issue Date: ${escapeHtml(meta.date||'')}</div></div><h3 style="text-align:center">${title}</h3>`;

  const ths = `<th>Product</th><th>Supplier</th><th>Condition</th><th>Qty</th><th>Expiry</th><th>Remarks</th>`;

  const rowsHtml = (rows.length ? rows : []).map(r => `<tr><td>${renderSimple(r.product||r.nameOfProduct||'')}</td><td>${renderSimple(r.supplier||'')}</td><td>${renderSimple(r.condition||'')}</td><td>${renderSimple(r.quantity||'')}</td><td>${renderSimple(r.expiryDate||'')}</td><td>${renderSimple(r.remarks||'')}</td></tr>`).join('');

  const verification = `<div style="margin-top:12px;display:flex;justify-content:space-between"><div>Received By: ${renderSignatureHtml(meta.receivedBySign||meta.receivedBy||'', { width:220, height:80 })||escapeHtml(meta.receivedBy||'')}</div><div>Complex Manager: ${renderSignatureHtml(meta.complexManagerSign||meta.complexManager||'', { width:220, height:80 })||escapeHtml(meta.complexManager||'')}</div></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<div style="overflow-x:auto"><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>${verification}</div></body></html>`;
}

module.exports = generateDryGoodsReceivingHtml;

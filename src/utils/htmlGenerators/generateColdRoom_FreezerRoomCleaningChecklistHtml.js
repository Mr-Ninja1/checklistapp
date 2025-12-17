const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateColdRoom_FreezerRoomCleaningChecklistHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const meta = p.metadata || {};
  const title = escapeHtml(p.title || p.name || 'COLD ROOM / FREEZER ROOM CLEANING CHECKLIST');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:8px}
      thead th{background:#f3f4f6}
    </style>
  `;

  const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(meta.location||'')}<div>${escapeHtml(meta.date||'')}</div></div></div><h3 style="text-align:center">${title}</h3>`;

  const ths = `<th>Area</th><th>Frequency</th><th>Done By</th><th>Sign</th>`;

  const rowsHtml = (rows.length ? rows : []).map(r => `<tr><td>${renderSimple(r.area||r.name||'')}</td><td>${renderSimple(r.frequency||'')}</td><td>${renderSimple(r.doneBy||r.staff||'')}</td><td>${renderSignatureHtml(r.sign||r.signature||'', { width:160, height:64 })||''}</td></tr>`).join('');

  const verification = `<div style="margin-top:12px">Verified By: ${renderSignatureHtml(meta.verifiedBySign||meta.verifiedBy||'', { width:220, height:80 })||escapeHtml(meta.verifiedBy||'')}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<div style="overflow-x:auto"><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>${verification}</div></body></html>`;
}

module.exports = generateColdRoom_FreezerRoomCleaningChecklistHtml;

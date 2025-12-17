const { escapeHtml, renderSignatureHtml, renderSimple, extractBool } = require('../../utils/exportHelpers');

function generateCleaningEquipment_CleaningChecklistHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const metadata = p.metadata || {};
  const title = escapeHtml(p.title || p.name || 'CLEANING EQUIPMENT CHECKLIST');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:8px;text-align:left}
      thead th{background:#f3f4f6}
    </style>
  `;

  const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(metadata.location||'')}<div style="font-size:12px">${escapeHtml(metadata.date||'')}</div></div></div><h2 style="text-align:center">${title}</h2>`;

  const ths = `<th style="width:40%">Equipment</th><th style="width:20%">Frequency</th><th style="width:20%">Done By</th><th style="width:20%">Sign</th>`;

  const rowsHtml = (rows.length ? rows : []).map(r => `<tr><td>${renderSimple(r.equipment||r.name||'')}</td><td>${renderSimple(r.frequency||r.freq||'')}</td><td>${renderSimple(r.doneBy||r.changedBy||'')}</td><td>${renderSignatureHtml(r.sign||r.signature||r.staffSign||'', { width:160, height:60 })||''}</td></tr>`).join('');

  const verification = `<div style="margin-top:12px">Verified By: ${renderSignatureHtml(metadata.verifiedBySign||metadata.verifiedBy||'', { width:220, height:80 })||escapeHtml(metadata.verifiedBy||'')}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<div style="overflow-x:auto"><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>${verification}</div></body></html>`;
}

module.exports = generateCleaningEquipment_CleaningChecklistHtml;

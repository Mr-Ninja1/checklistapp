const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateBakery_UnderbarShelfLifeInspectionHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const data = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const metadata = p.metadata || p || {};
  const title = escapeHtml(p.title || p.name || 'UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const TABLE_WIDTH = p._tableWidth || 1000;
  const COLS = [
    { key: 'name', label: 'ITEMS', w: Math.round(TABLE_WIDTH * 0.30) },
    { key: 'dateIn', label: 'DATE IN', w: Math.round(TABLE_WIDTH * 0.09) },
    { key: 'timeIn', label: 'TIME IN', w: Math.round(TABLE_WIDTH * 0.09) },
    { key: 'timeOut', label: 'TIME OUT', w: Math.round(TABLE_WIDTH * 0.09) },
    { key: 'usedBy', label: 'USED BY', w: Math.round(TABLE_WIDTH * 0.12) },
    { key: 'chefName', label: "CHEF'S NAME", w: Math.round(TABLE_WIDTH * 0.16) },
    { key: 'quantity', label: 'QUANTITY', w: Math.round(TABLE_WIDTH * 0.06) },
    { key: 'chefSign', label: 'CHEF SIGN', w: Math.round(TABLE_WIDTH * 0.09) },
  ];

  const styles = `
    <style>
      @page { size: A4 landscape; margin: 10mm }
      html,body{margin:0;padding:0;font-family:Arial;color:#111}
      .container{padding:12px}
      .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
      .title{font-weight:800;text-align:center}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:8px;vertical-align:top}
      thead th{background:#f3f4f6;font-weight:700}
      .sig{max-width:220px}
    </style>
  `;

  const headerHtml = `<div class="header">${logo?`<img src="${logo}" style="width:72px;height:48px;object-fit:contain"/>`:''}<div style="flex:1;text-align:center"><div class="title">${title}</div><div style="font-size:12px;color:#666">${escapeHtml(metadata.location||'')} — ${escapeHtml(metadata.date||'')}</div></div></div>`;

  const ths = COLS.map(c => `<th style="width:${c.w}px">${escapeHtml(c.label)}</th>`).join('');

  const rowsHtml = (data.length ? data : []).map(r => {
    const chefSign = renderSignatureHtml(r.chefSign || r.chefSignature || r.chef || r.sign || '', { width: Math.max(48, COLS[7].w - 8), height: 60 }) || '';
    return `<tr>
      <td style="width:${COLS[0].w}px">${renderSimple(r.name || r.item || '')}</td>
      <td style="width:${COLS[1].w}px">${renderSimple(r.dateIn || r.receivedDate || r.date || '')}</td>
      <td style="width:${COLS[2].w}px">${renderSimple(r.timeIn || r.time || '')}</td>
      <td style="width:${COLS[3].w}px">${renderSimple(r.timeOut || '')}</td>
      <td style="width:${COLS[4].w}px">${renderSimple(r.usedBy || '')}</td>
      <td style="width:${COLS[5].w}px">${renderSimple(r.chefName || r.bakerChefName || '')}</td>
      <td style="width:${COLS[6].w}px">${renderSimple(r.quantity || '')}</td>
      <td style="width:${COLS[7].w}px">${chefSign}</td>
    </tr>`;
  }).join('');

  const tableHtml = `<div style="overflow-x:auto"><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${headerHtml}${tableHtml}</div></body></html>`;
}

module.exports = generateBakery_UnderbarShelfLifeInspectionHtml;

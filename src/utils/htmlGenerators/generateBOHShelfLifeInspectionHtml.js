const { escapeHtml, renderSignatureHtml, renderSimple, extractBool } = require('../../utils/exportHelpers');

function generateBOHShelfLifeInspectionHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const verification = p.verification || p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : p.rows || [];
  const title = escapeHtml(p.title || p.name || 'BOH Shelf Life Inspection Checklist');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const colWidths = { item: 260, receivedDate: 120, shelfLifeDays: 120, ok: 60, checkedBy: 160 };
  const totalWidth = Object.values(colWidths).reduce((s,v)=>s+v,0);
  const pxPerMm = 96/25.4; const portraitMm=210; const portraitPx = portraitMm * pxPerMm;
  const orientationToUse = (options.orientation==='auto' || !options.orientation) ? (totalWidth > portraitPx*0.95 ? 'landscape' : 'portrait') : options.orientation;

  const styles = `
    <style>
      @page{size:A4 ${orientationToUse}; margin:10mm}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial;color:#111}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:8px;text-align:center}
      thead th{background:#f3f3f3}
    </style>
  `;

  const headerHtml = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">${logo?`<img src="${logo}" style="width:56px;height:56px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(metadata.location||'')}<div>${escapeHtml(metadata.date||'')}</div></div></div><h3 style="text-align:center">BOH Shelf Life Inspection Checklist</h3>`;

  const ths = `<th style="width:${colWidths.item}px">ITEMS</th><th style="width:${colWidths.receivedDate}px">DATE IN</th><th style="width:${colWidths.shelfLifeDays}px">TIME IN</th><th style="width:${colWidths.ok}px">TIME OUT</th><th style="width:${colWidths.checkedBy}px">USED BY</th><th style="width:120px">BAKER/CHEF NAME</th><th style="width:80px">QUANTITY</th><th style="width:80px">SIGN</th>`;

  const rowsHtml = (rows.length ? rows : []).map(r => {
    const signHtml = renderSignatureHtml(r.sign || r.signature || r.bakerSign || r.bakerSignature || '', { width: Math.max(48, colWidths.checkedBy - 8), height: 48 }) || '';
    return `<tr>
      <td style="width:${colWidths.item}px">${renderSimple(r.name || r.item || '')}</td>
      <td style="width:${colWidths.receivedDate}px">${renderSimple(r.dateIn || r.receivedDate || '')}</td>
      <td style="width:${colWidths.shelfLifeDays}px">${renderSimple(r.timeIn || '')}</td>
      <td style="width:${colWidths.ok}px">${renderSimple(r.timeOut || '')}</td>
      <td style="width:${colWidths.checkedBy}px">${renderSimple(r.usedBy || '')}</td>
      <td style="width:120px">${renderSimple(r.bakerChefName || r.baker || '')}</td>
      <td style="width:80px">${renderSimple(r.quantity || '')}</td>
      <td style="width:80px">${signHtml}</td>
    </tr>`;
  }).join('');

  const tableHtml = `<div><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;

  const footerHtml = `
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div><div style="font-weight:700">HSEQ Manager:</div>${renderSignatureHtml(verification.hseqManagerSign||verification.hseqManager||metadata.hseqManagerSign||metadata.hseqManager||'', { width:220, height:80 }) || escapeHtml(verification.hseqManager||metadata.hseqManager||'')}</div>
      <div><div style="font-weight:700">Complex Manager:</div>${renderSignatureHtml(verification.complexManagerSign||verification.complexManager||metadata.complexManagerSign||metadata.complexManager||'', { width:220, height:80 }) || escapeHtml(verification.complexManager||metadata.complexManager||'')}</div>
      <div><div style="font-weight:700">Baker / Chef:</div>${renderSignatureHtml(verification.bakerSign||verification.baker||metadata.bakerSign||metadata.baker||'', { width:220, height:80 }) || escapeHtml(verification.baker||metadata.baker||'')}</div>
      <div><div style="font-weight:700">Verified By:</div>${renderSignatureHtml(verification.verifiedBySign||verification.verifiedBy||metadata.verifiedBySign||metadata.verifiedBy||'', { width:220, height:80 }) || escapeHtml(verification.verifiedBy||metadata.verifiedBy||'')}</div>
    </div>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${headerHtml}${tableHtml}${footerHtml}</div></body></html>`;
}

module.exports = generateBOHShelfLifeInspectionHtml;

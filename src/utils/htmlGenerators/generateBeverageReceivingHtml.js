const { escapeHtml, renderSignatureHtml, extractBool, renderSimple } = require('../../utils/exportHelpers');

function generateBeverageReceivingHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : p.rows || [];
  const title = escapeHtml(p.title || p.name || 'Beverage and Water Receiving Checklist');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const hints = p.layoutHints || {};
  const colWidths = {
    name: hints.NAME || 260,
    supplier: hints.SUPPLIER || 180,
    clean: hints.CLEAN || 90,
    temp: hints.TEMP || 90,
    tempOfBeverage: hints.TEMP_OF_BEVERAGE || 120,
    stateOfProduct: hints.STATE_OF_PRODUCT || 140,
    expiryDate: hints.EXPIRY_DATE || 120,
    remarks: hints.REMARKS || 300,
  };
  const totalWidth = Object.values(colWidths).reduce((s,v)=>s+v,0);

  const pxPerMm = 96/25.4; const portraitMm = 210; const portraitPx = portraitMm * pxPerMm;
  const orientationToUse = (options.orientation === 'auto' || !options.orientation) ? (totalWidth > portraitPx*0.95 ? 'landscape' : 'portrait') : options.orientation;

  const styles = `
    <style>
      @page{size:A4 ${orientationToUse}; margin:10mm}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial,Helvetica,sans-serif;color:#111}
      .container{padding:10px}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding-bottom:8px}
      .brand{font-weight:700;color:#185a9d}
      table{border-collapse:collapse;width:100%;}
      th{background:#eee;padding:8px;border:1px solid #000;text-align:center}
      td{padding:6px;border:1px solid #000;text-align:center}
    </style>
  `;

  const headerHtml = `
    <div class="header">
      <div style="display:flex;align-items:center;gap:12px"><div>${logo?`<img src="${logo}" style="width:48px;height:48px;object-fit:contain"/>`:''}</div><div><div class="brand">Bravo</div><div style="font-size:12px">BRAVO BRANDS LIMITED</div></div></div>
      <div style="text-align:right">Issue Date: ${escapeHtml(p.date || '')}</div>
    </div>
    <h3 style="text-align:center;margin:8px 0">Beverage and Water Receiving Checklist</h3>
  `;

  const ths = `<th style="width:${colWidths.name}px">Name of Product</th><th style="width:${colWidths.supplier}px">Supplier</th><th style="width:${colWidths.clean}px">Clean</th><th style="width:${colWidths.temp}px">Temp</th><th style="width:${colWidths.tempOfBeverage}px">Temp of Beverage</th><th style="width:${colWidths.stateOfProduct}px">State of Product</th><th style="width:${colWidths.expiryDate}px">Expiry Date</th><th style="width:${colWidths.remarks}px">Remarks</th>`;

  const rowsHtml = (rows.length ? rows : []).map(row => {
    const cleanMark = extractBool(row.clean) ? '✓' : '';
    return `<tr><td style="width:${colWidths.name}px">${renderSimple(row.nameOfProduct||row.name||'')}</td><td style="width:${colWidths.supplier}px">${renderSimple(row.supplier||'')}</td><td style="width:${colWidths.clean}px">${cleanMark}</td><td style="width:${colWidths.temp}px">${renderSimple(row.temp||'')}</td><td style="width:${colWidths.tempOfBeverage}px">${renderSimple(row.tempOfBeverage||'')}</td><td style="width:${colWidths.stateOfProduct}px">${renderSimple(row.stateOfProduct||'')}</td><td style="width:${colWidths.expiryDate}px">${renderSimple(row.expiryDate||'')}</td><td style="width:${colWidths.remarks}px">${renderSimple(row.remarks||'')}</td></tr>`;
  }).join('');

  const verificationHtml = `
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div><div style="font-weight:700">Verified By</div>${renderSignatureHtml(metadata.verifiedBySign||metadata.verifiedBy||'', { width:220, height:80 }) || escapeHtml(metadata.verifiedBy||'')}</div>
      <div><div style="font-weight:700">HSEQ Manager</div>${renderSignatureHtml(metadata.hseqManagerSign||metadata.hseqManager||'', { width:220, height:80 }) || escapeHtml(metadata.hseqManager||'')}</div>
    </div>
  `;

  const tableHtml = `<div style="overflow-x:auto"><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>${styles}</head><body><div class="container">${headerHtml}${tableHtml}${verificationHtml}</div></body></html>`;
}

module.exports = generateBeverageReceivingHtml;

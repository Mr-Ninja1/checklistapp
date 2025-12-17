const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateCookingTemperatureHtml(payload = {}, options = {}) {
  const p = payload.payload || payload || {};
  const meta = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  const title = escapeHtml(p.title || p.name || 'COOKING TEMPERATURE LOG');

  // Widths mirror presentational defaults
  const WIDTHS = (p.layoutHints && p.layoutHints.WIDTHS) || {
    INDEX: 40,
    FOOD_ITEM: 300,
    TIME: 80,
    TEMP: 80,
    SIGN: 100,
    STAFF_NAME: 160,
  };

  const TABLE_PX = (p._tableWidth && Number(p._tableWidth)) || (WIDTHS.INDEX + WIDTHS.FOOD_ITEM + (3 * (WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN)) + WIDTHS.STAFF_NAME);

  // Orientation heuristic (A4)
  const paperSize = (options.paperSize || 'A4').toString();
  const requestedOrientation = (options.orientation || 'auto').toString();
  const sizes = { A4: { w: '210mm', h: '297mm' } };
  const chosen = sizes[paperSize] || sizes.A4;
  const pxPerMm = 96 / 25.4;
  const parseSizeToMm = (s) => {
    if (!s) return 0;
    if (String(s).endsWith('mm')) return parseFloat(s.replace('mm',''));
    if (String(s).endsWith('in')) return parseFloat(s.replace('in','')) * 25.4;
    return parseFloat(s);
  };
  const portraitWidthMm = parseSizeToMm(chosen.w);
  const portraitPx = portraitWidthMm * pxPerMm;
  let orientationToUse = requestedOrientation === 'portrait' || requestedOrientation === 'landscape' ? requestedOrientation : 'portrait';
  if (requestedOrientation === 'auto') {
    if (TABLE_PX > portraitPx * 0.95) orientationToUse = 'landscape';
    else orientationToUse = 'portrait';
  }

  const styles = `
    <style>
      @page { size: ${paperSize} ${orientationToUse}; margin: 10mm; }
      html,body{margin:0;padding:0;font-family:Arial, Helvetica, sans-serif;color:#111827}
      .container{padding:8px}
      .topRow{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
      .logo{width:38px;height:28px;object-fit:contain}
      .company{font-weight:900;font-size:14px;margin-left:6px}
      .issueBox{border:1px solid #333;padding:6px;min-width:130px;text-align:right}
      .subjectBand{display:flex;align-items:center;border-top:1px solid #333;border-bottom:1px solid #333;padding:6px;margin-top:6px}
      .probe{display:flex;justify-content:space-between;border-bottom:1px solid #ccc;padding:6px;margin-top:6px}
      .table{border:1px solid #333;margin-top:6px;width:100%;border-collapse:collapse}
      .tableTitle{text-align:center;font-weight:800;padding:6px;border-bottom:1px solid #333}
      thead th{background:#F3F4F6;padding:6px;border-right:1px solid #333;font-weight:800;text-align:center}
      th,td{padding:6px;border-right:1px solid #ccc;border-bottom:1px solid #ccc}
      tbody tr{min-height:36px}
      thead{display:table-header-group}
      tbody tr{page-break-inside:avoid;break-inside:avoid}
      .footer{margin-top:12px}
      .signatureBox{margin-bottom:12px}
    </style>
  `;

  // Render rows; ensure minimum 15 rows like presentational
  const rowsToRender = (formData && formData.length) ? formData : Array.from({ length: 15 }, (_, i) => ({ index: i + 1 }));

  const tableHeader = `
    <thead>
      <tr>
        <th style="width:${WIDTHS.INDEX}px">#</th>
        <th style="width:${WIDTHS.FOOD_ITEM}px">FOOD ITEM</th>
        <th colspan="3">1ST RECORD</th>
        <th colspan="3">2ND RECORD</th>
        <th colspan="3">3RD RECORD</th>
        <th style="width:${WIDTHS.STAFF_NAME}px">STAFF'S NAME</th>
      </tr>
      <tr>
        <th></th>
        <th></th>
        ${['','',''].map(() => `<th style="width:${WIDTHS.TIME}px">TIME</th><th style="width:${WIDTHS.TEMP}px">TEMP</th><th style="width:${WIDTHS.SIGN}px">SIGN</th>`).join('')}
        <th></th>
      </tr>
    </thead>
  `;

  const rowsHtml = rowsToRender.map((r, ri) => {
    const idx = r.index || r.id || ri + 1;
    const renderSig = (v) => renderSignatureHtml(v, { width: WIDTHS.SIGN - 8, height: 48 }) || escapeHtml(v || '');
    return `<tr>
      <td style="text-align:center">${escapeHtml(idx)}</td>
      <td>${renderSimple(r.foodItem || r.food || r.name || '')}</td>
      <td style="text-align:center">${escapeHtml(r.time1 || '')}</td>
      <td style="text-align:center">${escapeHtml(r.temp1 ? `${r.temp1} °C` : '')}</td>
      <td style="text-align:center">${renderSig(r.sign1)}</td>
      <td style="text-align:center">${escapeHtml(r.time2 || '')}</td>
      <td style="text-align:center">${escapeHtml(r.temp2 ? `${r.temp2} °C` : '')}</td>
      <td style="text-align:center">${renderSig(r.sign2)}</td>
      <td style="text-align:center">${escapeHtml(r.time3 || '')}</td>
      <td style="text-align:center">${escapeHtml(r.temp3 ? `${r.temp3} °C` : '')}</td>
      <td style="text-align:center">${renderSig(r.sign3)}</td>
      <td style="text-align:center">${escapeHtml(r.staffName || r.staff || '')}</td>
    </tr>`;
  }).join('\n');

  const footerHtml = `
    <div class="footer">
      <div class="signatureBox"><strong>CHEF Signature:</strong><div>${renderSignatureHtml(meta.chefSignature || meta.chef || '') || '<div style="border-bottom:1px solid #333;padding:8px;width:220px;margin-top:6px">&nbsp;</div>'}</div></div>
      <div class="signatureBox"><strong>Corrective Action:</strong><div style="border:1px solid #ccc;padding:8px;min-height:48px;margin-top:6px">${escapeHtml(meta.correctiveAction || meta.corrective_action || '')}</div></div>
      <div class="signatureBox"><strong>Complex Manager:</strong><div>${renderSignatureHtml(meta.complexManagerSignature || meta.complexManager || '') || '<div style="border-bottom:1px solid #333;padding:8px;width:220px;margin-top:6px">&nbsp;</div>'}</div></div>
    </div>
  `;

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">
    <div class="topRow">
      <div style="display:flex;align-items:center">
        ${p.assets && p.assets.logoDataUri ? `<img src="${p.assets.logoDataUri}" class="logo"/>` : ''}
        <div class="company">${escapeHtml(meta.companyName || 'BRAVO BRANDS LIMITED')}</div>
      </div>
      <div class="issueBox"><div>Issue Date:</div><div style="font-weight:700">${escapeHtml(meta.issueDate || meta.date || '')}</div></div>
    </div>
    <div class="subjectBand"><div style="font-weight:700">SUBJECT: COOKING TEMPERATURE LOG</div><div style="display:flex;gap:12px"><div style="font-weight:700">COMPILED BY: ${escapeHtml(meta.compiledBy || '')}</div><div style="font-weight:700">APPROVED BY: ${escapeHtml(meta.approvedBy || '')}</div></div></div>
    <div class="probe"><div style="font-weight:700">PROBE THERMOMETER TEMPERATURE LOG FOR COOKED FOOD</div><div>DATE: ${escapeHtml(meta.date || '')}</div></div>
    <div style="overflow-x:auto">
      <table class="table">
        <caption class="tableTitle">COOKING TEMPERATURE LOG</caption>
        ${tableHeader}
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
    ${footerHtml}
  </div></body></html>`;

  return html;
}

module.exports = generateCookingTemperatureHtml;

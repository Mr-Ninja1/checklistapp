const { escapeHtml, renderSignatureHtml, extractBool, extractText, renderSimple } = require('../../utils/exportHelpers');

function generateBakerySanitizingHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const title = escapeHtml(p.title || p.name || 'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG - BAKERY');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  // Layout hints
  const layout = p.layoutHints || {};
  const COL = {
    EQUIP: layout.EQUIP || layout.EQUIPMENT || 220,
    PPM: layout.PPM || 80,
    TIME: layout.TIME_SLOT || layout.TIME || 44,
    STAFF: layout.STAFF || 120,
    SIGN: layout.SIGN || 120,
    SUP: layout.SUP || 120,
  };
  const timeSlots = Array.isArray(p.timeSlots) && p.timeSlots.length ? p.timeSlots : ['06:00','09:00','12:00','15:00'];
  const timeColsWidth = (timeSlots.length || 0) * COL.TIME;
  const TABLE_PX = p._tableWidth || (COL.EQUIP + COL.PPM + timeColsWidth + COL.STAFF + COL.SIGN + (COL.SUP*2));

  // orientation heuristic
  const paper = (options.paperSize || 'A4');
  const orientation = (options.orientation || 'auto');
  const pxPerMm = 96 / 25.4;
  const portraitMm = 210; // A4 portrait width mm
  const portraitPx = portraitMm * pxPerMm;
  const orientationToUse = orientation === 'auto' ? (TABLE_PX > portraitPx * 0.95 ? 'landscape' : 'portrait') : orientation;

  const styles = `
    <style>
      @page { size: ${paper} ${orientationToUse}; margin: 10mm; }
      html,body{margin:0;padding:0;background:#fff}
      body{font-family: Arial, Helvetica, sans-serif; color:#111}
      .container{padding:12px}
      .header{display:flex;align-items:center;gap:12px}
      .title{font-weight:800;color:#185a9d;font-size:16px}
      .meta{margin-top:8px;margin-bottom:6px}
      .table{border:1px solid #4B5563;border-radius:6px;background:#fff;overflow:visible}
      table{width:100%;border-collapse:collapse;table-layout:fixed}
      th,td{border:1px solid #e5e7eb;padding:6px;vertical-align:top}
      thead th{background:#f3f4f6;font-weight:800}
      .sig{max-width:220px;max-height:80px}
    </style>
  `;

  // header html
  const headerHtml = `
    <div class="header">
      ${logo ? `<img src="${logo}" style="width:72px;height:48px;object-fit:contain"/>` : ''}
      <div style="flex:1"><div class="title">${title}</div><div style="color:#6b7280">${escapeHtml(metadata.location || '')} ${escapeHtml(metadata.date || '')}</div></div>
    </div>
  `;

  // table header
  const ths = [`<th style="width:${COL.EQUIP}px">EQUIPMENT</th>`, `<th style="width:${COL.PPM}px">SANITIZER (PPM)</th>`, `<th style="width:${timeColsWidth}px">TIME INTERVAL</th>`, `<th style="width:${COL.STAFF}px">STAFF NAME</th>`, `<th style="width:${COL.SIGN}px">STAFF SIGN</th>`, `<th style="width:${COL.SUP}px">SUP NAME</th>`, `<th style="width:${COL.SUP}px">SUP SIGN</th>`].join('');

  const rowsHtml = (formData.length ? formData : Array.from({ length: 8 }).map(()=>({}))).map(row => {
    const equip = renderSimple(row.name || row.equipment || row.item || row.label || '');
    const ppm = renderSimple(row.ppm || row.sanitizer || '');
    const staffName = renderSimple(row.staffName || row.staff || '');
    const staffSign = renderSignatureHtml(row.staffSign || row.staffSignature || row.staffSignatureData || row.staffSignData, { width: COL.SIGN - 8, height: 60 }) || '';
    const supName = renderSimple(row.supName || row.supervisor || '');
    const supSign = renderSignatureHtml(row.supSign || row.supervisorSignature || '', { width: COL.SUP - 8, height: 60 }) || '';
    // time slots checkboxes
    const timeCells = timeSlots.map(t => {
      const checked = extractBool(row.times && (row.times[t] || row[t] || row[t.replace(/:/g,'')]));
      return `<td style="width:${COL.TIME}px;text-align:center">${checked ? '<span style="color:#10B981;font-weight:800;">✓</span>' : '<span style="display:inline-block;width:18px;height:18px;border:2px solid #4B5563;border-radius:4px;background:#fff;"></span>'}</td>`;
    }).join('');

    return `<tr><td style="width:${COL.EQUIP}px">${equip}</td><td style="width:${COL.PPM}px">${ppm}</td><td style="width:${timeColsWidth}px"><table style="width:100%;border-collapse:collapse"><tr>${timeCells}</tr></table></td><td style="width:${COL.STAFF}px">${staffName}</td><td style="width:${COL.SIGN}px">${staffSign}</td><td style="width:${COL.SUP}px">${supName}</td><td style="width:${COL.SUP}px">${supSign}</td></tr>`;
  }).join('');

  const tableHtml = `
    <div class="table">
      <table>
        <thead><tr>${ths}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  const verificationHtml = metadata.verifiedBySign ? `<div style="margin-top:12px">Verified By: ${renderSignatureHtml(metadata.verifiedBySign, { width: 240, height: 80 })}</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${headerHtml}${tableHtml}${verificationHtml}</div></body></html>`;
}

module.exports = generateBakerySanitizingHtml;

// Generates a print-ready HTML document for Walk-In Chiller Temperature Checklist
const { escapeHtml, normalizeSignature, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

export default function generateWalkInChillerLogHtml(formData = {}, options = {}) {
  const title = escapeHtml(formData.title || formData.name || 'WALK-IN CHILLER TEMPERATURE CHECKLIST');
  const date = escapeHtml(formData.date || formData.issueDate || options.date || new Date().toLocaleDateString());

  const layout = formData.layoutHints || {};
  const DATE = layout.DATE || 80;
  const RECORD_SLOT_WIDTH = layout.RECORD_SLOT_WIDTH || 300;
  const ACTION = layout.ACTION || 360;
  const SIGNATURE = layout.SIGNATURE || 200;
  const TIME_SLOTS = Array.isArray(layout.TIME_SLOTS) && layout.TIME_SLOTS.length ? layout.TIME_SLOTS : ['Morning','Afternoon','Evening'];

  const rows = Array.isArray(formData.formData) ? formData.formData : [];

  const paperSize = (options.paperSize || 'A4').toString().toLowerCase();
  const requestedOrientation = (options.orientation || 'auto').toString().toLowerCase();
  const sizes = { a4: { w: '297mm', h: '210mm' }, letter: { w: '11in', h: '8.5in' } };
  const chosen = paperSize === 'letter' ? sizes.letter : sizes.a4;

  // Compute table width in pixels and choose orientation automatically if requested
  const TABLE_PX = DATE + (TIME_SLOTS.length * RECORD_SLOT_WIDTH) + ACTION + SIGNATURE;
  const pxPerMm = 96 / 25.4;
  const parseSizeToMm = (s) => {
    if (!s) return 0;
    try {
      if (String(s).endsWith('mm')) return parseFloat(s.replace('mm',''));
      if (String(s).endsWith('in')) return parseFloat(s.replace('in','')) * 25.4;
      return parseFloat(s);
    } catch (e) { return 0; }
  };
  const portraitWidthMm = parseSizeToMm(chosen.h);
  const landscapeWidthMm = parseSizeToMm(chosen.w);
  const portraitPx = portraitWidthMm * pxPerMm;
  const landscapePx = landscapeWidthMm * pxPerMm;
  let orientationToUse = requestedOrientation === 'portrait' || requestedOrientation === 'landscape' ? requestedOrientation : 'portrait';
  if (requestedOrientation === 'auto') {
    if (TABLE_PX > portraitPx * 0.95) orientationToUse = 'landscape';
    else orientationToUse = 'portrait';
  }

  const styles = `
    <style>
      @page { size: ${paperSize} ${orientationToUse}; margin: 10mm; }
      html,body{margin:0;padding:0;background:#fff}
      body{font-family: Arial, Helvetica, sans-serif; font-size:10pt;color:#111;width:${orientationToUse === 'portrait' ? chosen.h : chosen.w}}
      .page{box-sizing:border-box;padding:6mm}
      h1{font-size:14pt;margin:0 0 6px;text-align:center}
      table{width:100%;border-collapse:collapse;margin-top:6px;table-layout:fixed}
      th,td{border:1px solid #ddd;padding:6px;font-size:9pt;word-break:break-word;vertical-align:top}
      thead th{background:#f6f9fb}
      .sig{max-width:220px;max-height:80px;border:1px solid #ccc}
      .slotRow{display:flex;align-items:center;justify-content:space-between}
      .slotValue{flex:1;text-align:center}
      .footer{margin-top:8mm;font-size:9pt;color:#666;text-align:center}
    </style>
  `;

  // Build header columns using saved widths for pixel-accurate layout
  const cols = [ { key: 'date', label: 'Date', w: DATE } ];
  TIME_SLOTS.forEach(slot => cols.push({ key: slot, label: slot, w: RECORD_SLOT_WIDTH }));
  cols.push({ key: 'action', label: 'If temp out of spec - what was done?', w: ACTION });
  cols.push({ key: 'sup', label: 'Sup Name & Sign', w: SIGNATURE });

  const ths = cols.map(c => `<th style="width:${c.w}px">${escapeHtml(c.label)}</th>`).join('');

  const rowHtml = rows.map((item, idx) => {
    const cells = [];
    // Date cell
    cells.push(`<td style="width:${DATE}px">${escapeHtml(item.day || item.date || '')}</td>`);
    // slots
    TIME_SLOTS.forEach(slot => {
      const sVal = item[slot] || item[slot.toLowerCase()] || {};
      const temp = renderSimple((sVal && (sVal.temp || sVal.temperature)) || '');
      const time = renderSimple((sVal && (sVal.time)) || '');
      const signRaw = sVal && (sVal.sign || sVal.signature) ? sVal.sign || sVal.signature : null;
      let signHtml = '';
      if (signRaw) {
        const img = renderSignatureHtml(signRaw, { width: 220, height: 80 });
        signHtml = img || escapeHtml(String(signRaw));
      }
      cells.push(`<td style="width:${RECORD_SLOT_WIDTH}px"><div class="slotRow"><div class="slotValue">${temp}</div><div class="slotValue">${time}</div><div class="slotValue">${signHtml}</div></div></td>`);
    });
    // action
    cells.push(`<td style="width:${ACTION}px">${escapeHtml(item.correctiveAction || '')}</td>`);
    // sup sign
    const supRaw = item.supNameSign || item.supSign || item.sup || '';
    let supHtml = '';
    if (supRaw) {
      const img = renderSignatureHtml(supRaw, { width: 220, height: 80 });
      supHtml = img || escapeHtml(String(supRaw));
    }
    cells.push(`<td style="width:${SIGNATURE}px">${supHtml}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  }).join('\n');

  const logoUri = (formData && formData.assets && formData.assets.logoDataUri) || '';
  const headerHtml = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="display:flex;align-items:center">
        <div style="width:56px;height:56px;margin-right:12px">${logoUri ? `<img src="${logoUri}" style="width:56px;height:56px;object-fit:contain"/>` : ''}</div>
        <div>
          <div style="font-weight:700;font-size:16px;color:#185a9d">Bravo! Food Safety Inspections</div>
          <div style="font-size:12px;color:#43cea2">Bravo Brands Central</div>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#374151">Issue Date: ${date}</div>
    </div>`;

  const subject = `<h1>${title}</h1><div style="text-align:center;color:#b91c1c;font-weight:700;margin-bottom:8px">Instruction: The temperature of the Walk-in Chiller should be between 0° C and 4° C</div>`;

  const html = `<!doctype html>
  <html>
    <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title>${styles}</head>
    <body>
      <div class="page">
        ${headerHtml}
        ${subject}
        <table>
          <thead><tr>${ths}</tr></thead>
          <tbody>
            ${rowHtml}
          </tbody>
        </table>
        <div class="footer">Generated by ChecklistApp</div>
      </div>
    </body>
  </html>`;

  return html;
}

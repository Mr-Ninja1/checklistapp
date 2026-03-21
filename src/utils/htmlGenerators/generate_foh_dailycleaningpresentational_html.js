// HTML generator for FOH Daily Cleaning (AM/PM) forms
const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const resolveSignatureUri = (val) => {
  if (!val) return null;
  // Handle object-based signatures from SignatureField
  if (typeof val === 'object') {
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    // Support nested signature property
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : payloadWrapper;
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : [];
  
  // FIXED MAPPINGS: Matching FOH_DailyCleaningForm_AM/PM metadata keys
  const verifiedBy = metadata.verifiedBy || metadata.verified_by || '';
  const verifiedSigSource = resolveSignatureUri(metadata.verifiedBySign || metadata.verifiedBySignature || metadata.verified_by_sign);
  
  const managerName = metadata.complexManager || metadata.manager || '';
  const managerSigSource = resolveSignatureUri(metadata.complexManagerSign || metadata.complexManagerSignature || metadata.managerSign);

  const timeSlots = p.timeSlots || ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00'];
  const logoDataUri = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : null;

  const sigHtml = (src, w, h) => `<img src="${src}" style="max-width:${w}px; max-height:${h}px; width:auto; height:auto; display:block; margin:0 auto; mix-blend-mode: multiply;" />`;

  // Column proportions roughly matching the editable form (EQUIPMENT, PPM, TIME INTERVAL, STAFF NAME, STAFF SIGN, SUP NAME, SUP SIGN)
  const defaultWidths = {
    EQUIP: 20,
    PPM: 7,
    TIME_SLOTS: 36,
    STAFF_NAME: 11,
    SIGNATURE: 11,
    SUP_NAME: 7.5,
    SUP_SIGN: 7.5,
  };
  const colPercent = (val) => `${val}%`;

  const rowsHtml = formData.map(row => {
    const equip = row.name || row.equipment || '';
    const ppm = row.ppm != null ? String(row.ppm) : '';
    const times = row.times && typeof row.times === 'object' ? row.times : {};
    const staffName = row.staffName || '';
    const staffSig = resolveSignatureUri(row.staffSignature || row.staffSign);
    const supName = row.SUPName || row.slipName || row.supName || row.supervisorName || '';
    const supSig = resolveSignatureUri(row.supSign || row.supervisorSignature);

    const checkCells = timeSlots.map((ts, idx) => {
      const val = times[ts];
      const display = val ? '✓' : '';
      return `<div class="timeCell">${escapeHtml(display)}</div>`;
    }).join('');

    return `
      <div class="row">
        <div class="cell left" style="width:${colPercent(defaultWidths.EQUIP)}">${escapeHtml(equip)}</div>
        <div class="cell" style="width:${colPercent(defaultWidths.PPM)}">${escapeHtml(ppm)}</div>
        <div style="display: flex; flex-direction: row; width:${colPercent(defaultWidths.TIME_SLOTS)};">
          ${checkCells}
        </div>
        <div class="cell" style="width:${colPercent(defaultWidths.STAFF_NAME)}">${escapeHtml(staffName)}</div>
        <div class="cell" style="width:${colPercent(defaultWidths.SIGNATURE)}">${staffSig ? sigHtml(staffSig, 80, 40) : ''}</div>
        <div class="cell" style="width:${colPercent(defaultWidths.SUP_NAME)}">${escapeHtml(supName)}</div>
        <div class="cell" style="width:${colPercent(defaultWidths.SUP_SIGN)}">${supSig ? sigHtml(supSig, 70, 40) : ''}</div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 0; color: #1F2937; font-size: 10px; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #374151; padding-bottom: 10px; margin-bottom: 20px; }
      .logo { height: 50px; width: auto; }
      .title-section { text-align: center; }
      .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; }
      .meta-grid { display: flex; gap: 20px; margin-bottom: 15px; }
      .meta-item { font-size: 11px; }
      .table { border: 1px solid #374151; width: 100%; }
      .row { display: flex; border-bottom: 1px solid #374151; min-height: 40px; align-items: stretch; }
      .header-row { background-color: #87CEEB; font-weight: bold; text-align: center; color: #0b2540; }
      .cell { padding: 4px; border-right: 1px solid #374151; display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .cell.left { justify-content: flex-start; padding-left: 8px; }
      .cell:last-child { border-right: none; }
      .timeCell { flex: 1; border-right: 1px solid #374151; display: flex; align-items: center; justify-content: center; min-width: 0; font-size: 9px; }
      .timeCell:last-child { border-right: 1px solid #374151; }
    </style>
  </head>
  <body>
    <div class="header">
      ${logoDataUri ? `<img src="${logoDataUri}" class="logo">` : '<div></div>'}
      <div class="title-section">
        <h1 class="title">FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH — ${escapeHtml((metadata.shift || 'AM').toUpperCase())}</h1>
      </div>
      <div style="text-align: right;">
        <div class="meta-item"><strong>Date:</strong> ${escapeHtml(metadata.date || '')}</div>
        <div class="meta-item"><strong>Location:</strong> ${escapeHtml(metadata.location || metadata.site || '')}</div>
      </div>
    </div>

    <div class="table">
      <div class="row header-row">
        <div class="cell" style="width:${colPercent(defaultWidths.EQUIP)}">EQUIPMENT</div>
        <div class="cell" style="width:${colPercent(defaultWidths.PPM)}">SANITIZER (PPM)</div>
        <div style="display: flex; flex-direction: column; width:${colPercent(defaultWidths.TIME_SLOTS)}; border-right: 1px solid #374151;">
          <div style="border-bottom: 1px solid #374151; padding: 2px;">TIME INTERVAL</div>
          <div style="display: flex; flex-direction: row; width: 100%;">
            ${timeSlots.map(t => `<div class="timeCell">${escapeHtml(String(t).replace(/(AM|PM)/,'').trim())}</div>`).join('')}
          </div>
        </div>
        <div class="cell" style="width:${colPercent(defaultWidths.STAFF_NAME)}">STAFF NAME</div>
        <div class="cell" style="width:${colPercent(defaultWidths.SIGNATURE)}">STAFF SIGN</div>
        <div class="cell" style="width:${colPercent(defaultWidths.SUP_NAME)}">SUP NAME</div>
        <div class="cell" style="width:${colPercent(defaultWidths.SUP_SIGN)}">SUP SIGN</div>
      </div>
      ${rowsHtml}
    </div>
  </body>
  </html>`;
};
// HTML generator for FOH Daily Cleaning (AM/PM) forms, matching FOH_DailyCleaningPresentational.js layout
const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const resolveSignatureUri = (val) => {
  if (!val) return null;
  if (typeof val === 'object') {
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
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
  const timeSlots = p.timeSlots || ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
  const hints = p.layoutHints || {};
  const defaultWidths = { EQUIPMENT: 140, PPM: 60, TIME_SLOT: 48, STAFF_NAME: 120, SIGNATURE: 120, SUP_NAME: 90, SUP_SIGN: 80 };
  const slotCount = timeSlots.length;
  const tableW = (hints.EQUIPMENT || defaultWidths.EQUIPMENT)
    + (hints.PPM || defaultWidths.PPM)
    + slotCount * (hints.TIME_SLOT || defaultWidths.TIME_SLOT)
    + (hints.STAFF_NAME || defaultWidths.STAFF_NAME)
    + (hints.SIGNATURE || defaultWidths.SIGNATURE)
    + (hints.SUP_NAME || defaultWidths.SUP_NAME)
    + (hints.SUP_SIGN || defaultWidths.SUP_SIGN)
    + 40;
  const colPercent = (w) => ((w / tableW) * 100).toFixed(4) + '%';
  const logo = (p.assets && p.assets.logoDataUri) ? p.assets.logoDataUri : null;
  const date = metadata.date || metadata.Date || p.date || p.savedAt || '';
  const location = metadata.location || metadata.Location || metadata.site || '';
  const shift = metadata.shift || metadata.Shift || metadata.shiftName || '';
  const verifiedBy = metadata.verifiedBy || metadata.verified_by || metadata.VerifiedBy || metadata.verifier || '';
  const managerSign = metadata.complexManagerSign || metadata.managerSign || metadata.complex_manager_sign || '';
  const tickAfterCleaning = metadata.tickAfterCleaning || metadata.tick || metadata.ticked || false;
  const sigHtml = (val, w=120, h=60) => {
    const uri = resolveSignatureUri(val);
    if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; object-fit:contain; display:block; mix-blend-mode:multiply;"/>`;
    return `<div style="font-size:10px; color:#9CA3AF; min-height:${h}px;">${escapeHtml(val||'')}</div>`;
  };
  const rowsHtml = (formData.length ? formData : Array.from({ length: 8 }).map(()=>({}))).map(row => {
    const equip = escapeHtml(row.name || row.equipment || '');
    const ppm = escapeHtml(row.ppm || '');
    const timesHtml = timeSlots.map(ts => {
      const checked = row.times && row.times[ts];
      return `<div class="timeCell">${checked ? '✓' : ''}</div>`;
    }).join('');
    return `<div class="row">
      <div class="cell area" style="width:${colPercent(defaultWidths.EQUIPMENT)}">${equip}</div>
      <div class="cell" style="width:${colPercent(defaultWidths.PPM)}">${ppm}</div>
      <div class="timeGroup" style="width:${colPercent(defaultWidths.TIME_SLOT * slotCount)}">${timesHtml}</div>
      <div class="cell" style="width:${colPercent(defaultWidths.STAFF_NAME)}">${escapeHtml(row.staffName || '')}</div>
      <div class="cell" style="width:${colPercent(defaultWidths.SIGNATURE)}">${sigHtml(row.staffSign, defaultWidths.SIGNATURE, 60)}</div>
      <div class="cell" style="width:${colPercent(defaultWidths.SUP_NAME)}">${escapeHtml(row.SUPName || row.slipName || row.supName || '')}</div>
      <div class="cell" style="width:${colPercent(defaultWidths.SUP_SIGN)}">${sigHtml(row.supSign, defaultWidths.SUP_SIGN, 60)}</div>
    </div>`;
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; font-size: 11px; }
    .container { background: #fff; }
    .headerRow { display: flex; background: #eee; padding: 8px; border-bottom: 1px solid #ccc; align-items: center; }
    .row { display: flex; border-bottom: 1px solid #e5e7eb; min-height: 40px; align-items: center; }
    .cell { padding: 6px; border-right: 1px solid #e5e7eb; justify-content: center; align-items: center; display: flex; }
    .area { text-align: left; padding-left: 12px; font-weight: 600; }
    .headerTop { display: flex; flex-direction: row; align-items: center; padding: 8px 12px; border-bottom: 1px solid #eee; }
    .logo { width: 64px; height: 48px; margin-right: 12px; }
    .companyNameLarge { font-size: 20px; font-weight: 800; color: #185a9d; margin-right: 12px; }
    .titleRow { margin: 12px 0 8px 0; text-align: center; }
    .formTitle { font-size: 16px; font-weight: 900; text-transform: uppercase; }
    .metaBoxInline { display: flex; flex-direction: row; gap: 24px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; margin-bottom: 8px; align-items: center; }
    .metaLabel { font-size: 12px; font-weight: 700; color: #666; }
    .metaValue { font-size: 12px; color: #222; }
    .metaLeft { flex: 1; }
    .metaRight { flex: 1; }
    .inlineSignatureRow { flex-direction: row; align-items: center; gap: 8px; }
    .metaManagerInline { flex-direction: row; align-items: center; gap: 8px; margin-left: 12px; }
    .managerSign { font-size: 12px; color: #888; }
    .tickBadgeInline { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 2px; font-weight: 700; border: 1px solid #bbf7d0; font-size: 12px; margin-left: 8px; }
    .table { border: 1px solid #475569; display: flex; flex-direction: column; width: 100%; border-bottom: none; }
    .headerRowTable { display: flex; background: #f8fafc; border-bottom: 1px solid #475569; align-items: stretch; min-height: 30px; }
    .timeGroup { display: flex; flex-direction: row; align-self: stretch; border-right: 1px solid #e5e7eb; }
    .timeCell { flex: 1; display: flex; align-items: center; justify-content: center; border-right: 1px solid #e5e7eb; height: 100%; font-weight: bold; font-size: 13px; }
    .timeCell:last-child { border-right: none; }
    .footer { margin-top: 8px; font-size: 10px; color: #64748b; text-align: center; font-style: italic; }
    .underline { text-decoration: underline; color: #aaa; }
  </style>
  </head><body>
    <div class="container">
      <div class="headerTop">
        ${logo ? `<img class="logo" src="${logo}"/>` : ''}
        <span class="companyNameLarge">Bravo</span>
        <span style="flex:1"></span>
      </div>
      <div class="titleRow">
        <span class="formTitle">FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH</span>
      </div>
      <div class="metaBoxInline">
        <div class="metaLeft"><span class="metaLabel">Date:</span> <span class="metaValue">${escapeHtml(date)}</span></div>
        <div class="metaLeft"><span class="metaLabel">Location:</span> <span class="metaValue">${escapeHtml(location)}</span></div>
        <div class="metaRight"><span class="metaLabel">Shift:</span> <span class="metaValue">${escapeHtml(shift)}</span></div>
        <div class="metaRight inlineSignatureRow"><span class="metaLabel">Verified By:</span> <span class="metaValue">${escapeHtml(verifiedBy)}</span>${metadata.verifiedBySign ? sigHtml(metadata.verifiedBySign, 140, 60) : ''}</div>
        <div class="metaManagerInline"><span class="metaLabel">COMPLEX MANAGER SIGN:</span> ${managerSign ? sigHtml(managerSign, 220, 80) : ''}</div>
        ${tickAfterCleaning ? '<div class="tickBadgeInline">✓ TICK AFTER CLEANING</div>' : ''}
      </div>
      <div class="table">
        <div class="headerRowTable">
          <div class="cell area" style="width:${colPercent(defaultWidths.EQUIPMENT)}">EQUIPMENT</div>
          <div class="cell" style="width:${colPercent(defaultWidths.PPM)}">SANITIZER (PPM)</div>
          <div class="cell" style="width:${colPercent(defaultWidths.TIME_SLOT * slotCount)}; padding: 0;">
            <div style="padding: 4px 0;">TIME INTERVAL</div>
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
      <div class="footer">Instruction: All food handlers are required to clean and sanitize the equipment after use.</div>
    </div>
  </body></html>`;
};

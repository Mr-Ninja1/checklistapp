const escapeHtml = (s) => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const normalizeIncoming = (incoming) => {
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
};

const resolveSignatureUri = (val) => {
  if (!val) return null;
  const s = String(val || '');
  if (s.startsWith('data:')) return s;
  const compact = s.replace(/\s+/g, '');
  if (compact.length > 100) return `data:image/png;base64,${compact}`;
  return null;
};

const renderSig = (v, w = 120, h = 40) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return '';
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin:0 auto; object-fit:contain;"/>`;
};

const renderSigFromPayload = (p, candidates = [], w = 150, h = 40) => {
  if (!p) return '';
  for (const c of candidates) {
    if (p[c]) {
      const res = renderSig(p[c], w, h);
      if (res) return res;
    }
  }
  return '';
};

module.exports = function(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const title = p.title || 'FOOD HANDLERS DAILY HANDWASHING LOG';
  const date = p.date || p.issueDate || '';
  const location = p.location || '';
  const shift = p.shift || p.shiftName || '';
  const verifiedBy = p.verifiedBy || '';
  const complexManager = p.complexManager || p.complexManagerSign || p.managerName || '';
  // Prefer structured handlers array used by presentational component; fall back to legacy logEntries
  const handlers = Array.isArray(p.handlers) ? p.handlers : (Array.isArray(p.logEntries) ? p.logEntries.map((r, idx) => ({
    id: (r && r.id) || idx + 1,
    fullName: (r && r[0]) || '',
    jobTitle: (r && r[1]) || '',
    checks: (function() {
      const times = {};
      const slots = (p.timeSlots && p.timeSlots.length) ? p.timeSlots : ['06:','07:','08:','09:','10:','11:','12:','13:'];
      for (let i = 0; i < slots.length; i++) {
        const val = r && r[i + 2];
        times[slots[i]] = !!(val === true || String(val).toLowerCase() === 'true' || val === '\u2611' || val === '1');
      }
      return times;
    })(),
    staffSign: (r && (r[10] || r[9])) || '',
    supName: (r && (r[11] || r[12] || '')) || '',
    supSign: (r && (r[11] ? r[11] : r[12])) || ''
  })) : []);

  // Re-balanced widths to give time slots more room
  const pct = {
    sn: 3,
    name: 15,       // Reduced from 18
    job: 10,        // Reduced from 12
    time: 7.25,     // Increased from 6 (7.25 * 8 = 58%)
    staffSign: 7,   // Tightened
    supSign: 7      // Tightened
  };

  const rawTimeSlots = (p.timeSlots && p.timeSlots.length) ? p.timeSlots : ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00'];
  const logoUri = (p.assets && p.assets.logoDataUri) ? p.assets.logoDataUri : null;

  // Abbreviate time slots (e.g., 08:00 -> 08 AM/PM)
  const formatTime = (ts) => {
    const clean = ts.replace(':00', '');
    const hour = parseInt(clean);
    if (isNaN(hour)) return ts;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${clean} ${period}`;
  };

  let headerTimeCells = '';
  rawTimeSlots.forEach(ts => {
    headerTimeCells += `<th style="width:${pct.time}%">${escapeHtml(formatTime(ts))}</th>`;
  });

  const renderSignatureCell = (v, w = 100, h = 50) => {
    const uri = resolveSignatureUri(v);
    if (!uri) return '';
    return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; margin:0 auto; object-fit:contain;"/>`;
  };

  let rowsHtml = '';
  handlers.forEach((row, i) => {
    if (!row) return;
    let timeCells = '';
    for (let s = 0; s < rawTimeSlots.length; s++) {
      const slot = rawTimeSlots[s];
      const checked = row.checks && (row.checks[slot] === true || String(row.checks[slot]).toLowerCase() === 'true');
      timeCells += `<td style="text-align:center">${checked ? '<span class="checkmark">✓</span>' : ''}</td>`;
    }

    rowsHtml += `
      <tr>
        <td style="text-align:center">${escapeHtml(String(row.id || (i + 1)))}</td>
        <td style="text-align:left; padding-left:6px;">${escapeHtml(row.fullName || '')}</td>
        <td style="text-align:left; padding-left:6px;">${escapeHtml(row.jobTitle || '')}</td>
        ${timeCells}
        <td style="text-align:center">${renderSignatureCell(row.staffSign, 80, 40)}</td>
        <td style="text-align:left; padding-left:6px">${escapeHtml(row.supName || '')}</td>
        <td style="text-align:center">${renderSignatureCell(row.supSign, 80, 40)}</td>
      </tr>
    `;
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page { size: A4 landscape; margin: 7mm; }
      body { 
        font-family: Arial, sans-serif; 
        margin: 0; padding: 0; color: #000; font-size: 10px;
        line-height: 1.1;
      }
      .container { width: 100%; }
      .headerSection { border-bottom: 2px solid #000; margin-bottom: 8px; padding-bottom: 4px; }
      .title { font-size: 15px; font-weight: bold; text-align: center; text-transform: uppercase; margin: 0; }
      
      .metaGrid { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 10px;
        padding: 0 2px;
      }

      .metaLeft { display: flex; gap: 15px; font-weight: bold; font-size: 10px; }

      .sigContainer { display: flex; gap: 20px; align-items: flex-end; }
      .sigWrapper { text-align: center; width: 160px; }
      .sigLine { border-bottom: 1px solid #000; min-height: 38px; display: flex; align-items: center; justify-content: center; }
      .sigLabel { font-size: 8px; font-weight: bold; margin-top: 2px; text-transform: uppercase; }
      .headerRow { display:flex; align-items:center; gap:12px; }
      .logoBox { width:56px; flex:0 0 56px; }
      .logoImg { width:56px; height:56px; object-fit:contain; border-radius:6px; }
      .titleBox { flex:1; text-align:center; }

      table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.2px solid #000; }
      th, td { border: 1px solid #000; padding: 2px 0; text-align: center; word-wrap: break-word; overflow: hidden; }
      th { background-color: #f4f4f4; font-weight: bold; font-size: 9px; height: 22px; }
      td { height: 36px; }

      .checkmark { font-size: 16px; font-weight: bold; color: #000; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="headerSection">
        <div class="headerRow">
          <div class="logoBox">
            ${logoUri ? `<img src="${logoUri}" class="logoImg"/>` : '<div style="width:56px;height:56px;border-radius:6px;background:#fff"></div>'}
          </div>
          <div class="titleBox">
            <h1 class="title">${escapeHtml(title)}</h1>
          </div>
        </div>
      </div>

      <div class="metaGrid">
        <div class="metaLeft">
          <span>DATE: ${escapeHtml(date)}</span>
          <span>LOCATION: ${escapeHtml(location)}</span>
          <span>SHIFT: ${escapeHtml(shift)}</span>
        </div>

        <div class="sigContainer">
          <div class="sigWrapper">
            <div class="sigLine">
              ${renderSigFromPayload(p, ['verifiedBySign','verifiedBySignature','verifiedBy'], 140, 38) || (verifiedBy ? escapeHtml(verifiedBy) : '')}
            </div>
            <div class="sigLabel">Verified By (Name & Sign)</div>
          </div>
          
          <div class="sigWrapper">
            <div class="sigLine">
              ${renderSigFromPayload(p, ['complexManagerSign', 'managerSign', 'managerSignature'], 140, 38) || (complexManager ? escapeHtml(complexManager) : '')}
            </div>
            <div class="sigLabel">Complex Manager (Name & Sign)</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:${pct.sn}%">S/N</th>
            <th style="width:${pct.name}%">Full Name</th>
            <th style="width:${pct.job}%">Job Title</th>
            ${headerTimeCells}
            <th style="width:${pct.staffSign}%">Staff Sign</th>
            <th style="width:${pct.supSign}%">Sup Name</th>
            <th style="width:${pct.supSign}%">Sup Sign</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div style="margin-top:10px; display:flex; align-items:center; gap:12px;">
        <div style="font-weight:700; color:#185a9d; margin-right:8px;">Complex Manager:</div>
        <div style="min-width:220px;">${renderSigFromPayload(p, ['complexManagerSign','complexManager','managerSignature'], 220, 80) || (complexManager ? escapeHtml(complexManager) : '')}</div>
      </div>
    </div>
  </body>
  </html>
  `;
};
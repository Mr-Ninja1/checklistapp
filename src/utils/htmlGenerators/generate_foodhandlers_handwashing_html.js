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
  const week = p.week || '';
  const month = p.month || '';
  const year = p.year || '';
  const verifiedBy = p.verifiedBy || '';
  const managerName = p.complexManager || p.managerName || '';
  const logEntries = Array.isArray(p.logEntries) ? p.logEntries : [];

  // Re-balanced widths to give time slots more room
  const pct = {
    sn: 3,
    name: 15,       // Reduced from 18
    job: 10,        // Reduced from 12
    time: 7.25,     // Increased from 6 (7.25 * 8 = 58%)
    staffSign: 7,   // Tightened
    supSign: 7      // Tightened
  };

  const rawTimeSlots = (p.timeSlots && p.timeSlots.length === 8) 
    ? p.timeSlots 
    : ['06:','07:','08:','09:','10:','11:','12:','13:'];

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

  let rowsHtml = '';
  logEntries.forEach((row, i) => {
    if (!row || !Array.isArray(row)) return;
    let timeCells = '';
    for (let s = 0; s < 8; s++) {
      const val = row[s + 2];
      const checked = val === true || String(val).toLowerCase() === 'true';
      timeCells += `<td>${checked ? '<span class="checkmark">✓</span>' : ''}</td>`;
    }

    rowsHtml += `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td style="text-align:left; padding-left:4px;">${escapeHtml(row[0])}</td>
        <td style="text-align:left; padding-left:4px;">${escapeHtml(row[1])}</td>
        ${timeCells}
        <td>${renderSig(row[10], 65, 30)}</td>
        <td>${renderSig(row[11], 65, 30)}</td>
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
        <h1 class="title">${escapeHtml(title)}</h1>
      </div>

      <div class="metaGrid">
        <div class="metaLeft">
          <span>WEEK: ${escapeHtml(week)}</span>
          <span>MONTH: ${escapeHtml(month)}</span>
          <span>YEAR: ${escapeHtml(year)}</span>
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
              ${renderSigFromPayload(p, ['complexManagerSign', 'managerSign', 'managerSignature'], 140, 38) || (managerName ? escapeHtml(managerName) : '')}
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
            <th style="width:${pct.staffSign}%">Staff</th>
            <th style="width:${pct.supSign}%">Sup</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  </body>
  </html>
  `;
};
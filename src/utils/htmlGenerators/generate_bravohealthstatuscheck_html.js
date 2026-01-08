// Node path/fs removed for mobile; prefer payload.assets.logoDataUri provided by the mobile exporter.

const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

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
  if (typeof val === 'object') {
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return val.data.startsWith('data:') ? val.data : `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    if (val.signature && typeof val.signature === 'string') return val.signature.startsWith('data:') ? val.signature : `data:image/png;base64,${val.signature.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || /^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 200 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
};

const renderMaybeSignature = (v, w = 220, h = 45) => {
  const uri = resolveSignatureUri(v);
  if (uri) return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; mix-blend-mode: multiply; margin: 0 auto;"/>`;
  return `<div style="border-bottom: 1px solid #ccc; width: 140px; height: 20px; margin: 5px auto;"></div>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);

  const COL = {
    NAME: '15%',
    POS: '10%',
    DAY_BOX: '10.7%', 
    FIT: '30%',
    COMM: '70%'
  };

  // Ensure we have at least 15 rows to fill the visual space
  const rowsHtml = (rows.length ? rows : Array.from({length: 15}).map(()=>({}))).map(r => {
    const weekly = r.weeklyChecks || {};
    const daysHtml = daysOfWeek.map(d => {
      const cell = weekly[d] || { fit: null, comment: '' };
      const fitChar = cell.fit === true ? '✓' : (cell.fit === false ? 'X' : '');
      return `
        <div style="display:flex; width:${COL.DAY_BOX}; border-right:1px solid #000; align-items:stretch">
          <div style="width:${COL.FIT}; padding:2px; text-align:center; border-right:1px solid #000; font-weight:900; display:flex; align-items:center; justify-content:center">${fitChar}</div>
          <div style="width:${COL.COMM}; padding:2px; font-size:8px; display:flex; align-items:center; overflow:hidden">${escapeHtml(cell.comment || '')}</div>
        </div>`;
    }).join('');

    return `
      <div style="display:flex; border-bottom:1px solid #000; min-height:30px; align-items:stretch; page-break-inside:avoid">
        <div style="width:${COL.NAME}; padding:2px 6px; border-right:1px solid #000; font-size:10px; display:flex; align-items:center">${escapeHtml(r.name || '')}</div>
        <div style="width:${COL.POS}; padding:2px 6px; border-right:1px solid #000; font-size:9px; display:flex; align-items:center">${escapeHtml(r.position || '')}</div>
        ${daysHtml}
      </div>`;
  }).join('\n');

  const logo = getLogoDataUri(p);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:6mm}
    *{box-sizing: border-box;}
    body{font-family:'Inter', Arial, sans-serif; margin:0; padding:0; color:#111; line-height:1.1}
    .container{width:100%; margin:0 auto;}
    .docHeader{display:flex; justify-content:space-between; border:1px solid #000; padding:5px; margin-bottom:5px}
    .brandTitle{font-weight:900; font-size:14px; color:#A00; text-transform:uppercase}
    .formTitle{font-weight:900; text-align:center; font-size:15px; margin:8px 0; text-transform:uppercase}
    .metaContainer{display:flex; gap:8px; margin-bottom:10px}
    .metaBox{flex:1; border:1px solid #000; padding:4px}
    .label{font-size:9px; font-weight:800; color:#444}
    /* Removed page-break-inside:avoid from .table to allow it to start on page 1 */
    .table{border:1.5px solid #000; border-bottom:none; width:100%;}
    .hRow{display:flex; background:#eee; border-bottom:1.5px solid #000; align-items:stretch}
    .hCell{font-weight:800; font-size:9px; text-align:center; border-right:1px solid #000; text-transform:uppercase; display:flex; align-items:center; justify-content:center}
    .sig-section{display:flex; gap:10px; margin-top:10px; page-break-inside:avoid}
    .sig-box{flex:1; border:1px solid #000; padding:6px}
  </style></head><body>

    <div class="container">
      <div class="docHeader">
        <div style="display:flex; align-items:center; gap:10px">
          ${logo ? `<img style="width:40px; height:30px; object-fit:contain" src="${logo}"/>` : ''}
          <div>
            <div class="brandTitle">Bravo</div>
            <div style="font-weight:700; font-size:10px">FOOD PRODUCTION AND SERVICE PERSONNEL</div>
          </div>
        </div>
        <div style="text-align:right; font-size:10px">
          <div>Doc Ref: ${escapeHtml(metadata.docRef || 'BBN-SHEQ-P-R-72')}</div>
          <div>Issue Date: ${escapeHtml(metadata.issueDate || metadata.date || '')}</div>
        </div>
      </div>

      <div class="formTitle">BRAVO BRANDS HEALTH STATUS CHECK</div>

      <div class="metaContainer">
        <div class="metaBox"><div class="label">SITE</div><div style="font-weight:700; border-top:1px solid #eee; margin-top:2px">${escapeHtml(metadata.site || '')}</div></div>
        <div class="metaBox"><div class="label">WEEK</div><div style="font-weight:700; border-top:1px solid #eee; margin-top:2px">${escapeHtml(metadata.week || '')}</div></div>
        <div class="metaBox"><div class="label">MONTH</div><div style="font-weight:700; border-top:1px solid #eee; margin-top:2px">${escapeHtml(metadata.month || '')}</div></div>
      </div>

      <div class="table">
        <div class="hRow">
          <div class="hCell" style="width:${COL.NAME}">NAMES</div>
          <div class="hCell" style="width:${COL.POS}">POSITION</div>
          ${daysOfWeek.map(d => `
            <div style="width:${COL.DAY_BOX}; display:flex; flex-direction:column; border-right:1px solid #000">
              <div style="padding:2px; border-bottom:1px solid #000; font-weight:900; background:#ddd; text-align:center">${d}</div>
              <div style="display:flex; flex:1">
                <div style="width:${COL.FIT}; border-right:1px solid #000; font-size:7px; display:flex; align-items:center; justify-content:center; text-align:center">Fit</div>
                <div style="width:${COL.COMM}; font-size:7px; display:flex; align-items:center; justify-content:center">Comment</div>
              </div>
            </div>`).join('')}
        </div>
        ${rowsHtml}
      </div>

      <div class="sig-section">
        <div class="sig-box"><div class="label">SUPERVISOR SIGN</div>${renderMaybeSignature(metadata.supervisorSign || metadata.supervisorSignature || metadata.supervisorName)}</div>
        <div class="sig-box"><div class="label">COMPLEX MANAGER</div>${renderMaybeSignature(metadata.complexManagerSign || metadata.complexManager)}</div>
        <div class="sig-box"><div class="label">HSEQ MANAGER</div>${renderMaybeSignature(metadata.hseqManagerSign || metadata.hseqManager)}</div>
      </div>
    </div>
  </body></html>`;
};
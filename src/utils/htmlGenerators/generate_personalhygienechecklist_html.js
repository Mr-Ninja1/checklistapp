// Node fs removed for mobile; use payload.assets.logoDataUri instead.
// Node path removed for mobile compatibility

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

const renderSig = (v, w = 200, h = 60) => {
  const uri = resolveSignatureUri(v);
  if (!uri) return `<div style="border-bottom:1px dotted #ccc; width:180px; height:20px; margin-top:8px"></div>`;
  return `<img src="${uri}" style="max-width:${w}px; max-height:${h}px; width:auto; display:block; object-fit:contain; mix-blend-mode: multiply;"/>`;
};

const getLogoDataUri = (p) => {
  if (!p) return null;
  if (p.assets && p.assets.logoDataUri) return p.assets.logoDataUri;
  if (p.logoDataUri) return p.logoDataUri;
  if (p.logo) return p.logo;
  return null;
};

module.exports = function generate(payloadWrapper) {
  const p = normalizeIncoming(payloadWrapper);
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  // Optimized proportional widths for A4 Landscape (Total ~100%)
  const COL = {
    DATE: '7%',
    NAME: '15%',
    CHECK: '5.5%', // 10 checks * 5.5% = 55%
    COMMENT: '13%',
    CHECKEDBY: '10%'
  };

  const checks = ['hairCover','shortNails','workSuit','jewellery','lipstick','persistentDiarrhoea','persistentCough','runningNose','skinInfection','openWound'];

  const rowsHtml = (rows.length ? rows : Array.from({length: 12}).map(()=>({}))).map(r => {
    const checksHtml = checks.map(k => {
      const v = r[k];
      const disp = v === 'tick' || v === true ? '✔️' : (v === 'cross' || v === false ? '✖️' : '');
      return `<td style="width:${COL.CHECK}; padding:4px; border:1px solid #000; text-align:center; font-size:12px">${escapeHtml(disp)}</td>`;
    }).join('');
    
    return `
      <tr style="page-break-inside:avoid">
        <td style="width:${COL.DATE}; padding:4px; border:1px solid #000; font-size:9px">${escapeHtml(r.date || '')}</td>
        <td style="width:${COL.NAME}; padding:4px; border:1px solid #000; text-align:left; font-size:10px">${escapeHtml(r.name || '')}</td>
        ${checksHtml}
        <td style="width:${COL.COMMENT}; padding:4px; border:1px solid #000; text-align:left; font-size:9px">${escapeHtml(r.comment || '')}</td>
        <td style="width:${COL.CHECKEDBY}; padding:4px; border:1px solid #000; text-align:left; font-size:9px">${escapeHtml(r.checkedBy || '')}</td>
      </tr>
    `;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 landscape; margin:7mm}
    *{box-sizing:border-box}
    body{font-family: Arial, sans-serif; margin:0; padding:0; color:#111; line-height:1.2}
    .wrap{width:100%; padding:0}
    .headerRowTop{display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; border: 1px solid #000; padding: 8px;}
    .logo{width:50px; height:40px; object-fit:contain}
    .formTitle{font-size:18px; font-weight:900; text-transform:uppercase}
    .infoRowTop{display:flex; justify-content:space-between; margin-bottom:8px; font-size:11px}
    table{border-collapse:collapse; width:100%; table-layout: fixed; border: 1.5px solid #000;}
    th{padding:4px 2px; border:1px solid #000; background:#eee; text-align:center; font-weight:700; font-size:8px; height:50px}
    td{border:1px solid #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
    .footerSignaturesRow{display:flex; gap:30px; margin-top:15px; page-break-inside:avoid}
    .signatureBlock{flex: 1; display:flex; flex-direction:column; border: 1px solid #000; padding: 8px;}
    .footerLabel{font-weight:700; font-size:10px; margin-bottom:4px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 2px;}
  </style></head><body>

  <div class="wrap">
    <div class="headerRowTop">
      <div style="display:flex; align-items:center; gap:10px">
        <img src="${getLogoDataUri(p) || ''}" class="logo"/>
        <div style="display:flex; flex-direction:column">
          <div style="font-weight:900; font-size:13px">BRAVO BRANDS LIMITED</div>
          <div style="font-size:10px">Food Safety Management System</div>
        </div>
      </div>
      <div class="formTitle">${escapeHtml(p.title || 'Personal Hygiene Checklist')}</div>
      <div style="text-align:right">
        <div style="font-size:10px"><strong>Doc Ref:</strong> BBN-FSMS-CL-01</div>
        <div style="font-size:10px"><strong>Issue Date:</strong> ${escapeHtml(meta.issueDate || p.savedAt || '')}</div>
      </div>
    </div>

    <div class="infoRowTop">
      <div><strong>Subject:</strong> Personnel Hygiene Checklist</div>
      <div><strong>Compiled By:</strong> ${escapeHtml(meta.compiledBy || 'HSEQ Department')}</div>
      <div><strong>Approved By:</strong> ${escapeHtml(meta.approvedBy || 'Hassani Ali')}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:${COL.DATE}">DATE</th>
          <th style="width:${COL.NAME}">NAME</th>
          ${['HAIR<br/>COVER','SHORT<br/>NAILS','WORK<br/>SUIT','JEWEL<br/>LERY','LIP<br/>STICK','DIAR<br/>RHOEA','COUGH','RUNNING<br/>NOSE','SKIN<br/>INF','OPEN<br/>WOUND'].map(l=>`<th style="width:${COL.CHECK}">${l}?</th>`).join('')}
          <th style="width:${COL.COMMENT}">COMMENT</th>
          <th style="width:${COL.CHECKEDBY}">CHECKED BY</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footerSignaturesRow">
      <div class="signatureBlock">
        <div class="footerLabel">HSEQ MANAGER SIGN</div>
        ${renderSig(meta.hseqSign || meta.hseqManagerSign || p.hseqSign || p.hseqManagerSign)}
      </div>
      <div class="signatureBlock">
        <div class="footerLabel">SUPERVISOR SIGN</div>
        ${renderSig(meta.supervisorSign || p.supervisorSign)}
      </div>
    </div>
  </div>

</body></html>`;
};
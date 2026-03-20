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
    if (val.uri) return val.uri;
    if (val.data) return `data:image/png;base64,${String(val.data).replace(/\s+/g,'')}`;
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
  const p = normalizeIncoming(payloadWrapper);
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  // Column definitions aligned with MixingControlSheet form + presentational
  const BASE_HEADERS = [
    { key: 'prodDate', label: 'PROD DATE', width: 120 },
    { key: 'prodName', label: 'PROD NAME', width: 180 },
    { key: 'batchNo', label: 'BATCH NO.', width: 100 },
    { key: 'ingredients', label: 'INGREDIENTS', width: 220 },
    { key: 'ingredientsWeight', label: 'INGREDIENTS WEIGHT (kgs)', width: 160 },
    { key: 'mixingTime', label: 'MIXING TIME', width: 120 },
    { key: 'mixingTemp', label: 'MIXING TEMP', width: 120 },
    { key: 'doughDividingScaling', label: 'DOUGH DIVIDING/SCALING (kgs)', width: 160 },
    { key: 'productQuantity', label: 'PRODUCT QUANTITY', width: 120 },
    { key: 'mixerManSign', label: 'MIXER MAN SIGN', width: 140 },
    { key: 'supSign', label: 'SUP SIGN', width: 140 },
  ];

  // If layoutHints are present, prefer those widths so the
  // PDF export respects any live column width tweaks.
  const headers = BASE_HEADERS.map(h => {
    const hint = p.layoutHints && typeof p.layoutHints[h.key] === 'number' ? p.layoutHints[h.key] : null;
    return { ...h, width: hint || h.width };
  });

  const total = headers.reduce((s, h) => s + (Number(h.width) || 0), 0) || 1;
  const colPercent = (w) => ((w / total) * 100).toFixed(4) + '%';

  let logo = (p.assets && (p.assets.logoDataUri || p.assets.logo)) ? (p.assets.logoDataUri || p.assets.logo) : (p.logo || p.logoDataUri || metadata.logoUrl || metadata.companyLogo || metadata.logo || null);

  const sigHtml = (v,w=120,h=60) => { const uri = resolveSignatureUri(v); if (uri) return `<img src="${uri}" style="max-width:${w}px;max-height:${h}px;display:block;object-fit:contain"/>`; return `<div style="min-height:${h}px;display:flex;align-items:center;justify-content:center;color:#6b7280">${escapeHtml(v||'')}</div>` };

  const rowsHtml = rows.map(row => `
    <div class="row">
      ${headers.map(h => {
        const widthStyle = `width:${colPercent(h.width)};min-width:${colPercent(h.width)};flex-shrink:0;`;
        const val = row && Object.prototype.hasOwnProperty.call(row, h.key) ? row[h.key] : '';
        const isSign = h.key.toLowerCase().includes('sign');
        return `<div class="cell" style="${widthStyle}">${isSign ? sigHtml(val || '') : escapeHtml(val || '')}</div>`;
      }).join('')}
    </div>`).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box}
    body{font-family:Inter,Arial,sans-serif;padding:12px;margin:0;color:#111827;background:#fff}
    .card{max-width:1100px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .logo{width:48px;height:48px;object-fit:contain}
    .subject{text-align:center;font-weight:800;margin-bottom:8px}
    .table{border:1px solid #333;border-radius:4px;overflow:hidden;width:100%}
    .tableHeader{display:flex;background:#f3f5f7;border-bottom:1px solid #333;width:100%}
    .headerCell{padding:8px;border-right:1px solid #333;font-weight:700;text-align:center;font-size:10px;display:flex;align-items:center;justify-content:center}
    .headerCell:last-child, .cell:last-child{border-right:none}
    .row{display:flex;border-bottom:1px solid #333;width:100%}
    .cell{padding:6px;border-right:1px solid #333;display:flex;align-items:center;justify-content:center;word-break:break-word;font-size:10px;min-height:40px}
    .cell img{max-height:60px;object-fit:contain}
  </style>
</head><body>
  <div class="card">
    <div class="header">${logo?`<img class="logo" src="${logo}" alt="Company logo"/>`:''}<div style="flex:1;text-align:right">${escapeHtml(metadata.issueDate||'')}</div></div>
    <div class="subject">SUBJECT: MIXING CONTROL SHEET</div>
    <div class="table">
      <div class="tableHeader">
        ${headers.map(h=>`<div class="headerCell" style="width:${colPercent(h.width)};min-width:${colPercent(h.width)};flex-shrink:0;">${escapeHtml(h.label)}</div>`).join('')}
      </div>
      ${rowsHtml}
    </div>
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div style="width:48%"><strong>VERIFIED BY:</strong><br/>${sigHtml(p?.verification?.mixerManSign||p?.verification?.mixerMan||'')}</div>
      <div style="width:48%;text-align:right"><strong>COMPLEX MANAGER:</strong><br/>${sigHtml(p?.verification?.complexManagerSign||'')}</div>
    </div>
  </div>
</body></html>`;
};
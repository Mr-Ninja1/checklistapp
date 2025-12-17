const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateDryStorageArea_CleaningChecklistHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const meta = p.metadata || {};
  const title = escapeHtml(p.title || p.name || 'DRY STORAGE AREA CLEANING CHECKLIST');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial}
      .container{padding:8px}
      .brandRow{display:flex;align-items:center;gap:12px}
      .brandLogo{width:56px;height:56px;object-fit:contain}
      .brandName{font-size:16px;font-weight:700;color:#185a9d}
      .brandSub{font-size:12px;color:#43cea2}
      .headerMeta{display:flex;justify-content:space-between;color:#6B7280;font-size:10px;margin-top:4px}
      .mainTitle{text-align:center;font-size:18px;font-weight:800;color:#1F2937;margin:8px 0}
      .metaBox{display:flex;justify-content:space-between;border:1px solid #1F2937;padding:6px;margin-bottom:8px}
      .metaField{padding:4px 8px;border-right:1px solid #1F2937}
      .metaLabel{font-size:11px;font-weight:600;color:#4B5563;margin-right:6px}
      .areaTitle{font-size:12px;font-weight:700;margin-top:6px;margin-bottom:6px}
      table{width:100%;border-collapse:collapse}
      thead th{background:#F3F4F6;border-bottom:2px solid #1F2937;padding:8px;font-weight:700;text-align:center}
      th,td{border:1px solid #1F2937;padding:8px;vertical-align:middle}
      thead{display:table-header-group}
      tbody tr{min-height:36px;page-break-inside:avoid;break-inside:avoid}
      .verification{margin-top:8px;padding:6px;border:1px solid #1F2937;background:#E5E7EB}
    </style>
  `;

  const header = `
    <div class="brandRow">
      ${logo ? `<img src="${logo}" class="brandLogo" />` : ''}
      <div style="flex:1">
        <div class="brandName">Bravo! Food Safety Inspections</div>
        <div class="brandSub">Bravo Brands Central</div>
      </div>
      <div style="text-align:right">
        <div class="headerMeta">Issue Date: ${escapeHtml(p.date || meta.issueDate || '')}</div>
        <div class="headerMeta">Page 1 of 1</div>
      </div>
    </div>
    <div class="mainTitle">${title}</div>
    <div class="metaBox">
      <div class="metaField" style="flex:2"><span class="metaLabel">LOCATION:</span> ${escapeHtml(meta.location||'')}</div>
      <div class="metaField"><span class="metaLabel">WEEK:</span> ${escapeHtml(meta.week||'')}</div>
      <div class="metaField"><span class="metaLabel">MONTH:</span> ${escapeHtml(meta.month||'')}</div>
      <div class="metaField"><span class="metaLabel">YEAR:</span> ${escapeHtml(meta.year||'')}</div>
    </div>
    <div class="areaTitle">WAREHOUSE AREA</div>
  `;

  const layout = p.layoutHints || {};
  const areaWidth = layout.area ? (Number(layout.area) ? `${layout.area}px` : layout.area) : '40%';
  const freqWidth = layout.frequency ? (Number(layout.frequency) ? `${layout.frequency}px` : layout.frequency) : '20%';
  const doneWidth = layout.doneBy ? (Number(layout.doneBy) ? `${layout.doneBy}px` : layout.doneBy) : '20%';
  const signWidth = layout.sign ? (Number(layout.sign) ? `${layout.sign}px` : layout.sign) : '20%';

  const ths = `<th style="width:${areaWidth}">Area</th><th style="width:${freqWidth}">Frequency</th><th style="width:${doneWidth}">Done By</th><th style="width:${signWidth}">Sign</th>`;

  const rowsToRender = (rows && rows.length) ? rows : (p.formData || []);

  const rowsHtml = (rowsToRender.length ? rowsToRender : []).map(r => {
    const freq = r.frequencyText || r.frequencyValue || r.frequency || r.freq || '';
    const doneBy = r.doneBy || r.staff || r.cleanedBy || '';
    const signVal = r.sign || r.signature || r.staffSign || r.staff_sign || '';
    return `
      <tr>
        <td>${renderSimple(r.area||r.name||'')}</td>
        <td>${renderSimple(freq)}</td>
        <td>${renderSimple(doneBy)}</td>
        <td style="text-align:center">${renderSignatureHtml(signVal, { width:160, height:64 })||''}</td>
      </tr>
    `;
  }).join('');

  const verificationSig = meta.hseqSign || meta.hseqManagerSign || meta.hseqManager || meta.verifiedBySign || meta.verifiedBy || meta.verifiedBySignature || '';
  const verification = `<div class="verification">Verified By: ${renderSignatureHtml(verificationSig, { width:220, height:80 })||escapeHtml(meta.verifiedBy||meta.hseqManager||'')}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<div style="overflow-x:auto"> <table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>${verification}</div></body></html>`;
}

module.exports = generateDryStorageArea_CleaningChecklistHtml;

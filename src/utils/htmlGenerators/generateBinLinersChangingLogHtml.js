const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateBinLinersChangingLogHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : p.rows || [];
  const title = escapeHtml(p.title || p.name || 'Bin Liners Changing Log');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const colWidths = { area: 300, freq: 120, doneBy: 160, sign: 160 };
  const totalWidth = Object.values(colWidths).reduce((s,v)=>s+v,0);
  const pxPerMm = 96/25.4; const portraitMm = 210; const portraitPx = portraitMm * pxPerMm;
  const orientationToUse = (options.orientation === 'auto' || !options.orientation) ? (totalWidth > portraitPx*0.95 ? 'landscape' : 'portrait') : options.orientation;

  const styles = `
    <style>
      @page{size:A4 ${orientationToUse};margin:10mm}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial;color:#111}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:8px}
      thead th{background:#f3f3f3;font-weight:700}
    </style>
  `;

  const headerHtml = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">${logo?`<img src="${logo}" style="width:56px;height:56px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(metadata.location||'')}<div style="font-size:12px">${escapeHtml(metadata.date||'')}</div></div></div><h3 style="text-align:center">Bin Liners Changing Log</h3>`;

  const ths = `<th style="width:${colWidths.area}px">Area</th><th style="width:${colWidths.freq}px">Frequency</th><th style="width:${colWidths.doneBy}px">Done By</th><th style="width:${colWidths.sign}px">Sign</th>`;

  const rowsHtml = (rows.length ? rows : []).map(r => {
    const staffSign = renderSignatureHtml(r.staffSign || r.sign || r.signature || '', { width: colWidths.sign-8, height: 48 }) || '';
    const supSign = renderSignatureHtml(r.supervisorSign || r.supervisor || r.supervisorSignature || '', { width: colWidths.sign-8, height: 48 }) || '';
    return `<tr><td style="width:${colWidths.area}px">${renderSimple(r.area||r.name||'')}</td><td style="width:${colWidths.freq}px">${renderSimple(r.frequency||r.freq||'')}</td><td style="width:${colWidths.doneBy}px">${renderSimple(r.changedBy||r.doneBy||r.name||'')}</td><td style="width:${colWidths.doneBy}px">${staffSign}</td><td style="width:${colWidths.sign}px">${supSign}</td></tr>`;
  }).join('');

  const tableHtml = `<div><table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;

  const verificationHtml = `
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div><div style="font-weight:700">Verified By</div>${renderSignatureHtml(metadata.verifiedBySign||metadata.verifiedBy||'', { width:220, height:80 }) || escapeHtml(metadata.verifiedBy||'')}</div>
      <div><div style="font-weight:700">HSEQ Manager</div>${renderSignatureHtml(metadata.hseqManagerSign||metadata.hseqManager||'', { width:220, height:80 }) || escapeHtml(metadata.hseqManager||'')}</div>
    </div>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${headerHtml}${tableHtml}${verificationHtml}</div></body></html>`;
}

module.exports = generateBinLinersChangingLogHtml;

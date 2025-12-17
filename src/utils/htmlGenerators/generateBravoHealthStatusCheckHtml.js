const { escapeHtml, renderSignatureHtml, renderSimple } = require('../../utils/exportHelpers');

function generateBravoHealthStatusCheckHtml(payload = {}, options = {}) {
  const p = payload.payload || payload;
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : (p.rows || []);
  const title = escapeHtml(p.title || p.name || 'Bravo Health Status Check');
  const logo = p.assets && p.assets.logoDataUri ? p.assets.logoDataUri : '';

  const styles = `
    <style>
      @page{size:A4 portrait; margin:10mm}
      html,body{margin:0;padding:0;font-family:Arial;color:#111}
      .container{padding:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:8px}
      thead th{background:#f6f6f6}
    </style>
  `;

  const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(metadata.site||'')}<div style="font-size:12px">${escapeHtml(metadata.date||'')}</div></div></div><h2>${title}</h2>`;

  const rowsHtml = (rows.length ? rows : [{ note: 'No entries' }]).map(r => {
    if (typeof r === 'object' && !Array.isArray(r)) {
      return Object.keys(r).map(k => `<tr><th style="width:28%">${escapeHtml(k)}</th><td>${renderSimple(r[k]) || renderSignatureHtml(r[k]||'', { width:220, height:80 })||''}</td></tr>`).join('');
    }
    return `<tr><th>Entry</th><td>${escapeHtml(String(r))}</td></tr>`;
  }).join('');

  const verification = `
    <div style="margin-top:12px;display:flex;justify-content:space-between">
      <div><div style="font-weight:700">Supervisor</div>${renderSignatureHtml(metadata.supervisorSign||metadata.supervisorSignature||metadata.supervisorName||'', { width:220, height:80 }) || escapeHtml(metadata.supervisorName||metadata.supervisor||'')}</div>
      <div><div style="font-weight:700">Complex Manager</div>${renderSignatureHtml(metadata.complexManagerSign||metadata.complexManager||'', { width:220, height:80 }) || escapeHtml(metadata.complexManager||'')}</div>
      <div><div style="font-weight:700">HSEQ Manager</div>${renderSignatureHtml(metadata.hseqManagerSign||metadata.hseqManager||'', { width:220, height:80 }) || escapeHtml(metadata.hseqManager||'')}</div>
    </div>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<table><tbody>${rowsHtml}</tbody></table>${verification}</div></body></html>`;
}

module.exports = generateBravoHealthStatusCheckHtml;

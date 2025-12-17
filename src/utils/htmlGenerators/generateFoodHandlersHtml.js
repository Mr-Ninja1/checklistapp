const { escapeHtml, renderSignatureHtml, renderSimple, extractBool } = require('../../utils/exportHelpers');

function generateFoodHandlersHtml(payload = {}, options = {}) {
	const p = payload.payload || payload;
	const metadata = p.metadata || {};
	// presentational component often uses `handlers` array; support both
	const rows = Array.isArray(p.handlers) ? p.handlers : (Array.isArray(p.formData) ? p.formData : (p.rows || []));
	const title = escapeHtml(p.title || p.name || 'Food Handlers Checklist');
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

	const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">${logo?`<img src="${logo}" style="width:64px;height:48px;object-fit:contain"/>`:''}<div style="text-align:right">${escapeHtml(metadata.location||'')}<div style="font-size:12px">${escapeHtml(metadata.date||'')}</div></div></div><h2>${title}</h2>`;

	const ths = `<th style="width:30%">Name</th><th style="width:20%">Cert/Status</th><th style="width:30%">Notes</th><th style="width:20%">Sign</th>`;

	const rowsHtml = (rows.length ? rows : []).map(r => {
		const name = renderSimple(r.fullName || r.name || r.handler || r.staff || '');
		const status = renderSimple(r.status || r.cert || r.certification || r.certStatus || '');
		const notes = renderSimple(r.notes || r.remarks || r.comment || '');
		const sign = renderSignatureHtml(r.staffSign || r.sign || r.signature || r.signatureData || r.signedBy || '', { width: 180, height: 64 }) || '';
		return `<tr><td>${name}</td><td style="text-align:center">${status}</td><td>${notes}</td><td style="text-align:center">${sign}</td></tr>`;
	}).join('');

	const verification = `
		<div style="margin-top:12px;display:flex;justify-content:space-between">
			<div><div style="font-weight:700">Verified By</div>${renderSignatureHtml(metadata.verifiedBySign||metadata.verifiedBy||'', { width:220, height:80 }) || escapeHtml(metadata.verifiedBy||'')}</div>
			<div><div style="font-weight:700">Manager</div>${renderSignatureHtml(metadata.managerSign||metadata.manager||'', { width:220, height:80 }) || escapeHtml(metadata.manager||'')}</div>
		</div>
	`;

	return `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>${styles}</head><body><div class="container">${header}<table><thead><tr>${ths}</tr></thead><tbody>${rowsHtml}</tbody></table>${verification}</div></body></html>`;
}

module.exports = generateFoodHandlersHtml;

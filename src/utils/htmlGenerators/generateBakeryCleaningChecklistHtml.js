// Bakery Cleaning Checklist HTML generator
// Generates HTML matching BakeryCleaningChecklistPresentational.js

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const { escapeHtml, normalizeSignature, renderSignatureHtml, extractBool, extractText, renderSimple } = require('../../utils/exportHelpers');

function generateBakeryCleaningChecklistHtml(payload, options = {}) {
	const p = payload || {};
	const payloadCore = p.payload || p;
	const { metadata = {}, formData = [], verification = {}, layoutHints = {}, _tableWidth } = payloadCore;
	const logoUri = payloadCore.assets && payloadCore.assets.logoDataUri ? payloadCore.assets.logoDataUri : null;

	// Column widths (pixel hints) and computed TABLE_WIDTH
	const COL = {
		AREA: (layoutHints && layoutHints.AREA) || layoutHints.AREA || 300,
		FREQ: (layoutHints && layoutHints.FREQ) || layoutHints.FREQ || 150,
		DAY: (layoutHints && layoutHints.DAY_COL) || layoutHints.DAY_COL || 150,
	};
	const TABLE_WIDTH = _tableWidth || (COL.AREA + COL.FREQ + (DAYS_OF_WEEK.length * COL.DAY));

	// Determine paper size and initial orientation (use options; allow 'auto')
	const paperSize = (options.paperSize || 'A4').toString();
	const requestedOrientation = (options.orientation || 'auto').toString();
	const sizes = { A4: { w: '210mm', h: '297mm' }, a4: { w: '210mm', h: '297mm' }, Letter: { w: '8.5in', h: '11in' }, letter: { w: '8.5in', h: '11in' } };
	const chosen = (sizes[paperSize] && sizes[paperSize]) || sizes.a4;

	// Compute whether to use landscape automatically based on table pixel width
	const TABLE_PX = _tableWidth || (COL.AREA + COL.FREQ + (DAYS_OF_WEEK.length * COL.DAY));
	const pxPerMm = 96 / 25.4; // CSS px per mm (approx)
	const parseSizeToMm = (s) => {
		if (!s) return 0;
		try {
			if (String(s).endsWith('mm')) return parseFloat(s.replace('mm',''));
			if (String(s).endsWith('in')) return parseFloat(s.replace('in','')) * 25.4;
			return parseFloat(s);
		} catch (e) { return 0; }
	};
	const portraitWidthMm = parseSizeToMm(chosen.w);
	const landscapeWidthMm = parseSizeToMm(chosen.h);
	const portraitPx = portraitWidthMm * pxPerMm;
	const landscapePx = landscapeWidthMm * pxPerMm;
	let orientationToUse = requestedOrientation === 'portrait' || requestedOrientation === 'landscape' ? requestedOrientation : 'portrait';
	if (requestedOrientation === 'auto') {
		// if table wider than portrait page, try landscape
		if (TABLE_PX > portraitPx * 0.95) orientationToUse = 'landscape';
		else orientationToUse = 'portrait';
	}

	// Convert column pixel widths to percentages so the table scales to page width instead of overflowing.
	const toPercent = (px) => ((px / TABLE_WIDTH) * 100).toFixed(2) + '%';
	const pctAREA = toPercent(COL.AREA);
	const pctFREQ = toPercent(COL.FREQ);
	const pctDAY = toPercent(COL.DAY);

	// Header HTML (uses embedded logoUri)
	const headerHtml = `
		<div style="display:flex;align-items:center;margin-bottom:6px;">
			${logoUri ? `<img src="${logoUri}" style="width:56px;height:56px;border-radius:6px;object-fit:contain;" />` : ''}
			<div style="flex:1;padding-left:8px;">
				<div style="font-size:18px;font-weight:800;color:#185a9d;">Bravo</div>
				<div style="font-size:12px;font-weight:700;color:#374151;">BAKERY & CONFECTIONARY AREA</div>
			</div>
			<div style="flex:1;text-align:center;">
				<div style="font-size:15px;font-weight:800;color:#1F2937;">BAKERY AREA CLEANING CHECKLIST</div>
				<div style="font-size:10px;color:#6b7280;">Issued: ${metadata.month || ''} ${metadata.year || ''}</div>
			</div>
		</div>
		<div style="display:flex;gap:16px;margin-bottom:4px;">
			<div><span style="font-weight:700;color:#374151;">Location:</span> <span style="color:#111827;">${metadata.location || ''}</span></div>
			<div><span style="font-weight:700;color:#374151;">Week:</span> <span style="color:#111827;">${metadata.week || ''}</span></div>
		</div>
	`;

	// Table header with percent widths
	const tableHeader = `
		<tr style="background:#f3f4f6;border-bottom:2px solid #1F2937;">
			<th style="width:${pctAREA};padding:8px;border-right:1px solid #4B5563;font-weight:800;color:#000;">Area to be cleaned</th>
			<th style="width:${pctFREQ};padding:8px;border-right:1px solid #4B5563;font-weight:800;color:#000;">Frequency</th>
			${DAYS_OF_WEEK.map(day => `
				<th style="width:${pctDAY};border-right:1px solid #4B5563;text-align:center;">
					<div style="background:#f3f4f6;height:26px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;">${day.toUpperCase()}</div>
					<div style="background:#f8fafc;height:20px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;">
						<span style="font-size:9px;font-weight:600;color:#000;">CHECK</span>
						<span style="font-size:9px;font-weight:600;color:#000;">CLEANED BY</span>
					</div>
				</th>
			`).join('')}
		</tr>
	`;

	// Table rows
	const tableRows = formData.map(item => {
			return `
				<tr style="background:#fff;border-bottom:1px solid #4B5563;">
					<td style="width:${pctAREA};padding:6px;border-right:1px solid #4B5563;font-size:12px;color:#374151;">${renderSimple(item.name)}</td>
					<td style="width:${pctFREQ};padding:6px;border-right:1px solid #4B5563;font-size:12px;color:#6B7280;">${renderSimple(item.frequency)}</td>
					${DAYS_OF_WEEK.map(day => {
						const dayObj = item.days && item.days[day] ? item.days[day] : { checked: false, cleanedBy: '' };
						const isChecked = extractBool(dayObj && (dayObj.checked !== undefined ? dayObj.checked : dayObj));
						const checkedHtml = isChecked ? `<span style="color:#10B981;font-size:14px;font-weight:800;">✓</span>` : `<span style="display:inline-block;width:18px;height:18px;border:2px solid #4B5563;border-radius:4px;background:#fff;"></span>`;
						const cleanedByRaw = (dayObj && (dayObj.cleanedBy || dayObj.cleanedByName || dayObj.cleanedByText)) || null;
						const cleanedByText = extractText(cleanedByRaw);
						const cleanedByHtml = (() => {
							if (!cleanedByRaw) return '';
							if (typeof cleanedByRaw === 'object') return renderSignatureHtml(cleanedByRaw, { width: 120, height: 40 });
							if (typeof cleanedByRaw === 'string' && /^data:image\/.+;base64,/.test(cleanedByRaw)) return `<img src="${escapeHtml(cleanedByRaw)}" style="width:120px;height:40px;object-fit:contain;border:1px solid #ccc;"/>`;
							return escapeHtml(String(cleanedByText || cleanedByRaw));
						})();
						return `
							<td style="width:${pctDAY};border-right:1px solid #4B5563;text-align:center;vertical-align:top;padding:6px;">
								<div style="height:22px;display:flex;align-items:center;justify-content:center;">
									${checkedHtml}
								</div>
								<div style="margin-top:6px;font-size:11px;color:#111827;">${cleanedByHtml}</div>
							</td>
						`;
					}).join('')}
				</tr>
			`;
		}).join('');

	// Table HTML (table set to 100% so percent column widths apply and table fits page)
	const tableHtml = `
		<div style="border:1px solid #1F2937;border-radius:6px;background:#fff;overflow-x:auto;">
			<table style="width:100%;border-collapse:collapse;">
				${tableHeader}
				${tableRows}
			</table>
		</div>
	`;

	// Verification / signatures
	const verificationHtml = `
		<div style="margin-top:12px;">
			<div style="display:flex;align-items:center;margin-bottom:6px;justify-content:space-between;">
				<div style="flex:1"><div style="font-weight:700;color:#374151;margin-right:8px;">HSEQ Manager:</div>${renderSignatureHtml(verification.hseqManager || verification.hseqManagerSign || verification.hseqManagerSignature || verification.hseqManagerSign, { width: 260, height: 96 }) || escapeHtml(verification.hseqManager || '')}</div>
				<div style="flex:1"><div style="font-weight:700;color:#374151;margin-right:8px;">Complex Manager:</div>${renderSignatureHtml(verification.complexManager || verification.complexManagerSign || verification.complexManagerSignature, { width: 260, height: 96 }) || escapeHtml(verification.complexManager || '')}</div>
			</div>
		</div>
	`;

	// Add explicit page CSS to force landscape and reduce header/table gap
	const styles = `
		<style>
			@page { size: ${paperSize} ${orientationToUse}; margin: 12mm; }
			html,body{margin:0;padding:0;background:#fff}
			body{font-family: Arial, Helvetica, sans-serif; color:#111827}
			.container{padding:8px}
			.table-wrapper{overflow:visible;margin-top:2px}
			table{width:100%;border-collapse:collapse;table-layout:fixed}
			th,td{border:1px solid #4B5563;padding:6px;vertical-align:top}
			thead th{background:#f3f4f6}
			/* allow table to break across pages but keep rows intact; repeat header on each page */
			thead{display:table-header-group}
			tbody tr{page-break-inside:avoid;break-inside:avoid}
			table{page-break-inside:auto}
			.header{margin-bottom:2px}
		</style>
	`;

	// Compose full HTML document
	const title = escapeHtml(metadata.title || metadata.name || 'BAKERY AREA CLEANING CHECKLIST');
	return `<!doctype html>
	<html>
	<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>${styles}</head>
	<body>
		<div class="container">
			<div class="header">${headerHtml}</div>
			<div class="table-wrapper">${tableHtml}</div>
			<div class="verification">${verificationHtml}</div>
		</div>
	</body>
	</html>`;
}

module.exports = generateBakeryCleaningChecklistHtml;

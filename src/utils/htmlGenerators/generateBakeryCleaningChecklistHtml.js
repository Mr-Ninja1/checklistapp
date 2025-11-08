// Bakery Cleaning Checklist HTML generator
// Generates HTML matching BakeryCleaningChecklistPresentational.js

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function normalizeSignature(val) {
	if (!val) return '';
	if (typeof val === 'object') {
		const maybe = val.uri || val.data || val.base64 || val;
		if (typeof maybe === 'string') return normalizeSignature(maybe);
		return '';
	}
	if (typeof val === 'string') {
		const s = val.trim();
		if (!s) return '';
		if (s.startsWith('data:')) return s.replace(/\s+/g, '');
		if (/^data:image\/.+;base64,/.test(s)) return s.replace(/\s+/g, '');
		const compact = s.replace(/\s+/g, '');
		if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
	}
	return '';
}

function renderSignature(val) {
	const uri = normalizeSignature(val);
	if (uri) {
		return `<img src="${uri}" style="width:180px;height:60px;border:1px solid #ccc;border-radius:6px;object-fit:contain;" />`;
	}
	return `<span>${val ? String(val) : ''}</span>`;
}

function generateBakeryCleaningChecklistHtml(payload) {
	const p = payload || {};
	const payloadCore = p.payload || p;
	const { metadata = {}, formData = [], verification = {}, layoutHints = {}, _tableWidth } = payloadCore;
	const logoUri = payloadCore.assets && payloadCore.assets.logoDataUri ? payloadCore.assets.logoDataUri : null;

	// Column widths
	const COL = {
		AREA: (layoutHints && layoutHints.AREA) || layoutHints.AREA || 300,
		FREQ: (layoutHints && layoutHints.FREQ) || layoutHints.FREQ || 150,
		DAY: (layoutHints && layoutHints.DAY_COL) || layoutHints.DAY_COL || 150,
	};
	const TABLE_WIDTH = _tableWidth || (COL.AREA + COL.FREQ + (DAYS_OF_WEEK.length * COL.DAY));

	// Header HTML
	const headerHtml = `
		<div style="display:flex;align-items:center;margin-bottom:12px;">
			<img src="${logoUri || '/assets/logo.jpeg'}" style="width:72px;height:72px;border-radius:6px;object-fit:contain;" />
			<div style="flex:1;padding-left:12px;">
				<div style="font-size:18px;font-weight:800;color:#185a9d;">Bravo</div>
				<div style="font-size:12px;font-weight:700;color:#374151;">BAKERY & CONFECTIONARY AREA</div>
			</div>
			<div style="flex:1;text-align:center;">
				<div style="font-size:16px;font-weight:800;color:#1F2937;">BAKERY AREA CLEANING CHECKLIST</div>
				<div style="font-size:10px;color:#6b7280;">Issued: ${metadata.month || ''} ${metadata.year || ''}</div>
			</div>
		</div>
		<div style="display:flex;gap:24px;margin-bottom:12px;">
			<div><span style="font-weight:700;color:#374151;">Location:</span> <span style="color:#111827;">${metadata.location || ''}</span></div>
			<div><span style="font-weight:700;color:#374151;">Week:</span> <span style="color:#111827;">${metadata.week || ''}</span></div>
		</div>
	`;

	// Table header
	const tableHeader = `
		<tr style="background:#f3f4f6;border-bottom:2px solid #1F2937;">
			<th style="width:${COL.AREA}px;padding:8px;border-right:1px solid #4B5563;font-weight:800;color:#000;">Area to be cleaned</th>
			<th style="width:${COL.FREQ}px;padding:8px;border-right:1px solid #4B5563;font-weight:800;color:#000;">Frequency</th>
			${DAYS_OF_WEEK.map(day => `
				<th style="width:${COL.DAY}px;border-right:1px solid #4B5563;text-align:center;">
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
				<td style="width:${COL.AREA}px;padding:6px;border-right:1px solid #4B5563;font-size:12px;color:#374151;">${item.name || ''}</td>
				<td style="width:${COL.FREQ}px;padding:6px;border-right:1px solid #4B5563;font-size:12px;color:#6B7280;">${item.frequency || ''}</td>
				${DAYS_OF_WEEK.map(day => {
					const dayObj = item.days && item.days[day] ? item.days[day] : { checked: false, cleanedBy: '' };
					return `
						<td style="width:${COL.DAY}px;border-right:1px solid #4B5563;text-align:center;vertical-align:top;padding:6px;">
							<div style="height:22px;display:flex;align-items:center;justify-content:center;">
								${dayObj.checked ? `<span style="color:#10B981;font-size:14px;font-weight:800;">✓</span>` : `<span style="display:inline-block;width:18px;height:18px;border:2px solid #4B5563;border-radius:4px;background:#fff;"></span>`}
							</div>
							<div style="margin-top:6px;font-size:11px;color:#111827;">${dayObj.cleanedBy || ''}</div>
						</td>
					`;
				}).join('')}
			</tr>
		`;
	}).join('');

	// Table HTML
	const tableHtml = `
		<div style="border:1px solid #1F2937;border-radius:6px;background:#fff;overflow-x:auto;">
			<table style="width:${TABLE_WIDTH}px;border-collapse:collapse;page-break-inside:avoid;">
				${tableHeader}
				${tableRows}
			</table>
		</div>
	`;

	// Verification section
	const verificationHtml = `
		<div style="margin-top:12px;">
			<div style="display:flex;align-items:center;margin-bottom:6px;">
				<span style="font-weight:700;color:#374151;margin-right:8px;">Verified by (HSEQ):</span>
				${renderSignature(verification.hseqManager || verification.hseqManagerSign || verification.hseqManagerSignature)}
			</div>
			<div style="display:flex;align-items:center;margin-bottom:6px;">
				<span style="font-weight:700;color:#374151;margin-right:8px;">Complex Manager:</span>
				${renderSignature(verification.complexManager || verification.complexManagerSign || verification.complexManagerSignature)}
			</div>
		</div>
	`;

	// Compose all
	return `
		<div style="padding:12px;background:#fff;font-family:Arial,sans-serif;">
			${headerHtml}
			${tableHtml}
			${verificationHtml}
		</div>
	`;
}

module.exports = generateBakeryCleaningChecklistHtml;

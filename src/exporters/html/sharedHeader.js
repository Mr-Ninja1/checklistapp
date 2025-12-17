// Shared header HTML for exporters — renders logo and company details
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

export function renderHeader({ title, date, logoDataUri, companyName = 'Bravo! Food Safety Inspections', companySub = 'Bravo Brands Central' } = {}) {
  // Always use the app's bundled logo path for exports
  const logoHtml = `<img src="src/assets/logo.jpeg" style="width:56px;height:56px;object-fit:contain;border-radius:4px"/>`;
  const t = escapeHtml(title || '');
  const d = escapeHtml(date || '');
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="display:flex;align-items:center">
        <div style="width:56px;height:56px;margin-right:12px">${logoHtml}</div>
        <div>
          <div style="font-weight:700;font-size:16px;color:#185a9d">${escapeHtml(companyName)}</div>
          <div style="font-size:12px;color:#43cea2">${escapeHtml(companySub)}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#374151">Issue Date: ${d}</div>
    </div>`;
}

export default { renderHeader };

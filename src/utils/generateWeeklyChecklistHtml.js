export default function generateWeeklyChecklistHtml(formData = {}, options = {}) {
  // formData: { title, meta: { location, week, month, year }, areas: [{ name, frequency, days: { Sun:{checked,cleanedBy}, ... } }] }
  const title = formData.title || 'Weekly Cleaning Checklist';
  const meta = formData.meta || {};
  const areas = formData.areas || [];
  const logoDataUri = formData.logoDataUri || options.logoDataUri || '';

  const styles = `
    <style>
      /* A4 landscape: width 297mm, height 210mm */
      @page { size: 297mm 210mm; margin: 8mm; }
      html,body{margin:0;padding:0}
      body{font-family: Arial, Helvetica, sans-serif; font-size:10pt; color:#111; width:297mm; height:210mm}
      .container{box-sizing:border-box;padding:8mm;width:100%;height:100%;position:relative}
      .top { display:flex; align-items:center; justify-content:space-between; margin-bottom:6mm }
      .left { display:flex; align-items:center }
      .logo { width:36mm; height:36mm; object-fit:contain; margin-right:8pt }
      .brand { font-weight:800; color:#0B4F8C; font-size:12pt }
      .title { text-align:center; font-size:16pt; font-weight:900; color:#0B4F8C; margin-bottom:6mm }
      .meta { font-size:10pt; margin-top:4mm }
      table { width:100%; border-collapse:collapse; font-size:9pt; table-layout:fixed }
      th, td { border:1pt solid #444; padding:4pt 6pt }
      th { background:#f6f9fb; font-weight:800; color:#0B4F8C; text-align:center }
      td { vertical-align:middle }
      .day-col { width:40mm }
      .footer { position:absolute; bottom:8mm; left:8mm; right:8mm; text-align:center; color:#0B4F8C; font-size:9pt }
      thead th { text-align:center }
      tbody tr { page-break-inside: avoid }
    </style>
  `;

  const header = `
    <div class="top">
      <div class="left">
        ${logoDataUri ? `<img class="logo" src="${logoDataUri}" />` : '<div style="width:36mm;height:36mm"></div>'}
        <div class="brand">Bravo</div>
      </div>
      <div style="text-align:right">
        <div>${meta.docNo || ''}</div>
        <div>${meta.issueDate || ''}</div>
      </div>
    </div>
    <div class="title">${title}</div>
    <div class="meta">LOCATION: ${meta.location || ''} &nbsp; | &nbsp; WEEK: ${meta.week || ''} &nbsp; | &nbsp; MONTH: ${meta.month || ''} ${meta.year ? '| ' + meta.year : ''}</div>
  `;

  // table header: Area | Frequency | for each day: CHECK | CLEANED BY
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const ths = ['Area to be cleaned','Frequency', ...days.flatMap(d => ([`${d} CHECK`, `${d} CLEANED BY`]))];
  const thHtml = ths.map(h => `<th>${h}</th>`).join('');

  const rowsHtml = areas.map((area, idx) => {
    const dayCols = days.map(d => {
      const cell = (area.days && area.days[d]) || { checked: false, cleanedBy: '' };
      return `<td style="text-align:center">${cell.checked ? '✓' : ''}</td><td style="text-align:center">${(cell.cleanedBy || '')}</td>`;
    }).join('');
    return `<tr><td>${area.name}</td><td style="text-align:center">${area.frequency || ''}</td>${dayCols}</tr>`;
  }).join('\n');

  const html = `<!doctype html><html><head><meta charset='utf-8'/>${styles}</head><body><div class="container">${header}<table><thead><tr>${thHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><div class="footer">${formData.footerText || ''}</div></div></body></html>`;

  return html;
}

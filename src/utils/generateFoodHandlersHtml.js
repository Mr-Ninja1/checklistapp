export default function generateFoodHandlersHtml(formData = {}, options = {}) {
  // formData: { title, date, location, shift, verifiedBy, handlers: [{ fullName, jobTitle, checks, staffSign, supName, supSign }], timeSlots }
  const title = formData.title || 'Food Handlers Daily Handwashing Tracking Log Sheet';
  const date = formData.date || '';
  const location = formData.location || '';
  const shift = formData.shift || '';
  const verifiedBy = formData.verifiedBy || '';
  const handlers = formData.handlers || [];
  const timeSlots = formData.timeSlots || ['06:00AM','07:00AM','08:00AM','09:00AM','10:00AM','11:00AM','12:00PM','13:00PM','14:00PM','15:00PM'];

  // optional base64 logo data uri — prefer the value embedded in the saved formData (meta)
  const logoDataUri = formData.logoDataUri || options.logoDataUri || '';

  // styles: use cm and pt for physical sizing to ensure A4 accuracy
  const styles = `
    <style>
      /* A4 portrait: width 210mm, height 297mm */
      @page { size: 210mm 297mm; margin: 6mm; }
      html, body { margin: 0; padding: 0; }
      /* Force exact A4 portrait viewport so print engine lays out a single page */
      body { width: 210mm; height: 297mm; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color:#111; }
      .container { box-sizing: border-box; width: 100%; height: 100%; padding: 6mm; overflow: hidden; position: relative; }
      /* Top stamp: logo+brand left, doc info right */
      .top-stamp { display:flex; justify-content:space-between; align-items:center; margin-bottom:6mm; }
      .stamp-left { display:flex; align-items:center; }
      .logo-small { width: 30mm; height: 30mm; object-fit:contain; margin-right:6pt; }
      .brandName { font-size: 10pt; color: #0B4F8C; font-weight: 700; }
      .stamp-right { text-align:right; font-size: 10pt; color:#333; font-weight:700; }
      .title { font-size: 16pt; font-weight: 900; color: #0B4F8C; text-align: center; margin-bottom:4mm; }
      .divider { height:1pt; background:#e2e8f0; margin-bottom:6mm; }
      .meta { margin-top: 2mm; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; margin-top: 6mm; table-layout: fixed; font-size: 9pt; }
  th, td { border: 1pt solid #444; padding: 3pt 4pt; font-size: 9pt; }
      th { background: #f6f9fb; font-weight: 800; color: #0B4F8C; }
      .checkbox { display:inline-block; width: 14pt; height: 14pt; border: 1.2pt solid #444; vertical-align: middle; margin-right: 4pt; }
      .checked { background: #0B4F8C; }
  /* Footer is fixed to bottom inside A4 so it doesn't push content to another page */
  .footer { position: absolute; bottom: 6mm; left: 6mm; right: 6mm; font-size: 9pt; color: #0B4F8C; text-align:center; }
  /* Reduce table header/footer spacing to help fit everything on one page */
  thead th { text-align: center; }
  tbody tr { page-break-inside: avoid; }
      thead th { text-align: center; }
      td { word-wrap: break-word; }
    </style>
  `;

  // header HTML
  const headerHtml = `
    <div class="top-stamp">
      <div class="stamp-left">
        ${logoDataUri ? `<img class="logo-small" src="${logoDataUri}" alt="logo" />` : '<div style="width:30mm;height:30mm"></div>'}
        <div class="brandName">Bravo</div>
      </div>
      <div class="stamp-right">${formData.docNo || ''}<br/> ${formData.issueDate || ''}</div>
    </div>
    <div class="title">${title}</div>
    <div class="divider"></div>
    <div class="meta">Date: ${date} &nbsp; | &nbsp; Shift: ${shift} &nbsp; | &nbsp; Location: ${location}</div>
    <div style="margin-top:6mm;display:flex;align-items:center;">
      <div style="flex:1;font-size:11pt;">Verified By:</div>
      <div style="flex:1;border-bottom:1pt solid #444;height:18pt;margin-right:8mm"></div>
      <div style="flex:1;font-size:11pt;text-align:right;">Complex Manager Sign:</div>
      <div style="flex:1;border-bottom:1pt solid #444;height:18pt;margin-left:8mm"></div>
    </div>
  `;

  // table header
  const headers = ['S/N','Full Name','Job Title', ...timeSlots.map(t => t.replace(':00','').replace('AM','').replace('PM','')), 'Staff Sign','Sup Name','Sup Sign'];
  const thHtml = headers.map(h => `<th>${h}</th>`).join('');

  // rows
  const rowsHtml = handlers.map((row, idx) => {
    const checksHtml = timeSlots.map(ts => {
      const checked = row.checks && row.checks[ts];
      return `<td style="text-align:center">${checked ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>'}</td>`;
    }).join('');

    return `<tr>
      <td>${idx+1}</td>
      <td>${row.fullName || ''}</td>
      <td>${row.jobTitle || ''}</td>
      ${checksHtml}
      <td>${row.staffSign || ''}</td>
      <td>${row.supName || ''}</td>
      <td>${row.supSign || ''}</td>
    </tr>`;
  }).join('\n');

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${styles}
      </head>
      <body>
        <div class="container">
          ${headerHtml}
          <table>
            <thead><tr>${thHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">All food handlers are required to wash and sanitize their hands after every 60 minutes.</div>
        </div>
      </body>
    </html>
  `;

  return html;
}

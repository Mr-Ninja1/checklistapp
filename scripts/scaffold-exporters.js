const fs = require('fs');
const path = require('path');

const SRC_FORMS = path.resolve(__dirname, '..', 'src', 'forms');
const SRC_COMPONENTS = path.resolve(SRC_FORMS, 'components');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'exporters');

function listJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => path.join(dir, f));
}

function readFileSafe(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { return ''; }
}

function extractLabelsAndHints(src) {
  // Heuristic extraction from JSX: text nodes and prop values for label/name
  const labels = new Set();
  // capture JSX text nodes like >Some label<
  const textNodeRe = />\s*([^<>\n\r]{3,80}?)\s*</g;
  let m;
  while ((m = textNodeRe.exec(src))) {
    const s = m[1].trim();
    if (s && /^[A-Za-z0-9 /:\-()'.,]+$/.test(s)) labels.add(s);
  }
  // capture label={"..."} or label="..."
  const labelPropRe = /label\s*=\s*{?\s*['\"]([^'\"]{1,120})['\"]\s*}?/g;
  while ((m = labelPropRe.exec(src))) labels.add(m[1].trim());
  // capture name={'fieldName'} or name="fieldName"
  const namePropRe = /name\s*=\s*{?\s*['\"]([^'\"]{1,120})['\"]\s*}?/g;
  while ((m = namePropRe.exec(src))) labels.add(m[1].trim());

  // detect signs and checkbox-ish hints
  const hasSign = /sign|signature|signedBy|verifiedBy/i.test(src);
  const hasCheckbox = /checkbox|checked|checks|timeSlots|timeSlot|intervals|timeslot|timeslots/i.test(src);

  return { labels: Array.from(labels).slice(0, 30), hasSign, hasCheckbox };
}

function generateHtmlSkeleton(formFileName, hints) {
  const title = formFileName.replace(/\.js$/, '');
  const headerFields = ['location', 'shift', 'date', 'verifiedBy', 'verifiedBySign', 'managerSign', 'complexManagerSign'];
  const headerHtml = headerFields.map(k => `<div class="hdr-row"><strong>${k}</strong>: <!-- {{${k}}} --></div>`).join('\n');

  const labelsHtml = hints.labels.slice(0, 12).map(l => `<div class="field-row"><span class="label">${l}</span>: <!-- {{${l}}} --></div>`).join('\n');

  const signHtml = hints.hasSign ? `<div class="sign-row">\n  <div class="sign"><div class="sign-label">Signature</div><div class="sign-box"><!-- {{signature}} --></div></div>\n</div>` : '';
  const checkboxNote = hints.hasCheckbox ? '<!-- NOTE: this form has checkbox/time-grid patterns; replace table below with a narrow-checkbox table -->' : '';

  const css = `
  body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 16px; }
  .form-title { text-align: center; font-size: 18px; font-weight: 700; margin-bottom: 12px }
  .header-block { border: 1px solid #ccc; padding: 8px; margin-bottom: 12px; }
  .hdr-row { margin: 4px 0 }
  .field-row { margin: 6px 0 }
  .label { font-weight: 600 }
  .sign-box { width: 220px; height: 80px; border: 1px dashed #888; }
  table.data { width: 100%; border-collapse: collapse; margin-top: 12px }
  table.data th, table.data td { border: 1px solid #ccc; padding: 6px; font-size: 12px }
  `;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title} - export skeleton</title>
<style>${css}</style>
</head>
<body>
<div class="form-title">${title}</div>
<div class="header-block">
${headerHtml}
</div>
<div class="body-block">
${labelsHtml}

${signHtml}

${checkboxNote}

<table class="data">
  <thead>
    <tr>
      <th>Col 1</th>
      <th>Col 2</th>
      <th>Col 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><!-- {{row.0.col1}} --></td>
      <td><!-- {{row.0.col2}} --></td>
      <td><!-- {{row.0.col3}} --></td>
    </tr>
  </tbody>
</table>
</div>
</body>
</html>`;

  return html;
}

function main() {
  const formFiles = listJsFiles(SRC_FORMS).filter(p => !p.includes(path.join('src','forms','components')));
  const componentFiles = listJsFiles(SRC_COMPONENTS);
  const allFiles = [...formFiles];

  if (componentFiles.length) allFiles.push(...componentFiles);

  const summary = [];
  allFiles.forEach(file => {
    const src = readFileSafe(file);
    if (!src) return;
    const hints = extractLabelsAndHints(src);
    const baseName = path.basename(file).replace(/\.js$/, '');
    const outPath = path.join(OUT_DIR, `${baseName}.html`);
    const html = generateHtmlSkeleton(baseName, hints);
    fs.writeFileSync(outPath, html, 'utf8');
    summary.push({ file: path.relative(process.cwd(), file), out: path.relative(process.cwd(), outPath), labelsCount: hints.labels.length, hasSign: hints.hasSign, hasCheckbox: hints.hasCheckbox });
  });

  const reportPath = path.join(OUT_DIR, 'scaffold-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log('Generated', summary.length, 'exporter skeletons. Report:', reportPath);
}

main();

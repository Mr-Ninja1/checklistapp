const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEARCH_PATHS = [
  path.join(ROOT, 'src', 'forms'),
  path.join(ROOT, 'src', 'forms', 'components'),
];
const mappingFile = path.join(ROOT, 'src', 'utils', 'htmlGenerators', 'mapping.js');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && full.endsWith('.js')) files.push(full);
  }
  return files;
}

function extractTitles(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /title\s*:\s*['"`]([^'"`]+?)['"`]/g;
  const out = [];
  let m;
  while ((m = re.exec(txt))) out.push(m[1].trim());
  return out;
}

function main() {
  if (!fs.existsSync(mappingFile)) {
    console.error('mapping.js not found at', mappingFile);
    process.exit(2);
  }

  const mappingTxt = fs.readFileSync(mappingFile, 'utf8');

  const forms = [];
  for (const base of SEARCH_PATHS) {
    if (!fs.existsSync(base)) continue;
    const files = walk(base);
    for (const f of files) {
      const rel = path.relative(path.join(ROOT, 'src', 'forms'), f);
      const titles = extractTitles(f);
      forms.push({ file: f, rel, titles });
    }
  }

  const missing = [];
  const unmappedNoTitle = [];

  for (const fm of forms) {
    if (!fm.titles || fm.titles.length === 0) {
      unmappedNoTitle.push(fm.rel);
      continue;
    }
    // if any title of file is present in mapping.js consider it mapped
    const mapped = fm.titles.some(t => mappingTxt.includes(t));
    if (!mapped) missing.push({ file: fm.rel, titles: fm.titles });
  }

  console.log('Total form files scanned:', forms.length);
  console.log('Files with no title entries found:', unmappedNoTitle.length);
  if (unmappedNoTitle.length) {
    unmappedNoTitle.forEach(f => console.log(' -', f));
  }

  console.log('\nFiles with titles but no mapping entry:');
  if (missing.length === 0) console.log('All titled forms are present in mapping.js');
  else {
    missing.forEach(m => {
      console.log('\n- ' + m.file);
      m.titles.forEach(t => console.log('   •', t));
    });
    process.exitCode = 1;
  }
}

main();

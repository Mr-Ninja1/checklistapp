const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const formsDir = path.join(ROOT, 'src', 'forms');
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

function extractFormTitles(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const titles = new Set();
  const re = /title\s*:\s*['"`]([^'"`]+?)['"`]/g;
  let m;
  while ((m = re.exec(txt))) titles.add(m[1].trim());
  return Array.from(titles);
}

function main() {
  if (!fs.existsSync(formsDir)) {
    console.error('forms dir not found', formsDir);
    process.exit(2);
  }
  if (!fs.existsSync(mappingFile)) {
    console.error('mapping.js not found', mappingFile);
    process.exit(2);
  }

  const formFiles = walk(formsDir);
  const formTitles = new Set();
  for (const f of formFiles) {
    const t = extractFormTitles(f);
    t.forEach(x => formTitles.add(x));
  }

  const mappingTxt = fs.readFileSync(mappingFile, 'utf8');

  const missing = [];
  for (const title of Array.from(formTitles).sort()) {
    if (!mappingTxt.includes(title)) missing.push(title);
  }

  console.log('Found', formTitles.size, 'unique form titles');
  if (missing.length === 0) console.log('All titles appear in mapping.js');
  else {
    console.log('Titles NOT found in mapping.js:');
    missing.forEach(t => console.log(' -', t));
  }
}

main();

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEARCH_PATHS = [
  path.join(ROOT, 'src', 'forms'),
  path.join(ROOT, 'src', 'forms', 'components'),
];

const keyRegex = /['"`]([a-zA-Z0-9_\-]*?(sign|signature|verified|verifiedBy|manager|shift|location|logo|signer|signedBy)[a-zA-Z0-9_\-]*)['"`]/gi;

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

const mapping = {};
for (const basePath of SEARCH_PATHS) {
  if (!fs.existsSync(basePath)) continue;
  const files = walk(basePath);
  for (const f of files) {
    const rel = path.relative(path.join(ROOT, 'src', 'forms'), f);
    const formKey = path.basename(f, '.js');
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    const keys = new Set();
    while ((m = keyRegex.exec(txt))) {
      const key = m[1];
      keys.add(key);
    }
    if (keys.size > 0) {
      mapping[formKey] = Array.from(keys).sort();
    }
  }
}

const outPath = path.join(ROOT, 'src', 'utils', 'formExportMapping.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));
console.log('Wrote mapping to', outPath);

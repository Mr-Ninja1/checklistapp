const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEARCH_PATHS = [
  path.join(ROOT, 'src', 'forms'),
  path.join(ROOT, 'src', 'forms', 'components'),
];
const mappingFile = path.join(ROOT, 'src', 'utils', 'htmlGenerators', 'mapping.js');
const outFile = path.join(ROOT, 'src', 'utils', 'formMappingReport.json');

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

function getKeysFromTitle(title) {
    const k1 = title.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    const k2 = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return [k1, k2];
}

function parseMappingBlocks(mappingTxt) {
  const blocks = [];
  const re = /try\s*\{\s*const\s+mod\s*=\s*normalizeMod\(require\(['"](\.\/[^'"\)]+)['"]\)\);\s*if\s*\(mod\)\s*\{\s*const\s+titles\s*=\s*\[([\s\S]*?)\];/g;
  let m;
  while ((m = re.exec(mappingTxt))) {
    const req = m[1];
    const titlesBlock = m[2];
    const titles = [];
    const tre = /['"`]([^'"`]+?)['"`]/g;
    let mm;
    while ((mm = tre.exec(titlesBlock))) titles.push(mm[1]);
    blocks.push({ requirePath: req, titles });
  }
  return blocks;
}

function main() {
  if (!fs.existsSync(mappingFile)) {
    console.error('mapping.js not found at', mappingFile);
    process.exit(2);
  }

  const mappingTxt = fs.readFileSync(mappingFile, 'utf8');
  const blocks = parseMappingBlocks(mappingTxt);

  const genKeyMap = {}; // key -> requirePath
  for (const b of blocks) {
    for (const t of b.titles) {
      const keys = getKeysFromTitle(t);
      genKeyMap[keys[0]] = b.requirePath;
      genKeyMap[keys[1]] = b.requirePath;
    }
  }

  const forms = [];
  for (const base of SEARCH_PATHS) {
    if (!fs.existsSync(base)) continue;
    const files = walk(base);
    for (const f of files) {
      const rel = path.relative(path.join(ROOT, 'src', 'forms'), f).replace(/\\/g, '/');
      const titles = extractTitles(f);
      const mappings = [];
      for (const t of titles) {
        const keys = getKeysFromTitle(t);
        const gen = genKeyMap[keys[0]] || genKeyMap[keys[1]] || null;
        mappings.push({ title: t, keys, generator: gen });
      }
      forms.push({ file: rel, titles: titles, mappings });
    }
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(forms, null, 2));
  const total = forms.length;
  const withMapping = forms.filter(f => f.mappings && f.mappings.some(m => m.generator)).length;
  const without = total - withMapping;
  console.log(`Wrote ${outFile}`);
  console.log(`Total files: ${total}, with mapped title: ${withMapping}, without mapped title: ${without}`);
}

main();

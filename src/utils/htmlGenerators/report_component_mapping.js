const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '../../forms/components');
const mappingFile = path.resolve(__dirname, './mapping.js');

function listComponents() {
  try {
    return fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));
  } catch (e) {
    console.error('Failed to list components', e.message);
    return [];
  }
}

function extractExportKey(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const m = txt.match(/export\s+const\s+EXPORT_KEY\s*=\s*['"]([^'"]+)['"]/m);
    if (m) return m[1];
    return null;
  } catch (e) { return null; }
}

function parseMappingFile() {
  const txt = fs.readFileSync(mappingFile, 'utf8');
  const mappingKeys = new Set();
  const explicit = {};

  // extract mapping keys from `const mapping = { ... }` by finding lines like: key: gen_xxx,
  const mapBlock = txt.split(/const\s+mapping\s*=\s*{/, 2)[1];
  if (mapBlock) {
    const block = mapBlock.split('};',1)[0];
    const keyRe = /([A-Za-z0-9_]+)\s*:/g;
    let m;
    while ((m = keyRe.exec(block)) !== null) mappingKeys.add(m[1]);
  }

  // extract explicitOverrides entries like: foo_bar: mapping.some_generator_key,
  const explicitBlock = txt.split(/const\s+explicitOverrides\s*=\s*{/,2)[1];
  if (explicitBlock) {
    const block2 = explicitBlock.split('};',1)[0];
    const exRe = /['"]?([a-z0-9_]+)['"]?\s*:\s*mapping\.([a-z0-9_]+)/ig;
    let em;
    while ((em = exRe.exec(block2)) !== null) {
      explicit[em[1]] = em[2];
    }
  }

  // build normalized mapping key lookup
  const normMap = {};
  for (const k of mappingKeys) {
    const nk2 = String(k).toLowerCase().replace(/[^a-z0-9]+/g, '');
    normMap[nk2] = k;
  }
  return { mappingKeys: Array.from(mappingKeys), explicit, normMap };
}

const comps = listComponents();
const { mappingKeys, explicit, normMap } = parseMappingFile();
const results = [];

for (const file of comps) {
  const compName = file.replace(/\.js$/i,'');
  const fp = path.join(componentsDir, file);
  const exportKey = extractExportKey(fp);
  let mappedGenerator = null;
  if (exportKey) {
    const nk = String(exportKey).toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (normMap[nk]) mappedGenerator = normMap[nk];
    else if (explicit[exportKey]) mappedGenerator = explicit[exportKey];
  }
  results.push({ component: compName, exportKey: exportKey || '(none)', mappedGenerator: mappedGenerator });
}

console.table(results);
const unmapped = results.filter(r=>!r.mappedGenerator).map(r=>r.component + ' (' + r.exportKey + ')');
if (unmapped.length) {
  console.log('\nUnmapped components (need explicit generator):');
  unmapped.forEach(c=>console.log('- '+c));
}

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const formsDir = path.join(ROOT, 'src', 'forms');
const gensDir = path.join(ROOT, 'src', 'utils', 'htmlGenerators');
const mappingFile = path.join(gensDir, 'mapping.js');

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

function extractTitle(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /title\s*:\s*['"`]([^'"`]+?)['"`]/;
  const m = txt.match(re);
  return m ? m[1].trim() : null;
}

function main() {
  if (!fs.existsSync(formsDir) || !fs.existsSync(mappingFile)) {
    console.error('Missing paths'); process.exit(2);
  }

  const formFiles = walk(formsDir);
  const receiving = formFiles.filter(f => /receiv/i.test(path.basename(f)));
  const mappingTxt = fs.readFileSync(mappingFile, 'utf8');

  const gens = walk(gensDir).map(p => path.basename(p));

  console.log('Checking', receiving.length, 'receiving-related forms');
  let missing = [];
  receiving.forEach(f => {
    const name = path.basename(f, '.js');
    const title = extractTitle(f) || '(no title found)';
    const foundByTitle = mappingTxt.includes(title);
    // try to infer generator filename
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const matchingGen = gens.find(g => g.toLowerCase().includes(slug) || g.toLowerCase().includes('receiv') && g.toLowerCase().includes(name.toLowerCase().replace(/receiving|form/g, '')) );
    const foundByGen = matchingGen && mappingTxt.includes(matchingGen.replace(/\.js$/, ''));

    const status = foundByTitle ? 'mapped (title)' : (foundByGen ? `mapped (generator: ${matchingGen})` : 'MISSING');
    console.log(`- ${name}: ${status}`);
    if (status === 'MISSING') missing.push({ name, title });
  });

  if (missing.length > 0) {
    console.log('\nForms missing explicit mapping:');
    missing.forEach(m => console.log('- ' + m.name + ' -> ' + m.title));
    process.exitCode = 1;
  } else console.log('\nAll receiving-related forms appear to be mapped.');
}

main();

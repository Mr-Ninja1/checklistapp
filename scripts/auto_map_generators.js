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

function extractTitles(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /title\s*:\s*['"`]([^'"`]+?)['"`]/g;
  const set = new Set();
  let m;
  while ((m = re.exec(txt))) set.add(m[1].trim());
  return Array.from(set);
}

function getKeysFromTitle(title) {
    const k1 = title.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    const k2 = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return [k1, k2];
}

function slugFromGenerator(filename) {
  const base = path.basename(filename, '.js');
  return base.replace(/^generate_/, '').replace(/_html$/, '').replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function main() {
  if (!fs.existsSync(formsDir) || !fs.existsSync(gensDir) || !fs.existsSync(mappingFile)) {
    console.error('Required paths missing'); process.exit(2);
  }

  const genFiles = walk(gensDir).filter(f => !f.endsWith('mapping.js') && !f.endsWith('index.js'));
  const genSlugs = genFiles.map(f => ({ file: path.basename(f), slug: slugFromGenerator(f) }));

  const formFiles = walk(formsDir);
  const titles = [];
  for (const f of formFiles) {
    const t = extractTitles(f);
    t.forEach(x => titles.push({ title: x, file: path.relative(ROOT, f) }));
  }

  const mappingTxt = fs.readFileSync(mappingFile, 'utf8');

  const blocks = [];
  for (const t of titles) {
    if (mappingTxt.includes(t.title)) continue; // already present
    const keys = getKeysFromTitle(t.title);
    const k2 = keys[1];
    // find best generator by slug containment
    const match = genSlugs.find(g => g.slug.includes(k2) || k2.includes(g.slug));
    if (match) {
      const genRequire = './' + match.file.replace(/\.js$/, '');
      const safeTitle = t.title.replace(/'/g, "\\'");
      const block = `try {
    const mod = normalizeMod(require('${genRequire}'));
    if (mod) {
        const titles = ['${safeTitle}'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }
`;
      blocks.push({ title: t.title, block });
    }
  }

  if (blocks.length === 0) {
    console.log('No candidate blocks to add');
    return;
  }

  console.log('Candidate mapping blocks to add:');
  blocks.forEach(b => console.log('- ' + b.title));
  console.log('\n----BEGIN BLOCKS----\n');
  blocks.forEach(b => console.log(b.block));
  console.log('----END BLOCKS----');
}

main();

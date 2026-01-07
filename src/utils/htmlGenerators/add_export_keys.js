const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '../../forms/components');

function toExportKey(fileName) {
  // Remove extension and Presentational suffix
  const base = fileName.replace(/\.js$/i, '').replace(/Presentational$/i, '');
  return base
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase();
}

function insertExportKey(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (/export\s+const\s+EXPORT_KEY\s*=/.test(src)) return false;

  const file = path.basename(filePath);
  const key = toExportKey(file);
  // Find last import statement to insert after imports, otherwise top
  const importMatch = src.match(/(?:^|\n)(import\s.+;\s*)+/m);
  const exportLine = `\nexport const EXPORT_KEY = '${key}';\n`;
  if (importMatch && importMatch.index !== undefined) {
    const end = importMatch.index + importMatch[0].length;
    src = src.slice(0, end) + exportLine + src.slice(end);
  } else {
    src = exportLine + src;
  }
  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

function main() {
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));
  const changed = [];
  for (const f of files) {
    const p = path.join(componentsDir, f);
    try {
      const ok = insertExportKey(p);
      if (ok) changed.push(f);
    } catch (e) {
      console.error('Failed to update', f, e.message);
    }
  }
  console.log('Updated files:', changed.length);
  changed.forEach(f => console.log('- ' + f));
}

if (require.main === module) main();

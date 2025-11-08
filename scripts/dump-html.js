const fs = require('fs');
const path = require('path');

// Usage: node scripts/dump-html.js <inputJson> [outputHtml]
// Example: node scripts/dump-html.js ../savedPayloads/foh-sample.json ../tmp/foh-sample.html

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/dump-html.js <inputJson> [outputHtml]');
    process.exit(2);
  }

  const input = path.resolve(process.cwd(), args[0]);
  const output = args[1] ? path.resolve(process.cwd(), args[1]) : path.resolve(process.cwd(), 'tmp', path.basename(input, '.json') + '.html');

  if (!fs.existsSync(input)) {
    console.error('Input file not found:', input);
    process.exit(2);
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(input, 'utf8'));
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(2);
  }

  // Try to require the generator. Use relative path from scripts folder to src/utils
  let gen;
  try {
    gen = require(path.resolve(process.cwd(), 'src', 'utils', 'generatePdfHtml'));
    // If module exports default as function, support both
    if (gen && gen.default) gen = gen.default;
  } catch (e) {
    console.error('Failed to load generatePdfHtml:', e && e.message);
    process.exit(2);
  }

  let html;
  try {
    html = gen(payload, {});
  } catch (e) {
    console.error('Generator threw an error:', e && e.stack);
    process.exit(2);
  }

  // Ensure output directory exists
  const dir = path.dirname(output);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(output, html, 'utf8');
  console.log('Wrote HTML to', output);
}

main();

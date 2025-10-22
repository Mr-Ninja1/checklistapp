/*
Simple codemod to wrap form screens with EditableFormContainer and add editMode state.
This is intentionally conservative: it only edits files that:
 - are in src/forms
 - do not already import EditableFormContainer
 - export a default React component as a function named like `export default function X()`
It supports a dry-run mode to print planned changes without writing files.

Usage:
  node tools/applyEditableWrapper.js --dry
  node tools/applyEditableWrapper.js

Note: This script edits files in place. Commit or stash changes before running.
*/

const fs = require('fs');
const path = require('path');

const formsDir = path.resolve(__dirname, '..', 'src', 'forms');
const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.js'));

const dryRun = process.argv.includes('--dry');

function willEdit(content) {
  if (content.includes("import EditableFormContainer")) return false;
  // naive check: must contain "export default function" and a JSX return
  if (!/export\s+default\s+function\s+\w+\s*\(/.test(content)) return false;
  if (!/return\s*\(\s*<\w+/.test(content)) return false;
  return true;
}

function transform(content) {
  // insert import after React import
  content = content.replace(/(import\s+React[\s\S]*?;\s*)(\n?)/, function(m) {
    if (m.includes('EditableFormContainer')) return m;
    return m + "import EditableFormContainer from '../components/EditableFormContainer';\n";
  });

  // add editMode state near top: after first useState imports or after first const [ ... ]
  // We'll insert `const [editMode, setEditMode] = React.useState(false);` after the first hook declaration
  if (!content.includes('const [editMode')) {
    const insertAfter = content.indexOf('\n  const [');
    if (insertAfter !== -1) {
      const before = content.slice(0, insertAfter+1);
      const after = content.slice(insertAfter+1);
      content = before + "  const [editMode, setEditMode] = React.useState(false);\n" + after;
    } else {
      // fallback: insert after the top of the component function
      content = content.replace(/(export\s+default\s+function\s+\w+\s*\([^\)]*\)\s*\{\s*)/, '$1\n  const [editMode, setEditMode] = React.useState(false);\n');
    }
  }

  // wrap the returned JSX with EditableFormContainer if not already
  if (!/EditableFormContainer/.test(content)) {
    content = content.replace(/return\s*\(\s*([\s\S]*?)\n\s*\);\s*\n\s*\}/m, function(m, inner) {
      const wrapped = `return (\n    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={() => {}}>${inner}\n    </EditableFormContainer>\n  );\n\n}`;
      return wrapped;
    });
  }

  return content;
}

const plan = [];
for (const f of files) {
  const p = path.join(formsDir, f);
  const content = fs.readFileSync(p, 'utf8');
  if (willEdit(content)) {
    plan.push(f);
    if (!dryRun) {
      const out = transform(content);
      fs.writeFileSync(p, out, 'utf8');
    }
  }
}

console.log((dryRun ? '[dry-run] ' : '') + 'Files that would be/are edited:');
plan.forEach(p => console.log(' - ' + p));

if (plan.length === 0) console.log('No files matched conservative criteria.');

// Simple Node test runner to verify generateHtmlForPayload picks the
// expected generator for sample payloads.
const { routeMapping } = require('./mapping');

function generateHtmlForPayload(payloadWrapper, opts = {}) {
  const payload = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : (payloadWrapper || {});
  const exactType = payload.formType || payload.template || payload.title || payload.name || '';
  if (routeMapping && exactType && typeof routeMapping[exactType] === 'function') {
    const html = routeMapping[exactType](payloadWrapper, opts);
    try {
      const footerer = require('./footer');
      return footerer.injectFooterIntoHtml(html, payloadWrapper);
    } catch (e) { return html; }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title||payload.title||exactType||'Form'}</title></head><body><h1>Missing HTML generator</h1><p>No exact HTML generator for ${String(exactType)}</p><p>Ensure the payload includes the form's EXPORT_KEY as <code>formType</code>.</p></body></html>`;
}

function runTest(name, payloadWrapper, expectedSubstring) {
  try {
    const html = generateHtmlForPayload(payloadWrapper, { title: payloadWrapper.payload && payloadWrapper.payload.title });
    const ok = typeof html === 'string' && html.toLowerCase().indexOf(String(expectedSubstring).toLowerCase()) !== -1;
    console.log(`${name}: ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) {
      console.log('--- OUTPUT START ---');
      console.log(html.slice(0, 2000));
      console.log('--- OUTPUT END ---');
    }
    return ok;
  } catch (e) {
    console.error(`${name}: ERROR`, e && e.message);
    return false;
  }
}

const tests = [
  {
    name: 'Bakery cleaning by key',
    payloadWrapper: { payload: { formType: 'bakery_cleaning_checklist' } },
    expect: 'Bakery & Confectionery Area Cleaning Checklist'
  },
  {
    name: 'Baking control by title',
    payloadWrapper: { payload: { title: 'Baking Control Sheet' } },
    expect: 'Baking Control Sheet'
  },
  {
    name: 'Underbar shelflife by filename',
    payloadWrapper: { payload: { formType: 'Bakery_UnderbarShelfLifeInspectionChecklist' } },
    expect: 'UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST'
  }
];

let allOk = true;
for (const t of tests) {
  const ok = runTest(t.name, t.payloadWrapper, t.expect);
  allOk = allOk && ok;
}

process.exit(allOk ? 0 : 2);

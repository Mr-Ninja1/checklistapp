// Deprecated wrapper: prefer importing ./mapping directly. This shim keeps
// compatibility but will be removed — callers should require
// './htmlGenerators/mapping' and use `routeMapping` directly.
const mappingModule = require('./mapping');
const routeMapping = mappingModule.routeMapping || {};
const { injectFooterIntoHtml } = require('./footer');

function generateHtmlForPayload(payloadWrapper, opts = {}) {
  const payload = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : (payloadWrapper || {});
  const exactType = payload.formType || payload.template || payload.title || payload.name || '';
  if (routeMapping && exactType && typeof routeMapping[exactType] === 'function') {
    const html = routeMapping[exactType](payloadWrapper, opts);
    return injectFooterIntoHtml(html, payloadWrapper);
  }
  const titleText = opts && opts.title ? opts.title : (payload && payload.title) || exactType || 'Form';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${String(titleText)}</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111}</style></head><body><h1>Missing HTML generator</h1><p>No exact HTML generator is mapped for form type <strong>${String(exactType)}</strong>.</p></body></html>`;
}

module.exports = { generateHtmlForPayload };

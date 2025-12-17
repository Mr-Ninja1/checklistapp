// Shared helpers for export HTML generators and presentational parity
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function normalizeSignature(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    const maybe = val.uri || val.data || val.base64 || val;
    if (typeof maybe === 'string') return normalizeSignature(maybe);
    return '';
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return '';
    if (s.startsWith('data:')) return s.replace(/\s+/g,'');
    if (/^data:image\/.+;base64,/.test(s)) return s.replace(/\s+/g,'');
    const compact = s.replace(/\s+/g,'');
    if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
    // else return as-is (may be a http(s) url)
    return s;
  }
  return '';
}

function renderSignatureHtml(val, opts = {}) {
  const uri = normalizeSignature(val);
  if (!uri) return '';
  const width = opts.width || 180;
  const height = opts.height || 60;
  return `<img src="${escapeHtml(uri)}" style="width:${width}px;height:${height}px;border:1px solid #ccc;border-radius:6px;object-fit:contain;" />`;
}

function extractBool(v) {
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true','1','yes','y'].includes(v.trim().toLowerCase());
  if (typeof v === 'object') {
    if (typeof v.checked === 'boolean') return v.checked;
    if (typeof v.value === 'boolean') return v.value;
    if (typeof v._value === 'boolean') return v._value;
    if (typeof v.checked === 'string') return ['true','1'].includes(String(v.checked).trim().toLowerCase());
    if (typeof v.value === 'string') return ['true','1'].includes(String(v.value).trim().toLowerCase());
    return false;
  }
  return false;
}

function extractText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') {
    if (v.cleanedBy) return extractText(v.cleanedBy);
    if (v.name) return extractText(v.name);
    if (v.label) return extractText(v.label);
    if (v.text) return extractText(v.text);
    if (v.value) return extractText(v.value);
    if (v.uri) return v.uri;
    if (v.data) return v.data;
    if (v.base64) return v.base64;
    try { return JSON.stringify(v); } catch (e) { return '' }
  }
  return '';
}

function renderSimple(val) {
  if (val == null) return '';
  if (typeof val === 'object') {
    if (val.uri || val.data || val.base64) return renderSignatureHtml(val);
    if (val.name) return escapeHtml(val.name);
    if (val.label) return escapeHtml(val.label);
    if (val.value) return escapeHtml(val.value);
    try { return escapeHtml(JSON.stringify(val)); } catch (e) { return '' }
  }
  return escapeHtml(String(val));
}

module.exports = {
  escapeHtml,
  normalizeSignature,
  renderSignatureHtml,
  extractBool,
  extractText,
  renderSimple,
};

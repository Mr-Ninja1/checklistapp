
**Overview of exporter contract**
 * Each exporter is a CommonJS module that exports a single function: `module.exports = function generate(payloadWrapper) { ... }`.
 * The generator accepts a single argument (`payloadWrapper`) and returns a complete HTML string (doctype → </html>) ready for rendering or conversion to PDF.
 * The generator expects the payload to contain at least:
   - `formData` or `data`: the form fields or rows (array or object) used to fill the template.
   - `metadata`: optional object with `companyName`, `date`/`issueDate`, `compiledBySign`, `approvedBySign`, `logo`, `version`, etc.
   - `assets.logoDataUri` (optional): preferred inline logo data URI.
 * Generators include small helper functions inside the file: `escapeHtml`, `normalizeIncoming`, `resolveSignatureUri`, `getLogoDataUri` (node-only use `fs`), and inline CSS for A4 printing.

**How an exporter builds HTML**
 * Normalize incoming wrapper (many files call `normalizeIncoming(payloadWrapper)`): unwrap `payloadWrapper.payload` or `payloadWrapper.meta.payload` if present.
 * Extract `formData`/`rows` and `metadata`.
 * Compute layout (column widths, scaling) for table-style templates when necessary.
 * Resolve logo: prefer `payload.assets.logoDataUri` or `payload.logoDataUri`; fallback attempt to read local `assets/*` files using Node `fs` (not available on mobile).
 * Resolve signatures: `resolveSignatureUri` accepts three forms:
   1. An object `{uri: 'http...'} or {data: 'BASE64'}`.
   2. A data URI string `data:image/png;base64,...`.
   3. A plain base64 string (long strings are treated as base64 and wrapped into a data URI).
 * Produce a full HTML string with inline CSS and return it.

**What the mobile app needs to replicate**
1. Exporter function shape: implement the same `generate(payload)` contract in the mobile app (plain JS functions returning HTML strings).
2. Helpers: implement equivalents for `escapeHtml`, `normalizeIncoming`, and `resolveSignatureUri`. Replace `getLogoDataUri` with a mobile-friendly strategy (see below).
3. Assets and logos: mobile cannot `fs.readFile` packaged assets in the same way — instead:
   * Prefer passing `assets.logoDataUri` from mobile (encode app bundled image to data URI at build time or include as base64 in app resources), or
   * Provide a HTTP(S) URL `metadata.logo` that the generator can place into `<img src="...">` (WebView / HTML renderers can fetch remote images), or
   * Use React Native `Image` to get base64 (via `react-native-fs` or bundling) and pass it into payload as `logoDataUri`.
4. Signatures: on mobile, signatures are usually captured as base64 data (from signature pad), so pass `{ data: 'BASE64STRING' }` or a full `data:` URI as `compiledBySign` etc. `resolveSignatureUri` on mobile should accept those and return a data URI string.

**Porting steps (practical)**
1. Copy the HTML generator (one or more) from `src/exporters/html` into your mobile project under `mobile/exporters/html/` (or a JS module tree). Convert CommonJS `module.exports` to ES `export function generate(payload) {}` or keep CommonJS if using a compatible bundler.
2. Remove Node-only code:
   * Delete any `fs`/`path` usages (e.g., `getLogoDataUri` that reads from `assets/`). Replace by requiring `assets.logoDataUri` in `payload`.
3. Add mobile helper implementations (examples below).
4. Ensure the HTML is returned as a string. To convert to PDF on mobile use a library such as:
   * React Native Android / iOS: `react-native-html-to-pdf` (render HTML to PDF file)
   * Or load HTML into an offscreen WebView and print/save as PDF (platform-specific APIs)
5. Share/export the generated PDF using `react-native-share` or upload it.

**Mobile helper examples (copy into mobile app)**
```javascript
function escapeHtml(s){
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function normalizeIncoming(incoming){
  if (!incoming) return {};
  let v = incoming;
  if (v.payload) v = v.payload;
  if (v.meta && v.meta.payload) v = v.meta.payload;
  if (v.payload) v = v.payload;
  return v || {};
}

function resolveSignatureUri(val){
  if (!val) return null;
  if (typeof val === 'object'){
    if (val.uri && typeof val.uri === 'string') return val.uri.trim();
    if (val.data && typeof val.data === 'string') return `data:image/png;base64,${val.data.replace(/\s+/g,'')}`;
    return null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim(); if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http')) return s;
  const compact = s.replace(/\s+/g,'');
  if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  return null;
}
```

**Example payload shape (mobile should supply this)**
```json
{
  "formData": { "subject": "My Form", "questions": [...] },
  "metadata": { "companyName": "Bravo", "date": "2025-12-24T15:05:00Z", "version": "0.0.3" },
  "assets": { "logoDataUri": "data:image/png;base64,..." }
}
```

**Generating PDF on mobile**
 * Use `react-native-html-to-pdf`:
   1. Call your `generate(payload)` to get an HTML string.
   2. Pass the HTML to `react-native-html-to-pdf` which returns a PDF file path.
   3. Use `react-native-share` to share the file or open it.

Example (pseudo):
```javascript
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

async function exportForm(payload){
  const html = generate(payload);
  const res = await RNHTMLtoPDF.convert({ html, fileName: 'form-export' });
  await Share.open({ url: `file://${res.filePath}` });
}
```

**Edge cases & tips**
 * Ensure images in HTML are data URIs or public HTTPS URLs (some mobile PDF libraries do not fetch remote images reliably).
 * Keep CSS conservative — some PDF renderers on mobile support only a subset of CSS. Test on both Android and iOS.
 * If you need signatures stored separately, pass them as base64 in the payload to avoid platform fs access.
 * If you want the exact same desktop HTML output, port the exact generator code but remove Node-specific fallback logic and require all external assets be provided in the payload.

**Where to put the guide & next steps**
 * Guide added to `docs/MOBILE_EXPORT_GUIDE.md` (this file).
 * Next: pick a generator to port (e.g., `generate_customersatisfaction_html.js`) and I can produce a mobile-friendly ES module version and a small RN example using `react-native-html-to-pdf`.

***End of guide***

*** Generated by Copilot assistant — actionable port steps included.***

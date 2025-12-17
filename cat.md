## Export logic (Saved Forms -> PDF) — Implementation notes

This file documents how the app's vector HTML PDF export for saved forms was implemented so you (or a future copy of me) can pick up work and add more per-form exporters.

Summary
- Exports generate vector (HTML) documents per-form and use `expo-print` to render HTML → PDF.
- Per-form HTML generators live under `src/utils/htmlGenerators/` and share helpers in `src/utils/exportHelpers.js`.
- The export entry point is the `useExportFormAsPDF` hook at `src/utils/useExportFormAsPDF.js` which embeds assets, selects a generator, calls the print API, writes the PDF to disk, and updates the history index.

Key files
- `src/utils/useExportFormAsPDF.js` — main hook: prepares payload, embeds bundled logo as base64, sets `genOpts.orientation='auto'`, picks a specialized generator (Bakery, Walk-in Chiller, Moulding) or falls back to `generatePdfHtml`, calls `Print.printToFileAsync`, moves file to `FileSystem.documentDirectory + 'forms/'`, and updates history via `updateFormHistory` / `addFormHistory`.
- `src/utils/htmlGenerators/*.js` — per-form HTML generators. Examples:
	- `generateBakeryCleaningChecklistHtml.js`
	- `generateWalkInChillerLogHtml.js`
	- `generateMouldingProofingBakingLogHtml.js`
- `src/utils/exportHelpers.js` — shared HTML helpers: `escapeHtml`, `renderSignatureHtml`, `extractBool`, `extractText`, `renderSimple`, etc.
- `src/utils/formHistory.js` — read/write history to `FileSystem.documentDirectory + 'forms/history.json'` (and localStorage on web). Exposes `getFormHistory`, `addFormHistory`, `updateFormHistory`.

Design / flow
1. UI calls `exportAsPDF(payload)` from `useExportFormAsPDF()` with a normalized `payload` (saved form payload or live form payload).
2. `useExportFormAsPDF` ensures `payload.assets.logoDataUri` exists by bundling `src/assets/logo.jpeg` and converting it to a base64 data-URI (so printers can load it reliably).
3. It determines which generator to call based on `payload.formType` / `payload.template` / `payload.title`.
4. `genOpts.orientation` defaults to `'auto'`. Generators accept `options` and decide portrait vs landscape using a simple heuristic based on computed table pixel width vs page width.
5. Generator returns a full HTML document (including `@page { size: ... }`) so the print engine honors orientation and margins.
6. `useExportFormAsPDF` calls `Print.printToFileAsync({ html })` and writes the resulting temporary PDF to `FileSystem.documentDirectory + 'forms/'`.
7. To avoid duplicate saved-form entries, the hook attempts to `updateFormHistory(matchFn, updater)` first. The match function tests heuristics in order:
	 - `meta.formId` equality,
	 - `meta.filePath` equality,
	 - `savedAt` equality,
	 - deep equality of `meta.payload` (stringified JSON) if present.
	 If a match is found, the existing entry is updated with the new `pdfPath`. Otherwise a new history entry is added via `addFormHistory`.

How generators work (developer checklist)
- Location: `src/utils/htmlGenerators/<form>.js`.
- Export helpers: `require('../../utils/exportHelpers')` and use `escapeHtml`, `renderSignatureHtml`, `extractBool`, `extractText`, `renderSimple` — these mirror presentational component normalization.
- Input: `generator(payload, options = {})` where `payload` is the saved payload (or `payload.payload` for normalized wrapper) and `options.orientation` may be `'portrait'`, `'landscape'`, or `'auto'`.
- Table handling: compute pixel-based table width (from `_tableWidth` or `layoutHints`), then either:
	- convert pixel widths to percentage columns (so table scales to page width), or
	- compute `TABLE_PX` and compare against page width (in px) to choose orientation when `options.orientation === 'auto'`.
- Return: a complete HTML string with `<head>`, CSS containing `@page { size: A4 landscape; ... }` (or computed `@page { size: <paper> <orientation>; }`) and the document body. This ensures `expo-print` respects orientation.
 
Adding a new form exporter (step-by-step)
1. Copy an existing generator (e.g., bakery or moulding) to `src/utils/htmlGenerators/generate<MyForm>Html.js`.
2. Import shared helpers: `const { escapeHtml, renderSignatureHtml, extractBool, extractText, renderSimple } = require('../../utils/exportHelpers');`.
3. Normalize payload at top:
	 const p = payload || {};
	 const payloadCore = p.payload || p;
	 const { metadata = {}, formData = [], verification = {}, layoutHints = {}, _tableWidth } = payloadCore;
	 const logoUri = payloadCore.assets && payloadCore.assets.logoDataUri ? payloadCore.assets.logoDataUri : null;
4. Compute column sizes and `TABLE_PX` from `layoutHints` (fallback to sensible defaults).
5. If `options.orientation === 'auto'`, compare `TABLE_PX` to page pixel width (convert mm/in to px using ~96dpi -> pxPerMm = 96/25.4) and choose portrait/landscape.
6. Build the HTML body using helpers. For signatures and images, prefer `renderSignatureHtml(obj, {width,height})` so signature objects render as images (avoids `[object Object]`).
7. Return a full HTML document and ensure you include the `@page` rule for the chosen orientation.
8. Add a detection pattern in `useExportFormAsPDF.js` to route the `payload.formType` to your new generator.

Testing & QA steps
- Run the app locally and reproduce a saved form in the UI.
- Export from the Saved Forms UI (or from `ViewDocumentModal`) and confirm:
	- Generated PDF is in `FileSystem.documentDirectory + 'forms/'` with the expected name.
	- The PDF opens and shows the full table (orientation chosen automatically if wide).
	- No duplicate history entry is created. Confirm by checking the Saved Forms (History) view.
- If the last column clips, tune the heuristic constants: `pxPerMm` (96/25.4 is an approximation) and multiplier threshold (we use 0.95) in the generator.

Known caveats & troubleshooting
- Some print engines (or device printers) ignore `@page` or have DPI differences — you may need to swap to explicit `options.orientation = 'landscape'` for stubborn devices.
- If you see `[object Object]` in a cell, the signature or `cleanedBy` value is an object that wasn't normalized. Use `renderSignatureHtml` to render signature objects or `extractText`/`escapeHtml` to handle strings.
- Logo embedding can fail on rare platforms; `useExportFormAsPDF` logs a warning if base64 embedding fails. Generators should gracefully handle `logoUri` being `null`.
- History duplicates: The hook uses multiple heuristics to match existing entries — if your saved payload contains no stable id or file path, consider adding a unique `meta.formId` when saving forms so updates are reliable.

Commands (how to run/test locally)
1. Start the metro server and clear cache:
```
npx expo start -c
```
2. Run on Android emulator / device:
```
npx expo run:android
```
3. In the app: open a saved Bakery or Walk-in Chiller form → Export PDF → confirm file + history behavior.

If you paste this `cat.md` into a fresh chat, I (the assistant) can use the file as context to reconstruct the implementation steps and continue adding per-form generators.

-- end of export logic notes --

Builds for @mr-ninja1/bravo-manager:

ID                       44dd7b8a-f3fb-4c31-863c-886ffb465d5e
Platform                 Android
Status                   finished
Profile                  preview
Distribution             internal
Channel                  preview
SDK Version              54.0.0
Runtime Version          1.0.0
Version                  1.0.0
Version code             4
Commit                   7b68da8635ad8451d929ce8baa3e0688ddeedfb2
Logs                     https://expo.dev/accounts/mr-ninja1/projects/bravo-manager/builds/44dd7b8a-f3fb-4c31-863c-886ffb465d5e
Application Archive URL  https://expo.dev/artifacts/eas/9vdEt2NArNEg5KAiPrwd8Y.apk
Build Artifacts URL      null
Fingerprint              02e914899274fd0fd13ce5b8ab8ce4a99ebfed7c
Started at               12/6/2025, 12:45:42 AM
Finished at              12/6/2025, 12:59:10 AM
Started by               mr-ninja1
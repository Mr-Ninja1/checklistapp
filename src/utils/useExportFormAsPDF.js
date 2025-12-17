import { useRef } from 'react';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
// HTML generator logic removed — using screenshot-based export only
import { Asset } from 'expo-asset';
import { addFormHistory, updateFormHistory, getFormHistory } from './formHistory';

// Vector-only export hook (single implementation)
export function useExportFormAsPDF() {
  const ref = useRef(null); // kept for compatibility but not used

  async function exportAsPDF({ title, date, shift, formData, exportOptions = {} } = {}) {
    if (!formData) {
      const msg = 'exportAsPDF requires structured formData (meta). Screenshot export removed.';
      console.warn(msg);
      return { error: msg };
    }

    try {
    const dir = FileSystem.documentDirectory + 'forms/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const baseName = `Form_${new Date().toISOString().slice(0,10)}_${Date.now()}`;

  const payload = formData || {};
  // Ensure bundled logo is embedded as a data URI so the HTML print renderer can load it.
  try {
    payload.assets = payload.assets || {};
    if (!payload.assets.logoDataUri) {
      // load local asset and convert to base64
      const logoModule = require('../assets/logo.jpeg');
      const asset = Asset.fromModule(logoModule);
      // downloadAsync will no-op if already available
      // eslint-disable-next-line no-await-in-loop
      await asset.downloadAsync();
      const localUri = asset.localUri || asset.uri;
      if (localUri) {
        const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
        payload.assets.logoDataUri = `data:image/jpeg;base64,${b64}`;
      }
    }
  } catch (e) {
    // non-fatal: if embedding fails, generators should handle missing logo gracefully
    console.warn('logo embedding failed', e && e.message ? e.message : e);
  }

  // Screenshot-based export helper (prefer this when a captureRef is provided).
  const tryScreenshotExport = async () => {
    try {
      const captureRef = exportOptions.captureRef || exportOptions.viewRef || null;
      if (!captureRef) return null;
      // lazy-require so missing package doesn't crash if not intended
      const { captureRef: rnCaptureRef } = require('react-native-view-shot');

      // Compute A4 pixel width based on orientation so capture can fill the page.
      const pageSize = exportOptions.paperSize || 'A4';
      const orientation = exportOptions.orientation || 'portrait';
      const sizes = { A4: { w: '210mm', h: '297mm' } };
      const chosen = sizes[pageSize] || sizes.A4;
      const parseSizeToMm = (s) => {
        if (!s) return 0;
        try {
          if (String(s).endsWith('mm')) return parseFloat(s.replace('mm',''));
          if (String(s).endsWith('in')) return parseFloat(s.replace('in','')) * 25.4;
          return parseFloat(s);
        } catch (e) { return 0; }
      };
      const pxPerMm = 96 / 25.4;
      const pageWidthMm = orientation === 'portrait' ? parseSizeToMm(chosen.w) : parseSizeToMm(chosen.h);
      const pageWidthPx = Math.round(pageWidthMm * pxPerMm);

      // Determine capture width: prefer explicit captureWidth, then payload._tableWidth,
      // otherwise use the calculated A4 pixel width. Apply a scale factor for resolution.
      const captureScale = exportOptions.captureScale || 2;
      let captureOpts = { result: 'base64', format: 'png', quality: 1, snapshotContentContainer: true };
      const desiredWidth = exportOptions.captureWidth || (payload && (payload._tableWidth || payload.tableWidth));
      if (desiredWidth) {
        captureOpts.width = Math.round(Number(desiredWidth) * (exportOptions.captureScale || 1));
      } else if (pageWidthPx) {
        captureOpts.width = Math.round(pageWidthPx * captureScale);
      }

      // Attempt to measure as a last resort
      if (!captureOpts.width) {
        try {
          const { findNodeHandle, UIManager } = require('react-native');
          const node = findNodeHandle(captureRef && captureRef.current ? captureRef.current : captureRef);
          if (node) {
            const measured = await new Promise((resolve) => {
              try {
                UIManager.measure(node, (x, y, width, height) => resolve({ width, height }));
              } catch (e) { resolve(null); }
            });
            if (measured && measured.width) captureOpts.width = Math.round(measured.width * (exportOptions.captureScale || 1));
          }
        } catch (e) {}
      }

      const base64 = await rnCaptureRef(captureRef, captureOpts);
      if (!base64) return null;
      const imgDataUri = `data:image/png;base64,${base64}`;
      // build simple HTML wrapper that scales the image to page size
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>@page{size:${pageSize} ${orientation};margin:8mm}html,body{margin:0;padding:0}img{width:100%;height:auto;display:block}</style></head><body><img src="${imgDataUri}"/></body></html>`;
      if (Platform.OS === 'web') {
        const { base64: b64 } = await Print.printToFileAsync({ html, base64: true });
        return { pdfDataUri: `data:application/pdf;base64,${b64}` };
      }
      const { uri: pdfTemp } = await Print.printToFileAsync({ html, base64: false });
      const dir = FileSystem.documentDirectory + 'forms/';
      const baseName = `Form_${new Date().toISOString().slice(0,10)}_${Date.now()}`;
      const pdfName = `${baseName}.pdf`;
      const pdfPath = dir + pdfName;
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
        const info = await FileSystem.getInfoAsync(pdfPath);
        if (info.exists) await FileSystem.deleteAsync(pdfPath, { idempotent: true });
      } catch (e) {}
      await FileSystem.moveAsync({ from: pdfTemp, to: pdfPath });
      return { pdfPath };
    } catch (e) {
      console.warn('screenshot export failed', e && e.message ? e.message : e);
      return null;
    }
  };
  // generatePdfHtml returns a full, print-ready HTML document (including @page).
  // For certain complex forms we provide specialized HTML generators for pixel-perfect layout.
    // Prefer screenshot export when a captureRef is present (captures exact RN view)
    const screenshotResultEarly = await tryScreenshotExport();
    if (screenshotResultEarly) return screenshotResultEarly;

    let html;
    try {
      const type = (payload.formType || payload.template || payload.title || payload.name || '').toString();
    const genOpts = { title, date, shift, ...exportOptions };
    // Default to automatic orientation heuristic: let generators decide
    if (!genOpts.orientation) genOpts.orientation = 'auto';
    // Try to resolve an exporter via the static exporters map first (Metro-friendly)
    const normalized = normalizeExporterName(type);
    const mapped = exportersMap && exportersMap[normalized];
    if (mapped && typeof mapped === 'function') {
      try {
        html = mapped(payload, genOpts);
      } catch (e) {
        console.warn('exporter mapping call failed, falling back to defaults', e && e.message ? e.message : e);
      }
    }
    // Fall back to known specialized generators or generic renderer
    if (!html) {
      if (/MouldingProofingBakingLog|MOULDING PROOFING AND BAKING LOG/i.test(type)) {
        html = generateMouldingProofingBakingLogHtml(payload, genOpts);
      } else if (/Bakery_CleaningChecklist|Bakery Area Cleaning Checklist|BakeryCleaningChecklist|BAKERY AREA CLEANING CHECKLIST/i.test(type)) {
        html = generateBakeryCleaningChecklistHtml(payload, genOpts);
      } else if (/WalkInChillerLog|WALK-IN CHILLER TEMPERATURE CHECKLIST|Walk-In Chiller|WalkInChiller/i.test(type)) {
        html = generateWalkInChillerLogHtml(payload, genOpts);
      } else {
        html = generatePdfHtml(payload, genOpts);
      }
    }
  } catch (e) {
    // fallback to generic renderer on any generator error
    html = generatePdfHtml(payload, { title, date, shift, ...exportOptions });
  }

      // Screenshot-based export: if a captureRef is provided and the caller requested
      // `useScreenshot` or `fallbackToScreenshot`, prefer capturing the rendered RN view
      // (helps with very wide/dynamic forms). This uses `react-native-view-shot` which
      // may already be included in the project.
      // (previously defined screenshot helper moved earlier)

      if (Platform.OS === 'web') {
        const { base64 } = await Print.printToFileAsync({ html, base64: true });
        return { pdfDataUri: `data:application/pdf;base64,${base64}` };
      } else {
        const { uri: pdfTemp } = await Print.printToFileAsync({ html, base64: false });
        const pdfName = `${baseName}.pdf`;
        const pdfPath = dir + pdfName;
        try {
          const info = await FileSystem.getInfoAsync(pdfPath);
          if (info.exists) await FileSystem.deleteAsync(pdfPath, { idempotent: true });
        } catch (e) {}
        await FileSystem.moveAsync({ from: pdfTemp, to: pdfPath });

        try {
          // Attempt to find / update an existing history entry to avoid duplicates.
          let didUpdate = false;
          try {
            const history = await getFormHistory();
            // payloadCore to compare against stored meta.payload if present
            const payloadCore = payload && (payload.payload || payload) || {};
            const payloadJson = JSON.stringify(payloadCore || {});

            // Heuristics: match by meta.formId, meta.filePath, savedAt, or deep-equal meta.payload
            const matchFn = (entry) => {
              try {
                if (!entry) return false;
                // formId match
                const maybeFormId = payload && payload.meta && (payload.meta.formId || (payload.meta.payload && payload.meta.payload.formId));
                if (maybeFormId && entry.meta && entry.meta.formId && entry.meta.formId === maybeFormId) return true;
                // filePath match
                const maybeFilePath = payload && payload.meta && (payload.meta.filePath || (payload.meta.payload && payload.meta.payload.filePath));
                if (maybeFilePath && entry.meta && entry.meta.filePath && entry.meta.filePath === maybeFilePath) return true;
                // savedAt match
                const maybeSavedAt = payload && (payload.savedAt || (payload.meta && payload.meta.savedAt));
                if (maybeSavedAt && entry.savedAt && entry.savedAt === maybeSavedAt) return true;
                // deep payload match (stringified)
                const entryPayloadJson = JSON.stringify((entry.meta && entry.meta.payload) || {});
                if (entryPayloadJson && payloadJson && entryPayloadJson === payloadJson) return true;
              } catch (ex) {}
              return false;
            };

            // If a matching entry exists, update it with the pdfPath
            const found = history && Array.isArray(history) && history.find(matchFn);
            if (found) {
              await updateFormHistory(matchFn, (entry) => ({ ...entry, pdfPath, meta: entry.meta || { payload: payloadCore } }));
              didUpdate = true;
            }
          } catch (e) {
            console.warn('updateFormHistory check failed', e);
          }
          if (!didUpdate) {
            await addFormHistory({ pdfPath, title, date, shift, savedAt: Date.now(), meta: formData || null });
          }
        } catch (e) {
          console.warn('addFormHistory failed (vector export)', e);
        }

        return { pdfPath };
      }
    } catch (e) {
      const msg = 'vector export failed: ' + (e && e.message ? e.message : String(e));
      console.warn(msg, e);
      return { error: msg };
    }
  }

  return { ref, exportAsPDF };
}

export default useExportFormAsPDF;

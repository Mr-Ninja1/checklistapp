import { useRef } from 'react';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { addFormHistory, updateFormHistory, getFormHistory } from './formHistory';

// Use the static mapping of generators (avoid `index.js` wrapper)
const { routeMapping, getGeneratorForPayload } = require('./htmlGenerators/mapping');

function generateHtmlForPayload(payloadWrapper, opts = {}) {
  const payload = payloadWrapper && payloadWrapper.payload ? payloadWrapper.payload : (payloadWrapper || {});
  const exactType = payload.formType || payload.template || payload.title || payload.name || '';
  // Strict, exact lookup only — mapping keys must be EXPORT_KEY values.
  if (routeMapping && exactType && typeof routeMapping[exactType] === 'function') {
    return routeMapping[exactType](payloadWrapper, opts);
  }

  // Allow a debug/dev fallback when requested (e.g. Debug HTML Export).
  if (opts && (opts.forceHtml || opts.allowFallback || opts.debugFallback)) {
    try {
      const res = getGeneratorForPayload(payload, opts);
      if (res && res.module && typeof res.module === 'function') {
        return res.module(payloadWrapper, opts);
      }
    } catch (e) {
      // fall through to missing-generator message
      console.warn('fallback generation failed', e && e.message);
    }
  }

  const titleText = opts.title || payload.title || exactType || 'Form';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${titleText}</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#111}</style></head><body><h1>Missing HTML generator</h1><p>No exact HTML generator is mapped for form type <strong>${String(exactType)}</strong>.</p><p>This exporter requires the payload to include the form's EXPORT_KEY as <code>formType</code>.</p></body></html>`;
}

export function useExportFormAsPDF() {
  const ref = useRef(null); 

  async function exportAsPDF({ title, date, shift, formData, exportOptions = {} } = {}) {
    if (!formData) {
      const msg = 'exportAsPDF requires structured formData (meta).';
      console.warn(msg);
      return { error: msg };
    }

    try {
      const dir = FileSystem.documentDirectory + 'forms/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const payload = formData || {};
      // Friendly filename: prefer explicit `exportOptions.filename`, otherwise
      // derive from form title/type and date to keep paths short and predictable.
      const safe = (s) => String(s || '').replace(/[^a-z0-9\.\-_]/gi, '_').replace(/_+/g, '_').slice(0, 120);
      const suggestedBase = exportOptions && exportOptions.filename ? safe(exportOptions.filename) : safe(payload.title || payload.formType || `form_${new Date().toISOString().slice(0,10)}`);
      const baseName = suggestedBase.replace(/\.pdf$/i, '') + '.pdf';

      // Ensure bundled logo is embedded as a data URI
      try {
        payload.assets = payload.assets || {};
        if (!payload.assets.logoDataUri) {
          const logoModule = require('../assets/logo.jpeg');
          const asset = Asset.fromModule(logoModule);
          await asset.downloadAsync();
          const localUri = asset.localUri || asset.uri;
          if (localUri) {
            const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
            payload.assets.logoDataUri = `data:image/jpeg;base64,${b64}`;
          }
        }
      } catch (e) {
        console.warn('logo embedding failed', e.message);
      }

      // HTML-only export: always generate HTML for the payload and print to PDF.
      // (Remove screenshot capture fallback to keep export logic deterministic.)
      let html;
      try {
        const genOpts = { title, date, shift, ...exportOptions };
        if (!genOpts.orientation) genOpts.orientation = 'auto';
        html = generateHtmlForPayload({ payload }, genOpts);
      } catch (e) {
        html = `<!doctype html><html><body><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`;
      }

      if (Platform.OS === 'web') {
        const { base64 } = await Print.printToFileAsync({ html, base64: true });
        return { pdfDataUri: `data:application/pdf;base64,${base64}` };
      }

      const { uri: pdfTemp } = await Print.printToFileAsync({ html, base64: false });
      const pdfPath = dir + baseName;
      
      // Cleanup existing file if it exists
      const info = await FileSystem.getInfoAsync(pdfPath);
      if (info.exists) await FileSystem.deleteAsync(pdfPath, { idempotent: true });
      
      await FileSystem.moveAsync({ from: pdfTemp, to: pdfPath });

      // Exports are ephemeral and should not create or update Saved Forms
      // history entries. Do not write or modify history here.

      // Create a short, predictable cache copy so it's easier to locate later
      // (e.g. for quick debugging or to pick up via a file manager). This copy
      // will be at `FileSystem.cacheDirectory + 'latest_export.pdf'`.
      let cachePath = null;
      try {
        if (FileSystem.cacheDirectory) {
          cachePath = FileSystem.cacheDirectory + 'latest_export.pdf';
          const info = await FileSystem.getInfoAsync(cachePath);
          if (info.exists) await FileSystem.deleteAsync(cachePath, { idempotent: true });
          // copyAsync is available in Expo FileSystem
          await FileSystem.copyAsync({ from: pdfPath, to: cachePath });
        }
      } catch (e) {
        console.warn('Cache copy failed', e.message);
        cachePath = null;
      }

      // Attempt to share the PDF so the user can save/open it outside the app.
      let shared = false;
      try {
        const avail = await Sharing.isAvailableAsync();
        if (avail) {
          // Prefer sharing the user-friendly cache copy when available
          await Sharing.shareAsync(cachePath || pdfPath);
          shared = true;
        }
      } catch (e) {
        console.warn('Sharing failed', e.message);
      }

      return { pdfPath, cachePath, shared };
    } catch (e) {
      return { error: 'Export failed: ' + e.message };
    }
  }

  return { ref, exportAsPDF };
}

export default useExportFormAsPDF;
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

let captureRefSafe = null;
try {
  // Lazy require so the app doesn't crash if the package isn't present
  // eslint-disable-next-line global-require
  const { captureRef } = require('react-native-view-shot');
  captureRefSafe = captureRef;
} catch (e) {
  captureRefSafe = null;
}

export default async function captureAndExport({ ref, filenameBase = null, payloadHtmlFallback = null, onProgress = () => {} } = {}) {
  try {
    onProgress && onProgress({ stage: 'start' });

    // Try native view capture on non-web
    if (captureRefSafe && ref && ref.current && Platform.OS !== 'web') {
      try {
        onProgress && onProgress({ stage: 'capturing' });
        const base64 = await captureRefSafe(ref.current, {
          format: 'png',
          quality: 1,
          result: 'base64',
          pixelRatio: 3,
        });

        const imgSrc = `data:image/png;base64,${base64}`;
        const html = `<!doctype html><html><head><meta charset='utf-8'><style>@page{size:297mm 210mm;margin:8mm;}body{margin:0;padding:0;background:#fff;}img{display:block;width:297mm;height:210mm;object-fit:contain;}</style></head><body><div style="display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${imgSrc}"/></div></body></html>`;

        onProgress && onProgress({ stage: 'printing' });
        const { uri } = await Print.printToFileAsync({ html });

        onProgress && onProgress({ stage: 'sharing' });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Exported', `PDF saved to: ${uri}`);
        }

        onProgress && onProgress({ stage: 'done', uri });
        return { uri };
      } catch (capErr) {
        console.warn('captureAndExport: capture failed, will fall back to HTML generator', capErr);
        // fallthrough to fallback path
      }
    }

    // Fallback: use provided HTML payload or simply report failure
    if (payloadHtmlFallback) {
      onProgress && onProgress({ stage: 'printing-fallback' });
      const { uri } = await Print.printToFileAsync({ html: payloadHtmlFallback });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Exported', `PDF saved to: ${uri}`);
      }
      onProgress && onProgress({ stage: 'done', uri });
      return { uri };
    }

    const msg = 'No capture available and no fallback HTML provided.';
    console.warn('captureAndExport:', msg);
    onProgress && onProgress({ stage: 'error', error: msg });
    return { error: msg };
  } catch (e) {
    console.warn('captureAndExport error', e);
    onProgress && onProgress({ stage: 'error', error: e.message || String(e) });
    return { error: e.message || String(e) };
  }
}

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
        onProgress && onProgress({ stage: 'measuring' });
        // Measure the view height
        const measureView = () => new Promise((resolve, reject) => {
          ref.current.measure((x, y, width, height, pageX, pageY) => {
            resolve({ width, height });
          });
        });
        const { width, height } = await measureView();
            // Manually set a very wide page width to avoid horizontal clipping
            const MM_TO_PX = 3.78;
            const PIXEL_RATIO = 3;
            const PAGE_WIDTH_MM = 800; // extremely wide, adjust as needed
            const PAGE_HEIGHT_MM = 210;
            const PAGE_WIDTH_PX = Math.floor(PAGE_WIDTH_MM * MM_TO_PX * PIXEL_RATIO);
            const PAGE_HEIGHT_PX = Math.floor(PAGE_HEIGHT_MM * MM_TO_PX * PIXEL_RATIO);

            // For nested scrollable tables, try to expand all scrolls before capture
            if (ref.current && ref.current.scrollTo) {
              try {
                ref.current.scrollTo({ x: 0, y: 0, animated: false });
              } catch (e) {}
            }
            // If you have nested refs, you could also scroll them to 0 here

            let base64Images = [];
            if (height <= PAGE_HEIGHT_PX && width <= PAGE_WIDTH_PX) {
              // Single shot
              onProgress && onProgress({ stage: 'capturing-single' });
              const base64 = await captureRefSafe(ref.current, {
                format: 'jpeg',
                quality: 1,
                result: 'base64',
                pixelRatio: PIXEL_RATIO,
              });
              base64Images.push(base64);
            } else {
              // Multi-shot: vertical and/or horizontal
              onProgress && onProgress({ stage: 'capturing-multi', height, width });
              const verticalShots = Math.ceil(height / PAGE_HEIGHT_PX);
              const horizontalShots = Math.ceil(width / PAGE_WIDTH_PX);
              for (let v = 0; v < verticalShots; v++) {
                for (let h = 0; h < horizontalShots; h++) {
                  const base64 = await captureRefSafe(ref.current, {
                    format: 'jpeg',
                    quality: 1,
                    result: 'base64',
                    pixelRatio: PIXEL_RATIO,
                    height: PAGE_HEIGHT_PX,
                    width: PAGE_WIDTH_PX,
                    y: v * PAGE_HEIGHT_PX,
                    x: h * PAGE_WIDTH_PX,
                  });
                  base64Images.push(base64);
                }
              }
            }

            // Build multi-page PDF HTML
            const htmlPages = base64Images.map(img => `
              <div style="page-break-after:always;display:flex;align-items:center;justify-content:center;width:${PAGE_WIDTH_MM}mm;height:210mm;background:#fff;">
                <img src="data:image/jpeg;base64,${img}" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;box-shadow:0 2px 12px #0002;border-radius:10px;"/>
              </div>
            `).join('');
            const html = `<!doctype html><html><head><meta charset='utf-8'><style>
              @page{size:${PAGE_WIDTH_MM}mm 210mm;margin:0;}
              body{margin:0;padding:0;background:#fff;}
              .pdf-page{width:${PAGE_WIDTH_MM}mm;height:210mm;display:flex;align-items:center;justify-content:center;background:#fff;}
              img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;box-shadow:0 2px 12px #0002;border-radius:10px;}
            </style></head><body>${htmlPages}</body></html>`;

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

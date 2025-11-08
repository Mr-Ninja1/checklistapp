import { useRef } from 'react';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import generatePdfHtml from './generatePdfHtml';
import { addFormHistory } from './formHistory';

// Vector-only export hook (single implementation)
export function useExportFormAsPDF() {
  const ref = useRef(null); // kept for compatibility but not used

  async function exportAsPDF({ title, date, shift, formData } = {}) {
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
  // generatePdfHtml returns a full, print-ready HTML document (including @page).
  // Do not wrap it again; pass it directly to the print API so only a single @page rule exists.
  const html = generatePdfHtml(payload, { title, date, shift });

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
          await addFormHistory({ pdfPath, title, date, shift, savedAt: Date.now(), meta: formData || null });
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

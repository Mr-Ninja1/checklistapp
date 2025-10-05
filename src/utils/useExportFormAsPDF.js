
import { useRef } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

// Usage: const { ref, exportAsPDF } = useExportFormAsPDF();
// Attach ref to the form view, call exportAsPDF() to export as PDF
export function useExportFormAsPDF() {
  const ref = useRef();

  /**
   * Exports the referenced form as a landscape A4 PDF and saves it to device storage.
   * @param {string} pdfFileName - The file name for the PDF (e.g., 'form.pdf')
   * @returns {Promise<string|null>} - The file URI if successful, or null if failed
   */
  const exportAsPDF = async (pdfFileName = 'form.pdf') => {
    try {
      // 1. Capture the form as a PNG image
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // 2. Embed the image in a landscape A4-sized HTML
      // A4 landscape: 297mm x 210mm, 1in = 96px, 1mm = 3.78px
      // 297mm = 1122px, 210mm = 794px
      const html = `
        <html>
          <body style="margin:0;padding:0;">
            <img src='file://${uri}' style='width:1122px;height:794px;object-fit:contain;'/>
          </body>
        </html>
      `;

      // 3. Generate PDF from HTML (landscape A4)
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        width: 1122,
        height: 794,
        base64: false,
      });

      // 4. Save PDF to app's document directory
      const dir = FileSystem.documentDirectory + 'forms/';
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const fileUri = dir + pdfFileName;
      await FileSystem.moveAsync({ from: pdfUri, to: fileUri });

      // 5. Clean up temp image
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});

      return fileUri;
    } catch (e) {
      alert('Failed to export PDF.');
      return null;
    }
  };

  return { ref, exportAsPDF };
}

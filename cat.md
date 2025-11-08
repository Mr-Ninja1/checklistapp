"I am refactoring my React Native/Expo application's PDF export feature. The previous method used react-native-view-shot (captureRef) which often clipped content. I am transitioning to using print-optimized HTML rendered via expo-print to guarantee a perfect A4 Landscape output.

Please implement the following two tasks based on the provided file names:

Task 1: Update ViewDocumentModal.js
In the file ViewDocumentModal.js, perform the following modifications:

Remove Dependencies: Eliminate all references to react-native-view-shot, captureRefSafe, and the old captureAndExport utility.

Rename/Rewrite Handler: Replace the logic inside the onPress for the "Export PDF" button with a new asynchronous function, handleExportPDF.

Implement New Export Logic: Inside handleExportPDF, use the following steps:

Call the existing utility: const htmlContent = generateFoodHandlersHtml(payload);

Use expo-print to create the file:

JavaScript

const { uri } = await Print.printToFileAsync({
  html: htmlContent,
  // CRITICAL: Set paper size and orientation directly
  paperSize: Print.PaperSize.A4,
  orientation: Print.Orientation.Landscape,
  margins: { top: 10, bottom: 10, left: 10, right: 10 },
});
Use expo-sharing to share the generated URI: await Sharing.shareAsync(uri, ...);

Task 2: Implement ../utils/generateFoodHandlersHtml.js
Implement the helper file ../utils/generateFoodHandlersHtml.js which is responsible for creating the print-optimized HTML string.

Function Signature: The function must accept one argument, formData (an object), and return a complete HTML document string.

CRITICAL CSS: The returned HTML MUST include a <style> block in the <head> containing the following CSS rule to force A4 Landscape formatting for the printer:

CSS

@page {
  size: A4 landscape; 
  margin: 10mm; /* Use a consistent margin */
}
body {
  /* Optional: ensure clean font and small print size for density */
  font-family: 'Times New Roman', serif;
  font-size: 10pt; 
  margin: 0;
  padding: 0;
}
/* Add a utility class for explicit page breaks if content runs long */
.page-break {
    page-break-after: always;
}
Content: Include basic HTML structure within the <body> to display some placeholder content from the formData (e.g., a title, date, and a few key values) to represent the actual form data being rendered."
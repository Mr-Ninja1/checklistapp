That's a smart move to create a well-structured prompt/message for another AI, like Copilot, to help with the coding!

Here is a ready-to-use message/prompt that clearly explains the problem, the chosen solution, the required libraries, and emphasizes reusability.

## Prompt Message for an AI Assistant (e.g., Copilot)

---

### **Subject: React Native - Generating Reusable A4 Landscape PDF from UI View**

**Goal:** I need a robust, reusable React Native solution to take an audit form rendered on a tablet screen and save it as a pixel-perfect A4 Landscape PDF document for printing and archival.

**The Solution Architecture (The Plan):**
The chosen method is a two-step process to ensure accurate visual reproduction and correct paper sizing:

1.  **Capture:** Use `react-native-view-shot` to capture the entire form component as a high-resolution Base64 image.
2.  **Format & Embed:** Use `react-native-pdf-lib` to create a new PDF, define an **A4 Landscape** page (842 x 595 points), and embed the captured image onto that page, scaled to fit perfectly.

**Required Libraries:**
* `react-native-view-shot`
* `react-native-pdf-lib`

---

### **Specific Coding Tasks & Requirements:**

1.  **Form Component (`AuditForm.js`):**
    * Create a sample functional component (`AuditForm`) that contains a basic `View` with some content (like a logo, a table, and a few checkboxes, mirroring the example image).
    * Wrap this content with the necessary `ViewShot` setup, using a `useRef` hook for capturing.
    * Include a "Generate PDF" button that triggers the capture function. The capture should return the image as a **Base64 string**.

2.  **PDF Generation Utility (`PDFGenerator.js`):**
    * Create an exported, asynchronous function (e.g., `generatePrintablePDF(imageBase64)`) that handles the `react-native-pdf-lib` logic.
    * **Crucially**, ensure the page is set to the **A4 Landscape** media box dimensions (width: 842, height: 595).
    * The function must embed the `imageBase64` string and scale the image to fill the entire A4 Landscape page.
    * The final PDF should be saved to a common download or document directory on the device and its file path returned.

3.  **Cross-Platform Handling:**
    * Include basic logic for determining the correct save directory path for both **iOS** and **Android** using `react-native-pdf-lib`'s directory constants and `Platform.OS`.

---

### **Emphasis on Reusability:**

Please design the solution with **reusability** in mind. The `AuditForm` component and the `PDFGenerator` utility should be structured so that:

* Any future form component can be quickly converted to a printable PDF by simply wrapping it in the component containing the `ViewShot` logic.
* The `generatePrintablePDF` function is universal and can be used across any project where a high-quality A4 printout is required from a React Native UI view.

**Expected Output:** Provide the code for `AuditForm.js` and `PDFGenerator.js`, along with setup instructions.

---
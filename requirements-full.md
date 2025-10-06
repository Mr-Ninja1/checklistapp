# BRAVO Restaurant Cleaning Checklist App Requirements

## Overview
A cross-platform React Native mobile app for BRAVO restaurant supervisors to manage cleaning checklists for food contact surfaces, utensils, and other items. The app will generate forms grouped by categories, allowing supervisors to check, save, and switch between categories. All checked forms will be saved as PDFs, with offline access and automatic sync to Google Drive or Dropbox.

## Key Features
- Cross-platform (Android & iOS) using React Native
- Supervisor login (simple authentication)
- Splash screen and modern UI with gradients
- Hamburger menu with Home and Logout
- Categories (e.g., Kitchen, Utensils, Food, Staff Hygiene, Equipment)
- Only forms for the selected category are shown
- Each category contains modern cards for each form subject, with status (Pending/Done)
- Save progress and switch between categories
- Print and save checked forms as PDFs
- Local storage for offline access
- Automatic sync to Google Drive/Dropbox when online
- History page to review checked forms by session/date
- Ability to view, print, or share old PDFs

## Data & Sync
- Forms are stored as PDFs locally
- When internet is available, PDFs are synced to Google Drive/Dropbox
- App handles authentication for cloud storage
- History is organized by session/date for easy review

## User Roles
- Supervisor (initially; more roles can be added later)

## Next Steps

## Future Feature: PDF Storage, Offline History, and Cloud Sync
- All completed forms are saved as A4-sized PDFs, capturing the entire form (not just the visible viewport)
- PDFs are stored locally on the device for offline access
- A History page displays all saved PDFs, organized by session/date
- When internet is available, unsynced PDFs are automatically uploaded to Google Drive or Dropbox
- The app handles authentication for cloud storage and marks forms as synced
- Users can view, print, or share any saved PDF from the history page
- Await client confirmation on categories and forms
- Add required fields for each form as provided
- Implement PDF generation, print, and sync features
- Build history page for session/date review

## Open Questions
- Exact categories and forms needed (awaiting client)
- Fields required for each form
- Preferred cloud storage (Google Drive, Dropbox, or both)
- Any additional user roles or permissions

---
*This document can be pasted to restore full requirements context for future development.*

## Implementation details: Screenshot → PDF (recommended approach)

We adopted the "screenshot → embed → PDF" approach for reliable visual fidelity across devices. Key points and how to reuse the logic for other forms:

- Output format
	- The produced file is a PDF (.pdf) where the page contains a raster image (PNG) of the form. The PDF is A4 landscape by construction (the HTML wrapper sets `@page { size: A4 landscape; }`).
	- The PDF can be opened by any external PDF viewer on the device (Open with ...). On native platforms we call the OS URL launcher to open the `file://` path.

- Why this approach
	- Guaranteed visual fidelity: what the user sees in the app is what gets exported (once images/assets are present in the view).
	- Works for complex layouts and custom React Native components without reimplementing the layout in HTML/CSS.
	- Tradeoffs: larger, rasterized PDFs (not selectable text). If search/select is required later, we can switch to vector HTML→PDF.

- Reuse contract (how to use the export hook)
	- Hook provided: `useExportFormAsPDF()` → returns `{ ref, exportAsPDF }`.
	- Usage pattern in a form screen:
		1. Wrap the rendered (read-only) form with the returned `ref` (e.g., `<ScrollView ref={ref} collapsable={false}>...</ScrollView>`).
		2. Ensure any images (logo) are embedded in the form data as a base64 `logoDataUri` or are available synchronously in the UI before capture. If embedding, await asset download and base64 conversion first.
		3. Call `exportAsPDF({ title, date, shift, formData })`. `formData` is saved into history as `meta` so the form can be re-opened in-app.
		4. The hook returns `{ pdfPath }` (native) or `{ pdfDataUri }` (web fallback) on success.

- Implementation details to keep in mind
	- Wait for images and layout to finish before calling `exportAsPDF` (we recommend awaiting asset download then `requestAnimationFrame` twice or a short timeout) so the snapshot includes every visual element.
	- Use `captureRef` with a high `pixelRatio` (3–4) for sharp results.
	- The hook embeds the captured PNG as a `data:image/png;base64,...` URI inside a minimal HTML page sized to A4 landscape and calls `Print.printToFileAsync` to create the PDF.
	- The PDF and a `history.json` entry (containing `pdfPath`, `savedAt`, `title`, and `meta`) are saved to the app document directory under `forms/`.

- Reusing for multiple forms
	- The approach is form-agnostic: any React Native component can be rendered and captured as long as it is wrapped by the `ref` and fully painted before capture.
	- To add a new form screen:
		- Render the read-only version of that form inside the `ref` container.
		- Build the same `formData` shape and call `exportAsPDF({ title, date, formData })` on save.
		- The History screen will then be able to load and re-open the saved form because we persist `meta` which contains the original `formData`.

If you want, we can also add a short example snippet to the repo showing how to wire this hook for one more form type (copy/paste), and a small verification test that programmatically captures one sample form and produces a PDF to verify the end-to-end flow.

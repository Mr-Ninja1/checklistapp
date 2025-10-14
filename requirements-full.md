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

## Development snapshot (savepoint)

Paste this section into the file to quickly restore the current session context. It captures recent changes, files added, and recommended next steps.

- Date: 2025-10-06
- Branch: backup-before-keep-ours-20251006160143

- Recent files added/modified (high level):
  - `src/components/LoadingOverlay.js` — new reusable modal spinner overlay for modern loading feedback.
  
  - `src/forms/FOH_DailyCleaningForm.js` — FOH form updated with draft load/auto-save, Save Draft, Submit (addFormHistory + remove draft), Back button; responsive columns.
  - `src/forms/FoodHandlersHandwashingForm.js` — Handwashing form updated with draft load/auto-save, Save Draft, Save as PDF, Submit, Back; responsive layout with many time columns.
  - `src/utils/formDrafts.js` — abstraction for draft persistence (getDraft/setDraft/removeDraft) using localStorage or native files.
  - `src/screens/HomeScreen.js` — consolidated Production handwashing into one card and wired card taps to show a loading overlay while navigating.

- Key behaviors implemented:
  - Per-form draft lifecycle: auto-save (debounced), explicit Save Draft, load draft on open, remove draft on submit.
  - Submit saves form metadata and form data via `addFormHistory` and integrates with the existing export/PDF hooks where applicable.
  - LoadingOverlay used across Home and forms to present a modern spinner during navigation and async operations.
  - Forms are responsive and tuned for A4 landscape printing (column proportions, min widths).

- Current pending items / recommended next steps:
  1. Run Metro and do a full Android bundle + smoke test. (I can run this for you and report the logs.)
  2. Manual UX tests on a physical device or emulator to verify horizontal + vertical scrolling behavior; consider PanResponder fallback if nested horizontal/vertical scrolls are unreliable on some devices.
  3. Replace blocking alert() calls with toasts for a smoother UX.
  4. Optionally add a draft indicator badge on Home cards to show saved drafts.

- Quick local verification commands:
  - Start Metro (from project src):
    npm start
  - Open app on emulator/device and exercise:
    Home → Production → "Food Handlers Daily Handwashing" → edit fields → wait ~1s (autosave) → close → re-open to verify draft restored.
  5.add OTA for updating 
This snapshot is intentionally concise; paste it into this file to let the assistant re-load the current project state quickly in future sessions.

## Future task: Branded export and print fidelity for FOH / Cold Room forms

- Goal: ensure FOH and Cold Room forms print/export with the company logo, name, and precise A4 layout identical to the on-screen form.
- Work items:
	- Add a branded header (logo + company name) to the HTML generator used for PDF exports (or ensure logo base64 is embedded before capture).
	- Create specialized ReadOnly renderers for FOH and Cold Room forms when pixel-perfect print output is required.
	- Verify image embedding and capture timing to avoid missing assets in exported PDFs (wait for images to load, then capture).
	- Add an automated verification (small E2E test) that renders one sample FOH and Cold Room form and produces a PDF to confirm visual fidelity.
	- Decide whether to use raster (screenshot→PDF) or vector (HTML→PDF) export for selectable/searchable text; implement later if required.

Add this task to the implementation backlog and schedule after all forms are implemented and stabilized.


creating form saving logic
so check for the saving part lets discuss,
 there is a formsaves screen that will show all saved forms in the system 
 so i noticed that the export pdf was not working on mobile there was no library that was getting the entire form exactly the way it is with all its contents so i thought why not just make a trick were when you fill in the form and click submit(save) just get all the metadata of the form , then save it , when the user goes to the scrensaves forms and clicks a save form to view it that exact form is recreated on that side too

 since this app will have both desktop and mobile app version , so pdf export +print from the saves screen will only happen on desktop but on mobile the user will just be able to view that actuall form the way it was saved .because we noticed on mobile it was not possible to get the form in A4 full view but can only be saved as such so the user can work and save form on mobile and to print it or downlod they have to go to the desktop app and sync, so meaning we have to ensure that each form appears exactly when its saved .check the  foodhandlers daily handwashing Tracking Log sheet , it has a tech that is close but wasnt perfectly implemented , the form was being saved and all the texts and checkboxes but the structure of the layout was differing when it was saved. i hope you get the idea

 as long as the form appears exactly as it is and also its saved content , so we are focusing on mobile
but we want even if the form was saved using mobile but even on pc its comming out perfect condition and size , so i will late use this same codebase to build a desktop version of this , there will be only connected through saved forms via google drive sync , so when i save a form on mobile it will also appear perfectly in the desktop form screen saves 
and they are a lot of unused form cards on the home screen these card are not linked to any forms remove them before we start
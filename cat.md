```powershell
C:\Users\AHMAD\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r "C:\Users\AHMAD\app\src\android\app\build\outputs\apk\release\app-release.apk"

cd C:\Users\AHMAD\app\src\android
.\gradlew assembleRelease


c:\Users\AHMAD\app\src\android\app\build\outputs\apk\release
cd C:\Users\AHMAD\app\src\android
.\gradlew installRelease
```

## Signature field implementation notes

This repo uses a reusable `SignatureField` component (`src/components/SignatureField.js`) to support pen/finger drawn signatures. Add the following notes here so future forms can be updated consistently.

  - `react-native-signature-canvas` (JS wrapper around signature_pad inside a WebView)
  - `react-native-webview` (native module required)

  - `SignatureField` renders a small, borderless preview inside the form. Tapping the preview opens a centered modal with a large canvas where users can draw with pen or finger.
  - The component returns a data URL string (e.g. `data:image/png;base64,...`). The forms store that string directly in their form data.

  - Add a `*Sign` key for any field that needs a drawn signature (example: `baristaSign`, `verifiedBySign`). Keep the textual name (e.g. `verifiedBy`) if you also want to capture the typed name.

  - Import:
    - `import SignatureField from '../components/SignatureField';`
  - State:
    - `const [verifiedBySign, setVerifiedBySign] = useState('');`
  - Draft load/save:
    - When loading draft data include `verifiedBySign` if present.
    - When saving draft/payload include `verifiedBySign`.
  - UI:
    - Place the signature preview where the current typed field is and/or alongside it:
      `<SignatureField value={verifiedBySign} onChange={setVerifiedBySign} editable={editMode} width={240} height={120} />`
  - Presentational: render the saved data URL in an `<Image>` with appropriate dimensions:
    - `<Image source={{ uri: verifiedBySign }} style={{ width: 160, height: 80 }} />`

  - Inline previews: 160x120 (phone) or 240x180+ (tablet) for good legibility.
  - Modal canvas: use a responsive width (~75–90% of screen width) and ~60–80% of screen height.

  - No inline Sign/Clear buttons — tapping the preview opens the modal.
  - Keep Cancel/Save inside modal. Optionally include a Clear inside the modal to erase.

  - PNG base64 grows with pixel area; keep inline previews reasonable (avoid 1000s of pixels for every row). If storage/bandwidth is a concern, add optional client-side resizing before saving.

Keep these notes at the top of `cat.md` so future contributors can quickly replicate the approach.

## Signature capture: how we added drawn signatures (SignatureField)

This project uses a small reusable component to capture hand-drawn signatures (as a PNG data-URL) and to render them in saved presentational views.

Location
- Component source: `src/components/SignatureField.js`

Contract / API
- Props:
  - `value` (string) — existing signature. May be a full data-URL (e.g. `data:image/png;base64,...`) or base64 blob. The component normalises what it returns to a data-URL.
  - `onChange` (function) — called with the saved signature string (data-URL) when the user taps Save in the modal.
  - `editable` (bool) — when true the preview is tappable and opens the modal; when false it is read-only.
  - `width` / `height` (numbers) — suggested preview size for the thumbnail in the form.
  - `placeholder` (string) — optional label for the preview when empty.

Behavior summary
- Preview: small image or placeholder inside the form. Tapping (when `editable`) opens a modal containing a web canvas (via `react-native-signature-canvas`).
- Modal: signature pad with Save / Clear behavior. The saved signature is returned as a data URL (`data:image/png;base64,...`) via `onChange`.
- Canvas CSS: the component forces the canvas to occupy the full modal area (via `webStyle`) to avoid the webview capturing only a small top portion of touch input.
- Stroke settings: pen color and min/max width are tuned for darker, thicker strokes so saved signatures are legible when rendered as thumbnails.

Storage format and conventions
- Signatures are stored in the existing form payload structure. Two common patterns used in this repo:
  - Per-row signatures: `payload.table.left[i].sign` or `payload.table.right[j].sign` (for table-style registers).
  - Metadata signatures: `payload.metadata.someRoleSign` (e.g. `metadata.hseqManagerSign`, `storeOfficerSign`).
- The saved value from `SignatureField` is a data-URL. Presentational code must be prepared to accept either:
  - a full data-URL string: `data:image/png;base64,AAAA...` or
  - a raw base64 string (older code sometimes stored only base64). The presentational helper should normalise both forms.

Rendering in presentational components
- Use React Native's `<Image>` with the signature data-URL as the `uri` source.
- Normalisation helper (recommended):

```javascript
function signatureUri(sig) {
  if (!sig) return null;
  const s = String(sig);
  return s.startsWith('data:') ? s : `data:image/png;base64,${s}`;
}
```

Then render:

```jsx
{sig ? (
  <Image source={{ uri: signatureUri(sig) }} style={{ width: 150, height: 60, resizeMode: 'contain' }} />
) : (
  <Text>{fallbackText}</Text>
)}
```

Table layout / scrolling notes
- Presentational tables that include signature columns need explicit content width to ensure the right-most signature column is reachable on small screens. The Bakery presentational is used as canonical pattern:
  - Set `contentContainerStyle={{ width: tableWidth }}` on the Horizontal `ScrollView` and ensure the inner `<View>` has the same `width` (or `alignSelf: 'flex-start'`), so React Native calculates the full scrollable area.
  - Use `onStartShouldSetResponderCapture={() => true}` on the scroll container if horizontal drags are starting inside child views (this prevents parent touches from canceling the horizontal scroll gesture).

Thumbnail sizing
- If signatures look tiny in presentational views, increase the image `width`/`height` and increase row `minHeight` to match. Common sizes we used:
  - thumbnail: `150 x 60` (good balance for phone/tablet)
  - preview in-edit: `220 x 80` or larger if you want a fatter visual while editing

Development / testing notes
- This component depends on `react-native-signature-canvas` which uses an embedded webview. Ensure `react-native-webview` is installed and linked (autolinking in modern RN should handle it):

  - package installs (run in project root):

```powershell
npm install react-native-webview react-native-signature-canvas
# or using yarn
yarn add react-native-webview react-native-signature-canvas
```

- After installing native modules, build and run on device/emulator so the webview modal works:

```powershell
npx react-native run-android
# or
npx react-native run-ios
```

- Quick manual test flow:
  1. Open the app on an emulator or device (native build required for `react-native-webview`).
 2. Navigate to a form that uses `SignatureField` (e.g. PreShift Meeting, Product Rejection, FOH cleaning forms).
 3. Toggle edit mode, tap the signature preview, draw a signature, and Save.
 4. Confirm the preview thumbnail updates and the payload includes the signature under the expected key.
 5. Submit/save and open the presentational view — the signature should display as an image.

Troubleshooting
- Touch only works on the top of the canvas: we solved this by forcing the canvas CSS to `width:100%` / `height:100%` in `SignatureField`'s `webStyle`. If you still see touch problems, inspect the webStyle string and verify the modal sizing logic.
- Preview not tappable: ensure no parent `onStartShouldSetResponder` wrapper is swallowing touches around the thumbnail. Use `hitSlop` and `accessible` props on the preview and avoid capturing touch responders on parent rows.
- Tiny thumbnails: increase image `width`/`height` and the row `minHeight` in presentational styles.
- Missing images in presentational: normalise the stored value to a data-URL (see `signatureUri` helper) before passing to `<Image>`.
- App crashes on opening modal: verify `react-native-webview` is installed and the app was rebuilt after native module install.

Backups & future work
- If you plan to convert many forms, follow this minimal checklist for each form:
  1. Import `SignatureField`.
 2. Add state binding / metadata key (e.g. `metadata.someRoleSign`).
 3. Replace the TextInput placeholder with `SignatureField value={...} onChange={...} editable={editMode}`.
 4. Update presentational renderer to use `signatureUri` and render an `<Image>` thumbnail with an adequate size.
  5. Test on device/emulator.

If this doc becomes stale, search the repo for `SignatureField` and for keys that end with `Sign` to find remaining places to update.

---

Last updated: 2025-11-04 — contains the key implementation notes and examples for `SignatureField` and presentational handling.

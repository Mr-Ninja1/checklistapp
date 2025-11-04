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

- Dependencies
  - `react-native-signature-canvas` (JS wrapper around signature_pad inside a WebView)
  - `react-native-webview` (native module required)

- How it works
  - `SignatureField` renders a small, borderless preview inside the form. Tapping the preview opens a centered modal with a large canvas where users can draw with pen or finger.
  - The component returns a data URL string (e.g. `data:image/png;base64,...`). The forms store that string directly in their form data.

- Recommended keys
  - Add a `*Sign` key for any field that needs a drawn signature (example: `baristaSign`, `verifiedBySign`). Keep the textual name (e.g. `verifiedBy`) if you also want to capture the typed name.

- Integration pattern (copy/paste)
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

- Sizing guidance
  - Inline previews: 160x120 (phone) or 240x180+ (tablet) for good legibility.
  - Modal canvas: use a responsive width (~75–90% of screen width) and ~60–80% of screen height.

- UX notes
  - No inline Sign/Clear buttons — tapping the preview opens the modal.
  - Keep Cancel/Save inside modal. Optionally include a Clear inside the modal to erase.

- Storage / performance
  - PNG base64 grows with pixel area; keep inline previews reasonable (avoid 1000s of pixels for every row). If storage/bandwidth is a concern, add optional client-side resizing before saving.

Keep these notes at the top of `cat.md` so future contributors can quickly replicate the approach.

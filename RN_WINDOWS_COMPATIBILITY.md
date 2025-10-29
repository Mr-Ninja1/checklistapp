React Native for Windows compatibility checklist
===============================================

Goal
----
Produce a concrete, actionable list of items to change when porting this Expo-managed React Native app to React Native for Windows (RN-Windows). The intent is to keep as much shared JS and UI as possible and only swap / adapt platform-specific modules.

How to use this file
--------------------
- Follow the "Quick migration checklist" near the end to prepare the repo while you continue mobile work.
- Each dependency below lists: where it's used in the repo, compatibility notes, recommended replacement(s), and a short migration plan.
- After finishing mobile, follow the Eject + Add Windows section to add the Windows target.

Summary risk / reuse
--------------------
- Business logic & utilities: ~95% reusable (no native APIs).
- Screens & RN components: ~75–95% reusable (layout tweaks possible).
- Expo native modules and some third-party native modules: require replacement or adapter.

High-priority adapters to add now (high ROI)
--------------------------------------------
Create small adapter modules under `src/platform/` now and use them throughout the codebase. This lets you keep coding mobile and switch implementations when you add RN-Windows.
- `src/platform/secureStore.js` (getItem/setItem/deleteItem)
- `src/platform/fs.js` (readFile/writeFile/mkdir/listDir/removeFile/exists)
- `src/platform/crypto.js` (sha256/hash)
- `src/platform/authBrowser.js` (openAuthUrl && waitForRedirect / startAuthFlow)
- `src/platform/share.js` (shareFile / printFile)

Dependency compatibility matrix (module -> used in -> replacement & notes)
---------------------------------------------------------------------------

1) expo / Expo-managed
- Used: project is Expo-managed (expo in package.json, many expo/* packages used).
- Where used: repo-wide; `src/package.json` + many imports (expo-file-system, expo-secure-store, expo-auth-session, expo-crypto, expo-web-browser, expo-linear-gradient, expo-print, expo-sharing, expo-web-browser).
- Compatibility: Expo-managed workflow does not support RN-Windows directly. You will need to eject to a bare React Native project (``expo prebuild``/``expo eject``) before adding RN-Windows.
- Recommendation: keep code modular; plan to eject only when ready to add Windows. Use adapters for every direct Expo import.
- Effort: moderate (one-time). Must be done before adding RN-Windows.

2) expo-secure-store
- Used in: `src/utils/drive.js` (token storage), referenced in `src/package.json` and `src/app.json`.
- Compatibility: Not supported on RN-Windows.
- Replacement: `react-native-keychain` (check Windows support) or `react-native-mmkv` or a Windows-specific secure store. You can also implement a secure wrapper that uses OS-level APIs on Windows.
- Migration: Implement `src/platform/secureStore.js` that uses `expo-secure-store` on mobile and `react-native-keychain`/MMKV on Windows.
- Priority: high (auth tokens must be stored securely).

3) expo-file-system
- Used in: many places (heavy):
  - `src/utils/formStorage.js`
  - `src/utils/formHistory.js`
  - `src/utils/uploadQueue.js`
  - `src/utils/formDrafts.js`
  - `src/utils/useExportFormAsPDF.js`
  - `src/forms/*` (many form components)
- Compatibility: Replaceable. Use `react-native-fs` (or Windows file APIs) on RN-Windows.
- Recommendation: create `src/platform/fs.js` adapter now and switch all direct imports to that adapter. Adapter API should match a small subset used by the app (read/write/mkdir/listdir/unlink/stat).
- Migration: Replace `import * as FileSystem from 'expo-file-system'` with `import FS from '../platform/fs'` (or similar) in the above files.
- Priority: high (many files depend on FS).

4) expo-auth-session
- Used in: `src/utils/drive.js`, `src/components/DriveFloatingButton.js`
- Compatibility: Not supported on RN-Windows; desktop OAuth needs a different redirect strategy.
- Replacement: implement PKCE + system browser + loopback redirect (http://127.0.0.1:PORT) or Windows custom URI scheme. Wrap it in `src/platform/authBrowser.js`.
- Migration: Replace `AuthSession` usages with adapter functions: `startPkceAuth({ authUrl, redirectUri })` which opens a browser and returns the authorization code or token.
- Priority: high (auth flow used heavily).

5) expo-web-browser
- Used in: `src/utils/drive.js` (fallback flows)
- Compatibility: Not required on Windows; use `Linking.openURL` or system browser approaches via adapter.
- Replacement: `Linking.openURL` or native Windows process start.

6) expo-crypto
- Used in: `src/utils/drive.js` (SHA-256 hashing for PKCE and content-hash)
- Compatibility: Use `crypto-js` (pure JS) or Node's `crypto` on Windows (adapter pattern). Create `src/platform/crypto.js`.
- Migration: Use adapter for digest functions.

7) expo-linear-gradient / react-native-linear-gradient
- Used in: `src/screens/*` (SplashScreen, HomeScreen, LoginScreen, FOHCategoryScreen, KitchenCategory)
- Compatibility: `react-native-linear-gradient` is community native; Windows support may be limited. RN-Windows has XAML backgrounds — you'll need to confirm if `react-native-linear-gradient` has Windows binding.
- Recommendation: For first Windows release, either:
  - keep `react-native-linear-gradient` and test; or
  - replace gradient backgrounds with static color or a simple cross-platform component that renders an image/gradient fallback on Windows.
- Effort: low-to-moderate.

8) expo-print, expo-sharing
- Used in: `src/utils/useExportFormAsPDF.js`, `src/utils/captureAndExport.js`, `src/components/ViewDocumentModal.js`, `src/screens/FormSavesScreen.js`.
- Compatibility: Platform-specific; printing/sharing APIs differ on Windows.
- Recommendation: implement an adapter `src/platform/share.js` that exposes `printPdf(filePath)` and `shareFile(filePath)`. Implement mobile with expo-print/sharing; implement Windows using native print API or save-to-disk + prompt.
- Effort: small-to-moderate.

9) react-native-view-shot
- Used in: `src/utils/captureAndExport.js`, `src/components/ViewDocumentModal.js` (dynamic require)
- Compatibility: Native module; Windows support unclear.
- Recommendation: postpone view-shot functionality on the first Windows build (flag the feature), or implement a Windows native module. Alternatively, capture to PDF via platform print APIs instead of view snapshot.
- Effort: moderate-to-high if required.

10) react-navigation and related libraries
- Used in: many screens. (`@react-navigation/native`, `@react-navigation/stack`, `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`)
- Compatibility: React Navigation works with RN-Windows in many cases, but `react-native-gesture-handler` and `react-native-screens` must have appropriate Windows bindings.
- Recommendation: test after eject. Most projects succeed with React Navigation on RN-Windows, but verify versions.
- Effort: small-to-moderate (library compatibility checks).

11) @react-native-google-signin/google-signin
- Present in root `package.json` but no direct imports found in the code search.
- Compatibility: Windows binding not typical. Use browser-based OAuth flows with PKCE (same as Dropbox) for desktop instead of native Google Sign-In bindings.
- Migration: Replace native google-signin usage (if present) with PKCE browser flow.

12) Misc JS-only libraries
- `uuid`, `prop-types`, `jpeg-js`, `react-native-table-component`, `react-native-loading-spinner-overlay`, etc. Most are pure JS/React and should continue working on RN-Windows.
- Action: verify runtime behavior after adding Windows target; low risk.

Files to update (representative)
--------------------------------
Replace direct imports from Expo/natives with adapters. Example files to change (based on repo grep results):
- `src/utils/drive.js` (expo-auth-session, expo-secure-store, expo-crypto, expo-web-browser)
- `src/components/DriveFloatingButton.js` (AuthSession import; already uses drive helper)
- `src/utils/formStorage.js` (expo-file-system/legacy)
- `src/utils/formHistory.js` (expo-file-system/legacy)
- `src/utils/uploadQueue.js` (expo-file-system/legacy)
- `src/utils/formDrafts.js` (expo-file-system/legacy)
- `src/utils/useExportFormAsPDF.js` (expo-file-system, expo-print)
- `src/utils/captureAndExport.js` (expo-print, expo-sharing, react-native-view-shot)
- Many `src/forms/*.js` files that import expo-file-system directly

Suggested adapter APIs (simple, small surface area)
---------------------------------------------------
1) `src/platform/secureStore.js`
- async getItem(key): string|null
- async setItem(key, value)
- async deleteItem(key)

2) `src/platform/fs.js`
- async readFile(path): string
- async writeFile(path, contents)
- async exists(path): boolean
- async mkdir(path)
- async listDir(path): string[]
- async unlink(path)

3) `src/platform/crypto.js`
- async sha256(input): hexString

4) `src/platform/authBrowser.js`
- async openAuthUrl(url, { redirectUri, timeoutMs }): returns redirect full URL (or parsed code)
- optional helper: startPkceFlow({ authUrl, tokenUrl, clientId }) -> tokens

5) `src/platform/share.js`
- async print(filePath)
- async share(filePath)

Quick migration checklist (do these now to minimize work later)
--------------------------------------------------------------
- [ ] Add `src/platform/*` adapter stubs (export mobile defaults that proxy to Expo). I can scaffold these automatically.
- [ ] Replace direct imports in a few high-impact files: `src/utils/drive.js`, `src/utils/formStorage.js`, `src/utils/uploadQueue.js` to use adapters.
- [ ] Keep the rest of code importing the central utility modules (`formStorage`, `drive`, `uploadQueue`) rather than Expo modules directly.
- [ ] Add a README note with the RN-Windows requirements and the planned adapter locations.

Eject & add RN-Windows (high level steps when you're ready)
-----------------------------------------------------------
1. (Optional) Ensure code uses adapters as above.
2. Run `expo prebuild` / `expo eject` to create native projects (android/ios/windows). You must be on a bare RN-compatible Expo SDK.
3. Add Windows platform: install `react-native-windows` and follow docs: `npx react-native-windows-init --overwrite --install -r 0.71.12` (match RN version — check compatibility with your React Native version).
4. Open the solution in Visual Studio and build. You will likely need Visual Studio 2019/2022 with Desktop Development workloads.
5. Fix native module bindings: replace or re-link packages that don't provide Windows native code. Swap to Windows-capable alternatives for secure storage, file system, etc.

Estimated time & effort (rough)
------------------------------
- Prepare adapters & small refactor now: 1–3 days.
- Eject & configure RN-Windows (first build): 1–3 days (requires Windows dev environment and Visual Studio setup).
- Implement Windows replacements for SecureStore + FS + Auth browser: 2–7 days depending on how many modules and Windows API familiarity.
- UI polish & QA: 2–7 days depending on scope.

Next steps I can take for you (pick one)
---------------------------------------
A) Scaffold adapter stubs in `src/platform/` and patch a few key files to use them (safe, non-invasive). This reduces future port work immediately. (Recommended)
B) Produce a precise CSV-style dependency matrix enumerating all `package.json` dependencies and whether they need replacement for RN-Windows. (Lower immediate ROI than adapters, but helpful.)
C) Start the eject + RN-Windows onboarding (requires careful confirmation and willingness to run Visual Studio locally/CI). (Invasive; do only when ready.)

Tell me which you'd like and I will proceed. If you pick A I will scaffold the adapter files and update `drive.js`, `formStorage.js`, and `uploadQueue.js` to use them (non-invasive edits) so you can continue mobile development while keeping Windows migration simple.


--- End of compatibility report

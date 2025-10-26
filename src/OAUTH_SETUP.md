Production OAuth & private-distribution setup (ChecklistApp)

This document describes the final/production Google Drive OAuth setup for a private company app and how to build and distribute the app privately.

1) Google Cloud Console — OAuth consent
- Go to https://console.cloud.google.com/apis/credentials
- OAuth consent screen -> choose User Type: "Internal" (recommended for private/company apps on Google Workspace). This avoids external verification for sensitive scopes.
- App name, support email, developer contact: fill with company info.
- Scopes: add only: https://www.googleapis.com/auth/drive.file
- Save.

2) Create OAuth client IDs
- Android (native):
  - Application type: Android
  - Name: ChecklistApp Android (prod)
  - Package name: com.anonymous.src
  - SHA-1: Add the release keystore SHA-1 (or Google Play App Signing SHA-1 if Play manages signing). For dev you can add debug SHA-1; for production add release/Play SHA-1.
  - Copy the client ID and set it in `app.json` under `expo.extra.googleClientIdAndroid`.

- iOS (native):
  - Application type: iOS
  - Name: ChecklistApp iOS (prod)
  - Bundle ID: com.anonymous.src (or your chosen bundle id)
  - (optional) Team ID and App Store ID
  - Copy the client ID and set it in `app.json` under `expo.extra.googleClientIdIos`.

Notes:
- For a private app inside a Google Workspace domain, set OAuth consent screen User Type to Internal: only users in the Workspace can consent; Google will not require full verification for internal apps.
- drive.file is a sensitive scope; with Internal apps you avoid external verification.

3) Repo wiring (already applied)
- `src/app.json`:
  - `expo.extra.googleClientIdAndroid` - Android client id
  - `expo.extra.googleClientIdIos` - iOS client id
  - `expo.extra.googleClientIdWeb` - web client id (optional)
  - `expo.ios.bundleIdentifier` - should match the iOS Bundle ID used in Google Console
  - `expo.android.package` - should match the Android package
- `src/utils/drive.js` picks the client id depending on runtime (proxy vs native / Android vs iOS). A runtime console.log prints the client id and redirect URI used at sign-in.

4) Building & private distribution
- Install EAS CLI and login:

```powershell
npm install -g eas-cli
cd C:\Users\AHMAD\app\src
eas login
```

- Prepare `eas.json` (a minimal production profile was added to `src/eas.json`).
- iOS:
  - Use `eas build -p ios --profile production`.
  - EAS will ask for App Store Connect credentials (use App Store Connect API key or provide an account). EAS can manage provisioning profiles for you.
  - After build, distribute via TestFlight (internal testers) or using your MDM solution for private in-house distribution.
- Android:
  - Use `eas build -p android --profile production` to produce an AAB.
  - Distribute privately via an internal APK/AAB upload or via a private Play Console track (internal testing or private-managed Play) or your MDM.

5) Distribution choices for private company apps
- TestFlight (Apple): invite internal users/testers; easiest for private iOS distribution.
- Google Play Internal test / private track: upload AAB and restrict access to internal testers (or use a private managed Play account).
- MDM / Sideload: distribute APK/IPA via your device management solution.

6) Checklist before wide internal rollout
- Confirm `expo.extra.googleClientIdIos` matches the iOS OAuth client you created.
- Confirm `expo.ios.bundleIdentifier` matches the Bundle ID used in Google Cloud Console.
- Confirm Android client id and SHA-1(s) added to Google Console.
- If using Workspace Internal OAuth type, add any necessary test users or ensure users are in your Workspace.
- Build with EAS and test sign-in on a real device (TestFlight / internal APK install). The runtime log in `drive.signInAsync` prints the client id and redirect URI for verification.

7) If you want, I can:
- Add a privacy policy URL and sample privacy text (helps App Store listing and any future verification)
- Add more detailed EAS config for automated builds and credentials management
- Add a copyable redirect URI debug modal in the Drive UI for easy copying when configuring OAuth clients

---
If you want me to continue now, tell me which of the following you want next:
- (A) I will set `expo.ios.bundleIdentifier` to `com.anonymous.src` (I can do it now) and commit.
- (B) I will add `eas.json` at the workspace root (instead of `src`) if you prefer starting EAS from root.
- (C) I will add a short privacy policy file and link in `app.json` under `expo.extra.privacyPolicy`.
- (D) Ready to trigger EAS build steps and walk through credential setup interactively.


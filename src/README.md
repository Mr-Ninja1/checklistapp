# Checklist App — run & dependencies

This project uses Expo + React Native. The app implements a "screenshot -> embed -> PDF" export flow (Gemini approach) using:

- react-native-view-shot (captureRef)
- expo-print (Print.printToFileAsync)
- expo-file-system (FileSystem) — legacy import used in some helpers

Required packages (check package.json):
- react-native-view-shot
- expo-print
- expo-file-system

Quick run (Windows PowerShell):

1. Start Metro:

```powershell
npm start
```

2. Run on Android emulator:

```powershell
npm run android
```

Notes:
- Ensure Android SDK platform-tools (adb) are on PATH when building/running.
- The app saves PDFs to the app document directory under `forms/` and maintains a `history.json` file there.
- If you run into issues with FileSystem deprecation warnings, the code uses `expo-file-system/legacy` in a few helpers to be compatible with SDK 54.

For support: open an issue with Metro logs and the exact steps you followed to reproduce the problem.
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

## Automated branch sync & PR auto-merge

This repository includes two GitHub Actions workflows to help keep branches in sync and to auto-merge PRs when labeled.

- `.github/workflows/branch-sync.yml` — runs on a schedule (daily by default) and attempts to merge `main` into `backup-before-keep-ours-20251006160143`. If the merge succeeds it pushes the result; if conflicts appear it creates an issue labeled `sync, conflict` so maintainers can resolve them manually.
- `.github/workflows/pr-auto-merge.yml` — listens for PRs labeled `automerge` and attempts to merge them automatically when checks/approvals pass. It uses `pascalgn/automerge-action` and merges with `squash` method.

Configuration notes:

- Adjust the scheduled cron in `.github/workflows/branch-sync.yml` if you want a different cadence.
- If you want the Action to push to branches protected by rules, configure a machine user or fine-tune `GITHUB_TOKEN` permissions and ensure branch protection allows repo owners or the actions bot to push.
- To auto-merge a PR, add the `automerge` label to the PR and ensure required checks and approvals are present.
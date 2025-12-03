Quick EAS Update / Build cheatsheet

Where to run: `C:\Users\AHMAD\app\src` (project root)

Publish JS update (staging):
```
npm run update:staging
```

Publish JS update (production):
```
npm run update:prod
```

Build dev client (Android):
```
npm run build:dev:android
```

Build production (Android):
```
npm run build:prod:android
```

Start dev client:
```
npm run start:devclient
```

Download artifact after EAS build completes:
```
npx eas build:list --platform android
npx eas build:view <BUILD_ID>
npx eas build:download --platform android --id <BUILD_ID> --output ./build-artifact
```

Install APK (adb):
```
adb install -r ./build-artifact/app-release.apk
```

Notes:
- JS/asset-only changes -> `eas update` (no reinstall, device must be online).
- Native changes -> `eas build` and re-install binary.
- Use `staging` branch for QA before promoting to `production`.

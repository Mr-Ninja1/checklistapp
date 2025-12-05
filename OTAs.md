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


# Try offline (fast if deps already cached)
cd C:\Users\AHMAD\app\android
 --offline --info

# Force dependency refresh (will download) — compare time to the offline run
.\gradlew assembleRelease --refresh-dependencies --info

# Generate a profile report to find slow tasks
.\gradlew installRelease
# open the report at: android\build\reports\profile






<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="https"/>
    </intent>
  </queries>
  <application android:name=".MainApplication" android:label="@string/app_name" android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round" android:allowBackup="true" android:theme="@style/AppTheme" android:supportsRtl="true" android:enableOnBackInvokedCallback="false" android:fullBackupContent="@xml/secure_store_backup_rules" android:dataExtractionRules="@xml/secure_store_data_extraction_rules">
    <meta-data android:name="expo.modules.updates.ENABLED" android:value="true"/>
    <meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
    <meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="0"/>
    <activity android:name=".MainActivity" android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode" android:launchMode="singleTask" android:windowSoftInputMode="adjustResize" android:theme="@style/Theme.App.SplashScreen" android:exported="true" android:screenOrientation="unspecified">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="checklistapp"/>
      </intent-filter>
    </activity>
  </application>
</manifest>
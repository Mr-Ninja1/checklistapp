# Install Android command-line tools, platform-tools, build-tools and a stable NDK
# Run with: powershell -NoProfile -ExecutionPolicy Bypass -File .\install_android_tools.ps1

$ErrorActionPreference = 'Stop'

Write-Output "Starting Android SDK/NDK installer script"

# 1) Set ANDROID_SDK_ROOT and JAVA_HOME for the session (and persist for the user)
$env:ANDROID_SDK_ROOT = 'C:\Users\AHMAD\AppData\Local\Android\Sdk'
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $env:ANDROID_SDK_ROOT, 'User')
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
[Environment]::SetEnvironmentVariable('JAVA_HOME', $env:JAVA_HOME, 'User')

Write-Output "ANDROID_SDK_ROOT = $env:ANDROID_SDK_ROOT"
Write-Output "JAVA_HOME = $env:JAVA_HOME"

# 2) Prepare cmdline-tools folder
$cmdlineDir = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools'
if (-not (Test-Path $cmdlineDir)) { New-Item -Path $cmdlineDir -ItemType Directory | Out-Null }

# 3) Download command-line tools zip
$zipPath = Join-Path $env:TEMP 'commandlinetools.zip'
$downloadUrl = 'https://dl.google.com/android/repository/commandlinetools-win-9477386_latest.zip'
Write-Output "Downloading command-line tools to $zipPath ..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

# 4) Extract into the SDK folder
Write-Output "Extracting command-line tools into $env:ANDROID_SDK_ROOT ..."
Expand-Archive -Path $zipPath -DestinationPath $env:ANDROID_SDK_ROOT -Force

# 5) Normalize extracted layout to cmdline-tools\latest
$extractedSub = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\cmdline-tools'
$dest = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest'
if (Test-Path $extractedSub) {
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    Move-Item -Path $extractedSub -Destination $dest
} elseif (-not (Test-Path $dest)) {
    # Attempt to find a cmdline-tools folder with sdkmanager
    $found = Get-ChildItem -Path $env:ANDROID_SDK_ROOT -Directory -Filter 'cmdline-tools' -Recurse -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'bin\sdkmanager.bat') } | Select-Object -First 1
    if ($found) {
        $src = $found.FullName
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        Move-Item -Path $src -Destination $dest
    }
}

# 6) Update session PATH for cmdline-tools and platform-tools
$sessionPaths = @((Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest\bin'), (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools'))
$env:Path = ($sessionPaths -join ';') + ';' + $env:Path

# 7) Locate sdkmanager
$sdkmanagerPath = Join-Path $env:ANDROID_SDK_ROOT 'cmdline-tools\latest\bin\sdkmanager.bat'
if (-not (Test-Path $sdkmanagerPath)) {
    Write-Error "sdkmanager not found at $sdkmanagerPath. If this fails, open Android Studio -> SDK Manager -> SDK Tools and install 'Android SDK Command-line Tools'."
    exit 1
}

Write-Output "sdkmanager found at: $sdkmanagerPath"

# 8) Show available packages and install platform-tools, build-tools and NDK
& $sdkmanagerPath --list

Write-Output 'Installing platform-tools, build-tools;33.0.0 and ndk;25.2.9519653 (this may take some minutes)...'
# This command may prompt to download large packages; it will also prompt to accept licenses interactively
& $sdkmanagerPath "platform-tools" "build-tools;33.0.0" "ndk;25.2.9519653"

# 9) Accept licenses interactively
Write-Output 'Please accept any sdkmanager licenses when prompted...'
& $sdkmanagerPath --licenses

# 10) List installed packages
Write-Output 'Installed packages (sdkmanager --list_installed):'
& $sdkmanagerPath --list_installed

# 11) Remove the known-corrupt NDK folder if present
$corruptNdk = Join-Path $env:ANDROID_SDK_ROOT 'ndk\27.1.12297006'
if (Test-Path $corruptNdk) {
    Write-Output "Removing potentially corrupted NDK at $corruptNdk..."
    Remove-Item -Recurse -Force $corruptNdk
}

# 12) Final verification
Write-Output 'Final verification: adb devices'
& adb devices

Write-Output 'Android SDK/NDK install script completed.'

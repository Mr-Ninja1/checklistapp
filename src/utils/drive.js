// Minimal Dropbox helper using Expo AuthSession and SecureStore.
// Replaces the previous Google Drive implementation. To make this work you must:
// 1) Install dependencies: expo-auth-session and expo-secure-store
//    expo install expo-auth-session expo-secure-store
// 2) Add your Dropbox App Key to app config (`app.json` -> `expo.extra.dropboxAppKey`)
// 3) Add your app's redirect URI (if using Expo proxy, add the proxy redirect URI in the Dropbox app settings)

import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Linking, AppState } from 'react-native';

const TOKEN_KEY = 'dropbox_access_token';
const TOKEN_EXPIRES_KEY = 'dropbox_access_token_expires_at';
const USER_INFO_KEY = 'dropbox_user_info';

// Dropbox API endpoints
const AUTH_ENDPOINT = 'https://www.dropbox.com/oauth2/authorize';
const TOKEN_ENDPOINT = 'https://api.dropboxapi.com/oauth2/token';
const API_BASE = 'https://api.dropboxapi.com/2';
const CONTENT_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
const CONTENT_DOWNLOAD_URL = 'https://content.dropboxapi.com/2/files/download';

// Dropbox app key should be added to app.json under expo.extra
const extra = (Constants.manifest && Constants.manifest.extra) || (Constants.expoConfig && Constants.expoConfig.extra) || {};
const DROPBOX_APP_KEY = extra.dropboxAppKey || '<SET_DROPBOX_APP_KEY>';
// Optional: custom app folder path prefix for uploaded files
const BACKUP_PREFIX = 'checklistapp_';
// Dropbox scopes to request. Adjust if you need different permissions.
const SCOPES = 'files.content.write files.content.read account_info.read';
// Prefer the Dropbox App Folder named Bravoapp (the app container) as the base
// location for backups. If it exists we'll use its path (e.g. '/Apps/Bravoapp').
const APP_CONTAINER_NAME = 'Bravoapp';

function getRedirectUri({ useProxy = false } = {}) {
  try {
    const uri = AuthSession.makeRedirectUri(useProxy ? { useProxy: true } : { native: true });
    if (typeof uri === 'string' && uri) return uri;
  } catch (e) {
    // ignore and fallback
  }
  const scheme = (Constants.manifest && Constants.manifest.scheme) || (Constants.expoConfig && Constants.expoConfig.scheme) || 'checklistapp';
  // Prefer the double-slash form for native apps (checklistapp://oauth2redirect) which
  // is commonly registered in OAuth provider consoles. Use single-slash only when
  // an environment or provider specifically needs it.
  if (useProxy) return `${scheme}:/oauth2redirect`;
  return `${scheme}://oauth2redirect`;
}

export async function isConfigured() {
  return Boolean(DROPBOX_APP_KEY && !DROPBOX_APP_KEY.startsWith('<SET_'));
}

export async function getAccessToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const exp = await SecureStore.getItemAsync(TOKEN_EXPIRES_KEY);
    if (!token) return null;
    if (exp && Number(exp) < Date.now()) {
      // token expired — try refresh
      const refreshed = await refreshAccessToken().catch(() => null);
      if (refreshed) return refreshed;
      // failed to refresh: clear stored values
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRES_KEY);
      await SecureStore.deleteItemAsync('dropbox_refresh_token');
      return null;
    }
    return token;
  } catch (e) {
    console.warn('drive.getAccessToken error', e);
    return null;
  }
}

async function refreshAccessToken() {
  try {
    const refreshToken = await SecureStore.getItemAsync('dropbox_refresh_token');
    if (!refreshToken) return null;
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeForm({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: DROPBOX_APP_KEY }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn('refreshAccessToken failed', res.status, txt);
      return null;
    }
    const data = await res.json();
    const { access_token, expires_in, refresh_token } = data;
    if (!access_token) return null;
    const expiresAt = expires_in ? Date.now() + Number(expires_in) * 1000 : Date.now() + 3600 * 1000;
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(TOKEN_EXPIRES_KEY, String(expiresAt));
    // Notify listeners that auth is now available
    try { _emitAuth(true); } catch (e) {}
    if (refresh_token) await SecureStore.setItemAsync('dropbox_refresh_token', refresh_token);
    return access_token;
  } catch (e) {
    console.warn('refreshAccessToken error', e);
    return null;
  }
}

export async function signOut() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRES_KEY);
    await SecureStore.deleteItemAsync('dropbox_refresh_token');
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
    // Notify listeners that auth has been cleared
    try { _emitAuth(false); } catch (e) {}
    return true;
  } catch (e) {
    console.warn('dropbox.signOut failed', e);
    return false;
  }
}

// Sign-in using OAuth implicit flow (token returned in redirect). This is a pragmatic approach
// for mobile/Expo dev. For production consider using PKCE and server-side exchange.

// NOTE: We no longer attempt native Google Sign-In. This module always uses the
// browser-based Authorization Code + PKCE flow (via expo-auth-session / AuthSession).
// That keeps the auth flow identical across platforms and avoids native module
// build/configuration issues.

export async function signInAsync(options = {}) {
  // options: { useProxyOverride: boolean|null, forceExternalOverride: boolean|null }
  // determine whether to use the Expo proxy/web client (dev) or native client
  const useProxy = (typeof options.useProxyOverride === 'boolean') ? options.useProxyOverride : (Constants.appOwnership === 'expo');
  // Debug: log which client ID and redirect URI will be used (helps verify production wiring)
  try {
    const redirectDebug = getRedirectUri({ useProxy });
    // eslint-disable-next-line no-console
    console.log('drive.signInAsync -> useProxy=', useProxy, 'redirectUri=', redirectDebug, 'redirectType=', typeof redirectDebug, 'platform=', Platform.OS);
  } catch (e) {
    /* ignore logging errors */
  }
  const appKey = DROPBOX_APP_KEY;
  if (!appKey || appKey.startsWith('<SET_')) throw new Error('Dropbox App Key not configured (set app.json extra.dropboxAppKey)');
  const redirectUri = getRedirectUri({ useProxy });
  const authEndpoint = 'https://www.dropbox.com/oauth2/authorize';
  const tokenEndpoint = 'https://api.dropboxapi.com/oauth2/token';

  // Always use the browser PKCE flow (no native Play Services path).

  // generate PKCE verifier & challenge
  const codeVerifier = generateCodeVerifier(128);
  // Persist the code verifier briefly so flows that open an external browser
  // and then resume the app (which may reload JS) can still access the
  // verifier during the token exchange. This avoids "invalid code verifier"
  // errors when the in-memory variable is lost across the auth redirect.
  try {
    await SecureStore.setItemAsync('dropbox_code_verifier', codeVerifier);
  } catch (e) {
    /* ignore persistence errors */
  }
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  const codeChallenge = base64UrlEncode(hashed);

  const authUrl = `${authEndpoint}` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(appKey)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256` +
    `&token_access_type=offline` +
    `&scope=${encodeURIComponent(SCOPES)}`;

  // Dev: show the full auth URL so we can copy the redirect_uri param and inspect it
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    try {
      // eslint-disable-next-line no-console
      console.log('drive: authUrl ->', authUrl);
    } catch (e) {}
  }

    try {
    // Try available AuthSession methods in order of preference unless the app forces
    // an external browser flow (some emulators/dev images block in-app flows).
    let result = null;
  const forceExternal = (typeof options.forceExternalOverride === 'boolean') ? options.forceExternalOverride : Boolean(extra.forceExternalBrowser === true);

    if (forceExternal) {
      console.log('drive: forceExternalBrowser enabled — using external browser via Linking.openURL');
      // Manual fallback: open in external browser and wait for a redirect to our app's URI
      const waitForRedirect = (expectedPrefix, timeoutMs = 120000) => new Promise((resolve) => {
        let resolved = false;
        const onUrl = ({ url }) => {
          if (!url) return;
          if (url.startsWith(expectedPrefix) || url.includes('code=')) {
            if (!resolved) { resolved = true; cleanup(); resolve(url); }
          }
        };
        const cleanup = () => {
          try {
            if (sub && typeof sub.remove === 'function') sub.remove();
            else Linking.removeEventListener && Linking.removeEventListener('url', onUrl);
          } catch (e) { /* ignore */ }
          clearTimeout(timer);
        };
        let sub = null;
        try { sub = Linking.addEventListener('url', onUrl); } catch (e) { /* ignore */ }
        Linking.getInitialURL().then((u) => { if (u && (u.startsWith(expectedPrefix) || u.includes('code='))) { if (!resolved) { resolved = true; cleanup(); resolve(u); } } }).catch(() => {});
        const timer = setTimeout(() => { if (!resolved) { resolved = true; cleanup(); resolve(null); } }, timeoutMs);
      });

      try {
        const can = await Linking.canOpenURL(authUrl).catch(() => false);
        console.log('drive: Linking.canOpenURL ->', can);
        try { await Linking.openURL(authUrl); } catch (e) { console.warn('drive: Linking.openURL failed', e); }
      } catch (e) {
        console.warn('drive: error during Linking.openURL', e);
      }

      const redirected = await waitForRedirect(redirectUri);
      if (!redirected) throw new Error('Auth cancelled or no redirect received');
      result = { type: 'success', params: {} };
      try { const u = new URL(redirected); const codeParam = u.searchParams.get('code'); if (codeParam) result.params.code = codeParam; } catch (e) { /* ignore */ }
    } else {
      if (typeof AuthSession.startAsync === 'function') {
        console.log('drive: using AuthSession.startAsync');
        result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });
      } else if (typeof AuthSession.openAuthSessionAsync === 'function') {
        console.log('drive: using AuthSession.openAuthSessionAsync');
        const r = await AuthSession.openAuthSessionAsync(authUrl, redirectUri);
        result = { type: r && r.type ? r.type : 'cancel', params: {} };
        if (r && r.url) {
          try { const u = new URL(r.url); const codeParam = u.searchParams.get('code'); if (codeParam) result.params.code = codeParam; } catch (e) { /* ignore */ }
        }
      } else {
        console.log('drive: falling back to manual Linking flow');
        // Try Expo WebBrowser first (works as an in-app/custom-tab fallback)
        try {
          if (WebBrowser && typeof WebBrowser.openAuthSessionAsync === 'function') {
            console.log('drive: trying expo-web-browser.openAuthSessionAsync');
            const wb = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            if (wb && wb.type === 'success' && wb.url) {
              try {
                const u = new URL(wb.url);
                const codeParam = u.searchParams.get('code');
                if (codeParam) {
                  result = { type: 'success', params: { code: codeParam } };
                }
              } catch (e) { /* ignore parse errors */ }
            }
          }
        } catch (e) {
          console.log('drive: expo-web-browser.openAuthSessionAsync failed', e);
        }

        if (!result) {
          console.log('drive: falling back to Linking.openURL (external browser)');
          const waitForRedirect = (expectedPrefix, timeoutMs = 120000) => new Promise((resolve) => {
            let resolved = false;
            const onUrl = ({ url }) => {
              if (!url) return;
              if (url.startsWith(expectedPrefix) || url.includes('code=')) {
                if (!resolved) { resolved = true; cleanup(); resolve(url); }
              }
            };
            const cleanup = () => {
              try {
                if (sub && typeof sub.remove === 'function') sub.remove();
                else Linking.removeEventListener && Linking.removeEventListener('url', onUrl);
              } catch (e) { /* ignore */ }
              clearTimeout(timer);
            };
            let sub = null;
            try { sub = Linking.addEventListener('url', onUrl); } catch (e) { /* ignore */ }
            Linking.getInitialURL().then((u) => { if (u && (u.startsWith(expectedPrefix) || u.includes('code='))) { if (!resolved) { resolved = true; cleanup(); resolve(u); } } }).catch(() => {});
            const timer = setTimeout(() => { if (!resolved) { resolved = true; cleanup(); resolve(null); } }, timeoutMs);
          });

          try {
            const can = await Linking.canOpenURL(authUrl).catch(() => false);
            console.log('drive: Linking.canOpenURL ->', can);
            try { await Linking.openURL(authUrl); } catch (e) { console.warn('drive: Linking.openURL failed', e); }
          } catch (e) {
            console.warn('drive: error during Linking.openURL', e);
          }

          const redirected = await waitForRedirect(redirectUri);
          if (!redirected) throw new Error('Auth cancelled or no redirect received');
          result = { type: 'success', params: {} };
          try { const u = new URL(redirected); const codeParam = u.searchParams.get('code'); if (codeParam) result.params.code = codeParam; } catch (e) { /* ignore */ }
        }
      }
    }

    if (!result || result.type !== 'success') throw new Error('Auth cancelled or failed');
    const code = result.params && result.params.code;
    if (!code) throw new Error('No code returned from auth');

    // Exchange authorization code for tokens (Dropbox)
    // ensure we have the codeVerifier (try SecureStore fallback if lost in-memory)
    let verifierToUse = codeVerifier;
    if (!verifierToUse) {
      try {
        verifierToUse = await SecureStore.getItemAsync('dropbox_code_verifier');
      } catch (e) { verifierToUse = null; }
    }
    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeForm({
        grant_type: 'authorization_code',
        code,
        client_id: appKey,
        redirect_uri: redirectUri,
        code_verifier: verifierToUse,
      }),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      throw new Error(`Token exchange failed: ${tokenRes.status} ${txt}`);
    }
    const tokens = await tokenRes.json();
    const { access_token, expires_in, refresh_token } = tokens;
    const expiresAt = expires_in ? Date.now() + Number(expires_in) * 1000 : Date.now() + 3600 * 1000;
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    if (refresh_token) {
      await SecureStore.setItemAsync('dropbox_refresh_token', refresh_token);
      console.log('dropbox: refresh_token received and stored');
    } else {
      console.warn('dropbox: no refresh_token returned from token exchange — reauthenticate to obtain one');
    }
    await SecureStore.setItemAsync(TOKEN_EXPIRES_KEY, String(expiresAt));
  // remove persisted code verifier now that token exchange succeeded
  try { await SecureStore.deleteItemAsync('dropbox_code_verifier'); } catch (e) { /* ignore */ }
    // Fetch basic userinfo and persist it for UI
    try {
      // Fetch Dropbox account info
      const userRes = await fetch('https://api.dropboxapi.com/2/users/get_current_account', { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } });
      if (userRes.ok) {
        const ui = await userRes.json();
        await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(ui));
      }
    } catch (e) {
      console.warn('dropbox: failed to fetch userinfo', e);
    }
    // Notify listeners that auth is available after successful sign-in
    try { _emitAuth(true); } catch (e) {}
    return { access_token, expiresAt, refresh_token };
  } catch (e) {
    console.warn('dropbox.signInAsync failed', e);
    throw e;
  }
}

export async function getUserInfo() {
  try {
    const raw = await SecureStore.getItemAsync(USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('dropbox.getUserInfo error', e);
    return null;
  }
}

// Dev helper: return which clientId and redirectUri will be used and whether
// a refresh token is currently stored. Useful for debugging auth config on
// device/emulator without adding UI.
export async function getDebugInfo() {
  try {
    const useProxy = Constants.appOwnership === 'expo';
    const redirectUri = getRedirectUri({ useProxy });
    const rt = await SecureStore.getItemAsync('dropbox_refresh_token');
    return { clientId: DROPBOX_APP_KEY, redirectUri, hasRefreshToken: Boolean(rt) };
  } catch (e) {
    console.warn('dropbox.getDebugInfo error', e);
    return null;
  }
}

// Dev helper: import an access token into SecureStore for local testing (dev only).
export async function importAccessToken(token, refreshToken = null, expiresInSeconds = 3600) {
  try {
    if (!token) throw new Error('Missing token');
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    const expiresAt = Date.now() + Number(expiresInSeconds) * 1000;
    await SecureStore.setItemAsync(TOKEN_EXPIRES_KEY, String(expiresAt));
    if (refreshToken) await SecureStore.setItemAsync('dropbox_refresh_token', refreshToken);
    console.log('dropbox: importAccessToken stored token (dev only)');
    try { _emitAuth(true); } catch (e) {}
    return true;
  } catch (e) {
    console.warn('dropbox.importAccessToken failed', e);
    throw e;
  }
}

// Dev helper: revoke and clear any stored token. Calls Dropbox token revoke endpoint if a token exists.
export async function revokeAccessToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      try {
        // Dropbox token revoke endpoint expects an Authorization: Bearer <token> header
        const res = await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: ''
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.warn('dropbox.revokeAccessToken: revoke endpoint returned', res.status, txt);
        } else {
          console.log('dropbox: token revoked via API');
        }
      } catch (e) {
        console.warn('dropbox.revokeAccessToken: API call failed', e);
      }
    }
    // Clear local storage regardless
    await signOut();
    return true;
  } catch (e) {
    console.warn('dropbox.revokeAccessToken failed', e);
    throw e;
  }
}

// Dev helper: trigger a forced reauthentication (uses external browser and
// prompt=consent to try to obtain a refresh token). Returns the same result
// shape as `signInAsync` or will throw on error.
export async function forceReauthenticate() {
  return signInAsync({ forceExternalOverride: true, useProxyOverride: false });
}

// Ensure we have a refresh token for long-lived offline access. If none is stored
// this helper will run the sign-in flow (with prompt=consent already present) to
// try to obtain one. Returns true if a refresh token is present after running.
export async function ensureRefreshToken(options = {}) {
  try {
    const rt = await SecureStore.getItemAsync('dropbox_refresh_token');
    if (rt) return true;
    // Trigger sign-in flow which already includes prompt=consent and access_type=offline.
    // Force external browser if running in environments that block in-app flows.
    await signInAsync({ ...options, forceExternalOverride: options.forceExternalOverride || false });
    const newRt = await SecureStore.getItemAsync('dropbox_refresh_token');
    return Boolean(newRt);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('dropbox.ensureRefreshToken failed', e);
    return false;
  }
}

// helpers for PKCE and token exchange
function generateCodeVerifier(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function base64UrlEncode(base64) {
  // convert base64 to base64url by replacing +/ with -_ and trimming =
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeForm(obj) {
  return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
}



// Upload a JSON payload as a file to the user's Drive using multipart upload.
export async function uploadJsonFile(filename, jsonObj) {
  // Ensure we have a valid token (getAccessToken will attempt refresh if expired)
  let token = await getAccessToken();
  if (!token) throw new Error('Not signed in');

  // Prefix files so the app can query its own backups easily across devices
  const safeName = `${BACKUP_PREFIX}${filename}`;

  // Prefer uploading under the resolved master app folder (App Container such
  // as /Apps/Bravoapp) or a legacy backup folder if present. getMasterFolderPath()
  // returns an absolute path (e.g. '/apps/bravoapp') or '' to indicate the app
  // container root should be used.
  let targetPath = `/${safeName}`;
  try {
    const masterPath = await getMasterFolderPath().catch(() => '');
    const base = masterPath || '';
    targetPath = `${base ? base : ''}/${safeName}`.replace(/\\/g, '/');
    if (!targetPath.startsWith('/')) targetPath = `/${targetPath.replace(/^\/+/, '')}`;
  } catch (e) {
    // ignore and fall back to root
  }

  const body = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);

  // helper to perform the POST (so we can retry after refresh)
  const doUpload = async (bearer) => {
    const res = await fetch(CONTENT_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/octet-stream',
        // Disable autorename to avoid Dropbox creating duplicate "(1)" files on race conditions.
        // We'll handle conflict responses explicitly and treat them as skipped uploads.
        'Dropbox-API-Arg': JSON.stringify({ path: targetPath, mode: 'add', autorename: false, mute: false }),
      },
      body,
    });
    return res;
  };

  let res = await doUpload(token).catch(err => { throw err; });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    // If token invalid, try to refresh once
    if (res.status === 401 || (txt && txt.includes('invalid_access_token'))) {
      // attempt refresh
      const refreshed = await refreshAccessToken().catch(() => null);
      if (refreshed) {
        token = refreshed;
        res = await doUpload(token).catch(err => { throw err; });
      } else {
        // clear stored credentials to force user to reauthenticate
        await signOut().catch(() => {});
        throw new Error(`Dropbox upload failed: invalid or expired access token. Please sign in again.`);
      }
    }
    if (!res.ok) {
      const txt2 = txt || (await res.text().catch(() => ''));
      // If Dropbox reports a path conflict (file already exists) treat this as a skipped upload.
      if (txt2 && (txt2.includes('path/conflict') || txt2.includes('conflict') || txt2.includes('file already exists'))) {
        return { skipped: true };
      }
      if (txt2 && (txt2.includes('required scope') || txt2.includes('not permitted') || txt2.includes('files.content.write'))) {
        throw new Error(`Dropbox upload failed: missing Dropbox app permission. The Dropbox App Console must enable 'files.content.write' (and related file scopes) for your App. Response: ${res.status} ${txt2}`);
      }
      throw new Error(`Dropbox upload failed: ${res.status} ${txt2}`);
    }
  }
  return res.json();
}

// Upload JSON into a specific folder (parents array). If parents is provided, include it in metadata.
export async function uploadJsonFileToFolder(filename, jsonObj, parentFolderId) {
  // Resolve token and ensure parent folder exists when possible
  let token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const safeName = `${BACKUP_PREFIX}${filename}`;
  let folderPath = '';
  if (parentFolderId) {
    // parentFolderId can be a path string or an object with path_lower
    if (typeof parentFolderId === 'string') folderPath = parentFolderId;
    else if (parentFolderId.path_lower) folderPath = parentFolderId.path_lower;
    // normalize
    if (folderPath && !folderPath.startsWith('/')) folderPath = `/${folderPath}`;
  }

  // If no explicit folder path provided, prefer the master app folder
  if (!folderPath) {
    try {
      const masterPath = await getMasterFolderPath().catch(() => '');
      if (masterPath) folderPath = masterPath;
      else folderPath = '';
    } catch (e) {
      // ignore and fallback to root
    }
  }

  const dropboxPath = `${folderPath || ''}/${safeName}`.replace(/\\/g, '/').replace(/\\/g, '/');
  const body = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);

  const doUpload = async (bearer) => {
    const res = await fetch(CONTENT_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/octet-stream',
        // Disable autorename to avoid Dropbox creating duplicate "(1)" files on race conditions.
        'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: false, mute: false }),
      },
      body,
    });
    return res;
  };

  let res = await doUpload(token).catch(err => { throw err; });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    if (res.status === 401 || (txt && txt.includes('invalid_access_token'))) {
      const refreshed = await refreshAccessToken().catch(() => null);
      if (refreshed) {
        token = refreshed;
        res = await doUpload(token).catch(err => { throw err; });
      } else {
        await signOut().catch(() => {});
        throw new Error(`Dropbox upload failed: invalid or expired access token. Please sign in again.`);
      }
    }
    if (!res.ok) {
      const txt2 = txt || (await res.text().catch(() => ''));
      if (txt2 && (txt2.includes('path/conflict') || txt2.includes('conflict') || txt2.includes('file already exists'))) {
        return { skipped: true };
      }
      if (txt2 && (txt2.includes('required scope') || txt2.includes('not permitted') || txt2.includes('files.content.write'))) {
        throw new Error(`Dropbox upload failed: missing Dropbox app permission. The Dropbox App Console must enable 'files.content.write' (and related file scopes) for your App. Response: ${res.status} ${txt2}`);
      }
      throw new Error(`Dropbox upload failed: ${res.status} ${txt2}`);
    }
  }
  return res.json();
}

// Find a folder by name (returns first match) or null
export async function findFolderByName(folderName) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '', recursive: true, limit: 2000 }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dropbox list_folder failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  if (data.entries && data.entries.length) {
    const found = data.entries.find(e => e['.tag'] === 'folder' && e.name === folderName);
    return found || null;
  }
  return null;
}

// Create a folder at root with the given name
export async function createFolder(folderName) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${API_BASE}/files/create_folder_v2`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: `/${folderName}`, autorename: false }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create folder failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.metadata || data;
}

// Ensure a named folder exists (returns folder object)
export async function ensureFolder(folderName) {
  const found = await findFolderByName(folderName).catch(() => null);
  if (found) return found;
  return createFolder(folderName);
}

// List files inside a folder (folderId may be a path or metadata object)
export async function listFilesInFolder(folderId, extraQuery = "") {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  let path = '';
  if (folderId) {
    if (typeof folderId === 'string') path = folderId;
    else if (folderId.path_lower) path = folderId.path_lower;
    if (path && !path.startsWith('/')) path = `/${path}`;
  }
  const res = await fetch(`${API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: path || '', recursive: false, limit: 200 }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dropbox list_folder failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  let entries = data.entries || [];
  if (extraQuery && extraQuery.trim()) {
    const q = extraQuery.toLowerCase();
    entries = entries.filter(e => e.name && e.name.toLowerCase().includes(q));
  }
  return { entries };
}

// List files under a path recursively. Returns { entries } similar to listFilesInFolder
export async function listFilesRecursive(folderPath = '') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  let path = folderPath || '';
  if (path && !path.startsWith('/')) path = `/${path}`;
  const res = await fetch(`${API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: path || '', recursive: true, limit: 2000 }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dropbox list_folder recursive failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return { entries: data.entries || [] };
}

// Ensure a nested folder path exists (e.g. /checklistapp_backups/2025-10-28)
export async function ensureFolderPath(path) {
  if (!path) return null;
  let normalized = path;
  // normalize to no leading slash for easier prefix checks
  if (normalized.startsWith('/')) normalized = normalized.substring(1);
  // Try to create the full path in one call; if it exists, we'll catch the error and return metadata by listing
  try {
    // If the requested path is under the app master folder (checklistapp_backups)
    // prefer to resolve that master folder's actual path in Dropbox (it may live
    // under /Apps/<app-name>/ or at root) and create the nested path relative to it.
    const PREFIX = 'checklistapp_backups';
    let fullPath = null;
    if (normalized === PREFIX || normalized.startsWith(`${PREFIX}/`)) {
      // locate existing master folder anywhere in the user's Dropbox
      try {
        const master = await findFolderByName(PREFIX).catch(() => null);
        if (master && (master.path_lower || master.path_display)) {
          const base = master.path_lower || master.path_display || `/${PREFIX}`;
          if (normalized === PREFIX) {
            fullPath = base;
          } else {
            const rest = normalized.substring(PREFIX.length + 1);
            fullPath = `${base}/${rest}`.replace(/\\/g, '/').replace(/\\/g, '/');
          }
        } else {
          // master not found — prefer to create under the app container (Bravoapp)
          // when available; otherwise fall back to root.
          try {
            const appBase = await getMasterFolderPath().catch(() => '');
            if (appBase) fullPath = `${appBase}/${normalized}`.replace(/\\/g, '/');
            else fullPath = `/${normalized}`;
          } catch (e) {
            fullPath = `/${normalized}`;
          }
        }
      } catch (e) {
        fullPath = `/${normalized}`;
      }
    } else {
      // If the requested path is not under the legacy PREFIX, prefer to create
      // the nested folder under the resolved app container (e.g. /Apps/Bravoapp)
      // when available. getMasterFolderPath() will return the best base path or
      // '' if not found.
      try {
        const master = await getMasterFolderPath().catch(() => '');
        if (master) fullPath = `${master}/${normalized}`.replace(/\\/g, '/');
        else fullPath = `/${normalized}`;
      } catch (e) {
        fullPath = `/${normalized}`;
      }
    }

    const token = await getAccessToken();
    if (!token) throw new Error('Not signed in');
    const res = await fetch(`${API_BASE}/files/create_folder_v2`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: fullPath, autorename: false }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.metadata || data;
    }
    // If folder exists, list_folder will return an error; fall through to fetch metadata
  } catch (e) {
    // ignore and try to locate the folder
  }
  // Try to locate by listing parent
  try {
    // When locating by listing, assume the parent is the master folder if the
    // requested path begins with checklistapp_backups. Otherwise use the
    // computed parent path.
    const parent = `/${normalized}`.substring(0, `/${normalized}`.lastIndexOf('/')) || '/';
    const name = `/${normalized}`.substring(`/${normalized}`.lastIndexOf('/') + 1);
    const listed = await listFilesInFolder(parent === '/' ? '' : parent).catch(() => ({ entries: [] }));
    const found = (listed.entries || []).find(e => e['.tag'] === 'folder' && (e.name === name || e.name === name.replace(/^\//, '')));
    if (found) return found;
  } catch (e) {
    // ignore
  }
  // As last resort, attempt to create again (may throw)
  try {
    const token2 = await getAccessToken();
    if (!token2) throw new Error('Not signed in');
    const res2 = await fetch(`${API_BASE}/files/create_folder_v2`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: normalized, autorename: false }),
    });
    if (res2.ok) return (await res2.json()).metadata;
  } catch (e) {
    // give up
  }
  return null;
}

export async function downloadFile(filePathOrMeta) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  let path = '';
  if (!filePathOrMeta) throw new Error('Missing path');
  if (typeof filePathOrMeta === 'string') path = filePathOrMeta;
  else if (filePathOrMeta.path_lower) path = filePathOrMeta.path_lower;
  if (!path.startsWith('/')) path = `/${path}`;
  const res = await fetch(CONTENT_DOWNLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Dropbox-API-Arg': JSON.stringify({ path }) },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dropbox download failed: ${res.status} ${txt}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

export async function listFilesAsync(query = '') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '', recursive: false, limit: 200 }),
  });
  if (!res.ok) throw new Error('Dropbox list failed');
  const data = await res.json();
  if (!query) return data;
  const q = query.toLowerCase();
  return { entries: (data.entries || []).filter(e => e.name && e.name.toLowerCase().includes(q)) };
}

const defaultExport = {
  signInAsync,
  signOut,
  getAccessToken,
  uploadJsonFile,
  uploadJsonFileToFolder,
  downloadFile,
  listFilesAsync,
  findFolderByName,
  createFolder,
  ensureFolder,
  listFilesInFolder,
  listFilesRecursive,
  getUserInfo,
  isConfigured,
  // pagination & restore helpers
  listFilesInFolderPaginated,
  listFilesByDateRange,
  restoreFilesBatch,
  getMasterFolderPath,
  // hashing helpers
  computeJsonHash,
  computeRemoteFileHash,
  folderHasFileWithHash,
  // dev helpers
  importAccessToken,
  revokeAccessToken,
};

export default defaultExport;

// --- Progress listener API (structured events) ----------------------------------
// Lightweight subscriptions for UI to listen to progress from restore/upload ops.
const _progressListeners = new Set();
export function addProgressListener(fn) {
  if (typeof fn !== 'function') return () => {};
  _progressListeners.add(fn);
  return () => { try { _progressListeners.delete(fn); } catch (e) {} };
}
function _emitProgress(evt) {
  try {
    for (const l of Array.from(_progressListeners)) {
      try { l(evt); } catch (e) { /* ignore listener errors */ }
    }
  } catch (e) { /* ignore */ }
}

// --- Auth listener API ---------------------------------------------------------
// Lightweight subscription for other modules (uploadQueue, UI) to be notified
// when auth state changes (signed in / signed out). Listeners receive a
// single boolean argument: true when signed in, false when signed out.
const _authListeners = new Set();
export function addAuthListener(fn) {
  if (typeof fn !== 'function') return () => {};
  _authListeners.add(fn);
  return () => { try { _authListeners.delete(fn); } catch (e) {} };
}
export function removeAuthListener(fn) {
  try { _authListeners.delete(fn); } catch (e) { /* ignore */ }
}
function _emitAuth(isSignedIn) {
  try {
    for (const l of Array.from(_authListeners)) {
      try { l(Boolean(isSignedIn)); } catch (e) { /* ignore listener errors */ }
    }
  } catch (e) { /* ignore */ }
}

// --- Pagination and restore helpers -------------------------------------------------
// List files in a folder with pagination support. Returns { entries, cursor, has_more }
export async function listFilesInFolderPaginated(folderPath = '', limit = 200, cursor = null, recursive = false) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');

  if (cursor) {
    const res = await fetch(`${API_BASE}/files/list_folder/continue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursor }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Dropbox list_folder/continue failed: ${res.status} ${txt}`);
    }
    const data = await res.json();
    return { entries: data.entries || [], cursor: data.cursor, has_more: !!data.has_more };
  }

  let path = '';
  if (folderPath) {
    // Resolve master folder path if listing by logical name 'checklistapp_backups'
    if (folderPath === 'checklistapp_backups' || folderPath.startsWith('checklistapp_backups/')) {
      try {
        const master = await findFolderByName('checklistapp_backups').catch(() => null);
        if (master && (master.path_lower || master.path_display)) {
          const base = master.path_lower || master.path_display || '/checklistapp_backups';
          if (folderPath === 'checklistapp_backups') path = base;
          else {
            const rest = folderPath.substring('checklistapp_backups'.length + 1);
            path = `${base}/${rest}`;
          }
        } else {
          if (!folderPath.startsWith('/')) path = `/${folderPath}`;
          else path = folderPath;
        }
      } catch (e) {
        if (!folderPath.startsWith('/')) path = `/${folderPath}`;
        else path = folderPath;
      }
    } else {
      if (!folderPath.startsWith('/')) path = `/${folderPath}`;
      else path = folderPath;
    }
  }
  const res = await fetch(`${API_BASE}/files/list_folder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: path || '', recursive: !!recursive, limit }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Dropbox list_folder failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return { entries: data.entries || [], cursor: data.cursor, has_more: !!data.has_more };
}

// Return the resolved master folder path (if present). If the app is using an App Folder
// (e.g. /Apps/Bravoapp) this will return the path inside that app container. If not found,
// returns '/checklistapp_backups' which will be created under the app root when used.
export async function getMasterFolderPath() {
  try {
    // Prefer the explicit app container name (Bravoapp). This resolves the
    // path for apps that are installed in an App Folder (e.g. /Apps/Bravoapp).
    try {
      const appContainer = await findFolderByName(APP_CONTAINER_NAME).catch(() => null);
      if (appContainer && (appContainer.path_lower || appContainer.path_display)) return appContainer.path_lower || appContainer.path_display;
    } catch (e) {
      // ignore and continue to legacy lookup
    }
    // Fallback: look for legacy `checklistapp_backups` folder anywhere in the account
    const master = await findFolderByName('checklistapp_backups').catch(() => null);
    if (master && (master.path_lower || master.path_display)) return master.path_lower || master.path_display;
    // If neither found, return empty string to indicate the app container root should be used
    return '';
  } catch (e) {
    return '';
  }
}

// List files by date range or year under a backup master folder (e.g. checklistapp_backups).
// This function pages through remote listing but stops when 'limit' matching entries are found.
// Options: { folderPath, fromDate, toDate, year, limit, cursor }
export async function listFilesByDateRange(options = {}) {
  // Default to the app container root (empty path) so we search under /Apps/Bravoapp
  // or the user's app folder rather than creating/expecting a top-level checklistapp_backups.
  const { folderPath = '', fromDate = null, toDate = null, year = null, limit = 100, cursor = null } = options || {};
  const collected = [];
  let nextCursor = cursor;
  let hasMore = false;

  // Resolve listing base: if user asked for 'checklistapp_backups', try to resolve its actual path inside the app
  let listingBase = folderPath;
  // If callers explicitly requested the legacy 'checklistapp_backups' name, try
  // to resolve it; otherwise default to listing the app container root so we pick
  // up backups placed directly under /Apps/Bravoapp or similar.
  if (folderPath === 'checklistapp_backups' || folderPath.startsWith('checklistapp_backups/')) {
    try {
      const master = await findFolderByName('checklistapp_backups').catch(() => null);
      if (master && (master.path_lower || master.path_display)) {
        const base = master.path_lower || master.path_display || '/checklistapp_backups';
        if (folderPath === 'checklistapp_backups') listingBase = base;
        else {
          const rest = folderPath.substring('checklistapp_backups'.length + 1);
          listingBase = `${base}/${rest}`;
        }
      } else {
        listingBase = '';
      }
    } catch (e) {
      listingBase = '';
    }
  
  }

  // helper to parse date folder from path_lower: '/checklistapp_backups/2025-10-28/filename.json'
  const parseDateFromPath = (p, name) => {
    if (!p && !name) return null;
    // If a path is provided, search ALL segments for a YYYY-MM-DD folder name
    if (p) {
      const parts = p.split('/').filter(Boolean);
      for (const seg of parts) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(seg)) return seg;
      }
    }
    // Fallback: attempt to parse savedAt timestamp from filename pattern
    if (name) {
      // match trailing _<timestamp>.json or -<timestamp>.json
      const m = name.match(/[_-](\d{10,13})\.json$/);
      if (m && m[1]) {
        const ts = Number(m[1]);
        if (!Number.isNaN(ts) && ts > 0) {
          const d = new Date(ts);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(d.getUTCDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        }
      }
    }
    return null;
  };

  // iterate pages until we have enough entries or no more pages
  let localCursor = nextCursor || null;
  while (collected.length < limit) {
    const page = await listFilesInFolderPaginated(listingBase, 200, localCursor, true).catch(e => { throw e; });
    const pageEntries = (page.entries || []).filter(e => e['.tag'] === 'file');
    for (const e of pageEntries) {
      if (collected.length >= limit) break;
      const dateStr = parseDateFromPath(e.path_lower || e.path_display || '', e.name || '');
      if (year && !dateStr) continue;
      if (year && dateStr && !dateStr.startsWith(String(year))) continue;
      if (fromDate || toDate) {
        if (!dateStr) continue; // can't determine date
        const dt = new Date(dateStr + 'T00:00:00Z');
        if (fromDate && dt < new Date(fromDate)) continue;
        if (toDate && dt > new Date(toDate)) continue;
      }
      collected.push(e);
    }
    localCursor = page.cursor || null;
    hasMore = !!page.has_more;
    if (!localCursor || !hasMore) break;
  }

  return { entries: collected, cursor: localCursor, has_more: hasMore };
}

// Restore (download and import) a batch of remote files. Returns { results: [...], nextCursor, has_more }
// Options: { folderPath, fromDate, toDate, year, limit, cursor, onProgress }
export async function restoreFilesBatch(options = {}) {
  // Default to app container root unless caller specifies otherwise
  const { folderPath = '', fromDate = null, toDate = null, year = null, limit = 20, cursor = null, onProgress = null } = options || {};
  // First, list candidate files (paged, filtered)
  const listRes = await listFilesByDateRange({ folderPath, fromDate, toDate, year, limit, cursor }).catch(e => { throw e; });
  const entries = listRes.entries || [];
  const results = [];

  // Dynamically import formStorage's default export to avoid circular require at module load
  const { default: formStorage } = await import('./formStorage');
  // Load local history to detect existing form UUIDs so we can skip importing duplicates
  let existingUUIDs = new Set();
  try {
    const { getFormHistory } = await import('./formHistory');
    const hist = await getFormHistory().catch(() => []);
    for (const h of (hist || [])) {
      try {
        const pu = h.meta && h.meta.payload && h.meta.payload.formUUID;
        if (pu) existingUUIDs.add(String(pu));
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore history read errors */ }

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    try {
      // Extra safety: ensure the listed entry actually belongs to the requested year
      // (some list operations may return extra items). If a year filter was supplied
      // skip any entry that does not parse to that year.
      if (year) {
        // attempt to parse YYYY-MM-DD from path or timestamp in filename
        const parseDateFromPath = (p, name) => {
          try {
            if (p) {
              const parts = p.split('/').filter(Boolean);
              for (const seg of parts) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(seg)) return seg;
              }
            }
            if (name) {
              const m = name.match(/[_-](\d{10,13})\.json$/);
              if (m && m[1]) {
                const ts = Number(m[1]);
                if (!Number.isNaN(ts) && ts > 0) {
                  const d = new Date(ts);
                  if (!isNaN(d.getTime())) {
                    const yyyy = d.getUTCFullYear();
                    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(d.getUTCDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                  }
                }
              }
            }
          } catch (err) { /* ignore */ }
          return null;
        };
        const dateStr = parseDateFromPath(e.path_lower || e.path_display || '', e.name || '');
        if (!dateStr || !dateStr.startsWith(String(year))) {
          // skip entries that don't clearly belong to the requested year
          results.push({ entry: e, imported: false, skipped: true, reason: 'year_mismatch' });
          if (typeof onProgress === 'function') {
            try { onProgress({ index: i, total: entries.length, entry: e }); } catch (e) { /* ignore */ }
          }
          continue;
        }
      }
      // Fast skip: if the filename contains a form UUID tag and we already have it locally, skip downloading/importing
      let skipBecauseExists = false;
      try {
        const name = e.name || '';
        const m = name.match(/_id_([A-Za-z0-9_-]+)/);
        if (m && m[1]) {
          if (existingUUIDs.has(m[1])) {
            results.push({ entry: e, imported: false, skipped: true, reason: 'already_exists' });
            if (typeof onProgress === 'function') {
              try { onProgress({ index: i, total: entries.length, entry: e }); } catch (e) { /* ignore */ }
            }
            continue;
          }
        }
      } catch (err) { /* ignore name parse errors */ }

  const payload = await downloadFile(e).catch(err => { throw err; });
      // payload is expected to be { payload, savedAt } or the original wrapped object
      const wrapped = (payload && payload.payload) ? payload : { payload, savedAt: (payload && payload.savedAt) ? payload.savedAt : Date.now() };
      // If the downloaded wrapped payload contains a formUUID that we already have, skip importing
      try {
        const remoteUUID = wrapped && wrapped.payload && wrapped.payload.formUUID;
        if (remoteUUID && existingUUIDs.has(String(remoteUUID))) {
          results.push({ entry: e, imported: false, skipped: true, reason: 'already_exists' });
          if (typeof onProgress === 'function') {
            try { onProgress({ index: i, total: entries.length, entry: e }); } catch (e) { /* ignore */ }
          }
          continue;
        }
      } catch (err) { /* ignore */ }

      // Choose a formId derived from Dropbox file id (if present) or name
      const candidateId = e.id ? `dbx_${e.id.replace(/:/g, '_')}` : `dbx_${Date.now()}_${i}`;
      const imp = await formStorage.importForm(candidateId, wrapped).catch(err => { throw err; });
      // record that we now have this UUID locally so subsequent files in this batch can be deduped
      try {
        const newUuid = wrapped && wrapped.payload && wrapped.payload.formUUID;
        if (newUuid) existingUUIDs.add(String(newUuid));
      } catch (e) { /* ignore */ }

      results.push({ entry: e, imported: true, formId: imp.formId, filePath: imp.filePath });
      // notify caller-provided callback
      if (typeof onProgress === 'function') {
        try { onProgress({ index: i, total: entries.length, entry: e }); } catch (e) { /* ignore progress errors */ }
      }
      // emit structured progress event for any global listeners
      try { _emitProgress({ type: 'restore', index: i, total: entries.length, entry: e }); } catch (e) { /* ignore */ }
    } catch (err) {
      results.push({ entry: e, imported: false, error: (err && err.message) ? err.message : String(err) });
    }
  }

  return { results, nextCursor: listRes.cursor, has_more: listRes.has_more };
}

// Compute a SHA-256 hash for a JSON payload/string. Returns hex string.
export async function computeJsonHash(jsonObj) {
  try {
    const body = (typeof jsonObj === 'string') ? jsonObj : JSON.stringify(jsonObj);
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, body);
  } catch (e) {
    console.warn('drive.computeJsonHash failed', e);
    return null;
  }
}

// Compute a SHA-256 hash for a remote file's content by downloading it.
// Returns hex string or null on error.
export async function computeRemoteFileHash(fileMeta) {
  try {
    if (!fileMeta) return null;
    const txt = await downloadFile(fileMeta).catch(() => null);
    if (txt === null || typeof txt === 'undefined') return null;
    const body = (typeof txt === 'string') ? txt : JSON.stringify(txt);
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, body);
  } catch (e) {
    console.warn('drive.computeRemoteFileHash failed', e);
    return null;
  }
}

// Check whether any file in the given folderPath has identical content to the
// provided local hash. Downloads remote files and compares SHA-256 hashes.
// Returns the matching file metadata if found, otherwise null.
export async function folderHasFileWithHash(folderPath, localHash) {
  try {
    if (!localHash) return null;
    // normalize folderPath
    let path = folderPath || '';
    if (path && !path.startsWith('/')) path = `/${path}`;
    // list files non-recursively in the folder
    const listed = await listFilesInFolder(path === '/' ? '' : path).catch(() => ({ entries: [] }));
    const files = (listed.entries || []).filter(e => e['.tag'] === 'file');
    for (const f of files) {
      try {
        const remoteHash = await computeRemoteFileHash(f).catch(() => null);
        if (!remoteHash) continue;
        if (remoteHash === localHash) return f;
      } catch (e) {
        // ignore and continue
      }
    }
    return null;
  } catch (e) {
    console.warn('drive.folderHasFileWithHash failed', e);
    return null;
  }
}

// Dev-only: print resolved app key and redirectUri on module load to aid debugging on device/emulator
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  (async () => {
    try {
      const info = await getDebugInfo();
      // eslint-disable-next-line no-console
      console.log('DROPBOX DEBUG INFO (dev):', info);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('DROPBOX DEBUG INFO error', e);
    }
  })();
}

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
    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeForm({
        grant_type: 'authorization_code',
        code,
        client_id: appKey,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
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
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  // Prefix files so the app can query its own backups easily across devices
  const safeName = `${BACKUP_PREFIX}${filename}`;
  const dropboxPath = `/${safeName}`;
  const body = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);
  const res = await fetch(CONTENT_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false }),
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dropbox upload failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// Upload JSON into a specific folder (parents array). If parents is provided, include it in metadata.
export async function uploadJsonFileToFolder(filename, jsonObj, parentFolderId) {
  const token = await getAccessToken();
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
  const dropboxPath = `${folderPath}/${safeName}`.replace(/\/+/g, '/').replace(/\\/g, '/');
  const body = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);
  const res = await fetch(CONTENT_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'add', autorename: true, mute: false }),
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dropbox upload failed: ${res.status} ${txt}`);
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

export default {
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
  getUserInfo,
  isConfigured,
  // dev helpers
  importAccessToken,
  revokeAccessToken,
};

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

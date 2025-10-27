// Minimal Google Drive helper using Expo AuthSession and SecureStore.
// NOTE: This is a lightweight scaffold. To make it work you must:
// 1) Install dependencies: expo-auth-session and expo-secure-store
//    expo install expo-auth-session expo-secure-store
// 2) Add your Google OAuth client ID to app config (app.json extra.googleClientId)
// 3) Configure allowed redirect URIs in the Google Console (for expo use the expo proxy or the redirect created by makeRedirectUri)

import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Linking, AppState } from 'react-native';

const TOKEN_KEY = 'drive_access_token';
const TOKEN_EXPIRES_KEY = 'drive_access_token_expires_at';
const USER_INFO_KEY = 'drive_user_info';

// Client IDs should be added to app.json under expo.extra
const extra = (Constants.manifest && Constants.manifest.extra) || (Constants.expoConfig && Constants.expoConfig.extra) || {};
const CLIENT_ID_ANDROID = extra.googleClientIdAndroid || '<SET_GOOGLE_CLIENT_ID_ANDROID>';
const CLIENT_ID_WEB = extra.googleClientIdWeb || '<SET_GOOGLE_CLIENT_ID_WEB>';
const CLIENT_ID_IOS = extra.googleClientIdIos || '<SET_GOOGLE_CLIENT_ID_IOS>';
const CLIENT_ID_INSTALLED = extra.googleClientIdInstalled || '<SET_GOOGLE_CLIENT_ID_INSTALLED>';
// Optional: restrict sign-in to a specific Google Workspace/domain (e.g. 'yourcompany.com')
const ALLOWED_DOMAIN = extra.googleAllowedDomain || null;
const SCOPES = 'openid profile email https://www.googleapis.com/auth/drive.file';

function getRedirectUri({ useProxy = false } = {}) {
  // When useProxy is true (Expo dev via AuthSession proxy) we use the proxy/web redirect.
  // For standalone/native builds use native redirect.
  try {
    const uri = AuthSession.makeRedirectUri(useProxy ? { useProxy: true } : { native: true });
    // Some environments may return a non-string (boolean) from makeRedirectUri;
    // in that case fall back to a sensible native scheme based on app config.
    if (typeof uri === 'string' && uri) return uri;
  } catch (e) {
    // ignore and fallback
  }
  // Fallback: construct a native scheme URI from app.json `scheme` or default
  const scheme = (Constants.manifest && Constants.manifest.scheme) || (Constants.expoConfig && Constants.expoConfig.scheme) || 'checklistapp';
  // Use an explicit native redirect path so it's stable across builds.
  // Use the single-slash form recommended for mobile custom-scheme redirects.
  return `${scheme}:/oauth2redirect`;
}

export async function isConfigured() {
  // configured if any client id has been set to a non-placeholder value
  const any = [CLIENT_ID_ANDROID, CLIENT_ID_WEB, CLIENT_ID_IOS, CLIENT_ID_INSTALLED].find(id => id && !id.startsWith('<SET_'));
  return Boolean(any);
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
      await SecureStore.deleteItemAsync('drive_refresh_token');
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
    const refreshToken = await SecureStore.getItemAsync('drive_refresh_token');
    if (!refreshToken) return null;
    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
    // pick a client id appropriate for the running environment
    const useProxy = Constants.appOwnership === 'expo';
    const clientId = pickClientId({ useProxy });
    const res = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeForm({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId }),
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
    if (refresh_token) await SecureStore.setItemAsync('drive_refresh_token', refresh_token);
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
    await SecureStore.deleteItemAsync('drive_refresh_token');
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
    return true;
  } catch (e) {
    console.warn('drive.signOut failed', e);
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
  const clientId = pickClientId({ useProxy });
  // Debug: log which client ID and redirect URI will be used (helps verify production wiring)
  try {
    const redirectDebug = getRedirectUri({ useProxy });
    // eslint-disable-next-line no-console
    console.log('drive.signInAsync -> useProxy=', useProxy, 'clientId=', clientId, 'redirectUri=', redirectDebug, 'redirectType=', typeof redirectDebug, 'platform=', Platform.OS);
  } catch (e) {
    /* ignore logging errors */
  }
  if (!clientId || clientId.startsWith('<SET_')) throw new Error('Google Client ID not configured (set app.json extra.googleClientId*)');
  const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
  const redirectUri = getRedirectUri({ useProxy });
  // Ensure we have usable endpoints; some environments may return incomplete discovery results.
  const authEndpoint = (discovery && discovery.authorization_endpoint) || 'https://accounts.google.com/o/oauth2/v2/auth';
  const tokenEndpoint = (discovery && discovery.token_endpoint) || 'https://oauth2.googleapis.com/token';
  if (!discovery || !discovery.authorization_endpoint || !discovery.token_endpoint) {
    // Lower verbosity: log instead of warn to avoid noisy warnings in-app.
    console.log('drive: discovery incomplete, falling back to default endpoints', { discovery });
  }

  // Always use the browser PKCE flow (no native Play Services path).

  // generate PKCE verifier & challenge
  const codeVerifier = generateCodeVerifier(128);
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  const codeChallenge = base64UrlEncode(hashed);

  const authUrl = `${authEndpoint}` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256` +
    `&access_type=offline&prompt=consent&include_granted_scopes=true` +
    (ALLOWED_DOMAIN ? `&hd=${encodeURIComponent(ALLOWED_DOMAIN)}` : '');

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

    // Exchange authorization code for tokens
    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeForm({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
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
      await SecureStore.setItemAsync('drive_refresh_token', refresh_token);
      // eslint-disable-next-line no-console
      console.log('drive: refresh_token received and stored');
    } else {
      // If Google didn't return a refresh_token it's often because the user previously
      // granted access and the consent screen did not return a refresh token again.
      // We keep prompt=consent + access_type=offline in the auth URL to try to force
      // a refresh token on demand; log a helpful message for debugging.
      // eslint-disable-next-line no-console
      console.warn('drive: no refresh_token returned from token exchange — existing grants may suppress refresh_token. To force a refresh token, re-run sign-in with prompt=consent and ensure client is configured to allow offline access.');
    }
    await SecureStore.setItemAsync(TOKEN_EXPIRES_KEY, String(expiresAt));
    // Fetch basic userinfo and persist it for UI
    try {
      const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${access_token}` } });
      if (uiRes.ok) {
        const ui = await uiRes.json();
        // If ALLOWED_DOMAIN is set, enforce membership
        if (ALLOWED_DOMAIN) {
          const email = ui.email || '';
          const hd = ui.hd || (email.split('@')[1] || '');
          if (!hd || String(hd).toLowerCase() !== String(ALLOWED_DOMAIN).toLowerCase()) {
            // clear any tokens we stored
            await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
            await SecureStore.deleteItemAsync(TOKEN_EXPIRES_KEY).catch(() => {});
            await SecureStore.deleteItemAsync('drive_refresh_token').catch(() => {});
            // Do not persist user info; reject sign-in
            throw new Error('auth_not_allowed: account not in allowed domain');
          }
        }
        await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(ui));
      }
    } catch (e) {
      console.warn('drive: failed to fetch userinfo', e);
      // If enforcement failed we want to forward the error to callers
      if (e && String(e).startsWith('Error: auth_not_allowed')) throw e;
    }
    return { access_token, expiresAt, refresh_token };
  } catch (e) {
    console.warn('drive.signInAsync failed', e);
    throw e;
  }
}

export async function getUserInfo() {
  try {
    const raw = await SecureStore.getItemAsync(USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('drive.getUserInfo error', e);
    return null;
  }
}

// Ensure we have a refresh token for long-lived offline access. If none is stored
// this helper will run the sign-in flow (with prompt=consent already present) to
// try to obtain one. Returns true if a refresh token is present after running.
export async function ensureRefreshToken(options = {}) {
  try {
    const rt = await SecureStore.getItemAsync('drive_refresh_token');
    if (rt) return true;
    // Trigger sign-in flow which already includes prompt=consent and access_type=offline.
    // Force external browser if running in environments that block in-app flows.
    await signInAsync({ ...options, forceExternalOverride: options.forceExternalOverride || false });
    const newRt = await SecureStore.getItemAsync('drive_refresh_token');
    return Boolean(newRt);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('drive.ensureRefreshToken failed', e);
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

function pickClientId({ useProxy = false } = {}) {
  // Prefer an installed/native client id if configured (this supports custom-scheme
  // redirect URIs for private/mobile apps). Otherwise fall back to the web client id
  // for PKCE/browser flows.
  // If running through the Expo proxy (dev) prefer the web client id so redirects
  // match the proxy redirect and avoid server-side client restrictions.
  if (useProxy && CLIENT_ID_WEB && !CLIENT_ID_WEB.startsWith('<SET_')) return CLIENT_ID_WEB;
  if (CLIENT_ID_INSTALLED && !CLIENT_ID_INSTALLED.startsWith('<SET_')) return CLIENT_ID_INSTALLED;
  return CLIENT_ID_WEB;
}

// Upload a JSON payload as a file to the user's Drive using multipart upload.
export async function uploadJsonFile(filename, jsonObj) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  // Prefix files so the app can query its own backups easily across devices
  const safeName = `checklistapp_${filename}`;
  const metadata = { name: safeName, mimeType: 'application/json' };
  const boundary = '-------driveupload' + Date.now();
  const bodyParts = [];
  bodyParts.push(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`);
  bodyParts.push(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(jsonObj)}\r\n`);
  bodyParts.push(`--${boundary}--`);
  const body = bodyParts.join('');
  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// Upload JSON into a specific folder (parents array). If parents is provided, include it in metadata.
export async function uploadJsonFileToFolder(filename, jsonObj, parentFolderId) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const safeName = `checklistapp_${filename}`;
  const metadata = { name: safeName, mimeType: 'application/json' };
  if (parentFolderId) metadata.parents = [parentFolderId];
  const boundary = '-------driveupload' + Date.now();
  const bodyParts = [];
  bodyParts.push(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`);
  bodyParts.push(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(jsonObj)}\r\n`);
  bodyParts.push(`--${boundary}--`);
  const body = bodyParts.join('');
  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive upload failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// Find a folder by name (returns first match) or null
export async function findFolderByName(folderName) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,modifiedTime)&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Drive folder list failed');
  const data = await res.json();
  if (data.files && data.files.length) return data.files[0];
  return null;
}

// Create a folder at root with the given name
export async function createFolder(folderName) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const metadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create folder failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// Ensure a named folder exists (returns folder object)
export async function ensureFolder(folderName) {
  const found = await findFolderByName(folderName).catch(() => null);
  if (found) return found;
  return createFolder(folderName);
}

// List files inside a folder (optionally restrict by additional query fragment)
export async function listFilesInFolder(folderId, extraQuery = "") {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  let q = `'${folderId}' in parents and trashed=false`;
  if (extraQuery && extraQuery.trim()) q += ` and (${extraQuery})`;
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,modifiedTime,owners)&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Drive list in folder failed');
  return res.json();
}

export async function downloadFile(fileId) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Drive download failed: ${res.status} ${txt}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // return raw text if not JSON
    return text;
  }
}

export async function listFilesAsync(query = '') {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in');
  const q = encodeURIComponent(query);
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,modifiedTime,owners)&q=${q}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Drive list failed');
  return res.json();
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
};

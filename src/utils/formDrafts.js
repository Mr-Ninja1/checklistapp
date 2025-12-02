import * as FileSystem from 'expo-file-system/legacy';
import formStorage from './formStorage';

const DRAFTS_DIR = FileSystem.documentDirectory + 'forms/drafts/';

async function ensureDir() {
  try {
    await FileSystem.makeDirectoryAsync(DRAFTS_DIR, { intermediates: true });
  } catch (e) {
    // ignore
  }
}

async function readNativeDraft(key) {
  try {
    const path = DRAFTS_DIR + key + '.json';
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const txt = await FileSystem.readAsStringAsync(path);
    return JSON.parse(txt || 'null');
  } catch (e) {
    console.warn('readNativeDraft failed', e);
    return null;
  }
}

async function writeNativeDraft(key, obj) {
  try {
    await ensureDir();
    const path = DRAFTS_DIR + key + '.json';
    await FileSystem.writeAsStringAsync(path, JSON.stringify(obj));
  } catch (e) {
    console.warn('writeNativeDraft failed', e);
  }
}

async function removeNativeDraft(key) {
  try {
    const path = DRAFTS_DIR + key + '.json';
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) await FileSystem.deleteAsync(path);
  } catch (e) {
    // ignore
  }
}

export async function getDraft(key) {
  // First try legacy draft location in localStorage (web)
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    try {
      const raw = globalThis.localStorage.getItem(`draft:${key}`);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    // Next try the unified form storage location used by formStorage
    try {
      const raw2 = globalThis.localStorage.getItem(`forms:${key}`);
      if (raw2) {
        const wrapped = JSON.parse(raw2);
        return wrapped && wrapped.payload ? wrapped.payload : wrapped;
      }
    } catch (e) { /* ignore */ }
  }

  // On native environments, try the draft file first
  const native = await readNativeDraft(key);
  if (native) return native;

  // Finally, try the unified formStorage location (this returns wrapped { payload, savedAt })
  try {
    const wrapped = await formStorage.loadForm(key).catch(() => null);
    if (wrapped && wrapped.payload) return wrapped.payload;
  } catch (e) { /* ignore */ }
  return null;
}

export async function setDraft(key, obj) {
  // On web, persist both the legacy draft key and the unified forms key
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    try {
      globalThis.localStorage.setItem(`draft:${key}`, JSON.stringify(obj));
      try {
        const wrapped = { payload: obj, savedAt: Date.now() };
        globalThis.localStorage.setItem(`forms:${key}`, JSON.stringify(wrapped));
      } catch (e) { /* ignore secondary write */ }
      return true;
    } catch (e) { return false; }
  }

  // On native, write to the draft directory (maintain backward compatibility)
  await writeNativeDraft(key, obj);
  return true;
}

export async function removeDraft(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.removeItem(`draft:${key}`); return true; } catch (e) { return false; }
  }
  await removeNativeDraft(key);
  return true;
}

export default { getDraft, setDraft, removeDraft };

import * as FileSystem from 'expo-file-system/legacy';

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
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(window.localStorage.getItem(`draft:${key}`) || 'null');
    } catch (e) { return null; }
  }
  return await readNativeDraft(key);
}

export async function setDraft(key, obj) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`draft:${key}`, JSON.stringify(obj));
      return true;
    } catch (e) { return false; }
  }
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

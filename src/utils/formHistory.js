import * as FileSystem from 'expo-file-system/legacy';

const HISTORY_PATH = FileSystem.documentDirectory + 'forms/history.json';

async function readNativeHistory() {
  try {
    const info = await FileSystem.getInfoAsync(HISTORY_PATH);
    if (!info.exists) return [];
    const txt = await FileSystem.readAsStringAsync(HISTORY_PATH);
    try {
      return JSON.parse(txt || '[]');
    } catch (parseErr) {
      console.warn('readNativeHistory: failed to parse history JSON, raw:', txt, parseErr);
      return [];
    }
  } catch (e) {
    console.warn('readNativeHistory failed', e);
    return [];
  }
}

async function writeNativeHistory(list) {
  try {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'forms/', { intermediates: true }).catch(() => {});
    // Some versions of expo-file-system legacy may not expose EncodingType; write without encoding option
    await FileSystem.writeAsStringAsync(HISTORY_PATH, JSON.stringify(list));
  } catch (e) {
    console.warn('writeNativeHistory failed', e && e.message ? e.message : e);
  }
}

export async function getFormHistory() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return JSON.parse(window.localStorage.getItem('formHistory') || '[]');
    } catch (e) {
      return [];
    }
  }
  return await readNativeHistory();
}

export async function addFormHistory(entry) {
  if (!entry || typeof entry !== 'object') return;

  // normalize entry fields
  const normalized = {
    title: entry.title || entry.pdfPath?.split('/')?.pop() || 'Saved Form',
    date: entry.date || null,
    shift: entry.shift || null,
    location: entry.location || entry.loc || null,
    handlers: entry.handlers || null,
    pdfPath: entry.pdfPath || null,
    savedAt: entry.savedAt || Date.now(),
    // allow callers to store arbitrary metadata too
    meta: entry.meta || null,
  };

  // limit history size
  const MAX_HISTORY = 200;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = JSON.parse(window.localStorage.getItem('formHistory') || '[]');

      // dedupe: if same pdfPath or same savedAt exists, replace
      const idx = list.findIndex(f => (f.pdfPath && f.pdfPath === normalized.pdfPath) || (f.savedAt && f.savedAt === normalized.savedAt));
      if (idx >= 0) list.splice(idx, 1, normalized);
      else list.push(normalized);

      // cap length
      while (list.length > MAX_HISTORY) list.shift();

      window.localStorage.setItem('formHistory', JSON.stringify(list));
      return list;
    } catch (e) {
      console.warn('addFormHistory web failed', e);
      return;
    }
  }

  // native
  try {
    const list = await readNativeHistory();
    const idx = list.findIndex(f => (f.pdfPath && f.pdfPath === normalized.pdfPath) || (f.savedAt && f.savedAt === normalized.savedAt));
    if (idx >= 0) list.splice(idx, 1, normalized);
    else list.push(normalized);

    while (list.length > MAX_HISTORY) list.shift();

    await writeNativeHistory(list);
    return list;
  } catch (e) {
    console.warn('addFormHistory native failed', e);
  }
}

export async function removeFormHistory(matchFn) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      const filtered = list.filter(f => !matchFn(f));
      window.localStorage.setItem('formHistory', JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.warn('removeFormHistory web failed', e);
      return [];
    }
  }
  try {
    const list = await readNativeHistory();
    const filtered = list.filter(f => !matchFn(f));
    await writeNativeHistory(filtered);
    return filtered;
  } catch (e) {
    console.warn('removeFormHistory native failed', e);
    return [];
  }
}

export async function updateFormHistory(matchFn, updater) {
  // applies updater(item) => newItem for matching entries
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      const newList = list.map(item => (matchFn(item) ? updater(item) : item));
      window.localStorage.setItem('formHistory', JSON.stringify(newList));
      return newList;
    } catch (e) {
      console.warn('updateFormHistory web failed', e);
      return [];
    }
  }
  try {
    const list = await readNativeHistory();
    const newList = list.map(item => (matchFn(item) ? updater(item) : item));
    await writeNativeHistory(newList);
    return newList;
  } catch (e) {
    console.warn('updateFormHistory native failed', e);
    return [];
  }
}

export async function clearFormHistory() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('formHistory');
      return [];
    } catch (e) {
      console.warn('clearFormHistory web failed', e);
      return [];
    }
  }
  try {
    await writeNativeHistory([]);
    return [];
  } catch (e) {
    console.warn('clearFormHistory native failed', e);
    return [];
  }
}

export default {
  getFormHistory,
  addFormHistory,
  removeFormHistory,
};

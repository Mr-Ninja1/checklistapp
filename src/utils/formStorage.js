import * as FileSystem from 'expo-file-system/legacy';
import { addFormHistory } from './formHistory';

const BASE_DIR = FileSystem.documentDirectory + 'forms/';

async function saveForm(formId, payload) {
  // payload: object (full saved form payload)
  const dir = BASE_DIR + `${formId}/`;
  const filePath = dir + 'payload.json';
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const wrapped = { payload, savedAt: Date.now() };
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped));

    // Register a lightweight history entry so the saved form appears in the saved list
    // Register a lightweight history entry so the saved form appears in the saved list.
    // Make history registration fire-and-forget so slow history writes don't block the
    // primary save operation (this avoids long submit hangs when history or I/O is slow).
    try {
      const historyEntry = { title: payload.title || payload.formType || 'Saved Form', date: payload.date || null, shift: payload.shift || null, savedAt: Date.now(), meta: { formId, filePath, payload } };
      // don't await - run in background and log any failures
      addFormHistory(historyEntry).catch(e => {
        console.warn('formStorage: addFormHistory failed', e);
      });
    } catch (e) {
      // In the unlikely event constructing the history entry throws, log and continue
      console.warn('formStorage: failed to schedule addFormHistory', e);
    }

    return { filePath };
  } catch (err) {
    console.error('formStorage.saveForm error', err);
    throw err;
  }
}

// Save a draft without adding an entry to the global history index.
// Used for silent autosave so the Saved Forms modal/list isn't updated on every keystroke.
async function saveDraft(formId, payload) {
  const dir = BASE_DIR + `${formId}/`;
  const filePath = dir + 'payload.json';
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const wrapped = { payload, savedAt: Date.now() };
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped));
    return { filePath };
  } catch (err) {
    console.error('formStorage.saveDraft error', err);
    throw err;
  }
}

async function loadForm(formId) {
  const filePath = BASE_DIR + `${formId}/payload.json`;
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(raw);
  } catch (err) {
    console.error('formStorage.loadForm error', err);
    throw err;
  }
}

async function listForms() {
  try {
    // rely on formHistory for a lightweight index (keeps listing fast)
    // formHistory maintains a list at forms/history.json
    // We'll attempt to load that list via addFormHistory's getter
    // but since formHistory exposes getFormHistory, import it here dynamically to avoid cycles
    const { getFormHistory } = await import('./formHistory');
    const list = await getFormHistory();
    // Normalize so each entry includes formId/filePath if available in meta
    return list.map(item => ({ id: item.meta?.formId || null, value: item }));
  } catch (err) {
    console.error('formStorage.listForms error', err);
    throw err;
  }
}

async function deleteForm(formId) {
  const dir = BASE_DIR + `${formId}/`;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
    // Also remove from history (match by meta.formId)
    const { removeFormHistory } = await import('./formHistory');
    await removeFormHistory(f => f.meta && f.meta.formId === formId);
    return true;
  } catch (err) {
    console.error('formStorage.deleteForm error', err);
    throw err;
  }
}

export default {
  saveForm,
  saveDraft,
  loadForm,
  listForms,
  deleteForm,
};

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
    try {
      // include a small snapshot of the payload inside the history meta so the Saved Forms
      // screen can render the presentational quickly even if the file can't be loaded later.
      await addFormHistory({ title: payload.title || payload.formType || 'Saved Form', date: payload.date || null, shift: payload.shift || null, savedAt: Date.now(), meta: { formId, filePath, payload } });
    } catch (e) {
      console.warn('formStorage: addFormHistory failed', e);
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

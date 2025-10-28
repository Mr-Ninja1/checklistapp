import * as FileSystem from 'expo-file-system/legacy';
import { addFormHistory } from './formHistory';

const BASE_DIR = FileSystem.documentDirectory + 'forms/';

async function saveForm(formId, payload) {
  // payload: object (full saved form payload)
  const dir = BASE_DIR + `${formId}/`;
  const filePath = dir + 'payload.json';
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    // Ensure the saved payload contains a stable unique identifier so uploads
    // and restores can dedupe by ID without downloading whole content.
    try {
      if (payload && !payload.formUUID) {
        payload.formUUID = `f_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      }
    } catch (e) { /* ignore */ }
    const wrapped = { payload, savedAt: Date.now() };
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped));

    // Register a lightweight history entry so the saved form appears in the saved list
    // Register a lightweight history entry so the saved form appears in the saved list.
    // Make history registration fire-and-forget so slow history writes don't block the
    // primary save operation (this avoids long submit hangs when history or I/O is slow).
    // Build historyEntry in an outer scope so it can be referenced later by
    // the auto-upload task. Previously this was declared inside a nested try
    // block which caused a ReferenceError when referenced below.
    let historyEntry = null;
    try {
  historyEntry = { title: payload.title || payload.formType || 'Saved Form', date: payload.date || null, shift: payload.shift || null, savedAt: Date.now(), meta: { formId, filePath, payload } };
      // Await history registration so callers that wait for the save will see the
      // new entry present in the history index immediately. Failures are logged
      // but won't prevent the save from returning.
      try {
        await addFormHistory(historyEntry);
      } catch (e) {
        console.warn('formStorage: addFormHistory failed', e);
      }
    } catch (e) {
      // In the unlikely event constructing the history entry throws, log and continue
      console.warn('formStorage: failed to schedule addFormHistory', e);
    }

    // Fire-and-forget: attempt to upload this saved form to Dropbox if configured.
    // If upload fails (no network or not signed in), enqueue the wrapped payload
    // so it will be uploaded later when connectivity and credentials are available.
    (async () => {
      try {
        const uploadQueue = await import('./uploadQueue');
        const drive = await import('./drive');
        if (!drive || typeof drive.isConfigured !== 'function') return;
        const configured = await drive.isConfigured().catch(() => false);
        if (!configured) return;
        const token = await drive.getAccessToken().catch(() => null);
        // Build a simple entry for the queue
        const entry = { title: payload && (payload.title || payload.formType) ? String((payload.title || payload.formType)) : 'form', payload, savedAt: historyEntry.savedAt || Date.now() };
        if (!token) {
          // not signed in: persist for later
          try { await uploadQueue.enqueue(entry); } catch (e) { /* ignore */ }
          return;
        }

        // Try immediate upload; if it fails, enqueue
        try {
          const dt = entry.savedAt ? new Date(Number(entry.savedAt)) : new Date();
          const dateFolder = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          const safeTitle = entry.title ? entry.title.replace(/[^a-z0-9-_\. ]/gi, '_') : 'form';
          const uuidTag = (payload && payload.formUUID) ? `_id_${payload.formUUID}` : '';
          const filename = `checklistapp_${safeTitle}_${entry.savedAt || Date.now()}${uuidTag}.json`;
          try {
            await drive.ensureFolderPath(dateFolder).catch(() => {});
            const res = await drive.uploadJsonFileToFolder(filename, { savedAt: entry.savedAt || Date.now(), payload }, `/${dateFolder}`).catch(err => { throw err; });
            if (res && res.skipped) {
              // skip
            }
            return;
          } catch (err) {
            // fallback to root upload
            try { await drive.uploadJsonFile(filename, { savedAt: entry.savedAt || Date.now(), payload }).catch(err => { throw err; }); return; } catch (err2) { /* fall through to enqueue */ }
          }
        } catch (e) {
          // If immediate upload fails, persist to queue
          try { await uploadQueue.enqueue(entry); } catch (ee) { /* ignore */ }
        }
      } catch (e) {
        // Non-fatal: log and continue
        console.warn('formStorage: auto drive upload failed', e);
      }
    })();

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
    try {
      if (payload && !payload.formUUID) {
        payload.formUUID = `f_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      }
    } catch (e) { /* ignore */ }
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

// Import a form that was downloaded from remote backup (Dropbox). This writes the
// wrapped payload ({ payload, savedAt }) to disk and registers a history entry but
// does NOT trigger the auto-upload flow (important to avoid re-uploading restored items).
// Returns { filePath, formId }
async function importForm(formId, wrappedPayload = null) {
  try {
    // If the caller didn't provide a formId, generate a stable one based on timestamp
    // and a small random suffix to avoid collisions.
    const id = formId || `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dir = BASE_DIR + `${id}/`;
    const filePath = dir + 'payload.json';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

    // wrappedPayload should be { payload, savedAt }
    const wrapped = wrappedPayload || { payload: null, savedAt: Date.now() };
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(wrapped));

    // Add a history entry so the saved form appears in the UI.
    try {
      // When importing we want to preserve the original savedAt timestamp from
      // the remote file so history grouping remains accurate. addFormHistory
      // supports callers setting `_preserveSavedAt: true` to honor the provided
      // savedAt instead of using the current time.
      const historyEntry = {
        title: (wrapped.payload && (wrapped.payload.title || wrapped.payload.formType)) ? String((wrapped.payload.title || wrapped.payload.formType)) : 'Imported Form',
        date: wrapped.payload && wrapped.payload.date ? wrapped.payload.date : null,
        shift: wrapped.payload && wrapped.payload.shift ? wrapped.payload.shift : null,
        savedAt: wrapped.savedAt || Date.now(),
        _preserveSavedAt: true,
        meta: { formId: id, filePath, payload: wrapped.payload },
      };
      const { addFormHistory } = await import('./formHistory');
      await addFormHistory(historyEntry);
    } catch (e) {
      console.warn('formStorage.importForm: addFormHistory failed', e);
    }

    return { filePath, formId: id };
  } catch (err) {
    console.error('formStorage.importForm error', err);
    throw err;
  }
}

export default {
  saveForm,
  saveDraft,
  loadForm,
  listForms,
  deleteForm,
  importForm,
};

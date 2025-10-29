import * as FileSystem from 'expo-file-system/legacy';
import * as drive from './drive';

// In-memory processing lock to prevent concurrent queue drains which can
// cause race conditions when reading/writing the on-disk queue file.
let _processing = false;

const QUEUE_PATH = FileSystem.documentDirectory + 'uploadQueue.json';
const FAILED_PATH = FileSystem.documentDirectory + 'failedUploads.json';

// Subscribers to permanent-failure notifications. UI code can register a
// listener to show an in-app alert when entries are moved to permanent failure.
const _permanentFailureListeners = new Set();

async function readFailedUploads() {
  try {
    const info = await FileSystem.getInfoAsync(FAILED_PATH);
    if (!info.exists) return [];
    const txt = await FileSystem.readAsStringAsync(FAILED_PATH);
    return JSON.parse(txt || '[]');
  } catch (e) {
    console.warn('uploadQueue: readFailedUploads failed', e);
    return [];
  }
}

async function writeFailedUploads(list) {
  try {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true }).catch(() => {});
    await FileSystem.writeAsStringAsync(FAILED_PATH, JSON.stringify(list || []));
  } catch (e) {
    console.warn('uploadQueue: writeFailedUploads failed', e);
  }
}

export async function getFailedUploads() {
  return await readFailedUploads();
}

export async function clearFailedUploads() {
  try {
    await writeFailedUploads([]);
    return true;
  } catch (e) { return false; }
}

export function onPermanentFailure(fn) {
  try { _permanentFailureListeners.add(fn); } catch (e) { /* ignore */ }
}

export function offPermanentFailure(fn) {
  try { _permanentFailureListeners.delete(fn); } catch (e) { /* ignore */ }
}

async function readQueue() {
  try {
    const info = await FileSystem.getInfoAsync(QUEUE_PATH);
    if (!info.exists) return [];
    const txt = await FileSystem.readAsStringAsync(QUEUE_PATH);
    return JSON.parse(txt || '[]');
  } catch (e) {
    console.warn('uploadQueue: readQueue failed', e);
    return [];
  }
}

async function writeQueue(list) {
  try {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true }).catch(() => {});
    await FileSystem.writeAsStringAsync(QUEUE_PATH, JSON.stringify(list || []));
  } catch (e) {
    console.warn('uploadQueue: writeQueue failed', e);
  }
}

// Enqueue a wrapped entry: { title, payload, savedAt, formUUID }
export async function enqueue(entry) {
  try {
    const q = await readQueue();
    // Ensure entry shape and defaults
    if (!entry) entry = {};
    if (!entry.payload) entry.payload = {};
    if (!entry.savedAt) entry.savedAt = entry.savedAt || Date.now();
    if (!entry.enqueuedAt) entry.enqueuedAt = Date.now();
    if (typeof entry.attempts === 'undefined') entry.attempts = 0;
    // Ensure a persistent identifier exists on the payload so deduping by UUID works
    try {
      if (!entry.payload.formUUID) {
        entry.payload.formUUID = `q_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      }
    } catch (e) { /* ignore */ }
    // Defensive dedupe: if the payload contains a stable formUUID, avoid
    // enqueueing a duplicate entry with the same formUUID (common when UI
    // retries the save). This keeps the queue compact and avoids repeated
    // upload attempts for the same saved form.
    try {
      const incomingUuid = entry && entry.payload && entry.payload.formUUID;
      if (incomingUuid) {
        const exists = q.some(item => item && item.payload && item.payload.formUUID && String(item.payload.formUUID) === String(incomingUuid));
        if (exists) return true;
      }
    } catch (e) { /* ignore dedupe errors */ }
    q.push(entry);
    await writeQueue(q);
    return true;
  } catch (e) {
    console.warn('uploadQueue.enqueue failed', e);
    return false;
  }
}

// Try to upload a single queue entry. Returns true if uploaded or skipped, false on failure.
async function tryUploadEntry(entry) {
  try {
    // Build safe filename and target dateFolder
    const safeTitle = (entry.title) ? String(entry.title).replace(/[^a-z0-9-_\. ]/gi, '_') : 'form';
    const uuidTag = (entry.payload && entry.payload.formUUID) ? `_id_${entry.payload.formUUID}` : '';
    const filename = `checklistapp_${safeTitle}_${entry.savedAt || Date.now()}${uuidTag}.json`;
    const dt = entry.savedAt ? new Date(Number(entry.savedAt)) : new Date();
    const dateFolder = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const targetPath = `/${dateFolder}`;

    // Attempt upload
    try {
      await drive.ensureFolderPath(dateFolder).catch(() => {});
      const res = await drive.uploadJsonFileToFolder(filename, { savedAt: entry.savedAt || Date.now(), payload: entry.payload }, targetPath).catch(err => { throw err; });
      // res may be { skipped: true } or metadata
      return true;
    } catch (err) {
      // fallback to root
      try {
        const res2 = await drive.uploadJsonFile(filename, { savedAt: entry.savedAt || Date.now(), payload: entry.payload });
        return true;
      } catch (err2) {
        // upload failed
        return false;
      }
    }
  } catch (e) {
    console.warn('uploadQueue.tryUploadEntry failed', e);
    return false;
  }
}

// Process the queue: attempt to upload each entry sequentially. Remove entries that succeed.
export async function processQueue() {
  try {
    // Prevent concurrent drains
    if (_processing) return { processed: 0, remaining: (await readQueue()).length };
    _processing = true;
    const q = await readQueue();
    if (!q || q.length === 0) {
      _processing = false;
      return { processed: 0, remaining: 0 };
    }
    const remaining = [];
    const MAX_ATTEMPTS = 10;
    const BASE_DELAY_MS = 60 * 1000; // 1 minute base for backoff
    for (const entry of q) {
      try {
        // Respect scheduled nextAttemptAt (exponential backoff). If the
        // scheduled time is in the future, skip this entry for now and keep it.
        try {
          if (entry.nextAttemptAt && Number(entry.nextAttemptAt) > Date.now()) {
            remaining.push(entry);
            continue;
          }
        } catch (e) { /* ignore malformed field */ }

        // Attempt upload. If it fails, increment attempts and keep for later retry.
        const ok = await tryUploadEntry(entry);
        if (!ok) {
          entry.attempts = (entry.attempts || 0) + 1;
          entry.lastAttempt = Date.now();
          // compute exponential backoff delay (capped to 24 hours)
          const delay = Math.min(24 * 3600 * 1000, BASE_DELAY_MS * Math.pow(2, Math.max(0, entry.attempts - 1)));
          entry.nextAttemptAt = Date.now() + delay;
          if (entry.attempts >= MAX_ATTEMPTS) {
            console.warn('uploadQueue: dropping entry after max attempts', { title: entry.title, attempts: entry.attempts });
            // Persist the failed entry for UI inspection and notify listeners
            try {
              const failed = await readFailedUploads();
              failed.push({ entry, droppedAt: Date.now(), reason: 'max_attempts' });
              await writeFailedUploads(failed);
              for (const fn of _permanentFailureListeners) {
                try { fn({ entry, reason: 'max_attempts' }); } catch (e) { /* ignore listener errors */ }
              }
            } catch (e) { /* ignore failed write */ }
            // drop (do not re-enqueue)
          } else {
            remaining.push(entry);
          }
        }
      } catch (e) {
        try {
          entry.attempts = (entry.attempts || 0) + 1;
          entry.lastAttempt = Date.now();
          const delay = Math.min(24 * 3600 * 1000, BASE_DELAY_MS * Math.pow(2, Math.max(0, entry.attempts - 1)));
          entry.nextAttemptAt = Date.now() + delay;
          if (entry.attempts < (typeof MAX_ATTEMPTS !== 'undefined' ? MAX_ATTEMPTS : 10)) remaining.push(entry);
          else {
            try {
              const failed = await readFailedUploads();
              failed.push({ entry, droppedAt: Date.now(), reason: 'error_max_attempts' });
              await writeFailedUploads(failed);
              for (const fn of _permanentFailureListeners) {
                try { fn({ entry, reason: 'error_max_attempts' }); } catch (e) { /* ignore */ }
              }
            } catch (ee) { /* ignore */ }
            console.warn('uploadQueue: dropping entry after error and max attempts', { title: entry && entry.title });
          }
        } catch (ee) {
          remaining.push(entry);
        }
      }
    }
    await writeQueue(remaining);
    return { processed: q.length - remaining.length, remaining: remaining.length };
  } catch (e) {
    console.warn('uploadQueue.processQueue failed', e);
    return { processed: 0, remaining: 0 };
  } finally {
    _processing = false;
  }
}

// Start a simple auto-processor that callers can call once (e.g., app mount).
export function startAutoUploader(appStateEmitter) {
  // appStateEmitter should be the AppState module or similar with addEventListener
  try {
    // run an initial drain
    processQueue().catch(() => {});
    if (appStateEmitter && typeof appStateEmitter.addEventListener === 'function') {
      try {
        // Register for AppState changes (when app becomes active, attempt drain)
        appStateEmitter.addEventListener('change', (state) => {
          if (state === 'active') processQueue().catch(() => {});
        });
      } catch (e) {
        // Some RN runtimes return a subscription object; tolerate both shapes
        try {
          const sub = appStateEmitter.addEventListener('change', (state) => {
            if (state === 'active') processQueue().catch(() => {});
          });
          // no further action; we intentionally do not remove listener for app lifetime
        } catch (e2) { /* ignore */ }
      }
    }
    // Periodic fallback: attempt to drain every 5 minutes in case AppState events
    // are missed or the app remains active for long periods. This is lightweight
    // and helps recover from transient network issues.
    try {
      setInterval(() => {
        processQueue().catch(() => {});
      }, 5 * 60 * 1000);
    } catch (e) { /* ignore timers in restricted runtimes */ }
  } catch (e) { /* ignore */ }
}

export default {
  enqueue,
  processQueue,
  startAutoUploader,
  getFailedUploads,
  clearFailedUploads,
  onPermanentFailure,
  offPermanentFailure,
};

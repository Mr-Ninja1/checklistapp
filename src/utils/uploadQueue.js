import * as FileSystem from 'expo-file-system/legacy';
import * as drive from './drive';

// In-memory processing lock to prevent concurrent queue drains which can
// cause race conditions when reading/writing the on-disk queue file.
let _processing = false;

const QUEUE_PATH = FileSystem.documentDirectory + 'uploadQueue.json';
const FAILED_PATH = FileSystem.documentDirectory + 'failedUploads.json';
const UPLOADED_PATH = FileSystem.documentDirectory + 'uploaded.json';

// Internet reachability probe configuration. Uses a lightweight 204 endpoint
// which returns quickly on successful internet access. These values can be
// tuned if desired or moved to an app config later.
const PROBE_URL = 'https://clients3.google.com/generate_204';
const PROBE_TIMEOUT_MS = 3000; // abort probe after 3s
const PROBE_INTERVAL_MS = 10 * 1000; // probe every 10s when falling back

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

async function readUploaded() {
  try {
    const info = await FileSystem.getInfoAsync(UPLOADED_PATH);
    if (!info.exists) return [];
    const txt = await FileSystem.readAsStringAsync(UPLOADED_PATH);
    return JSON.parse(txt || '[]');
  } catch (e) {
    console.warn('uploadQueue: readUploaded failed', e);
    return [];
  }
}

async function writeUploaded(list) {
  try {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true }).catch(() => {});
    await FileSystem.writeAsStringAsync(UPLOADED_PATH, JSON.stringify(list || []));
  } catch (e) {
    console.warn('uploadQueue: writeUploaded failed', e);
  }
}

export async function markUploaded(formUUID) {
  try {
    if (!formUUID) return false;
    const list = await readUploaded();
    if (list.some(u => String(u) === String(formUUID))) return true;
    list.push(String(formUUID));
    await writeUploaded(list);
    return true;
  } catch (e) {
    console.warn('uploadQueue.markUploaded failed', e);
    return false;
  }
}

// Perform a lightweight HTTP probe to determine if the device has real
// internet access. Returns a boolean. This is a safer check than relying
// on NetInfo.isConnected which only implies a network (e.g., Wi-Fi) but not
// necessarily internet access.
export async function httpProbe(timeoutMs = PROBE_TIMEOUT_MS, url = PROBE_URL) {
  try {
    // Abortable fetch to bound time spent waiting
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, { method: 'GET', cache: 'no-cache', signal: controller.signal });
    clearTimeout(id);
    // The generate_204 endpoint returns 204 on success. Treat 2xx as success.
    const ok = !!(resp && (resp.status === 204 || (resp.status >= 200 && resp.status < 300)));
    try { if (ok) console.log('uploadQueue.httpProbe -> internet reachable'); } catch (e) {}
    return ok;
  } catch (e) {
    return false;
  }
}

async function isUploaded(formUUID) {
  try {
    if (!formUUID) return false;
    const list = await readUploaded();
    return list.some(u => String(u) === String(formUUID));
  } catch (e) {
    return false;
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

// Remove any queued entries that reference the given payload.formUUID.
// Returns the number of entries removed.
export async function removeByFormUUID(formUUID) {
  try {
    if (!formUUID) return 0;
    const q = await readQueue();
    const before = q.length;
    const filtered = q.filter(item => !(item && item.payload && String(item.payload.formUUID) === String(formUUID)));
    if (filtered.length !== before) await writeQueue(filtered);
    return before - filtered.length;
  } catch (e) {
    console.warn('uploadQueue.removeByFormUUID failed', e);
    return 0;
  }
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
    try { console.log('uploadQueue.enqueue -> enqueued', entry && entry.payload && entry.payload.formUUID); } catch (e) {}
      // Attempt to process the queue immediately so newly-enqueued items upload
      // as soon as possible (processQueue is concurrency-safe).
      try { processQueue().catch(() => {}); } catch (e) { /* ignore */ }
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
        // If this formUUID was already uploaded by an immediate save elsewhere
        // (race conditions can cause the queued entry to remain), skip uploading.
        try {
          const maybeUUID = entry && entry.payload && entry.payload.formUUID;
          if (maybeUUID && await isUploaded(maybeUUID)) return true;
        } catch (e) { /* ignore uploaded-check errors */ }
      await drive.ensureFolderPath(dateFolder).catch(() => {});
      const res = await drive.uploadJsonFileToFolder(filename, { savedAt: entry.savedAt || Date.now(), payload: entry.payload }, targetPath).catch(err => { throw err; });
      // res may be { skipped: true } or metadata
      // If upload succeeded, mark the formUUID as uploaded so queued duplicates
      // will be skipped later.
      try { if (entry && entry.payload && entry.payload.formUUID) markUploaded(entry.payload.formUUID).catch(() => {}); } catch (e) {}
      return true;
    } catch (err) {
      // fallback to root
      try {
        const res2 = await drive.uploadJsonFile(filename, { savedAt: entry.savedAt || Date.now(), payload: entry.payload });
        try { if (entry && entry.payload && entry.payload.formUUID) markUploaded(entry.payload.formUUID).catch(() => {}); } catch (e) {}
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

    // Ensure we only attempt uploads when we have both internet access and
    // a valid Dropbox auth token. This avoids unnecessary upload attempts
    // (and noisy logs) when the device is offline or the user is signed out.
    try {
      // 1) check auth
      let token = null;
      try { token = await drive.getAccessToken().catch(() => null); } catch (e) { token = null; }
      if (!token) {
        try { console.log('uploadQueue.processQueue -> skipped: no dropbox auth token'); } catch (e) {}
        return { processed: 0, remaining: (await readQueue()).length };
      }
      // 2) check internet via probe
      let internetOk = false;
      try { internetOk = await httpProbe(); } catch (e) { internetOk = false; }
      if (!internetOk) {
        try { console.log('uploadQueue.processQueue -> skipped: no internet'); } catch (e) {}
        return { processed: 0, remaining: (await readQueue()).length };
      }

    } catch (e) {
      // If our lightweight checks fail unexpectedly, bail out conservatively.
      try { console.warn('uploadQueue.processQueue -> pre-checks failed', e); } catch (er) {}
      return { processed: 0, remaining: (await readQueue()).length };
    }

    try { console.log('uploadQueue.processQueue -> starting drain at', new Date().toISOString()); } catch (e) {}
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
    try { console.log('uploadQueue.processQueue -> completed', { processed: q.length - remaining.length, remaining: remaining.length }); } catch (e) {}
    return { processed: q.length - remaining.length, remaining: remaining.length };
  } catch (e) {
    console.warn('uploadQueue.processQueue failed', e);
    return { processed: 0, remaining: 0 };
  } finally {
    _processing = false;
  }
}

// Ensure any saved forms present in the local history are enqueued for upload
// if they are not already recorded as uploaded or present in the queue. This
// helps recover cases where saves happened while the auto-enqueue step failed
// or files were created outside the normal save flow. It is safe to call
// repeatedly and is idempotent.
export async function enqueueMissingFromHistory() {
  try {
    // Load history (lightweight index)
    const { getFormHistory } = await import('./formHistory');
    const history = await getFormHistory().catch(() => []);
    if (!Array.isArray(history) || history.length === 0) return 0;

    // Read current queue and uploaded list once for efficient checks
    const q = await readQueue();
    const uploadedList = await readUploaded();
    const queuedUUIDs = new Set((q || []).map(item => (item && item.payload && item.payload.formUUID) ? String(item.payload.formUUID) : null));
    const uploadedSet = new Set((uploadedList || []).map(u => String(u)));

    let enqueued = 0;
    for (const h of history) {
      try {
        const meta = h && h.meta ? h.meta : {};
        let payload = null;
        // Prefer payload loaded from formStorage when meta.formId exists
        if (meta && meta.formId) {
          try {
            const formStorage = await import('./formStorage');
            const loaded = await formStorage.loadForm(meta.formId).catch(() => null);
            if (loaded && loaded.payload) payload = loaded.payload;
          } catch (e) { /* ignore load errors */ }
        }
        // Fallbacks: meta.payload, meta.formData, or meta itself
        if (!payload) {
          if (meta && meta.payload && Object.keys(meta.payload || {}).length) payload = meta.payload;
          else if (meta && Array.isArray(meta.formData)) {
            const m = { ...meta };
            const rows = m.formData || [];
            delete m.formData;
            payload = { metadata: m, formData: rows };
          } else if (meta && meta.formData && Object.keys(meta.formData || {}).length) payload = meta.formData;
          else payload = meta || null;
        }

        // Determine a UUID if present
        const candidateUuid = payload && payload.formUUID ? String(payload.formUUID) : null;
        if (candidateUuid && uploadedSet.has(candidateUuid)) continue; // already uploaded
        if (candidateUuid && queuedUUIDs.has(candidateUuid)) continue; // already queued

        // If no candidateUuid, we still want to enqueue; enqueue() will assign one.
        // Build entry
        const entry = { title: (h && h.title) ? String(h.title) : 'Saved Form', payload: payload || {}, savedAt: h && h.savedAt ? h.savedAt : (payload && payload.savedAt) ? payload.savedAt : Date.now() };
        try {
          await enqueue(entry);
          enqueued += 1;
          // track queued uuid to avoid duplicate enqueues in this run
          const addedUuid = entry && entry.payload && entry.payload.formUUID ? String(entry.payload.formUUID) : null;
          if (addedUuid) queuedUUIDs.add(addedUuid);
        } catch (e) {
          // If enqueue fails, continue with other items
          console.warn('uploadQueue.enqueueMissingFromHistory: enqueue failed for', h && h.title, e);
        }
      } catch (e) { /* ignore per-entry errors */ }
    }
    try { if (enqueued > 0) console.log('uploadQueue.enqueueMissingFromHistory -> enqueued', enqueued, 'missing items'); } catch (e) {}
    return enqueued;
  } catch (e) {
    console.warn('uploadQueue.enqueueMissingFromHistory failed', e);
    return 0;
  }
}

// Start a simple auto-processor that callers can call once (e.g., app mount).
export function startAutoUploader(appStateEmitter) {
  // appStateEmitter should be the AppState module or similar with addEventListener
  try {
    // run an initial drain
    processQueue().catch(() => {});

    // Try to listen for network connectivity changes via NetInfo (best-effort).
    // If NetInfo is not installed we fall back to AppState events and a periodic timer.
    try {
      let netUnsub = null;
      let fallbackToHttpProbe = false;
      try {
        // require rather than import to avoid bundling failure when module missing
        const NetInfoModule = require('@react-native-community/netinfo');
        const NetInfo = NetInfoModule && NetInfoModule.default ? NetInfoModule.default : NetInfoModule;
        if (NetInfo && typeof NetInfo.addEventListener === 'function') {
          // immediate check - catch errors in case native part is not linked
          try {
            NetInfo.fetch().then(async s => {
              try {
                // If NetInfo reports explicit internet reachability use it.
                if (s && s.isInternetReachable === true) {
                  processQueue().catch(() => {});
                } else if (s && s.isConnected) {
                  // Connected to a network but NetInfo can't guarantee internet.
                  // Do an explicit HTTP probe to verify actual internet access.
                  try {
                    const ok = await httpProbe();
                    if (ok) processQueue().catch(() => {});
                  } catch (e) { /* ignore probe errors */ }
                }
              } catch (e) {}
            }).catch((err) => { fallbackToHttpProbe = true; });
          } catch (e) { fallbackToHttpProbe = true; }
          // subscribe for changes (guard in try/catch to avoid NativeModule.RNCNetInfo null errors)
          try {
            netUnsub = NetInfo.addEventListener(state => {
              try {
                // If NetInfo explicitly reports internet reachability, act immediately.
                if (state && state.isInternetReachable === true) {
                  processQueue().catch(() => {});
                  return;
                }
                // If NetInfo reports connected but not internet-reachable, do a probe
                if (state && state.isConnected) {
                  httpProbe().then(ok => { if (ok) processQueue().catch(() => {}); }).catch(() => {});
                }
              } catch (e) { /* ignore listener errors */ }
            });
          } catch (e) { fallbackToHttpProbe = true; }
        } else {
          fallbackToHttpProbe = true;
        }
      } catch (e) {
        // NetInfo not available or require failed — fallback to HTTP probe
        fallbackToHttpProbe = true;
      }

      // If NetInfo isn't usable (native module not linked), fall back to a lightweight HTTP probe
      // which attempts a quick fetch to a fast 204 endpoint and triggers processQueue when reachable.
      if (fallbackToHttpProbe) {
        try {
          // initial probe
          try {
            httpProbe().then(ok => { if (ok) processQueue().catch(() => {}); }).catch(() => {});
          } catch (e) {}
          // periodic probe (more aggressive for mobile transitions)
          setInterval(() => {
            try { httpProbe().then(ok => { if (ok) processQueue().catch(() => {}); }).catch(() => {}); } catch (e) {}
          }, PROBE_INTERVAL_MS);
        } catch (e) { /* ignore probe errors */ }
      }
      // We intentionally don't return the unsubscribe since this runs for app lifetime
    } catch (e) { /* ignore NetInfo subscription errors */ }

    // Also listen for AppState changes as a fallback
    if (appStateEmitter && typeof appStateEmitter.addEventListener === 'function') {
      try {
        appStateEmitter.addEventListener('change', (state) => {
          if (state === 'active') processQueue().catch(() => {});
        });
      } catch (e) {
        try {
          const sub = appStateEmitter.addEventListener('change', (state) => {
            if (state === 'active') processQueue().catch(() => {});
          });
        } catch (e2) { /* ignore */ }
      }

      // Listen for auth state changes so we can attempt to process the queue when
      // the user signs in (credentials now available). This avoids needing every
      // sign-in UI to call processQueue manually.
      try {
        if (drive && typeof drive.addAuthListener === 'function') {
          try {
            drive.addAuthListener((isSignedIn) => {
              try {
                if (isSignedIn) {
                  // Reconcile history into the queue first so any saved forms
                  // that were missed are enqueued before we attempt to drain.
                  enqueueMissingFromHistory().catch(() => {});
                  // run a quick probe/trigger so uploads start as soon as possible
                  httpProbe().then(ok => { if (ok) processQueue().catch(() => {}); else processQueue().catch(() => {}); }).catch(() => { processQueue().catch(() => {}); });
                }
              } catch (e) { /* ignore listener errors */ }
            });
          } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore addAuthListener errors */ }
    }

    // Periodic fallback: attempt to drain every 5 minutes in case events are missed.
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
  enqueueMissingFromHistory,
  getFailedUploads,
  clearFailedUploads,
  onPermanentFailure,
  offPermanentFailure,
};

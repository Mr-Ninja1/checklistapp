import * as FileSystem from 'expo-file-system/legacy';
import * as drive from './drive';

const QUEUE_PATH = FileSystem.documentDirectory + 'uploadQueue.json';

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
    const q = await readQueue();
    if (!q || q.length === 0) return { processed: 0, remaining: 0 };
    const remaining = [];
    for (const entry of q) {
      try {
        const ok = await tryUploadEntry(entry);
        if (!ok) remaining.push(entry);
      } catch (e) {
        remaining.push(entry);
      }
    }
    await writeQueue(remaining);
    return { processed: q.length - remaining.length, remaining: remaining.length };
  } catch (e) {
    console.warn('uploadQueue.processQueue failed', e);
    return { processed: 0, remaining: 0 };
  }
}

// Start a simple auto-processor that callers can call once (e.g., app mount).
export function startAutoUploader(appStateEmitter) {
  // appStateEmitter should be the AppState module or similar with addEventListener
  try {
    // run an initial drain
    processQueue().catch(() => {});
    if (appStateEmitter && typeof appStateEmitter.addEventListener === 'function') {
      appStateEmitter.addEventListener('change', (state) => {
        if (state === 'active') {
          processQueue().catch(() => {});
        }
      });
    }
  } catch (e) { /* ignore */ }
}

export default {
  enqueue,
  processQueue,
  startAutoUploader,
};

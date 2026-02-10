import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Modal, Text, TouchableWithoutFeedback, Alert, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as drive from '../utils/drive';
import { processQueue } from '../utils/uploadQueue';
import { getFormHistory, addFormHistory } from '../utils/formHistory';
import formStorage from '../utils/formStorage';

export default function DriveFloatingButton({ onSyncComplete, inline = false, openOnMount = false } = {}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [remoteYears, setRemoteYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [folderId, setFolderId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [renderError, setRenderError] = useState(null);
  // Restore/download progress modal state (separate from the Dropbox modal)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({ index: 0, total: 0, entry: '' });
  const [restoreMessage, setRestoreMessage] = useState('');
  const statusRef = useRef('');
  useEffect(() => { statusRef.current = statusMessage || ''; }, [statusMessage]);
  const loadingWatchRef = useRef(null);

  const startLoading = (msg) => {
    try {
      // clear existing watchdog
      if (loadingWatchRef.current) {
        clearTimeout(loadingWatchRef.current);
        loadingWatchRef.current = null;
      }
    } catch (e) {}
    setStatusMessage(msg || '');
    setLoading(true);
    // watchdog: clear loading after 5 minutes to avoid stuck spinner
    try {
      loadingWatchRef.current = setTimeout(() => {
        // silently clear loading state (don't spam the log)
        try { setStatusMessage(''); } catch (e) {}
        try { setLoading(false); } catch (e) {}
        try { loadingWatchRef.current = null; } catch (e) {}
      }, 300000);
    } catch (e) { /* ignore */ }
  };

  const stopLoading = () => {
    try {
      if (loadingWatchRef.current) {
        clearTimeout(loadingWatchRef.current);
        loadingWatchRef.current = null;
      }
    } catch (e) {}
    setStatusMessage('');
    setLoading(false);
  };

  // keep ref in sync to avoid stale closures in listeners
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Subscribe to structured progress events from drive helper so UI can respond immediately
  useEffect(() => {
    let unsub = null;
    try {
      if (drive && typeof drive.addProgressListener === 'function') {
        unsub = drive.addProgressListener(evt => {
          try {
            if (!evt || evt.type !== 'restore') return;
            const { index, total, entry } = evt;
            // update status text
            try { setStatusMessage(`Downloading: ${index + 1}/${total} ${entry && (entry.name || entry.path_display || '')}`); } catch (e) {}
            // if this is the final item, stop loading and refresh
            try {
              if ((typeof total === 'number') && (typeof index === 'number') && index + 1 >= total) {
                // avoid redundant calls if already not loading
                try { if (loadingRef.current) stopLoading(); } catch (e) {}
                try { if (typeof onSyncComplete === 'function') { const maybe = onSyncComplete(); if (maybe && typeof maybe.then === 'function') maybe.catch(() => {}); } } catch (e) {}
                try { triggerRefreshInBackground(0, 1, 3000); } catch (e) {}
                // ensure restore modal is closed when restore finishes
                try { setRestoreModalOpen(false); } catch (e) {}
              }
            } catch (e) { /* ignore */ }
          } catch (e) { /* ignore listener error */ }
        });
      }
    } catch (e) {}
    return () => { try { if (typeof unsub === 'function') unsub(); } catch (e) {} };
  }, [onSyncComplete]);

  // Wait until the form history reflects additional entries. This polls
  // `getFormHistory()` until `currentCount >= startCount + expectedDelta` or timeout.
  const waitForHistoryIncrease = async (startCount, expectedDelta = 1, timeoutMs = 3000) => {
    try {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          const list = await getFormHistory().catch(() => []);
          const cur = Array.isArray(list) ? list.length : 0;
          if (cur >= (startCount || 0) + (expectedDelta || 0)) return true;
        } catch (e) { /* ignore */ }
        // small delay
        await new Promise(res => setTimeout(res, 200));
      }
    } catch (e) { /* ignore */ }
    return false;
  };

  // Kick off a background refresh: wait for history to include new entries, then call onSyncComplete()
  const triggerRefreshInBackground = (preCount, delta = 1, timeoutMs = 5000) => {
    (async () => {
      try {
        await waitForHistoryIncrease(preCount, delta, timeoutMs);
          // Stop loading as soon as history shows the new entries.
          try { stopLoading(); } catch (e) {}
          if (typeof onSyncComplete === 'function') {
            try { await onSyncComplete(); } catch (err) { /* avoid noisy logs */ }
          }
          return;
      } catch (e) { /* ignore */ }
    })();
  };

  // Monitor statusMessage for a trailing "x/y" progress marker and when it reaches
  // completion (x >= y) force-stop the loading UI and trigger a background refresh.
  // Returns a function to stop the monitor.
  const startProgressMonitor = (preCount = 0, expectedDelta = 1, countdownTimeoutMs = 5000) => {
    let stopped = false;
    let showed = false;
    const start = Date.now();
    const interval = setInterval(() => {
      try {
        const msg = String(statusRef.current || '');
        const m = msg.match(/(\d+)\s*\/\s*(\d+)/);
        if (m && m[1] && m[2]) {
          const cur = Number(m[1]);
          const tot = Number(m[2]);
          if (!isNaN(cur) && !isNaN(tot) && cur >= tot) {
            if (!showed) {
              showed = true;
              try { stopLoading(); } catch (e) {}
              // Immediately trigger UI refresh (caller-provided callback) since downloads finished
              try {
                if (typeof onSyncComplete === 'function') {
                  const maybe = onSyncComplete();
                  if (maybe && typeof maybe.then === 'function') maybe.catch(() => {});
                }
              } catch (e) {}
              // Also trigger background history wait to be safe
              try { triggerRefreshInBackground(preCount, expectedDelta, countdownTimeoutMs); } catch (e) {}
            }
          }
        }
        // also bail if timeout exceeded
        if (Date.now() - start > countdownTimeoutMs + 2000) {
          if (!stopped) { stopped = true; clearInterval(interval); }
        }
      } catch (e) {
        // ignore
      }
    }, 250);
    return () => { try { stopped = true; clearInterval(interval); } catch (e) {} };
  };

  useEffect(() => {
    let mounted = true;
    (async () => { try { const t = await drive.getAccessToken(); if (mounted) setSignedIn(Boolean(t)); } catch (e) {} })();
    // also load cached user info (if any)
    (async () => {
      try {
        const ui = await drive.getUserInfo();
        if (mounted && ui) setUserInfo(ui);
      } catch (e) { /* ignore */ }
    })();
    // also attempt to resolve the app master path (if signed in) without creating folders
    (async () => {
      try {
        const masterPath = await drive.getMasterFolderPath().catch(() => '');
        if (mounted && masterPath) setFolderId(masterPath);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // derive display-friendly name and profile URL from various provider shapes
  const derivedDisplayName = React.useMemo(() => {
    try {
      if (!userInfo) return null;
      if (typeof userInfo === 'string') return userInfo;
      if (typeof userInfo.name === 'string' && userInfo.name) return userInfo.name;
      if (userInfo.name && typeof userInfo.name === 'object') {
        return userInfo.name.display_name || userInfo.name.familiar_name || userInfo.name.given_name || null;
      }
      // fallback to email or id
      return userInfo.email || userInfo.account_id || null;
    } catch (e) { return null; }
  }, [userInfo]);

  const derivedProfileUrl = React.useMemo(() => {
    try {
      if (!userInfo) return null;
      return userInfo.profile_photo_url || userInfo.picture || (userInfo.image && userInfo.image.url) || null;
    } catch (e) { return null; }
  }, [userInfo]);

  // If parent requests the modal to open on mount (e.g. via navigation param), open it.
  useEffect(() => {
    try {
      if (openOnMount) setModalOpen(true);
    } catch (e) { console.warn('DriveFloatingButton: openOnMount error', e); setRenderError(String(e)); }
    // only run on mount / when openOnMount changes
  }, [openOnMount]);

  // When modal is opened and user is signed in, refresh remote list automatically
  useEffect(() => {
    try {
      if (modalOpen && signedIn) {
        // refresh remote index so restore UI is populated
        refreshRemoteList().catch(() => {});
      }
    } catch (e) {}
  }, [modalOpen, signedIn]);

  // Local class-based ErrorBoundary to catch render errors inside modal
  class LocalErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(err) {
      return { hasError: true, error: err };
    }
    componentDidCatch(err, info) {
      console.warn('DriveFloatingButton render error', err, info);
      try { if (typeof setRenderError === 'function') setRenderError(String(err)); } catch (e) {}
    }
    render() {
      if (this.state.hasError) {
        return (
          <View style={{ padding: 12 }}>
            <Text style={{ color: '#b91c1c', fontWeight: '800', marginBottom: 8 }}>An error occurred loading Dropbox UI</Text>
            <Text style={{ color: '#333', marginBottom: 8 }}>{String(this.state.error || '')}</Text>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => { try { setModalOpen(false); } catch (e) {} }}><Text style={styles.actionBtnText}>Close</Text></TouchableOpacity>
          </View>
        );
      }
      return this.props.children;
    }
  }

  // NOTE: remote scanning is intentionally not automatic on modal open.
  // Scanning can be expensive for large backups, so we only refresh when
  // the user explicitly requests a restore/preview action (see handlers).

  const handleSignIn = async () => {
    try {
  startLoading('Opening Dropbox sign-in...');
      await drive.signInAsync();
      setSignedIn(true);
      // attempt to read profile
      let ui = null;
      try {
        ui = await drive.getUserInfo();
        if (ui) setUserInfo(ui);
      } catch (e) { /* ignore */ }
      // Ensure app folder exists and sync (resolve master path without creating new folders)
      try {
        const masterPath = await drive.getMasterFolderPath().catch(() => '');
        if (masterPath) setFolderId(masterPath);
      } catch (e) { /* ignore */ }
  stopLoading();
      Alert.alert('Signed in', `Dropbox is now connected${ui && ui.email ? ' (' + (ui.email || '') + ')' : ''}.`);
      // refresh remote list when signed in (defensive: use resolved folderId/masterPath)
      try {
        let list = null;
        const useFolder = folderId || null;
        if (useFolder) list = await drive.listFilesInFolder(useFolder, "name contains 'checklistapp_'");
        else list = await drive.listFilesAsync("name contains 'checklistapp_'");
        setRemoteFiles((list && list.files) ? list.files : (list && list.entries) ? list.entries : []);
      } catch (e) { /* ignore */ }
      // After sign-in, attempt to drain the upload queue immediately
      try { processQueue().catch(() => {}); } catch (e) { /* ignore */ }
    } catch (e) {
  stopLoading();
      // Detect domain restriction error from drive helper
      const msg = String(e || '');
      if (msg.indexOf('auth_not_allowed') !== -1) {
        Alert.alert('Sign in not allowed', 'This Google account is not part of the allowed company domain. Please sign in with your company email.');
        try { await drive.signOut(); } catch (er) { /* ignore */ }
        setSignedIn(false);
        setUserInfo(null);
        return;
      }
      Alert.alert('Sign in failed', String(e));
    }
  };

  const handleSignOut = async () => {
    try {
  startLoading('Signing out...');
      await drive.signOut();
      setSignedIn(false);
      setUserInfo(null);
  stopLoading();
      Alert.alert('Signed out', 'Disconnected from Dropbox.');
    } catch (e) {
  stopLoading();
      Alert.alert('Sign out failed', String(e));
    }
  };

  const handleShowRedirectUris = () => {
    try {
      const proxy = AuthSession.makeRedirectUri({ useProxy: true });
      const native = AuthSession.makeRedirectUri({ native: true });
      Alert.alert('Redirect URIs', `Proxy:\n${proxy}\n\nNative:\n${native}`);
    } catch (e) {
      Alert.alert('Redirect URI error', String(e));
    }
  };

  const handleSyncNow = async () => {
    // Upload missing saved forms and import missing remote files
  startLoading('Uploading backups...');
    try {
      const history = await getFormHistory();
      const entries = (history || []).slice().reverse();

      // Resolve master app folder path (e.g. /Apps/Bravoapp) so we can target date folders inside it.
      const masterPath = await drive.getMasterFolderPath().catch(() => '');
      // We'll cache per-date-folder listings for this run to avoid listing the entire account.
      const folderCache = {}; // { '2025-10-28': [entries...] }

      // (uploads will be handled below) Only perform uploads on explicit Save-to-Dropbox action. Do not pull/download during this action.
      let uploaded = 0;
      let skipped = 0;
      let failed = 0;
      for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        try {
          setStatusMessage(`Uploading ${i + 1}/${entries.length} - ${(item.title || 'form').slice(0, 40)}`);
          let payload = null;
          if (item.meta && item.meta.formId) {
            const loaded = await formStorage.loadForm(item.meta.formId).catch(() => null);
            if (loaded && loaded.payload) payload = loaded.payload;
          }
          if (!payload) payload = item.meta?.payload || item.meta || item;
          const safeTitle = (item.title ? item.title.replace(/[^a-z0-9-_\. ]/gi, '_') : 'form');
          const uuidTag = (payload && payload.formUUID) ? `_id_${payload.formUUID}` : '';
          const filename = `${safeTitle}_${item.savedAt || Date.now()}${uuidTag}.json`;
          const prefixed = `checklistapp_${filename}`;

          // Compute target date folder (store date folders directly under the app container)
          const dt = item.savedAt ? new Date(Number(item.savedAt)) : new Date();
          const dateFolder = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          const targetPath = (masterPath ? `${masterPath}/${dateFolder}` : `/${dateFolder}`).replace(/\\/g, '/');

          // Ensure the date folder exists under the app container (creates if missing)
          try {
            await drive.ensureFolderPath(dateFolder);
          } catch (err) {
            // ignore ensure errors; listing may still work
          }

          // Load folder listing from cache or remote (non-recursive)
          let folderEntries = folderCache[dateFolder];
          if (!folderEntries) {
            try {
              const listRes = await drive.listFilesInFolder(targetPath).catch(() => ({ entries: [] }));
              folderEntries = listRes.entries || [];
            } catch (err) {
              folderEntries = [];
            }
            folderCache[dateFolder] = folderEntries;
          }

          // Fast path: check exact filename or uuid tag inside the date folder only
          const exactExists = (folderEntries || []).some(x => x && x.name === prefixed);
          const uuidExists = (payload && payload.formUUID) ? (folderEntries || []).some(x => x && typeof x.name === 'string' && x.name.includes(`_id_${payload.formUUID}`)) : false;
          if (exactExists || uuidExists) { skipped += 1; continue; }

          // Second: check whether any file in the target folder has identical content
          const localWrapped = { payload, savedAt: item.savedAt || Date.now() };
          const localHash = await drive.computeJsonHash(localWrapped).catch(() => null);
          let duplicate = null;
          if (localHash && folderEntries && folderEntries.length) {
            for (const f of folderEntries) {
              try {
                const remoteHash = await drive.computeRemoteFileHash(f).catch(() => null);
                if (remoteHash && remoteHash === localHash) { duplicate = f; break; }
              } catch (err) { /* ignore per-file errors */ }
            }
          }
          if (duplicate) { skipped += 1; continue; }

          // No duplicate found — proceed to upload into date folder
          try {
            const upRes = await drive.uploadJsonFileToFolder(filename, localWrapped, targetPath).catch(err => { throw err; });
            if (upRes && upRes.skipped) { skipped += 1; }
            else { uploaded += 1; }
            // update cached folderEntries to include uploaded filename to avoid re-checking later
            folderCache[dateFolder] = folderCache[dateFolder] || [];
            folderCache[dateFolder].push({ name: prefixed });
          } catch (e) {
            // fallback to root upload
            try { const upRes2 = await drive.uploadJsonFile(filename, localWrapped).catch(err => { throw err; }); if (upRes2 && upRes2.skipped) skipped += 1; else uploaded += 1; } catch (err) { console.warn('drive: upload fallback failed', err); failed += 1; }
          }
        } catch (e) {
          console.warn('drive: upload entry failed', e);
          failed += 1;
        }
      }

      setStatusMessage('');
      Alert.alert('Save complete', `Uploaded: ${uploaded}\nSkipped (already present): ${skipped}\nFailed: ${failed}`);
      if (typeof onSyncComplete === 'function') {
        try {
          await new Promise(res => setTimeout(res, 250));
          await onSyncComplete();
        } catch (err) {
          console.warn('onSyncComplete failed', err);
        }
      }
    } catch (e) {
      Alert.alert('Sync failed', String(e));
    } finally {
      stopLoading();
    }
  };

  const handleRestoreRecent = async () => {
    // Only refresh the remote index and display remote saves — do not download anything.
    startLoading('Scanning remote backups...');
    try {
      await refreshRemoteList().catch(() => null);
      Alert.alert('Remote scan complete', 'Remote backups index refreshed. Select a year and use "Restore selected" to import files.');
    } catch (e) {
      console.warn('drive: refresh failed', e);
      Alert.alert('Scan failed', String(e));
    } finally {
      stopLoading();
    }
  };

  const handleRestoreYear = async (year) => {
    // Use a separate restore modal to show per-file progress so the Dropbox modal
    // remains responsive and we can provide a clear "Done" message afterwards.
    setRestoreMessage(`Downloading backups for ${year}...`);
    // close the Drive floating modal so only the restore modal is visible
    try { setModalOpen(false); } catch (e) {}
    setRestoreModalOpen(true);
    setRestoreProgress({ index: 0, total: 0, entry: '' });
    // capture starting history count so we can wait until imports appear in UI
    let preCount = 0;
    try { const hist = await getFormHistory().catch(() => []); preCount = Array.isArray(hist) ? hist.length : 0; } catch (e) { preCount = 0; }
    try {
      let cursor = null;
      let imported = 0;
      let failed = 0;
      // Loop until all pages for that year are restored
      do {
        const masterPath = await drive.getMasterFolderPath().catch(() => '');
        const res = await drive.restoreFilesBatch({ folderPath: masterPath, year, limit: 50, cursor, onProgress: ({ index, total, entry }) => {
          try { setRestoreProgress({ index: index + 1, total: total || 0, entry: entry && (entry.name || entry.path_display) ? (entry.name || entry.path_display) : '' }); } catch (err) {}
        } }).catch(e => { throw e; });
        const results = res.results || [];
        for (const r of results) {
          if (r.imported) imported += 1; else failed += 1;
        }
        cursor = res.nextCursor || null;
        // If the restoreFilesBatch indicates has_more but returned no cursor, break to avoid infinite loop
        if (res.has_more && !cursor) break;
      } while (cursor);
      // stop spinner/modal immediately and show a completion alert
      setRestoreModalOpen(false);
      Alert.alert('Restore complete', `Year ${year} - Imported: ${imported}\nFailed: ${failed}`, [{ text: 'OK', onPress: () => { try { if (typeof onSyncComplete === 'function') onSyncComplete(); } catch (e) {} } }]);
      // in background, wait for history to be updated and then trigger onSyncComplete to refresh UI
      try { triggerRefreshInBackground(preCount, imported, 4000); } catch (e) { /* ignore */ }
    } catch (e) {
      setRestoreModalOpen(false);
      Alert.alert('Restore failed', String(e));
    }
  };

  const toggleYear = (year) => {
    try {
      setSelectedYears(prev => {
        const s = new Set(prev || []);
        if (s.has(year)) s.delete(year);
        else s.add(year);
        return Array.from(s).sort((a,b) => b - a);
      });
    } catch (e) { /* ignore */ }
  };

  // Preview functionality removed — Restore recent now only refreshes the remote index

  const handleRestoreSelected = async () => {
    if (!selectedYears || !selectedYears.length) {
      Alert.alert('Restore', 'No years selected.');
      return;
    }
    const yrs = selectedYears.join(', ');
    Alert.alert(
      'Confirm restore',
      `You are about to download and import all forms for: ${yrs}. Do you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: async () => {
          // close the Drive floating modal before opening the restore modal
          try { setModalOpen(false); } catch (e) {}
          // capture pre-restore history count
          let preCount = 0;
          try { const hist = await getFormHistory().catch(() => []); preCount = Array.isArray(hist) ? hist.length : 0; } catch (e) { preCount = 0; }
          // open dedicated restore modal
          setRestoreModalOpen(true);
          setRestoreMessage('Restoring selected years...');
          try {
            // Ensure we've scanned remote backups for available files before restoring
            if (!remoteYears || !remoteYears.length) {
              setRestoreMessage('Scanning remote backups...');
              await refreshRemoteList().catch(() => null);
            }
            let totalImported = 0;
            let totalFailed = 0;
            const masterPath = await drive.getMasterFolderPath().catch(() => '');
            for (const y of selectedYears) {
              setRestoreMessage(`Restoring ${y}...`);
              let cursor = null;
              do {
                const res = await drive.restoreFilesBatch({ folderPath: masterPath, year: y, limit: 50, cursor, onProgress: ({ index, total, entry }) => {
                  try { setRestoreProgress({ index: index + 1, total: total || 0, entry: entry && (entry.name || entry.path_display) ? (entry.name || entry.path_display) : '' }); } catch (err) {}
                } }).catch(e => { throw e; });
                const results = res.results || [];
                for (const r of results) {
                  if (r.imported) totalImported += 1; else totalFailed += 1;
                }
                cursor = res.nextCursor || null;
                if (res.has_more && !cursor) break;
              } while (cursor);
            }
            // close modal and notify user
            setRestoreModalOpen(false);
            Alert.alert('Restore complete', `Imported: ${totalImported}\nFailed: ${totalFailed}`, [{ text: 'OK', onPress: () => { try { if (typeof onSyncComplete === 'function') onSyncComplete(); } catch (e) {} } }]);
            try { triggerRefreshInBackground(preCount, totalImported, 5000); } catch (e) { /* ignore */ }
          } catch (e) {
            setRestoreModalOpen(false);
            Alert.alert('Restore failed', String(e));
          }
        } }
      ],
      { cancelable: true }
    );
  };

  const refreshRemoteList = async () => {
  startLoading('Scanning remote backups...');
      // Resolve the actual master folder path and list recursively to find backups wherever they are located
    try {
      const masterPath = await drive.getMasterFolderPath().catch(() => '');
      const res = await drive.listFilesRecursive(masterPath === '/' ? '' : masterPath).catch(() => ({ entries: [] }));
      const entries = res.entries || [];
      setRemoteFiles(entries);
      // Derive available years by scanning any path segment for YYYY-MM-DD or by filename timestamp
      const yearsSet = new Set();
      const extractDateFolder = (p, name) => {
        try {
          if (p) {
            const parts = (p || '').split('/').filter(Boolean);
            for (const seg of parts) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(seg)) return seg;
            }
          }
          if (name) {
            const m = (name || '').match(/[_-](\d{10,13})\.json$/);
            if (m && m[1]) {
              const ts = Number(m[1]);
              if (!Number.isNaN(ts) && ts > 0) {
                const d = new Date(ts);
                if (!isNaN(d.getTime())) {
                  const yyyy = d.getUTCFullYear();
                  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                  const dd = String(d.getUTCDate()).padStart(2, '0');
                  return `${yyyy}-${mm}-${dd}`;
                }
              }
            }
          }
        } catch (err) { /* ignore */ }
        return null;
      };

      entries.forEach(e => {
        try {
          const p = (e.path_lower || e.path_display || '');
          const name = e.name || '';
          const dateFolder = extractDateFolder(p, name);
          if (dateFolder) yearsSet.add(Number(dateFolder.slice(0,4)));
        } catch (err) { /* ignore */ }
      });
      const years = Array.from(yearsSet).sort((a,b) => b - a);
      setRemoteYears(years);
    } catch (e) {
      console.warn('drive: list failed', e);
    } finally {
      // use centralized stop helper so watchdog is cleared and status is reset
      stopLoading();
    }
  };

  const handleImport = async (file) => {
    // use centralized start helper to set status and start watchdog
    startLoading('Importing files...');
    try {
      // If the selected item is a folder, list its files and import each file
      if (file && file['.tag'] === 'folder') {
        const path = file.path_lower || file.path_display || '';
        const list = await drive.listFilesRecursive(path === '/' ? '' : path).catch(() => ({ entries: [] }));
        const files = (list.entries || []).filter(e => e['.tag'] === 'file');
        if (!files.length) {
          stopLoading();
          Alert.alert('Import', 'No files found inside the selected folder.');
          return;
        }
        let imported = 0;
        let failed = 0;
        // helper: extract YYYY-MM-DD date folder from path or filename
        const extractDateFolder = (p, name) => {
          try {
            if (p) {
              const parts = (p || '').split('/').filter(Boolean);
              for (const seg of parts) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(seg)) return seg;
              }
            }
            if (name) {
              const m = (name || '').match(/(\d{4})-(\d{2})-(\d{2})/);
              if (m) return `${m[1]}-${m[2]}-${m[3]}`;
              const m2 = (name || '').match(/[_-](\d{10,13})\.json$/);
              if (m2 && m2[1]) {
                const ts = Number(m2[1]);
                if (!Number.isNaN(ts) && ts > 0) {
                  const d = new Date(ts);
                  if (!isNaN(d.getTime())) {
                    const yyyy = d.getUTCFullYear();
                    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(d.getUTCDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                  }
                }
              }
            }
          } catch (err) { /* ignore */ }
          return null;
        };
        // Build set of existing local UUIDs to skip duplicates
        let existingUUIDs = new Set();
        try {
          const { getFormHistory } = await import('../utils/formHistory');
          const hist = await getFormHistory().catch(() => []);
          for (const h of (hist || [])) {
            try { const pu = h.meta && h.meta.payload && h.meta.payload.formUUID; if (pu) existingUUIDs.add(String(pu)); } catch (e) { }
          }
        } catch (e) { /* ignore */ }

        for (const f of files) {
          try {
            // Fast skip: if filename contains uuid tag and we already have it, skip download
            const name = f.name || '';
            const m = name.match(/_id_([A-Za-z0-9_-]+)/);
            if (m && m[1] && existingUUIDs.has(m[1])) {
              // already present locally
              continue;
            }
            setStatusMessage(`Downloading ${f.name || ''}...`);
            const payload = await drive.downloadFile(f).catch(err => { throw err; });
            let wrapped = (payload && payload.payload) ? payload : { payload, savedAt: (payload && payload.savedAt) ? payload.savedAt : null };
            // If the remote wrapped payload does not include savedAt, attempt to infer it
            // from the file path or filename (YYYY-MM-DD folder or timestamp suffix).
            if (!wrapped.savedAt) {
              const dateFolder = extractDateFolder(f.path_lower || f.path_display || '', f.name || '');
              if (dateFolder) {
                const dt = new Date(`${dateFolder}T00:00:00Z`);
                if (!isNaN(dt.getTime())) wrapped.savedAt = dt.getTime();
              }
              if (!wrapped.savedAt) wrapped.savedAt = Date.now();
            }
            // If wrapped payload includes formUUID and we already have it, skip import
            const remoteUUID = wrapped && wrapped.payload && wrapped.payload.formUUID;
            if (remoteUUID && existingUUIDs.has(String(remoteUUID))) continue;
            const formId = f.id ? `drive_${f.id}` : `drive_${Date.now()}`;
            const imp = await formStorage.importForm(formId, wrapped).catch(err => { throw err; });
            imported += 1;
            if (remoteUUID) existingUUIDs.add(String(remoteUUID));
          } catch (err) {
            console.warn('drive: import file failed', err);
            failed += 1;
          }
        }
        // stop spinner immediately and show a completion alert
        stopLoading();
        Alert.alert('Import complete', `Imported: ${imported}\nFailed: ${failed}`);
        try { const hist = await getFormHistory().catch(() => []); const preCount = Array.isArray(hist) ? hist.length - imported : 0; triggerRefreshInBackground(preCount, imported, 4000); } catch (e) { /* ignore */ }
        return;
      }

      // Otherwise assume it's a file metadata object
      // Fast skip: check filename for uuid tag and local history
      try {
        const { getFormHistory } = await import('../utils/formHistory');
        const hist = await getFormHistory().catch(() => []);
        const name = file && file.name ? file.name : '';
        const m = name.match(/_id_([A-Za-z0-9_-]+)/);
        if (m && m[1]) {
          const exists = (hist || []).some(h => { try { return h.meta && h.meta.payload && String(h.meta.payload.formUUID) === String(m[1]); } catch (e) { return false; } });
          if (exists) {
              stopLoading();
              Alert.alert('Import skipped', `${file.name} already exists locally.`);
              return;
            }
        }
      } catch (e) { /* ignore history read errors */ }

      const payload = await drive.downloadFile(file).catch(err => { throw err; });
      // If payload has savedAt, try to preserve it
      const wrapped = (payload && payload.payload) ? payload : { payload, savedAt: (payload && payload.savedAt) ? payload.savedAt : Date.now() };
      const formId = file.id ? `drive_${file.id}` : `drive_${Date.now()}`;
      // Import locally without triggering auto-upload
      await formStorage.importForm(formId, wrapped).catch(() => null);
      // importForm already added a history entry; stop spinner & notify user
      stopLoading();
      Alert.alert('Imported', `${file.name} imported into saved forms.`);
      try { const hist = await getFormHistory().catch(() => []); const preCount = Array.isArray(hist) ? hist.length - 1 : 0; triggerRefreshInBackground(preCount, 1, 3000); } catch (e) { /* ignore */ }
    } catch (e) {
      Alert.alert('Import failed', String(e));
    } finally {
      stopLoading();
    }
  };

  const handleToggleModal = async () => {
    try {
      const next = !modalOpen;
      setModalOpen(next);
      if (next && signedIn) {
        try { await refreshRemoteList(); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  };

  const InlineButton = (
    <TouchableOpacity style={[styles.button, inline ? styles.inlineButton : null]} onPress={handleToggleModal}>
      <Image source={require('../assets/dropbox.png')} style={[styles.icon, inline ? styles.inlineIcon : null]} resizeMode="contain" />
    </TouchableOpacity>
  );

  return (
    <>
      <Modal visible={modalOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer} pointerEvents="box-none">
          <LocalErrorBoundary>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 10 }}>Dropbox</Text>
            <ScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: '700' }}>Dropbox</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)} style={{ padding: 6 }} accessibilityLabel="Close">
                  <Text style={{ fontSize: 20, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ marginBottom: 4, color: '#444', fontSize: 15, fontWeight: '700' }}>Connected: {signedIn ? 'Yes' : 'No'}</Text>
              {signedIn && typeof userInfo?.email === 'string' ? (
                <Text style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{userInfo.email}</Text>
              ) : null}
              {signedIn && (derivedDisplayName || derivedProfileUrl) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  {typeof derivedProfileUrl === 'string' ? <Image source={{ uri: derivedProfileUrl }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }} /> : null}
                  <View>
                    {derivedDisplayName ? <Text style={{ fontWeight: '700' }}>{derivedDisplayName}</Text> : null}
                    {typeof userInfo?.email === 'string' ? <Text style={{ color: '#666' }}>{userInfo.email}</Text> : null}
                  </View>
                </View>
              ) : null}
              {loading ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
                  <ActivityIndicator />
                  {statusMessage ? <Text style={{ marginTop: 12, fontWeight: '600' }}>{statusMessage}</Text> : null}
                </View>
              ) : (
                <>
                      {!signedIn ? (
                    <>
                      <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleSignIn}><Text style={styles.actionBtnText}>Sign in with Dropbox</Text></TouchableOpacity>
                      <Text style={{ marginTop: 12, color: '#444' }}>Sign in to enable Dropbox sync (push/pull) features.</Text>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleSignOut}><Text style={styles.actionBtnTextSecondary}>Sign out</Text></TouchableOpacity>

                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => { handleSyncNow(); }}><Text style={styles.actionBtnText}>Save to Dropbox</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnPrimaryOutline} onPress={() => handleRestoreRecent()}><Text style={styles.actionBtnTextOutline}>Restore recent</Text></TouchableOpacity>
                      </View>

                      {remoteYears && remoteYears.length > 0 ? (
                        <View style={{ marginTop: 10 }}>
                          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Restore by year</Text>
                          <View style={{ marginBottom: 8 }}>
                            <Text style={{ marginBottom: 6, color: '#333' }}>Select years to restore:</Text>
                              <View style={{ maxHeight: 220, marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                  {remoteYears.map(y => {
                                    const isSel = selectedYears && selectedYears.includes(y);
                                    return (
                                      <TouchableOpacity key={String(y)} style={[styles.yearTile, isSel ? styles.yearTileSelected : null]} onPress={() => toggleYear(y)}>
                                        <Text style={[styles.yearTileText, isSel ? styles.yearTileTextSelected : null]}>{y}</Text>
                                        {isSel ? <Text style={styles.yearRowCheck}>✓</Text> : null}
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            <View style={{ marginTop: 8, alignItems: 'center' }}>
                              <TouchableOpacity style={[styles.actionBtnPrimary, { minWidth: 260 }]} onPress={() => handleRestoreSelected()}><Text style={styles.actionBtnText}>Restore selected</Text></TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </>
                  )}
                </>
              )}
              
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalOpen(false)}><Text style={{ color: '#185a9d', fontWeight: '700' }}>Close</Text></TouchableOpacity>
          </View>
          </LocalErrorBoundary>
        </View>
      </Modal>

      {/* Restore progress modal (separate from the Drive modal) */}
      <Modal visible={restoreModalOpen} transparent animationType="fade">
        <View style={styles.restoreOverlay}>
          <View style={styles.restoreCard}>
            <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 10 }}>Restoring backups</Text>
            <Text style={{ marginBottom: 8, color: '#444' }}>{restoreMessage}</Text>
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="large" />
              {restoreProgress && restoreProgress.total ? (
                <Text style={{ marginTop: 8 }}>{`${restoreProgress.index}/${restoreProgress.total} - ${restoreProgress.entry || ''}`}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setRestoreModalOpen(false); }}><Text style={{ color: '#185a9d', fontWeight: '700' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!inline ? (
        <View style={styles.wrapper} pointerEvents="box-none">
          {InlineButton}
        </View>
      ) : (
        <View pointerEvents="box-none">
          {InlineButton}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    zIndex: 999,
    elevation: 20,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  icon: { width: 56, height: 56 },
  inlineIcon: { width: 56, height: 56 },
  inlineButton: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  inlineButton: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, marginLeft: 12 },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 12 },
  modalCard: { backgroundColor: '#fff', padding: 18, borderTopLeftRadius: 12, borderTopRightRadius: 12, minHeight: 300, maxHeight: '92%' },
  restoreOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  restoreCard: { backgroundColor: '#fff', padding: 18, borderRadius: 12, minWidth: 280, maxWidth: '92%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  // Primary full-width button (modern)
  actionBtnPrimary: { backgroundColor: '#185a9d', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginTop: 8, minWidth: 140, flex: 1, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnPrimaryOutline: { borderColor: '#185a9d', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginTop: 8, minWidth: 140, flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  actionBtnTextOutline: { color: '#185a9d', fontWeight: '800', textAlign: 'center' },
  actionBtnSecondary: { alignSelf: 'center', backgroundColor: '#efefef', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 6 },
  actionBtnTextSecondary: { color: '#333', fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  yearBtn: { width: '48%', backgroundColor: '#0b74de', paddingVertical: 10, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  yearBtnText: { color: '#fff', fontWeight: '700' },
  yearBtnSelected: { backgroundColor: '#064f9a' },
  yearRow: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f6f9ff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  yearRowText: { color: '#0b74de', fontWeight: '800', fontSize: 16 },
  yearRowTextSelected: { color: '#fff', fontWeight: '900' },
  yearRowSelected: { backgroundColor: '#185a9d', borderRadius: 8, paddingHorizontal: 12 },
  yearRowCheck: { color: '#fff', fontWeight: '900', fontSize: 18 },
  // Tile styles for two-column year grid
  yearTile: { width: '48%', margin: '1%', backgroundColor: '#f6f9ff', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  yearTileSelected: { backgroundColor: '#185a9d' },
  yearTileText: { color: '#0b74de', fontWeight: '800', fontSize: 16 },
  yearTileTextSelected: { color: '#fff', fontWeight: '900' },
  closeBtn: { marginTop: 12, alignSelf: 'flex-end' },
});

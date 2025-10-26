import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Modal, Text, TouchableWithoutFeedback, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import drive from '../utils/drive';
import { getFormHistory, addFormHistory } from '../utils/formHistory';
import formStorage from '../utils/formStorage';

export default function DriveFloatingButton({ onSyncComplete, inline = false } = {}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [folderId, setFolderId] = useState(null);

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
    // also attempt to resolve the app folder id (if signed in)
    (async () => {
      try {
        const f = await drive.ensureFolder('checklistapp_backups').catch(() => null);
        if (mounted && f && f.id) setFolderId(f.id);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await drive.signInAsync();
      setSignedIn(true);
      // attempt to read profile
      let ui = null;
      try {
        ui = await drive.getUserInfo();
        if (ui) setUserInfo(ui);
      } catch (e) { /* ignore */ }
      // Ensure app folder exists and sync
      try {
        const f = await drive.ensureFolder('checklistapp_backups').catch(() => null);
        if (f && f.id) setFolderId(f.id);
      } catch (e) { /* ignore */ }
      setLoading(false);
      Alert.alert('Signed in', `Google Drive is now connected${ui && ui.email ? ' (' + (ui.email || '') + ')' : ''}.`);
      // refresh remote list when signed in
      try {
        let list = null;
        const useFolder = (f && f.id) ? f.id : null;
        if (useFolder) list = await drive.listFilesInFolder(useFolder, "name contains 'checklistapp_'");
        else list = await drive.listFilesAsync("name contains 'checklistapp_'");
        setRemoteFiles(list.files || []);
      } catch (e) { /* ignore */ }
    } catch (e) {
      setLoading(false);
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
      setLoading(true);
      await drive.signOut();
      setSignedIn(false);
      setUserInfo(null);
      setLoading(false);
      Alert.alert('Signed out', 'Disconnected from Google Drive.');
    } catch (e) {
      setLoading(false);
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
    try {
      setLoading(true);
      const history = await getFormHistory();
      const entries = (history || []).slice().reverse();

      // Ensure folder exists
      let f = null;
      try { f = await drive.ensureFolder('checklistapp_backups'); if (f && f.id) setFolderId(f.id); } catch (e) { f = null; }

      // List remote files in folder (if available) or global matching names
      let remoteList = { files: [] };
      try {
        if (f && f.id) remoteList = await drive.listFilesInFolder(f.id, "name contains 'checklistapp_'");
        else remoteList = await drive.listFilesAsync("name contains 'checklistapp_'");
      } catch (e) { remoteList = { files: [] }; }

      const remoteNames = new Set((remoteList.files || []).map(x => x.name));

      // Push: upload local entries that do not have a matching remote name
      for (let i = 0; i < entries.length; i++) {
        const item = entries[i];
        try {
          let payload = null;
          if (item.meta && item.meta.formId) {
            const loaded = await formStorage.loadForm(item.meta.formId).catch(() => null);
            if (loaded && loaded.payload) payload = loaded.payload;
          }
          if (!payload) payload = item.meta?.payload || item.meta || item;
          const safeTitle = (item.title ? item.title.replace(/[^a-z0-9-_\. ]/gi, '_') : 'form');
          const filename = `${safeTitle}_${item.savedAt || Date.now()}.json`;
          const prefixed = `checklistapp_${filename}`;
          if (remoteNames.has(prefixed)) continue; // skip already uploaded
          if (f && f.id) await drive.uploadJsonFileToFolder(filename, payload, f.id).catch(e => { throw e; });
          else await drive.uploadJsonFile(filename, payload).catch(e => { throw e; });
        } catch (e) {
          console.warn('drive: upload entry failed', e);
        }
      }

      // Pull: import remote files that are not present locally
      const localNameSet = new Set((entries || []).map(it => `checklistapp_${(it.title ? it.title.replace(/[^a-z0-9-_\. ]/gi, '_') : 'form')}_${it.savedAt || ''}.json`));
      for (const rf of (remoteList.files || [])) {
        try {
          if (localNameSet.has(rf.name)) continue;
          // download and import
          await handleImport(rf);
        } catch (e) {
          console.warn('drive: import remote file failed', e);
        }
      }

      setLoading(false);
      Alert.alert('Sync complete', 'Push/pull sync attempted for saved forms.');
      if (typeof onSyncComplete === 'function') onSyncComplete();
    } catch (e) {
      setLoading(false);
      Alert.alert('Sync failed', String(e));
    }
  };

  const refreshRemoteList = async () => {
    try {
      setLoading(true);
      const list = await drive.listFilesAsync("name contains 'checklistapp_'");
      setRemoteFiles(list.files || []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.warn('drive: list failed', e);
    }
  };

  const handleImport = async (file) => {
    try {
      setLoading(true);
      const payload = await drive.downloadFile(file.id);
      // If payload has savedAt, try to preserve it
      const formId = `drive_${file.id}`;
      // Save locally
      await formStorage.saveForm(formId, payload).catch(() => null);
      // Add to history, preserve savedAt if available
      await addFormHistory({ title: payload.title || file.name, savedAt: payload.savedAt || Date.now(), _preserveSavedAt: true, meta: { payload } });
      setLoading(false);
      Alert.alert('Imported', `${file.name} imported into saved forms.`);
      if (typeof onSyncComplete === 'function') onSyncComplete();
    } catch (e) {
      setLoading(false);
      Alert.alert('Import failed', String(e));
    }
  };

  const InlineButton = (
    <TouchableOpacity style={[styles.button, inline ? styles.inlineButton : null]} onPress={() => setModalOpen(true)}>
      <Image source={require('../assets/google.png')} style={[styles.icon, inline ? styles.inlineIcon : null]} resizeMode="contain" />
    </TouchableOpacity>
  );

  return (
    <>
      <Modal visible={modalOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer} pointerEvents="box-none">
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 10 }}>Google Drive</Text>
            <ScrollView>
              <Text style={{ marginBottom: 8 }}>Connected: {signedIn ? 'Yes' : 'No'}</Text>
              {userInfo ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  {userInfo.picture ? <Image source={{ uri: userInfo.picture }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }} /> : null}
                  <View>
                    <Text style={{ fontWeight: '700' }}>{userInfo.name || userInfo.email}</Text>
                    <Text style={{ color: '#666' }}>{userInfo.email}</Text>
                  </View>
                </View>
              ) : null}
              {loading ? <ActivityIndicator /> : (
                <>
                  {!signedIn ? (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={handleSignIn}><Text style={styles.actionBtnText}>Sign in with Google</Text></TouchableOpacity>
                      <Text style={{ marginTop: 12, color: '#444' }}>Sign in to enable Drive sync (push/pull) features.</Text>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={handleSignOut}><Text style={styles.actionBtnText}>Sign out</Text></TouchableOpacity>

                      {/* Push (upload) */}
                      <TouchableOpacity style={[styles.actionBtn, { marginTop: 8 }]} onPress={() => { handleSyncNow(); }}><Text style={styles.actionBtnText}>Sync saved forms now (upload)</Text></TouchableOpacity>

                      {/* Pull (remote list + import) */}
                      <View style={{ height: 12 }} />
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0b74de' }]} onPress={() => refreshRemoteList()}><Text style={styles.actionBtnText}>Refresh remote file list</Text></TouchableOpacity>
                      <Text style={{ marginTop: 12, fontWeight: '700' }}>Remote backups</Text>
                      {remoteFiles.length === 0 ? (
                        <Text style={{ color: '#444', marginTop: 8 }}>No remote backup files found.</Text>
                      ) : remoteFiles.map(f => (
                        <View key={f.id} style={{ marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' }}>
                          <Text style={{ fontWeight: '700' }}>{f.name}</Text>
                          <Text style={{ color: '#666', marginTop: 4 }}>Modified: {new Date(f.modifiedTime).toLocaleString()}</Text>
                          <View style={{ flexDirection: 'row', marginTop: 8 }}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10a37f', marginRight: 8 }]} onPress={() => handleImport(f)}><Text style={styles.actionBtnText}>Import</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6b7280' }]} onPress={() => Alert.alert('Preview', 'Preview is not implemented yet')}><Text style={styles.actionBtnText}>Preview</Text></TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
              <Text style={{ marginTop: 12, color: '#444' }}>Note: This feature requires configuring a Google OAuth Client ID and the expo-auth-session & secure-store packages. See project README for setup.</Text>
              <TouchableOpacity style={[styles.actionBtn, { marginTop: 10 }]} onPress={handleShowRedirectUris}>
                <Text style={styles.actionBtnText}>Show redirect URIs</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalOpen(false)}><Text style={{ color: '#185a9d', fontWeight: '700' }}>Close</Text></TouchableOpacity>
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
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', padding: 18, borderTopLeftRadius: 12, borderTopRightRadius: 12, minHeight: 180 },
  actionBtn: { backgroundColor: '#185a9d', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginTop: 6 },
  actionBtnText: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  closeBtn: { marginTop: 12, alignSelf: 'flex-end' },
});

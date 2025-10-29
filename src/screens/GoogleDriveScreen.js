import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, ActivityIndicator, FlatList, StyleSheet, Alert, Switch } from 'react-native';
import drive from '../utils/drive';

export default function DropboxScreen() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [useProxy, setUseProxy] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await drive.isConfigured().catch(() => false);
      if (!ok && mounted) {
        Alert.alert('Dropbox not configured', 'Please set dropboxAppKey in app.json (expo.extra.dropboxAppKey) before testing.');
        return;
      }
      const info = await drive.getUserInfo().catch(() => null);
      if (mounted && info) setUser(info);
    })();
    return () => { mounted = false; };
  }, []);

  const loadingWatchRef = useRef(null);
  const startLoading = (msg) => {
    try { if (loadingWatchRef.current) { clearTimeout(loadingWatchRef.current); loadingWatchRef.current = null; } } catch (e) {}
    setLoading(true);
    // optional message not used in this dev screen
    try { loadingWatchRef.current = setTimeout(() => { try { console.warn('GoogleDriveScreen: operation timeout'); } catch (e) {} ; setLoading(false); loadingWatchRef.current = null; }, 30000); } catch (e) {}
  };
  const stopLoading = () => { try { if (loadingWatchRef.current) { clearTimeout(loadingWatchRef.current); loadingWatchRef.current = null; } } catch (e) {}; setLoading(false); };

  async function handleSignIn() {
    startLoading();
    try {
      const res = await drive.signInAsync({ useProxyOverride: useProxy });
      const ui = await drive.getUserInfo();
      setUser(ui || null);
      const name = (ui && (ui.email || (ui.name && ui.name.display_name))) || 'Signed in';
      Alert.alert('Signed in', name);
    } catch (e) {
      Alert.alert('Sign in failed', String(e.message || e));
    } finally {
      stopLoading();
    }
  }

  async function handleSignOut() {
    startLoading();
    try {
      await drive.signOut();
      setUser(null);
      setFiles([]);
      Alert.alert('Signed out');
    } catch (e) {
      Alert.alert('Sign out failed', String(e.message || e));
    } finally {
      stopLoading();
    }
  }

  async function handleUploadTest() {
    startLoading();
    try {
      const now = new Date().toISOString();
      const payload = { test: true, ts: now };
      const name = `test_${now}.json`;
      const ok = await drive.uploadJsonFile(name, payload);
      Alert.alert('Upload OK', ok && ok.name ? `file: ${ok.name}` : 'uploaded');
    } catch (e) {
      Alert.alert('Upload failed', String(e.message || e));
    } finally {
      stopLoading();
    }
  }

  async function handleListFiles() {
    startLoading();
    try {
      const res = await drive.listFilesAsync('');
      const arr = (res && res.entries) ? res.entries : [];
      setFiles(arr);
      if (!arr.length) Alert.alert('No files found');
    } catch (e) {
      Alert.alert('List failed', String(e.message || e));
    } finally {
      stopLoading();
    }
  }

  async function handleShowDebugInfo() {
    startLoading();
    try {
      const info = await drive.getDebugInfo();
      Alert.alert('Dropbox debug', JSON.stringify(info, null, 2));
    } catch (e) {
      Alert.alert('Debug failed', String(e.message || e));
    } finally {
      stopLoading();
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dropbox Test</Text>
      {user ? (
        <View style={styles.info}>
          <Text style={styles.label}>Signed in:</Text>
          <Text>{(user && (user.name && user.name.display_name)) || user.email || 'Unknown'}</Text>
        </View>
      ) : (
        <Text style={styles.label}>Not signed in</Text>
      )}

      <View style={styles.buttons}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ marginRight: 8 }}>Use Expo proxy</Text>
          <Switch value={useProxy} onValueChange={setUseProxy} />
        </View>
        <View style={{ height: 8 }} />
        <Button title="Show Dropbox Debug" onPress={handleShowDebugInfo} disabled={loading} />
        <View style={{ height: 8 }} />
        <Button title={user ? 'Refresh files' : 'Sign in with Dropbox'} onPress={user ? handleListFiles : handleSignIn} disabled={loading} />
        <View style={{ height: 8 }} />
        <Button title="Upload test file" onPress={handleUploadTest} disabled={loading || !user} />
        <View style={{ height: 8 }} />
        <Button title="Sign out" onPress={handleSignOut} disabled={loading || !user} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      <FlatList
        style={{ marginTop: 12, width: '100%' }}
        data={files}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.fileRow}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: '#666' }}>{item.id}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 8, color: '#666' }}>No files to show</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 16 },
  title: { fontSize: 20, marginBottom: 12 },
  info: { alignItems: 'center', marginBottom: 8 },
  label: { color: '#333', marginBottom: 6 },
  buttons: { width: '100%', maxWidth: 420 },
  fileRow: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
});

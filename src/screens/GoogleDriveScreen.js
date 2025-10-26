import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, FlatList, StyleSheet, Alert, Switch } from 'react-native';
import drive from '../utils/drive';

export default function GoogleDriveScreen() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [useProxy, setUseProxy] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await drive.isConfigured().catch(() => false);
      if (!ok && mounted) {
        Alert.alert('Google OAuth not configured', 'Please set client IDs in app.json (expo.extra.googleClientId*) before testing.');
        return;
      }
      const info = await drive.getUserInfo().catch(() => null);
      if (mounted && info) setUser(info);
    })();
    return () => { mounted = false; };
  }, []);

  async function handleSignIn() {
    setLoading(true);
    try {
      const res = await drive.signInAsync({ useProxyOverride: useProxy });
      const ui = await drive.getUserInfo();
      setUser(ui || null);
      Alert.alert('Signed in', ui && ui.email ? ui.email : 'Signed in');
    } catch (e) {
      Alert.alert('Sign in failed', String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      await drive.signOut();
      setUser(null);
      setFiles([]);
      Alert.alert('Signed out');
    } catch (e) {
      Alert.alert('Sign out failed', String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadTest() {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const payload = { test: true, ts: now };
      const name = `test_${now}.json`;
      const ok = await drive.uploadJsonFile(name, payload);
      Alert.alert('Upload OK', ok && ok.id ? `file id: ${ok.id}` : 'uploaded');
    } catch (e) {
      Alert.alert('Upload failed', String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleListFiles() {
    setLoading(true);
    try {
      const res = await drive.listFilesAsync("name contains 'checklistapp_test' or name contains 'checklistapp_' ");
      const arr = (res && res.files) ? res.files : [];
      setFiles(arr);
      if (!arr.length) Alert.alert('No files found');
    } catch (e) {
      Alert.alert('List failed', String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Drive Test</Text>
      {user ? (
        <View style={styles.info}>
          <Text style={styles.label}>Signed in:</Text>
          <Text>{user.name || user.email}</Text>
        </View>
      ) : (
        <Text style={styles.label}>Not signed in</Text>
      )}

      <View style={styles.buttons}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ marginRight: 8 }}>Use Expo proxy</Text>
          <Switch value={useProxy} onValueChange={setUseProxy} />
        </View>
        <Button title={user ? 'Refresh files' : 'Sign in with Google'} onPress={user ? handleListFiles : handleSignIn} disabled={loading} />
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

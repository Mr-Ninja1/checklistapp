import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import SignatureField from '../components/SignatureField';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import formStorage from '../utils/formStorage';
import EditableFormContainer from '../components/EditableFormContainer';
import FormActionBar from '../components/FormActionBar';

const DRAFT_KEY = 'moulding_proofing_baking_log_draft';

const initialRows = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  product: '',
  proofStart: '',
  proofEnd: '',
  bakingTemp: '',
  bakingTime: '',
  staffName: '',
  staffSign: ''
}));

const initialMetadata = {
  date: new Date().toLocaleDateString(),
  location: '',
  shift: '',
  compiledBy: '',
};

export default function MouldingProofingBakingLog(props = {}) {
  const [rows, setRows] = useState(initialRows);
  const [meta, setMeta] = useState(initialMetadata);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d) {
          if (d.rows) setRows(d.rows);
          if (d.meta) setMeta(d.meta);
        }
        try {
          const asset = Asset.fromModule(require('../assets/logo.jpeg'));
          if (!asset.localUri) await asset.downloadAsync();
          const uri = asset.localUri || asset.uri;
          const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { rows, meta }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [rows, meta]);

  const setRowField = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const payload = {
        formType: 'MouldingProofingBakingLog',
        templateVersion: 'v1.0',
        title: 'MOULDING PROOFING AND BAKING LOG SHEET',
        date: meta.date,
        metadata: meta,
        formData: rows,
        assets: logoDataUri ? { logoDataUri } : {},
        savedAt: Date.now()
      };
      const formId = `${payload.formType}_${Date.now()}`;
      try {
        await formStorage.saveForm(formId, payload);
      } catch (e) {
        try { await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, meta: { metadata: meta, formData: rows } }); } catch (err) { /* ignore */ }
      }
      try { await removeDraft(DRAFT_KEY); } catch (e) {}
      setRows(initialRows);
      setMeta(initialMetadata);
      Alert.alert('Saved', 'Form saved');
    } catch (e) {
      Alert.alert('Error', 'Failed to save form');
    }
    setBusy(false);
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { rows, meta }); Alert.alert('Draft saved'); } catch (e) { Alert.alert('Failed to save draft'); }
    setBusy(false);
  };

  const actionButtons = (
    <FormActionBar onBack={() => props.navigation?.navigate?.('Home')} onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} showSavePdf={false} isSaving={busy} />
  );

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.metaBox}>
          <Text style={styles.title}>MOULDING PROOFING AND BAKING LOG SHEET</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}><Text style={styles.label}>Date:</Text><TextInput style={styles.input} value={meta.date} onChangeText={t => setMetaField('date', t)} /></View>
            <View style={styles.metaItem}><Text style={styles.label}>Location:</Text><TextInput style={styles.input} value={meta.location} onChangeText={t => setMetaField('location', t)} /></View>
            <View style={styles.metaItem}><Text style={styles.label}>Shift:</Text><TextInput style={styles.input} value={meta.shift} onChangeText={t => setMetaField('shift', t)} /></View>
          </View>
          <View style={{ marginTop: 8 }}><Text style={styles.label}>Compiled By:</Text><TextInput style={styles.input} value={meta.compiledBy} onChangeText={t => setMetaField('compiledBy', t)} /></View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.col, { flex: 2 }]}>Product</Text>
          <Text style={[styles.col, { flex: 1 }]}>Proof Start</Text>
          <Text style={[styles.col, { flex: 1 }]}>Proof End</Text>
          <Text style={[styles.col, { flex: 1 }]}>Bake Temp</Text>
          <Text style={[styles.col, { flex: 1 }]}>Bake Time</Text>
          <Text style={[styles.col, { flex: 1 }]}>Staff</Text>
          <Text style={[styles.col, { flex: 1 }]}>Sign</Text>
        </View>

        {rows.map(r => (
          <View key={r.id} style={styles.row}>
            <TextInput style={[styles.cell, { flex: 2 }]} value={r.product} onChangeText={t => setRowField(r.id, 'product', t)} editable={editMode} />
            <TextInput style={[styles.cell, { flex: 1 }]} value={r.proofStart} onChangeText={t => setRowField(r.id, 'proofStart', t)} editable={editMode} />
            <TextInput style={[styles.cell, { flex: 1 }]} value={r.proofEnd} onChangeText={t => setRowField(r.id, 'proofEnd', t)} editable={editMode} />
            <TextInput style={[styles.cell, { flex: 1 }]} value={r.bakingTemp} onChangeText={t => setRowField(r.id, 'bakingTemp', t)} editable={editMode} />
            <TextInput style={[styles.cell, { flex: 1 }]} value={r.bakingTime} onChangeText={t => setRowField(r.id, 'bakingTime', t)} editable={editMode} />
            <TextInput style={[styles.cell, { flex: 1 }]} value={r.staffName} onChangeText={t => setRowField(r.id, 'staffName', t)} editable={editMode} />
            <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
              <SignatureField value={r.staffSign} onChange={v => setRowField(r.id, 'staffSign', v)} editable={editMode} width={120} height={40} />
            </View>
          </View>
        ))}

      </ScrollView>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, backgroundColor: '#f7fbfc' },
  metaBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6, marginBottom: 12 },
  title: { fontWeight: '800', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flex: 1, marginRight: 8 },
  label: { fontWeight: '700', fontSize: 12, marginBottom: 4 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 6, paddingHorizontal: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eef2ff', padding: 8, borderWidth: 1, borderColor: '#dbeafe', marginBottom: 6 },
  col: { fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e6eef2', paddingVertical: 6, alignItems: 'center' },
  cell: { paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: '#e6eef2', marginHorizontal: 2, borderRadius: 4 },
});

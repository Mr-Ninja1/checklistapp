import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import useFormSave from '../hooks/useFormSave';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const DRAFT_KEY = 'fruit_washing_log_draft';
const MAX_ENTRIES = 15;

const initialLogEntry = {
  date: '',
  productWashed: '',
  sanitizerName: '',
  sanitizerConcentration: '',
  disinfectionStartTime: '',
  disinfectionEndTime: '',
  rinsingDone: '',
  personWashing: '',
  supSign: '',
};

const initialLogState = Array.from({ length: MAX_ENTRIES }, () => ({ ...initialLogEntry }));

const initialMetadata = {
  subject: 'FRUIT ,VEGETABLE & EGG WASHING + SANITIZING LOG',
  docNo: 'BBN-SHEQ-P-26.19b',
  issueDate: '',
  reviewDate: 'N/A',
  compiledBy: 'Michael C. Zulu',
  approvedBy: 'Hassani Ali',
  versionNo: '01',
  revNo: '00',
  site: '',
  verification: {
    hseqManagerSign: '',
    complexManagerSign: '',
    verifiedBySign: '',
  }
};

export default function FruitWashingLog() {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);
  // verification is nested on metadata.verification per template
  const [busy, setBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
        }
        // If no draft exists, ensure the entry rows are empty (no prefilled dates)
        if (mounted && !d) {
          setFormData(initialLogState);
        }
        // set issue date to today if not set
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayStr = `${dd}/${mm}/${yyyy}`;
        if (mounted && (!d || !d.metadata)) setMetadata(prev => ({ ...prev, issueDate: todayStr }));
      } catch (e) { console.warn('load draft failed', e); }
    })();
    // attempt to embed logo as base64 into payload so saved presentational is identical
    (async () => {
      let m = true;
      try {
        const asset = Asset.fromModule(require('../assets/logo.jpeg'));
        if (!asset.localUri) await asset.downloadAsync();
        const uri = asset.localUri || asset.uri;
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        if (b64 && m) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
      } catch (e) {
        // ignore and fall back to bundled image in presentational
      }
      return () => { m = false; };
    })();
    return () => { mounted = false; };
  }, []);

  // useFormSave: build payload and integrate autosave + save/submit handlers
  const draftId = DRAFT_KEY;
  const buildPayload = () => ({
    formType: 'FruitWashingLog',
    templateVersion: 'v1.0',
    title: 'FRUIT ,VEGETABLE & EGG WASHING + SANITIZING LOG',
    metadata,
    formData,
    // layout hints used by presentational renderers to keep column widths consistent
    layoutHints: {
      DATE: 80,
      NAME: 220,
      SANITIZER: 180,
      CONC: 140,
      START: 100,
      END: 100,
      RINSING: 80,
      PERSON: 160,
      SIGN: 100,
      gap: 8
    },
    _tableWidth: 80 + 220 + 180 + 140 + 100 + 100 + 80 + 160 + 100,
    assets: logoDataUri ? { logoDataUri } : undefined,
    savedAt: Date.now(),
  });

  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => {
    setFormData(initialLogState);
    setMetadata(initialMetadata);
  } });

  // Trigger the hook's debounced autosave when form data or metadata changes
  useEffect(() => {
    scheduleAutoSave();
  }, [formData, metadata]);

  const handleMetaChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    // trigger autosave when entries change (including signature updates)
    try { if (typeof scheduleAutoSave === 'function') scheduleAutoSave(); } catch (e) { /* ignore */ }
  }, [scheduleAutoSave]);

  const handleVerificationChange = (key, value) => setMetadata(prev => ({ ...prev, verification: { ...prev.verification, [key]: value } }));

  const submitAndRecord = async () => {
    try {
      await handleSubmit();
      try { await removeDraft(DRAFT_KEY); } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('submit failed', e);
    }
  };

  // UI: render buttons and overlays
  const saveDraftLocal = async () => {
    try {
      const res = await handleSaveDraft();
      try { console.info('FruitWashingLog: handleSaveDraft result', res); } catch (e) {}
      // Also mirror the payload to the legacy/native draft location to maximize
      // discoverability for getDraft (helps when storage fallbacks differ).
      try {
        const payload = buildPayload();
        await setDraft(DRAFT_KEY, payload);
        try { console.info('FruitWashingLog: setDraft wrote legacy/native draft'); } catch (e) {}
      } catch (e) {
        console.warn('FruitWashingLog: setDraft failed', e);
      }
      return res;
    } catch (e) {
      console.warn('FruitWashingLog: saveDraftLocal failed', e);
    }
  };

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={saveDraftLocal}>
      <ScrollView contentContainerStyle={styles.content}>
  <View style={styles.headerBox}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTitle}>Bravo!</Text>
              <Text style={styles.brandSubtitle}>Food Safety Inspections</Text>
            </View>
          </View>
          <Text style={styles.title}>{metadata.subject}</Text>
          <Text style={styles.meta}>Doc No: {metadata.docNo} • Issue Date: {metadata.issueDate}</Text>
        </View>

        {/* Site input */}
        <View style={styles.siteRow}>
          <Text style={styles.siteLabel}>SITE:</Text>
          {editMode ? (
            <TextInput style={styles.siteInput} value={metadata.site} onChangeText={v => handleMetaChange('site', v)} editable={true} />
          ) : (
            <Text style={styles.readOnlyCell}>{metadata.site}</Text>
          )}
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { flex: 1.5 }]}><Text style={styles.headerText}>Date</Text></View>
            <View style={[styles.headerCell, { flex: 2 }]}><Text style={styles.headerText}>Product being washed</Text></View>
            <View style={[styles.headerCell, { flex: 2 }]}><Text style={styles.headerText}>Name of Sanitizer Used</Text></View>
            <View style={[styles.headerCell, { flex: 2.5 }]}><Text style={styles.headerText}>Concentration of Sanitizer</Text></View>
            <View style={[styles.headerCell, { flex: 2, paddingHorizontal: 2 }]}><Text style={styles.headerText}>Disinfection Start time</Text></View>
            <View style={[styles.headerCell, { flex: 2, paddingHorizontal: 2 }]}><Text style={styles.headerText}>Disinfection End time</Text></View>
            <View style={[styles.headerCell, { flex: 1.5 }]}><Text style={styles.headerText}>Rinsing Done Yes/No</Text></View>
            <View style={[styles.headerCell, { flex: 2 }]}><Text style={styles.headerText}>Person washing fruits & veg</Text></View>
            <View style={[styles.headerCell, { flex: 1.5, borderRightWidth: 0 }]}><Text style={styles.headerText}>Sup Sign</Text></View>
          </View>

          {formData.map((item, idx) => (
            <View key={idx} style={styles.row}>
              <View style={[styles.cell, { flex: 1.5 }]}>{editMode ? <TextInput style={styles.input} value={item.date} onChangeText={v => handleEntryChange(idx, 'date', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.date}</Text>}</View>
              <View style={[styles.cell, { flex: 2 }]}>{editMode ? <TextInput style={styles.input} value={item.productWashed} onChangeText={v => handleEntryChange(idx, 'productWashed', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.productWashed}</Text>}</View>
              <View style={[styles.cell, { flex: 2 }]}>{editMode ? <TextInput style={styles.input} value={item.sanitizerName} onChangeText={v => handleEntryChange(idx, 'sanitizerName', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.sanitizerName}</Text>}</View>
              <View style={[styles.cell, { flex: 2.5 }]}>{editMode ? <TextInput style={styles.input} value={item.sanitizerConcentration} onChangeText={v => handleEntryChange(idx, 'sanitizerConcentration', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.sanitizerConcentration}</Text>}</View>
              <View style={[styles.cell, { flex: 2 }]}>{editMode ? <TextInput style={styles.input} value={item.disinfectionStartTime} onChangeText={v => handleEntryChange(idx, 'disinfectionStartTime', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.disinfectionStartTime}</Text>}</View>
              <View style={[styles.cell, { flex: 2 }]}>{editMode ? <TextInput style={styles.input} value={item.disinfectionEndTime} onChangeText={v => handleEntryChange(idx, 'disinfectionEndTime', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.disinfectionEndTime}</Text>}</View>
              <View style={[styles.cell, { flex: 1.5 }]}>{editMode ? <TextInput style={styles.input} value={item.rinsingDone} onChangeText={v => handleEntryChange(idx, 'rinsingDone', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.rinsingDone}</Text>}</View>
              <View style={[styles.cell, { flex: 2 }]}>{editMode ? <TextInput style={styles.input} value={item.personWashing} onChangeText={v => handleEntryChange(idx, 'personWashing', v)} editable={true} /> : <Text style={styles.readOnlyCell}>{item.personWashing}</Text>}</View>
              <View style={[styles.cell, { flex: 1.5, borderRightWidth: 0 }]}> 
                {editMode ? (
                  <SignatureField
                    value={item.supSign}
                    onChange={v => handleEntryChange(idx, 'supSign', v)}
                    editable={true}
                    width={100}
                    height={40}
                  />
                ) : (
                  (item.supSign && typeof item.supSign === 'string' && item.supSign.startsWith('data:')) ? (
                    <Image source={{ uri: item.supSign }} style={{ width: 100, height: 40, resizeMode: 'contain' }} />
                  ) : (
                    <Text style={styles.readOnlyCell}>{item.supSign}</Text>
                  )
                )}
              </View>
            </View>
          ))}

        </View>

        <View style={styles.verifyFooter}>
          {/* Verified by column */}
          <View style={[styles.verifyCol, { flex: 1 }]}>
            <Text style={styles.verifyLabel}>Verified by</Text>
            {editMode ? (
              <SignatureField
                value={metadata.verification?.verifiedBySign || ''}
                onChange={v => handleVerificationChange('verifiedBySign', v)}
                editable={true}
                width={160}
                height={48}
              />
            ) : (
              (metadata.verification?.verifiedBySign && typeof metadata.verification.verifiedBySign === 'string' && metadata.verification.verifiedBySign.startsWith('data:'))
                ? <Image source={{ uri: metadata.verification.verifiedBySign }} style={{ width: 160, height: 48, resizeMode: 'contain' }} />
                : <Text style={styles.readOnlyCell}>{metadata.verification?.verifiedBySign}</Text>
            )}
          </View>

          {/* HSEQ Manager column */}
          <View style={[styles.verifyCol, { flex: 1 }]}>
            <Text style={styles.verifyLabel}>HSEQ Manager</Text>
            {editMode ? (
              <SignatureField
                value={metadata.verification?.hseqManagerSign || ''}
                onChange={v => handleVerificationChange('hseqManagerSign', v)}
                editable={true}
                width={160}
                height={48}
              />
            ) : (
              (metadata.verification?.hseqManagerSign && typeof metadata.verification.hseqManagerSign === 'string' && metadata.verification.hseqManagerSign.startsWith('data:'))
                ? <Image source={{ uri: metadata.verification.hseqManagerSign }} style={{ width: 160, height: 48, resizeMode: 'contain' }} />
                : <Text style={styles.readOnlyCell}>{metadata.verification?.hseqManagerSign}</Text>
            )}
          </View>

          {/* Complex Manager column */}
          <View style={[styles.verifyCol, { flex: 1 }]}>
            <Text style={styles.verifyLabel}>Complex Manager</Text>
            {editMode ? (
              <SignatureField
                value={metadata.verification?.complexManagerSign || ''}
                onChange={v => handleVerificationChange('complexManagerSign', v)}
                editable={true}
                width={160}
                height={48}
              />
            ) : (
              (metadata.verification?.complexManagerSign && typeof metadata.verification.complexManagerSign === 'string' && metadata.verification.complexManagerSign.startsWith('data:'))
                ? <Image source={{ uri: metadata.verification.complexManagerSign }} style={{ width: 160, height: 48, resizeMode: 'contain' }} />
                : <Text style={styles.readOnlyCell}>{metadata.verification?.complexManagerSign}</Text>
            )}
          </View>
        </View>

  <View style={styles.buttonRow}>
  <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={saveDraftLocal} disabled={isSaving}><Text style={styles.btnText}>{isSaving ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
   <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={submitAndRecord} disabled={isSaving}><Text style={styles.btnText}>{isSaving ? 'Submitting...' : 'Submit Log'}</Text></TouchableOpacity>
  </View>
        <LoadingOverlay visible={isSaving} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
      </ScrollView>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12 },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  logo: { width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#fff' },
  brandTextWrap: { flexDirection: 'column' },
  brandTitle: { fontSize: 20, fontWeight: '800', color: '#185a9d' },
  brandSubtitle: { fontSize: 12, color: '#43cea2', fontWeight: '600' },
  title: { fontWeight: '800', fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 4 },
  meta: { fontSize: 12, color: '#555', marginBottom: 8 },
  siteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  siteLabel: { fontWeight: '700', marginRight: 8 },
  siteInput: { borderBottomWidth: 1, borderColor: '#ccc', padding: 4, flex: 1, borderBottomColor: '#222' },
  tableWrap: { backgroundColor: '#fff', borderRadius: 0, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { 
    padding: 4, // Reduced padding for better fit
    borderRightWidth: 1, 
    borderRightColor: '#333', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 48, // Ensure enough height for wrapping text
  },
  headerText: { fontSize: 10, fontWeight: '700', textAlign: 'center' }, // Reduced font size
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333', minHeight: 44 },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  input: { padding: 6, fontSize: 12, textAlign: 'center', minHeight: 36, backgroundColor: 'transparent' },
  verifyFooter: { marginTop: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  verifyCol: { flex: 1, },
  verifyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  verifyText: { fontSize: 12, fontWeight: '500' },
  verifyInput: { borderBottomWidth: 1, borderColor: '#333', padding: 2, flex: 1, marginLeft: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';
import formStorage from '../utils/formStorage';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, removeDraft } from '../utils/formDrafts';
import EditableFormContainer from '../components/EditableFormContainer';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';

const DRAFT_KEY = 'products_net_content_checklist_draft';

const PRODUCT_LIST = [
  { name: 'BURGER ROLLS', expectedWeight: '80-105' },
  { name: 'BAGELS', expectedWeight: '80-100' },
  { name: 'MALVA PUDDING', expectedWeight: '100-125' },
  { name: 'PORTUGUESE ROLLS', expectedWeight: '170-205' },
  { name: 'ALMOND BROWNIES', expectedWeight: '130-150' },
  { name: 'CHEESE CAKE', expectedWeight: '130-150' },
  { name: 'PIZZA DOUGH', expectedWeight: '340-375' },
  { name: 'BRAVO BREAD', expectedWeight: '690-720' },
];

const initialEntry = { name: '', expectedWeight: '', weight1: '', weight2: '', weight3: '', weight4: '', weight5: '', date: '' };
// include three empty rows for user entry
const initialLogState = PRODUCT_LIST.map(p => ({ ...p, ...initialEntry })).concat(
  Array.from({ length: 3 }).map(() => ({ ...initialEntry }))
);

const initialMetadata = {
  subject: 'PRODUCTS NET CONTENT CHECKLIST',
  docNo: 'BBN-SHEQ-NCC-1',
  issueDate: '',
  compiledBy: 'Michael Zulu C.',
  approvedBy: 'Hassani Ali',
  versionNo: '01',
  revNo: '00',
  frequency: 'DAILY',
};

export default function ProductsNetContentChecklist() {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [verification, setVerification] = useState({ supervisorSign: '', hseqManagerSign: '', complexManagerSign: '' });
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await formStorage.loadForm(DRAFT_KEY);
        const payload = d?.payload || null;
        if (payload && mounted) {
          if (payload.formData) setFormData(payload.formData);
          if (payload.metadata) setMetadata(payload.metadata);
        }
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayStr = `${dd}/${mm}/${yyyy}`;
        if (mounted) {
          setMetadata(prev => ({ ...prev, issueDate: todayStr }));
          setFormData(prev => prev.map(item => ({ ...item, date: item.date || todayStr })));
        }
      } catch (e) { console.warn('load draft failed', e); }
      // preload logo as base64 for saved payloads
      try {
        const asset = Asset.fromModule(require('../assets/logo.jpeg'));
        await asset.downloadAsync();
        if (asset.localUri) {
          const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
          if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // autosave handled by useFormSave scheduleAutoSave

  const [logoDataUri, setLogoDataUri] = useState(null);

  // payload includes layout hints and preloaded logo for faithful saved render
  const columnFlex = [3,1,2,1,1,1,1,1];
  const buildPayload = (status = 'draft') => ({
    formType: 'ProductsNetContentChecklist',
    templateVersion: '01',
    title: 'Products Net Content Checklist',
    metadata,
    formData,
    verification,
    layoutHints: { name: 3, date: 1, expectedWeight: 2, weight1: 1, weight2: 1, weight3: 1, weight4: 1, weight5: 1 },
    _tableWidth: columnFlex.reduce((s, v) => s + v, 0),
    assets: logoDataUri ? { logoDataUri } : {},
    savedAt: new Date().toISOString(),
    status,
  });

  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft } = useFormSave({ buildPayload, draftId: DRAFT_KEY, waitForSave: false });

  // Custom handleSubmit that preserves draft after submission
  const handleSubmit = async () => {
    try {
      const payload = buildPayload('submitted');
      await addFormHistory({ title: payload.title, date: payload.metadata?.issueDate, savedAt: Date.now(), payload });
      // Draft is NOT removed - it persists in storage
      // State is NOT reset - UI remains populated with submitted data
    } catch (e) {
      console.warn('submit failed', e);
      throw e;
    }
  };

  // Clear draft and reset all state
  const handleClearDraft = async () => {
    const ok = await new Promise(resolve => {
      Alert.alert('Clear draft', 'This action will clear the draft and all your progress. Are you sure you want to continue?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Yes, Clear', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!ok) return;
    try { await removeDraft(DRAFT_KEY); } catch (e) { console.warn('removeDraft failed', e); }
    setFormData(initialLogState);
    setVerification({ supervisorSign: '', hseqManagerSign: '', complexManagerSign: '' });
    setEditMode(false);
  };

  // edit mode: default read-only for smooth scrolling; toggle to edit to enable inputs
  const [editMode, setEditMode] = React.useState(false);

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newData = prev.map((item, i) => i === index ? { ...item, [field]: value } : item);
      try { scheduleAutoSave(); } catch (e) {}
      return newData;
    });
  }, [scheduleAutoSave]);

  const handleVerificationChange = (key, value) => setVerification(prev => ({ ...prev, [key]: value }));

  const handleSaveDraftLocal = async () => {
    setBusy(true);
    try { await handleSaveDraft(); } catch (e) { console.warn('save draft failed', e); }
    setBusy(false);
  };

  const handleSubmitLocal = async () => {
    setBusy(true);
    try {
      console.log('ProductsNetContentChecklist: submit button pressed');
      await handleSubmit();
    } catch (e) {
      console.warn('submit failed', e);
    } finally {
      setBusy(false);
      // exit edit mode after submit to return to read-only scrolling view
      setEditMode(false);
    }
  };

  const actionButtons = (
    <View style={styles.buttonRow}>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 }]} onPress={handleSaveDraftLocal} disabled={busy || isSaving}><Text style={[styles.btnText, { fontSize: 16 }]}>{(busy || isSaving) ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 }]} onPress={handleSubmitLocal} disabled={busy || isSaving}><Text style={[styles.btnText, { fontSize: 16 }]}>{(busy || isSaving) ? 'Submitting...' : 'Submit Checklist'}</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#e53e3e', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 }]} onPress={handleClearDraft} disabled={busy || isSaving}><Text style={[styles.btnText, { fontSize: 16 }]}>Clear Draft</Text></TouchableOpacity>
    </View>
  );

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraftLocal} actionButtons={actionButtons}>
      <View style={styles.container}>
      <ScrollView contentContainerStyle={{ ...styles.content, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">

  <View style={styles.headerBox}>
          <View style={styles.logoRow}>
            <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>Bravo Brands Limited</Text>
              <Text style={styles.brandSub}>Food Safety Inspections</Text>
            </View>
          </View>
          <Text style={[styles.title, { fontSize: 20 } ]}>PRODUCTS NET CONTENT CHECKLIST</Text>
          {editMode ? (
            <TextInput style={[styles.valueTextInput, { flex: 1 }]} value={metadata.issueDate} onChangeText={v => setMetadata(prev => ({ ...prev, issueDate: v }))} />
          ) : (
            <Text style={styles.meta}>Doc No: {metadata.docNo} • Issue Date: {metadata.issueDate}</Text>
          )}
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { flex: 3 }]}><Text style={styles.headerText}>NAME OF PRODUCT</Text></View>
            <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>DATE</Text></View>
            <View style={[styles.headerCell, { flex: 2 }]}><Text style={styles.headerText}>EXPECTED WEIGHT (g)</Text></View>
            <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>W1</Text></View>
            <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>W2</Text></View>
            <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>W3</Text></View>
            <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>W4</Text></View>
            <View style={[styles.headerCell, { flex: 1 }]}><Text style={styles.headerText}>W5</Text></View>
          </View>

          {formData.map((item, idx) => (
            <View key={idx} style={styles.row}>
              <View style={[styles.cell, { flex: 3 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={String(item.name || '')} onChangeText={v => handleEntryChange(idx, 'name', v)} placeholder="Product name" />
                ) : (
                  <Text style={styles.readOnlyText}>{String(item.name || '')}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={item.date} onChangeText={v => handleEntryChange(idx, 'date', v)} placeholder="DD/MM/YYYY" />
                ) : (
                  <Text style={styles.readOnlyText}>{item.date}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 2 }]}> 
                {editMode ? (
                  <TextInput style={styles.input} value={String(item.expectedWeight || '')} onChangeText={v => handleEntryChange(idx, 'expectedWeight', v)} placeholder="expected g" />
                ) : (
                  <Text style={styles.readOnlyText}>{String(item.expectedWeight || '')}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={item.weight1} onChangeText={v => handleEntryChange(idx, 'weight1', v)} keyboardType="default" />
                ) : (
                  <Text style={styles.readOnlyText}>{item.weight1}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={item.weight2} onChangeText={v => handleEntryChange(idx, 'weight2', v)} keyboardType="default" />
                ) : (
                  <Text style={styles.readOnlyText}>{item.weight2}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={item.weight3} onChangeText={v => handleEntryChange(idx, 'weight3', v)} keyboardType="default" />
                ) : (
                  <Text style={styles.readOnlyText}>{item.weight3}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={item.weight4} onChangeText={v => handleEntryChange(idx, 'weight4', v)} keyboardType="default" />
                ) : (
                  <Text style={styles.readOnlyText}>{item.weight4}</Text>
                )}
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                {editMode ? (
                  <TextInput style={styles.input} value={item.weight5} onChangeText={v => handleEntryChange(idx, 'weight5', v)} keyboardType="default" />
                ) : (
                  <Text style={styles.readOnlyText}>{item.weight5}</Text>
                )}
              </View>
            </View>
          ))}

        </View>

        <View style={styles.verifyFooter}>
          <View style={styles.verifyCol} />
          <View style={styles.verifyCol}>
            {editMode ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', marginBottom: 6 }}>Supervisor</Text>
                <SignatureField value={verification.supervisorSign} onChange={v => handleVerificationChange('supervisorSign', v)} editable={editMode} width={220} height={60} placeholder="Supervisor" />
              </View>
            ) : (() => {
              const v = verification.supervisorSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', marginBottom: 6 }}>Supervisor</Text>
                  {uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.readOnlyText}>{v || ''}</Text>}
                </View>
              );
            })()}
            {editMode ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', marginBottom: 6 }}>HSEQ Manager</Text>
                <SignatureField value={verification.hseqManagerSign} onChange={v => handleVerificationChange('hseqManagerSign', v)} editable={editMode} width={220} height={60} placeholder="HSEQ Manager" />
              </View>
            ) : (() => {
              const v = verification.hseqManagerSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', marginBottom: 6 }}>HSEQ Manager</Text>
                  {uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.readOnlyText}>{v || ''}</Text>}
                </View>
              );
            })()}
            {editMode ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', marginBottom: 6 }}>Complex manager</Text>
                <SignatureField value={verification.complexManagerSign} onChange={v => handleVerificationChange('complexManagerSign', v)} editable={editMode} width={220} height={60} placeholder="Complex Manager" />
              </View>
            ) : (() => {
              const v = verification.complexManagerSign;
              const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
              return (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', marginBottom: 6 }}>Complex manager</Text>
                  {uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.readOnlyText}>{v || ''}</Text>}
                </View>
              );
            })()}
          </View>
        </View>

        {/* action buttons moved into EditableFormContainer via actionButtons prop */}
  <LoadingOverlay visible={isSaving || busy} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />

      </ScrollView>
      </View>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12 },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 40, height: 40, marginRight: 8 },
  brandWrap: { flexDirection: 'column' },
  brand: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  title: { fontWeight: '800', fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 4 },
  meta: { fontSize: 12, color: '#555', marginBottom: 8 },
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333', minHeight: 48 },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  staticText: { fontWeight: '600', fontSize: 12, color: '#444' },
  input: { padding: 6, fontSize: 12, textAlign: 'center', minHeight: 36, backgroundColor: 'transparent' },
  verifyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  verifyCol: { flex: 1, marginRight: 12 },
  verifyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifyInput: { borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 6, minHeight: 36, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  readOnlyText: { fontSize: 12, textAlign: 'center', minHeight: 36, color: '#222', paddingVertical: 6 },
});

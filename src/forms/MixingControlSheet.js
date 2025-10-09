import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'mixing_control_sheet_draft';

const initialEntry = {
  prodDate: '',
  prodName: '',
  batchNo: '',
  ingredients: '',
  ingredientsWeight: '',
  mixingTime: '',
  mixingTemp: '',
  doughDividingScaling: '',
  productQuantity: '',
  mixerManSign: '',
  supSign: '',
};

const initialLogState = Array.from({ length: 15 }, () => ({ ...initialEntry }));

const initialMetadata = {
  docNo: 'BBN-SHEQ-BKP-F-02-01a',
  issueDate: '',
  revisionDate: 'N/A',
  compiledBy: 'Michael Zulu C.',
  approvedBy: 'Hassani Ali',
  versionNo: '01',
  revNo: '00',
};

export default function MixingControlSheet() {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [verification, setVerification] = useState({ mixerManSign: '', complexManagerSign: '' });
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
          if (d.verification) setVerification(d.verification);
        } else if (mounted) {
          // auto-populate issueDate
          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const yyyy = today.getFullYear();
          setMetadata(prev => ({ ...prev, issueDate: `${dd}/${mm}/${yyyy}` }));
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata, verification }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata, verification]);

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }, []);

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata, verification }); console.log('Draft saved'); }
    catch (e) { console.warn('save draft failed', e); }
    finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Mixing Control Sheet', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData, verification } });
      await removeDraft(DRAFT_KEY);
      setFormData(initialLogState);
      setVerification({ mixerManSign: '', complexManagerSign: '' });
    } catch (e) { console.warn('submit failed', e); }
    finally { setBusy(false); }
  };

  // column widths chosen for readability / A4
  const columnHeaders = useMemo(() => [
    { key: 'prodDate', label: 'PRODUCTION DATE', width: 120 },
    { key: 'prodName', label: 'PRODUCT NAME', width: 180 },
    { key: 'batchNo', label: 'BATCH NO.', width: 100 },
    { key: 'ingredients', label: 'INGREDIENTS', width: 220 },
    { key: 'ingredientsWeight', label: 'INGREDIENTS WEIGHT (kgs)', width: 160 },
    { key: 'mixingTime', label: 'MIXING TIME', width: 120 },
    { key: 'mixingTemp', label: 'MIXING TEMP', width: 120 },
    { key: 'doughDividingScaling', label: 'DOUGH DIVIDING/SCALING (kgs)', width: 160 },
    { key: 'productQuantity', label: 'PRODUCT QUANTITY', width: 120 },
    { key: 'mixerManSign', label: 'MIXER MAN SIGN', width: 140 },
    { key: 'supSign', label: 'SUP SIGN', width: 140 },
  ], []);

  const renderRow = (item, index) => (
    <View key={index} style={styles.row}>
      {columnHeaders.map(col => (
        <View key={col.key} style={[styles.cell, { width: col.width }]}>
          <TextInput
            value={item[col.key]}
            onChangeText={v => handleEntryChange(index, col.key, v)}
            style={styles.input}
            multiline={true}
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={styles.headerTop}>
            <View style={styles.logoWrap}>
              <Image source={require('../assets/logo.png')} style={styles.logo} />
              <View>
                <Text style={styles.brand}>Bravo Brands Limited</Text>
                <Text style={styles.sub}>Food Safety Management System</Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Doc No: {metadata.docNo}</Text>
              <Text style={styles.metaLabel}>Issue Date: {metadata.issueDate}</Text>
              <Text style={styles.metaLabel}>Revision Date: {metadata.revisionDate}</Text>
            </View>
          </View>
          <View style={styles.subjectRow}><Text style={styles.subjectText}>Subject: MIXING CONTROL SHEET</Text></View>
          <View style={styles.signRow}>
            <Text style={styles.metaSmall}>Compiled By: {metadata.compiledBy}</Text>
            <Text style={styles.metaSmall}>Approved By: {metadata.approvedBy}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Instructions:</Text>
          <Text style={styles.noteText}>This form should be completed daily by both Mixer Man and Supervisor. File this form as evidence of performing the controls.</Text>
        </View>

        <View style={styles.verifyRow}>
          <View style={styles.verifyInput}>
            <Text style={styles.verifyLabel}>VERIFIED BY:</Text>
            <TextInput value={verification.mixerManSign} onChangeText={v => setVerification(prev => ({ ...prev, mixerManSign: v }))} style={styles.smallInput} />
          </View>
          <View style={styles.verifyInput}>
            <Text style={styles.verifyLabel}>COMPLEX MANAGER SIGN:</Text>
            <TextInput value={verification.complexManagerSign} onChangeText={v => setVerification(prev => ({ ...prev, complexManagerSign: v }))} style={styles.smallInput} />
          </View>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            {columnHeaders.map(col => (
              <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>
          {formData.map(renderRow)}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}>
            <Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}>
            <Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Log'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12 },
  headerBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef2', marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  sub: { fontSize: 12, color: '#43cea2' },
  metaCol: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 12, color: '#333' },
  subjectRow: { paddingVertical: 8, alignItems: 'center' },
  subjectText: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaSmall: { fontSize: 12, color: '#333' },
  noteBox: { backgroundColor: '#fff9f0', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#f0d9b5', marginBottom: 12 },
  noteTitle: { fontWeight: '700', marginBottom: 4 },
  noteText: { fontSize: 12, color: '#444' },
  verifyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  verifyInput: { flex: 1, marginRight: 8 },
  verifyLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  smallInput: { borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 6, minHeight: 36 },
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#333' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333' },
  input: { padding: 8, fontSize: 12, textAlign: 'left', minHeight: 48, lineHeight: 18 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});

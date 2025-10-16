import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'boh_shelf_life_inspection_draft';

const initialProducts = [
  { name: 'Bread Loaf' },
  { name: 'Buns' },
  { name: 'Rolls' },
  { name: 'Pastries' },
  { name: 'Cakes' },
  { name: 'Cookies' },
  { name: 'Other' },
];

const initialEntry = {
  dateIn: '',
  timeIn: '',
  usedBy: '',
  bakerChefName: '',
  quantity: '',
  sign: '',
};

const initialLogState = initialProducts.map(p => ({ ...p, ...initialEntry }));

const initialMetadata = {
  docNo: 'BBN-SHEQ-BOH-F-02-01c',
  frequency: 'Daily',
  date: '',
  compiledBy: 'Michael Zulu C.',
  dateOfIssue: '',
};

const initialVerification = {
  hseqManagerSign: '',
  complexManagerSign: '',
  baristaSign: '',
};

export default function BOH_ShelfLifeInspectionChecklist() {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [verification, setVerification] = useState(initialVerification);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);
  const { width: windowWidth } = useWindowDimensions();

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
          // auto-populate date fields
          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const yyyy = today.getFullYear();
          setMetadata(prev => ({ ...prev, date: `${dd}/${mm}/${yyyy}`, dateOfIssue: `${dd}/${mm}/${yyyy}` }));
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

  const handleVerificationChange = (key, value) => {
    setVerification(prev => ({ ...prev, [key]: value }));
  };

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata, verification }); } catch (e) { console.warn('save draft failed', e); }
    setBusy(false);
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'BOH Products Shelf-Life Inspection Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData, verification } });
      await removeDraft(DRAFT_KEY);
      setFormData(initialLogState);
      setVerification(initialVerification);
    } catch (e) { console.warn('submit failed', e); }
    setBusy(false);
  };

  // use flex weights so columns scale and can expand for A4-like width
  const columnHeaders = useMemo(() => [
    { key: 'name', label: 'ITEMS', flex: 3, isStatic: true },
    { key: 'dateIn', label: 'DATE IN', flex: 1 },
    { key: 'timeIn', label: 'TIME IN', flex: 1 },
    { key: 'usedBy', label: 'USED BY', flex: 2 },
    { key: 'bakerChefName', label: "BAKER/CHEF'S NAME", flex: 3 },
    { key: 'quantity', label: 'QUANTITY', flex: 1 },
    { key: 'sign', label: 'SIGN', flex: 1 },
  ], []);

  // compute widths so columns fill the available view width
  const totalFlex = columnHeaders.reduce((s, c) => s + (c.flex || 1), 0);
  const tableAvailableWidth = Math.max(windowWidth - 32, 600); // leave some margin; ensure minimum width
  const colPixel = (flex) => Math.floor((flex / totalFlex) * tableAvailableWidth);

  const renderRow = (item, index) => (
    <View key={index} style={styles.row}>
      {columnHeaders.map(col => {
        const w = colPixel(col.flex || 1);
        if (col.isStatic) {
          return (
            <View key={col.key} style={[styles.cell, { width: w, backgroundColor: '#f7f7fa' }]}>
              <Text style={styles.staticText}>{item.name}</Text>
            </View>
          );
        }
        return (
          <View key={col.key} style={[styles.cell, { width: w }]}> 
            <TextInput
              value={item[col.key]}
              onChangeText={v => handleEntryChange(index, col.key, v)}
              style={styles.input}
              multiline={true}
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={styles.logoWrap}><Image source={require('../assets/logo.jpeg')} style={styles.logo} /><Text style={styles.brand}>Bravo Brands Limited</Text></View>
          <Text style={styles.title}>BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST</Text>
          <Text style={styles.frequency}>FREQUENCY: {metadata.frequency}</Text>
        </View>

        <View style={[styles.tableWrap, { width: tableAvailableWidth }]}> 
          <View style={styles.tableHeader}>
            {columnHeaders.map(col => (
              <View key={col.key} style={[styles.headerCell, { width: colPixel(col.flex || 1) }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>
          {formData.map(renderRow)}
        </View>

        <View style={styles.verifyFooter}>
          <View style={styles.verifyCol}>
            <Text style={styles.verifyLabel}>Verified By:</Text>
            <TextInput value={verification.hseqManagerSign} onChangeText={v => handleVerificationChange('hseqManagerSign', v)} style={styles.verifyInput} placeholder="HSEQ Manager Sign" />
            <TextInput value={verification.complexManagerSign} onChangeText={v => handleVerificationChange('complexManagerSign', v)} style={styles.verifyInput} placeholder="Complex Manager Sign" />
            <Text style={styles.metaText}>DOC NO: {metadata.docNo}</Text>
            <View style={styles.metaRow}><Text style={styles.metaText}>DATE:</Text><TextInput value={metadata.date} onChangeText={v => handleMetadataChange('date', v)} style={styles.metaInput} placeholder="DD/MM/YYYY" /></View>
          </View>
          <View style={styles.verifyCol}>
            <TextInput value={verification.baristaSign} onChangeText={v => handleVerificationChange('baristaSign', v)} style={styles.verifyInput} placeholder="Barista Sign" />
            <Text style={styles.metaText}>COMPILED BY: {metadata.compiledBy}</Text>
            <Text style={styles.metaText}>DATE OF ISSUE: {metadata.dateOfIssue}</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}><Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Checklist'}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12 },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 40, height: 40, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  title: { fontWeight: '800', fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 4 },
  frequency: { fontSize: 13, color: '#d32f2f', fontWeight: 'bold', marginBottom: 8 },
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden', paddingHorizontal: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { paddingVertical: 12, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333', minHeight: 56 },
  cell: { paddingVertical: 8, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  staticText: { fontWeight: '600', fontSize: 12, color: '#444' },
  input: { padding: 8, fontSize: 12, textAlign: 'left', minHeight: 48, lineHeight: 18 },
  verifyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  verifyCol: { flex: 1, marginRight: 12 },
  verifyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifyInput: { borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 6, minHeight: 36, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#333', marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  metaInput: { borderWidth: 1, borderColor: '#ccc', padding: 4, borderRadius: 6, minWidth: 80 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});
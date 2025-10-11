import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

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
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
        }
        // auto-populate issue date and item dates when no draft exists
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayStr = `${dd}/${mm}/${yyyy}`;
        // always set issue date to system current date
        if (mounted) {
          setMetadata(prev => ({ ...prev, issueDate: todayStr }));
          setFormData(prev => prev.map(item => ({ ...item, date: item.date || todayStr })));
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

  const handleVerificationChange = (key, value) => setVerification(prev => ({ ...prev, [key]: value }));

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata, verification }); } catch (e) { console.warn('save draft failed', e); }
    setBusy(false);
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Products Net Content Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData, verification } });
      await removeDraft(DRAFT_KEY);
      setFormData(initialLogState);
      setVerification({ supervisorSign: '', hseqManagerSign: '', complexManagerSign: '' });
    } catch (e) { console.warn('submit failed', e); }
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.headerBox}>
          <View style={styles.logoRow}>
            <Image source={require('../assets/logo.png')} style={styles.logo} />
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>Bravo Brands Limited</Text>
              <Text style={styles.brandSub}>Food Safety Inspections</Text>
            </View>
          </View>
          <Text style={styles.title}>PRODUCTS NET CONTENT CHECKLIST</Text>
          <Text style={styles.meta}>Doc No: {metadata.docNo} • Issue Date: {metadata.issueDate}</Text>
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
              <View style={[styles.cell, { flex: 3 }]}>{
                item.name && String(item.name).trim() ? (
                  <Text style={styles.staticText}>{item.name}</Text>
                ) : (
                  <TextInput style={styles.input} value={item.name} onChangeText={v => handleEntryChange(idx, 'name', v)} placeholder="Product name" />
                )
              }</View>
              <View style={[styles.cell, { flex: 1 }]}><TextInput style={styles.input} value={item.date} onChangeText={v => handleEntryChange(idx, 'date', v)} placeholder="DD/MM/YYYY" /></View>
              <View style={[styles.cell, { flex: 2 }]}>{
                item.expectedWeight && String(item.expectedWeight).trim() ? (
                  <Text style={styles.staticText}>{item.expectedWeight}</Text>
                ) : (
                  <TextInput style={styles.input} value={item.expectedWeight} onChangeText={v => handleEntryChange(idx, 'expectedWeight', v)} placeholder="expected g" />
                )
              }</View>
              <View style={[styles.cell, { flex: 1 }]}><TextInput style={styles.input} value={item.weight1} onChangeText={v => handleEntryChange(idx, 'weight1', v)} keyboardType="numeric" /></View>
              <View style={[styles.cell, { flex: 1 }]}><TextInput style={styles.input} value={item.weight2} onChangeText={v => handleEntryChange(idx, 'weight2', v)} keyboardType="numeric" /></View>
              <View style={[styles.cell, { flex: 1 }]}><TextInput style={styles.input} value={item.weight3} onChangeText={v => handleEntryChange(idx, 'weight3', v)} keyboardType="numeric" /></View>
              <View style={[styles.cell, { flex: 1 }]}><TextInput style={styles.input} value={item.weight4} onChangeText={v => handleEntryChange(idx, 'weight4', v)} keyboardType="numeric" /></View>
              <View style={[styles.cell, { flex: 1 }]}><TextInput style={styles.input} value={item.weight5} onChangeText={v => handleEntryChange(idx, 'weight5', v)} keyboardType="numeric" /></View>
            </View>
          ))}

        </View>

        <View style={styles.verifyFooter}>
          <View style={styles.verifyCol}><Text style={styles.verifyLabel}>Verified By</Text></View>
          <View style={styles.verifyCol}>
            <TextInput style={styles.verifyInput} value={verification.supervisorSign} onChangeText={v => handleVerificationChange('supervisorSign', v)} placeholder="Supervisor" />
            <TextInput style={styles.verifyInput} value={verification.hseqManagerSign} onChangeText={v => handleVerificationChange('hseqManagerSign', v)} placeholder="HSEQ Manager" />
            <TextInput style={styles.verifyInput} value={verification.complexManagerSign} onChangeText={v => handleVerificationChange('complexManagerSign', v)} placeholder="Complex Manager" />
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
});

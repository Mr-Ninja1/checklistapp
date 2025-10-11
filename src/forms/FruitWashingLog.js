import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

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
  subject: 'FRUIT, VEGETABLE AND EGG WASHING & SANITIZING LOG',
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
  }
};

export default function FruitWashingLog() {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);
  // verification is nested on metadata.verification per template
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
        // set issue date to today if not set
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayStr = `${dd}/${mm}/${yyyy}`;
        if (mounted && (!d || !d.metadata)) setMetadata(prev => ({ ...prev, issueDate: todayStr }));
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  const handleMetaChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }, []);

  const handleVerificationChange = (key, value) => setMetadata(prev => ({ ...prev, verification: { ...prev.verification, [key]: value } }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
  await addFormHistory({ title: 'Fruit, Vegetable and Egg Washing & Sanitizing Log', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { ...metadata, formData: formData.filter(item => item.productWashed) } });
      await removeDraft(DRAFT_KEY);
      setFormData(initialLogState);
  // reset verification nested in metadata
  setMetadata(prev => ({ ...prev, verification: { hseqManagerSign: '', complexManagerSign: '' }, site: '' }));
    } catch (e) { console.warn('submit failed', e); }
    setBusy(false);
  };

  const handleSaveDraft = async () => {
    setBusy(true);
  try { await setDraft(DRAFT_KEY, { formData, metadata }); } catch (e) { console.warn('save draft failed', e); }
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={styles.brandRow}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
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
          <TextInput style={styles.siteInput} value={metadata.site} onChangeText={v => handleMetaChange('site', v)} placeholder="Site name" />
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
              <View style={[styles.cell, { flex: 1.5 }]}><TextInput style={styles.input} value={item.date} onChangeText={v => handleEntryChange(idx, 'date', v)} placeholder="YYYY-MM-DD" /></View>
              <View style={[styles.cell, { flex: 2 }]}><TextInput style={styles.input} value={item.productWashed} onChangeText={v => handleEntryChange(idx, 'productWashed', v)} placeholder="Product" /></View>
              <View style={[styles.cell, { flex: 2 }]}><TextInput style={styles.input} value={item.sanitizerName} onChangeText={v => handleEntryChange(idx, 'sanitizerName', v)} placeholder="Sanitizer" /></View>
              <View style={[styles.cell, { flex: 2.5 }]}><TextInput style={styles.input} value={item.sanitizerConcentration} onChangeText={v => handleEntryChange(idx, 'sanitizerConcentration', v)} placeholder="Conc." /></View>
              <View style={[styles.cell, { flex: 2 }]}><TextInput style={styles.input} value={item.disinfectionStartTime} onChangeText={v => handleEntryChange(idx, 'disinfectionStartTime', v)} placeholder="HH:MM" /></View>
              <View style={[styles.cell, { flex: 2 }]}><TextInput style={styles.input} value={item.disinfectionEndTime} onChangeText={v => handleEntryChange(idx, 'disinfectionEndTime', v)} placeholder="HH:MM" /></View>
              <View style={[styles.cell, { flex: 1.5 }]}><TextInput style={styles.input} value={item.rinsingDone} onChangeText={v => handleEntryChange(idx, 'rinsingDone', v)} placeholder="Y/N" /></View>
              <View style={[styles.cell, { flex: 2 }]}><TextInput style={styles.input} value={item.personWashing} onChangeText={v => handleEntryChange(idx, 'personWashing', v)} placeholder="Name" /></View>
              <View style={[styles.cell, { flex: 1.5, borderRightWidth: 0 }]}><TextInput style={styles.input} value={item.supSign} onChangeText={v => handleEntryChange(idx, 'supSign', v)} placeholder="Sign" /></View>
            </View>
          ))}

        </View>

        <View style={styles.verifyFooter}>
          <View style={[styles.verifyCol, { flex: 0.5 }]}><Text style={styles.verifyLabel}>Verified by: ....................</Text></View>
          <View style={styles.verifyCol}>
            <View style={styles.verifyRow}>
              <Text style={styles.verifyText}>HSEQ Manager:</Text>
              <TextInput style={styles.verifyInput} value={metadata.verification?.hseqManagerSign || ''} onChangeText={v => handleVerificationChange('hseqManagerSign', v)} placeholder="Sign" />
            </View>
          </View>
          <View style={styles.verifyCol}>
            <View style={styles.verifyRow}>
              <Text style={styles.verifyText}>COMPLEX manager sign:</Text>
              <TextInput style={styles.verifyInput} value={metadata.verification?.complexManagerSign || ''} onChangeText={v => handleVerificationChange('complexManagerSign', v)} placeholder="Sign" />
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}><Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Log'}</Text></TouchableOpacity>
        </View>

      </ScrollView>
    </View>
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
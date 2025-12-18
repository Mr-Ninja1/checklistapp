import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import formStorage from '../utils/formStorage';
import SignatureField from '../components/SignatureField';
import EditableFormContainer from '../components/EditableFormContainer';
import LoadingOverlay from '../components/LoadingOverlay';
import FormActionBar from '../components/FormActionBar';
import NotificationModal from '../components/NotificationModal';

// Template for a single product row matching your refined spreadsheet draft
const createRow = () => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  product: '',
  batchNo: '',
  time: '',
  dateReceived: '',
  appearance: '',
  weight: '',
  texture: '',
  organicTest: '',
  result: '', // Now a text input
  comment: '',
  sampledBy: '', // Last column
  sfcSign: '',
});

const initialFormData = {
  issueDate: '',
  // Initializing with exactly 5 rows
  products: [createRow(), createRow(), createRow(), createRow(), createRow()], 
  hseqManager: '',
  complexManager: '',
  footerDate: '',
  compiledBy: 'Michael C. Zulu',
};

export default function CertificateOfAnalysis() {
  const [formData, setFormData] = useState(initialFormData);
  const [busy, setBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submittedVisible, setSubmittedVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wrapped = await formStorage.loadForm('CertificateOfAnalysis_draft');
        if (wrapped?.payload?.formData && mounted) {
          setFormData(prev => ({ ...prev, ...wrapped.payload.formData }));
        } else if (mounted) {
          setFormData(prev => ({ ...prev, issueDate: new Date().toLocaleDateString() }));
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  const buildPayload = (status = 'draft') => ({
    formType: 'CertificateOfAnalysis',
    templateVersion: '05',
    formData,
    savedAt: new Date().toISOString(),
  });

  const { isSaving, handleSaveDraft, handleSubmit, scheduleAutoSave } = useFormSave({ 
    buildPayload, 
    draftId: 'CertificateOfAnalysis_draft', 
    clearOnSubmit: () => setFormData(initialFormData), 
    formType: 'CertificateOfAnalysis' 
  });

  const handleProductChange = (id, key, value) => {
    setFormData(prev => {
      const newProducts = prev.products.map(p => p.id === id ? { ...p, [key]: value } : p);
      const next = { ...prev, products: newProducts };
      try { scheduleAutoSave(); } catch (e) {}
      return next;
    });
  };

  const addOneMoreRow = () => {
    if (!editMode) { setEditMode(true); return; }
    if (formData.products.length >= 6) {
      Alert.alert("Limit Reached", "You can only add one additional row to this form.");
      return;
    }
    setFormData(prev => ({ ...prev, products: [...prev.products, createRow()] }));
  };

  const handleSaveLocal = async () => {
    if (busy || isSaving) return;
    setBusy(true);
    try {
      await handleSubmit(() => setFormData(initialFormData));
      setSubmittedVisible(true);
    } catch (e) {
      Alert.alert('Submit failed', String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={(
      <FormActionBar onSaveDraft={async ()=>{ await handleSaveDraft(true); }} onSubmit={handleSaveLocal} isSaving={busy || isSaving} />
    )}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <LoadingOverlay visible={busy || isSaving} message={(busy || isSaving) ? 'Saving...' : ''} />
        <View style={styles.card}>
          
          <View style={styles.headerRowTop}>
            <Image source={require('../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.title}>CERTIFICATE OF ANALYSIS</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>Issue date: {formData.issueDate}</Text>
            </View>
          </View>

          <ScrollView horizontal nestedScrollEnabled style={styles.tableBorder}>
            <View pointerEvents={editMode ? 'auto' : 'none'}>
              {/* Spanning Header: Appearance, Weight, Texture */}
              <View style={styles.spanningHeaderRow}>
                <View style={{ width: 410 }} /> 
                <View style={[styles.testsHeaderGroup, { width: 380 }]}>
                  <Text style={styles.testsHeaderText}>Organoleptic & Morphologistic Tests</Text>
                </View>
                <View style={{ width: 410 }} /> 
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { width: 120 }]}>Product</Text>
                <Text style={[styles.columnHeader, { width: 110 }]}>Batch No:</Text>
                <Text style={[styles.columnHeader, { width: 80 }]}>Time</Text>
                <Text style={[styles.columnHeader, { width: 100 }]}>Date Rec.</Text>
                <Text style={[styles.columnHeader, { width: 100, backgroundColor: '#fdfdfd' }]}>Appearance</Text>
                <Text style={[styles.columnHeader, { width: 80, backgroundColor: '#fdfdfd' }]}>Weight</Text>
                <Text style={[styles.columnHeader, { width: 100, backgroundColor: '#fdfdfd' }]}>Texture</Text>
                <Text style={[styles.columnHeader, { width: 100, backgroundColor: '#fdfdfd' }]}>Organic Test</Text>
                <Text style={[styles.columnHeader, { width: 120 }]}>Result</Text>
                <Text style={[styles.columnHeader, { width: 150 }]}>Comment</Text>
                <Text style={[styles.columnHeader, { width: 140 }]}>sampled by</Text>
                <Text style={[styles.columnHeader, { width: 140 }]}>SFC sign</Text>
              </View>

              {formData.products.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <TextInput style={[styles.cellInput, { width: 120 }]} value={item.product} onChangeText={t => handleProductChange(item.id, 'product', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 110 }]} value={item.batchNo} onChangeText={t => handleProductChange(item.id, 'batchNo', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 80 }]} value={item.time} onChangeText={t => handleProductChange(item.id, 'time', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 100 }]} value={item.dateReceived} onChangeText={t => handleProductChange(item.id, 'dateReceived', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 100 }]} value={item.appearance} onChangeText={t => handleProductChange(item.id, 'appearance', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 80 }]} value={item.weight} onChangeText={t => handleProductChange(item.id, 'weight', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 100 }]} value={item.texture} onChangeText={t => handleProductChange(item.id, 'texture', t)} editable={editMode} />
                  <TextInput style={[styles.cellInput, { width: 100 }]} value={item.organicTest} onChangeText={t => handleProductChange(item.id, 'organicTest', t)} editable={editMode} />
                  
                  {/* Manual Result Entry */}
                  <TextInput style={[styles.cellInput, { width: 120 }]} value={item.result} onChangeText={t => handleProductChange(item.id, 'result', t)} placeholder="e.g. PASSED" editable={editMode} />
                  
                  <TextInput style={[styles.cellInput, { width: 150 }]} value={item.comment} onChangeText={t => handleProductChange(item.id, 'comment', t)} editable={editMode} />

                  <View style={{ width: 140, padding: 4 }}>
                    <SignatureField value={item.sampledBy} onChange={(v) => handleProductChange(item.id, 'sampledBy', v)} editable={editMode} width={130} height={45} />
                  </View>
                  <View style={{ width: 140, padding: 4 }}>
                    <SignatureField value={item.sfcSign} onChange={(v) => handleProductChange(item.id, 'sfcSign', v)} editable={editMode} width={130} height={45} />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity onPress={addOneMoreRow} style={styles.addRowBtn}>
            <Text style={styles.addRowText}>+ Add One More Row</Text>
          </TouchableOpacity>

          <View style={styles.footerGrid}>
            <View style={styles.footerBox}>
              <Text style={styles.inputLabel}>HSEQ Manager:</Text>
              <SignatureField value={formData.hseqManager} onChange={(v) => setFormData(p => ({...p, hseqManager: v}))} editable={editMode} width={180} height={70} />
            </View>
            <View style={styles.footerBox}>
              <Text style={styles.inputLabel}>COMPLEX MANAGER:</Text>
              <SignatureField value={formData.complexManager} onChange={(v) => setFormData(p => ({...p, complexManager: v}))} editable={editMode} width={180} height={70} />
            </View>
          </View>
        </View>
        <NotificationModal visible={submittedVisible} message={'Form submitted successfully'} onClose={() => setSubmittedVisible(false)} />
      </ScrollView>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  logo: { width: 55, height: 55, marginRight: 12 },
  brandName: { fontSize: 13, fontWeight: '800', color: '#185a9d' },
  title: { fontSize: 15, fontWeight: 'bold' },
  metaBox: { alignItems: 'flex-end' },
  metaText: { fontSize: 10, color: '#666' },

  spanningHeaderRow: { flexDirection: 'row', backgroundColor: '#fff' },
  testsHeaderGroup: { width: 280, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ccc', backgroundColor: '#fcfcfc', alignItems: 'center', paddingVertical: 4 },
  testsHeaderText: { fontSize: 9, fontWeight: 'bold' },

  tableBorder: { borderWidth: 1, borderColor: '#ccc' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f2f2f2', borderBottomWidth: 1, borderColor: '#ccc' },
  columnHeader: { fontSize: 10, fontWeight: 'bold', padding: 8, textAlign: 'center', borderRightWidth: 1, borderColor: '#ccc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  cellInput: { padding: 6, fontSize: 11, borderRightWidth: 1, borderColor: '#ccc', textAlign: 'center' },

  addRowBtn: { padding: 12, backgroundColor: '#f0f4ff', alignItems: 'center', marginVertical: 10, borderRadius: 5 },
  addRowText: { color: '#2563EB', fontWeight: 'bold', fontSize: 12 },

  footerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  footerBox: { width: '48%' },
  inputLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  button: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginLeft: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
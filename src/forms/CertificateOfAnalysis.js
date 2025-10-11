import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';

import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'certificate_of_analysis_draft';

const initialFormData = {
  time: '',
  no: '',
  ingredientProduct: '',
  dateReceived: '',
  dateSampled: '',
  batchNumber: '',
  appearance: '',
  weight: '',
  texture: '',
  organicTaste: '',
  sampledBy: '',
  hseqManager: '',
  complexManager: '',
  date: '',
  result: 'PASSED',
  comment: '',
  issueDate: '',
  compiledBy: 'Michael C. Zulu',
};

export default function CertificateOfAnalysis() {
  const [formData, setFormData] = useState(initialFormData);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d) {
          setFormData(prev => ({ ...prev, ...d }));
        } else {
          // auto-populate issueDate, month and year from system
          const today = new Date();
          const issueDate = today.toLocaleDateString();
          const month = today.toLocaleString('default', { month: 'long' });
          const year = today.getFullYear();
          setFormData(prev => ({ ...prev, issueDate, month, year }));
        }
      } catch (e) { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, formData), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData]);

  const handleChange = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await setDraft(DRAFT_KEY, formData);
      Alert.alert('Success', 'Draft saved');
    } catch (e) { Alert.alert('Error', 'Failed to save draft'); }
    finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Certificate of Analysis', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { formData } });
      await removeDraft(DRAFT_KEY);
      Alert.alert('Success', 'Certificate submitted successfully');
      setFormData(initialFormData);
    } catch (e) { Alert.alert('Error', 'Submission failed'); }
    finally { setBusy(false); }
  };

  const renderInputLine = (label, key, placeholder = '', type = 'default', width = '48%') => (
    <View style={[styles.inputRow, { width }]}> 
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={formData[key]} onChangeText={t => handleChange(key, t)} placeholder={placeholder} style={styles.input} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerRowTop}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.title}>CERTIFICATE OF ANALYSIS</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>Issue date: {formData.issueDate}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {renderInputLine('Ingredient / Product:', 'ingredientProduct', 'Product name')}
            {renderInputLine('TIME:', 'time', 'e.g., 14:30')}
          </View>

          <View style={styles.metaRow}>
            {renderInputLine('NO: 2025-', 'no', 'e.g., 001')}
            {renderInputLine('DATE RECEIVED:', 'dateReceived', '', 'default')}
          </View>

          <View style={styles.testArea}>
            <Text style={styles.sectionTitle}>Organoleptic & Morphologistic Tests</Text>
            {renderInputLine('APPEARANCE:', 'appearance', 'E.g., Clear')}
            {renderInputLine('WEIGHT:', 'weight', 'E.g., 500g')}
            {renderInputLine('TEXTURE:', 'texture', 'E.g., Smooth')}
            {renderInputLine('ORGANIC TASTE:', 'organicTaste', 'E.g., Expected')}
          </View>

          <View style={styles.signatureArea}>
            {renderInputLine('SAMPLED BY:', 'sampledBy', 'Signature')}
            {renderInputLine('HSEQ Manager:', 'hseqManager', 'Signature')}
            {renderInputLine('COMPLEX MANAGER:', 'complexManager', 'Signature')}
            {renderInputLine('DATE:', 'date', '', 'default')}
          </View>

          <View style={styles.resultArea}>
            <View style={styles.resultButtons}>
              {['PASSED', 'FAILED', 'QUARANTINED'].map(status => (
                <TouchableOpacity key={status} onPress={() => handleChange('result', status)} style={[styles.resultBtn, formData.result === status && styles.resultBtnActive]}>
                  <Text style={[styles.resultBtnText, formData.result === status && styles.resultBtnTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={formData.comment} onChangeText={t => handleChange('comment', t)} placeholder="Comment" style={styles.commentInput} multiline />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}</TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Certificate</Text>}</TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#1F2937', borderWidth: 1 },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 64, height: 64, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 14, fontWeight: '800', color: '#185a9d' },
  title: { fontSize: 16, fontWeight: '900', color: '#111827' },
  metaBox: { alignItems: 'flex-end' },
  metaText: { fontSize: 11, color: '#4B5563' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' },
  inputRow: { marginBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderBottomWidth: 1, borderBottomColor: '#9CA3AF', paddingVertical: 4, fontSize: 14, minWidth: 120 },
  testArea: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  signatureArea: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 },
  resultArea: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  resultButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 6, backgroundColor: '#E5E7EB', alignItems: 'center' },
  resultBtnActive: { backgroundColor: '#10B981' },
  resultBtnText: { fontWeight: '700', color: '#374151' },
  resultBtnTextActive: { color: '#fff' },
  commentInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, minHeight: 60, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  button: { width: 150, marginLeft: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  draftButton: { backgroundColor: '#F59E0B' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

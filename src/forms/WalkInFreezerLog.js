import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';

import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'walkin_freezer_log_draft';
const TOTAL_DAYS = 31;
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

const initialLogState = Array.from({ length: TOTAL_DAYS }, (_, index) => ({
  day: index + 1,
  Morning: { temp: '', time: '', sign: '' },
  Afternoon: { temp: '', time: '', sign: '' },
  Evening: { temp: '', time: '', sign: '' },
  correctiveAction: '',
  supNameSign: ''
}));

const initialMetadata = {
  docNo: 'BBN-SHEQ-KN-SOP-6.8.10b',
  issueDate: '',
  revisionDate: 'N/A',
  compiledBy: 'Michael Zulu C.',
  approvedBy: 'Hassani Ali',
  versionNo: '01',
  revNo: '00',
  month: '',
  year: '',
  location: '',
  hseqManagerSign: '',
  complexManagerSign: ''
};

const useFormState = (initialState, initialMeta) => {
  const [formData, setFormData] = useState(initialState);
  const [metadata, setMetadata] = useState(initialMeta);
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
        } else if (mounted) {
          const today = new Date();
          const month = today.toLocaleString('default', { month: 'long' });
          const year = today.getFullYear();
          const issueDate = today.toLocaleDateString();
          setMetadata(prev => ({ ...prev, month, year, issueDate }));
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  return { formData, setFormData, metadata, setMetadata, busy, setBusy };
};

const Slot = React.memo(({ value, onChange }) => (
  <View style={styles.slotRow}>
    <TextInput value={value.temp} onChangeText={t => onChange('temp', t)} placeholder="°C" style={[styles.slotInput, { flex: 1 }]} keyboardType="numeric" />
    <TextInput value={value.time} onChangeText={t => onChange('time', t)} placeholder="hh:mm" style={[styles.slotInput, { flex: 1 }]} />
    <TextInput value={value.sign} onChangeText={t => onChange('sign', t)} placeholder="Initials" style={[styles.slotInput, { flex: 1 }]} />
  </View>
));

export default function WalkInFreezerLog() {
  const { formData, setFormData, metadata, setMetadata, busy, setBusy } = useFormState(initialLogState, initialMetadata);

  // Increased widths to better fit A4 landscape when printing/previewing
  const COL_WIDTHS = useMemo(() => ({ DATE: 80, RECORD_SLOT_WIDTH: 300, ACTION: 360, SIGNATURE: 200 }), []);
  const TABLE_MIN_WIDTH = COL_WIDTHS.DATE + (TIME_SLOTS.length * COL_WIDTHS.RECORD_SLOT_WIDTH) + COL_WIDTHS.ACTION + COL_WIDTHS.SIGNATURE;

  const handleRecordChange = useCallback((day, slotName, field, value) => {
    setFormData(prev => prev.map(item => item.day === day ? ({ ...item, [slotName]: { ...item[slotName], [field]: value } }) : item));
  }, [setFormData]);

  const handleDailyChange = useCallback((day, field, value) => {
    setFormData(prev => prev.map(item => item.day === day ? ({ ...item, [field]: value }) : item));
  }, [setFormData]);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata }); Alert.alert('Success', 'Draft saved'); }
    catch (e) { Alert.alert('Error', 'Failed to save draft'); }
    finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Walk-In Freezer Log', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(DRAFT_KEY);
      Alert.alert('Success', 'Log submitted');
      setFormData(initialLogState);
      setMetadata(prev => ({ ...initialMetadata, docNo: prev.docNo, issueDate: prev.issueDate }));
    } catch (e) { Alert.alert('Error', 'Submission failed'); }
    finally { setBusy(false); }
  };

  const renderRow = (item) => (
    <View key={`row-${item.day}`} style={styles.row}>
      <View style={[styles.cell, { width: COL_WIDTHS.DATE }]}><Text style={styles.cellText}>{item.day}</Text></View>
      {TIME_SLOTS.map(slot => (
        <View key={`${item.day}-${slot}`} style={[styles.recordSlot, { width: COL_WIDTHS.RECORD_SLOT_WIDTH }]}>
          <Slot value={item[slot]} onChange={(field, val) => handleRecordChange(item.day, slot, field, val)} />
        </View>
      ))}
      <View style={[styles.cell, { width: COL_WIDTHS.ACTION }]}>
        <TextInput value={item.correctiveAction} onChangeText={t => handleDailyChange(item.day, 'correctiveAction', t)} placeholder="Action taken..." style={styles.actionInput} />
      </View>
      <View style={[styles.cell, { width: COL_WIDTHS.SIGNATURE }]}>
        <TextInput value={item.supNameSign} onChangeText={t => handleDailyChange(item.day, 'supNameSign', t)} placeholder="Name & Sign" style={styles.signatureInput} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} horizontal={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
                <Text style={styles.brandSub}>Bravo Brands Central</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaText}>Doc No: {metadata.docNo}</Text>
                <Text style={styles.metaText}>Issue Date: {metadata.issueDate}</Text>
              </View>
            </View>

            <Text style={styles.subject}>WALK-IN FREEZER TEMPERATURE LOG SHEET</Text>
            <View style={styles.metaRowSmall}>
              <TextInput value={metadata.month} onChangeText={t => handleMetadataChange('month', t)} placeholder="Month" style={styles.metaInput} />
              {/* Year is automatically populated and not editable */}
              <View style={{ flex: 1, minWidth: 80, marginRight: 8 }}>
                <Text style={styles.metaStatic}>{metadata.year}</Text>
              </View>
              <TextInput value={metadata.location} onChangeText={t => handleMetadataChange('location', t)} placeholder="Location" style={styles.metaInput} />
            </View>
            <Text style={styles.instruction}>Instruction: The temperature of the Walk-in Freezer should be less than -12° C</Text>
          </View>

          <ScrollView horizontal style={styles.tableScroll}>
            <View style={{ minWidth: TABLE_MIN_WIDTH }}>
              <View style={styles.headerRow}>
                <View style={[styles.headerCell, { width: COL_WIDTHS.DATE }]}><Text style={styles.headerText}>Date</Text></View>
                {TIME_SLOTS.map(slot => (
                  <View key={slot} style={[styles.headerCell, { width: COL_WIDTHS.RECORD_SLOT_WIDTH }]}>
                    <Text style={styles.headerText}>{slot}</Text>
                    <View style={styles.slotHeaderRow}><Text style={styles.slotHeaderText}>Temp</Text><Text style={styles.slotHeaderText}>Time</Text><Text style={styles.slotHeaderText}>Sign</Text></View>
                  </View>
                ))}
                <View style={[styles.headerCell, { width: COL_WIDTHS.ACTION }]}><Text style={styles.headerText}>If temp out of spec - what was done?</Text></View>
                <View style={[styles.headerCell, { width: COL_WIDTHS.SIGNATURE }]}><Text style={styles.headerText}>Sup Name & Sign</Text></View>
              </View>

              {formData.map(renderRow)}
            </View>
          </ScrollView>

          <View style={styles.footerSign}>
            <TextInput value={metadata.hseqManagerSign} onChangeText={t => handleMetadataChange('hseqManagerSign', t)} placeholder="Verified by: HSEQ Manager Sign" style={styles.signInput} />
            <TextInput value={metadata.complexManagerSign} onChangeText={t => handleMetadataChange('complexManagerSign', t)} placeholder="Complex Manager Sign" style={styles.signInput} />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}</TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Log</Text>}</TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 20, borderColor: '#1F2937', borderWidth: 1 },
  header: { marginBottom: 8 },
  subject: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  metaBox: { alignItems: 'flex-end' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaRowSmall: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaText: { fontSize: 12, color: '#374151' },
  metaInput: { borderBottomWidth: 1, borderBottomColor: '#9CA3AF', paddingVertical: 4, marginRight: 8, minWidth: 80, flex: 1 },
  metaStatic: { fontSize: 14, color: '#374151', paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, textAlign: 'center' },
  instruction: { color: '#b91c1c', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  tableScroll: { borderWidth: 1, borderColor: '#1F2937', borderRadius: 6 },
  headerRow: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  slotHeaderRow: { flexDirection: 'row', width: '100%', marginTop: 4 },
  slotHeaderText: { flex: 1, textAlign: 'center', fontSize: 11 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 44, alignItems: 'center' },
  cell: { padding: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  cellText: { fontSize: 12 },
  recordSlot: { borderRightWidth: 1, borderRightColor: '#E5E7EB', padding: 4 },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotInput: { borderWidth: 1, borderColor: '#E5E7EB', padding: 10, marginHorizontal: 6, borderRadius: 4, textAlign: 'center', fontSize: 14 },
  actionInput: { borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 6, fontSize: 14 },
  signatureInput: { borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 6, textAlign: 'center', fontSize: 14 },
  footerSign: { marginTop: 12 },
  signInput: { borderBottomWidth: 1, borderBottomColor: '#9CA3AF', paddingVertical: 6, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  button: { width: 140, marginLeft: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  draftButton: { backgroundColor: '#F59E0B' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

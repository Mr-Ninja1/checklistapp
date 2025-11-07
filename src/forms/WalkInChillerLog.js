import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';

import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';
import useFormSave from '../hooks/useFormSave';
import EditableFormContainer from '../components/EditableFormContainer';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';

const DRAFT_KEY = 'walkin_chiller_log_draft';
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
  issueDate: '',
  compiledBy: 'Michael Zulu C.',
  approvedBy: 'Hassani Ali',
  month: '',
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

function normalizeSignatureToDataUri(v) {
  if (!v) return null;
  // already a data URI
  if (typeof v === 'string' && v.startsWith('data:')) return v;
  // object-shaped signature: { uri } or { data } or { signature } or { base64 }
  if (typeof v === 'object') {
    if (v.uri && typeof v.uri === 'string') return v.uri;
    if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data}`;
    if (v.signature && typeof v.signature === 'string') return v.signature.startsWith('data:') ? v.signature : `data:image/png;base64,${v.signature}`;
    if (v.base64 && typeof v.base64 === 'string') return `data:image/png;base64,${v.base64}`;
  }
  // legacy compact base64 string
  if (typeof v === 'string') {
    const compact = v.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
  }
  return null;
}

const Slot = React.memo(({ value, onChange, editable, signatureWidth = 140, signatureHeight = 44 }) => (
  <View style={styles.slotRow}>
    {editable ? (
      <>
        <TextInput value={value.temp} onChangeText={t => onChange('temp', t)} placeholder="°C" style={[styles.slotInput, { flex: 1 }]} keyboardType="numeric" />
        <TextInput value={value.time} onChangeText={t => onChange('time', t)} placeholder="hh:mm" style={[styles.slotInput, { flex: 1 }]} />
        <SignatureField value={value.sign} onChange={(v) => onChange('sign', v)} editable={editable} width={signatureWidth} height={signatureHeight} placeholder="Sign" />
      </>
    ) : (
      <>
        <Text style={[styles.slotReadText, { flex: 1 }]}>{value.temp}</Text>
        <Text style={[styles.slotReadText, { flex: 1 }]}>{value.time}</Text>
        {(() => {
          const uri = normalizeSignatureToDataUri(value.sign);
          return uri ? <SignatureThumb uri={uri} width={signatureWidth} height={signatureHeight} layers={6} spread={0.9} /> : <Text style={[styles.slotReadText, { flex: 1 }]}>{value.sign || ''}</Text>;
        })()}
      </>
    )}
  </View>
));

export default function WalkInChillerLog() {
  const { formData, setFormData, metadata, setMetadata, busy, setBusy } = useFormState(initialLogState, initialMetadata);

  // Wider columns for A4 landscape
  const COL_WIDTHS = useMemo(() => ({ DATE: 80, RECORD_SLOT_WIDTH: 300, ACTION: 360, SIGNATURE: 200 }), []);
  const TABLE_MIN_WIDTH = COL_WIDTHS.DATE + (TIME_SLOTS.length * COL_WIDTHS.RECORD_SLOT_WIDTH) + COL_WIDTHS.ACTION + COL_WIDTHS.SIGNATURE;

  // Build canonical payload used by useFormSave
  const buildPayload = (status = 'submitted') => ({
    formType: 'WalkInChillerLog',
    templateVersion: '01',
    title: 'WALK-IN CHILLER TEMPERATURE CHECKLIST',
    date: metadata.issueDate || new Date().toLocaleDateString(),
    metadata,
    formData,
    layoutHints: { DATE: COL_WIDTHS.DATE, RECORD_SLOT_WIDTH: COL_WIDTHS.RECORD_SLOT_WIDTH, ACTION: COL_WIDTHS.ACTION, SIGNATURE: COL_WIDTHS.SIGNATURE },
    _tableWidth: TABLE_MIN_WIDTH,
    assets: {},
    savedAt: Date.now(),
    status,
  });

  // useFormSave must be called at top-level of component (not inside handlers)
  const { handleSaveDraft: hookSaveDraft, handleSubmit: hookSubmit } = useFormSave({ buildPayload, draftId: DRAFT_KEY, clearOnSubmit: () => { setFormData(initialLogState); setMetadata(prev => ({ ...initialMetadata, docNo: prev.docNo, issueDate: prev.issueDate })); }, waitForSave: true });

  const [editMode, setEditMode] = useState(false);

  const handleRecordChange = useCallback((day, slotName, field, value) => {
    setFormData(prev => prev.map(item => item.day === day ? ({ ...item, [slotName]: { ...item[slotName], [field]: value } }) : item));
  }, [setFormData]);

  const handleDailyChange = useCallback((day, field, value) => {
    setFormData(prev => prev.map(item => item.day === day ? ({ ...item, [field]: value }) : item));
  }, [setFormData]);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      // prefer hook's saveDraft for consistency, but fall back to setDraft
      if (typeof hookSaveDraft === 'function') await hookSaveDraft();
      else await setDraft(DRAFT_KEY, { formData, metadata });
      Alert.alert('Success', 'Draft saved');
    } catch (e) {
      console.warn('save draft failed', e);
      Alert.alert('Error', 'Failed to save draft');
    } finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await hookSubmit();
      try { await removeDraft(DRAFT_KEY); } catch (e) {}
      Alert.alert('Success', 'Log submitted');
    } catch (e) {
      console.warn('submit failed', e);
      Alert.alert('Error', 'Submission failed');
    } finally { setBusy(false); }
  };

  const renderRow = (item) => (
    <View key={`row-${item.day}`} style={styles.row}>
      <View style={[styles.cell, { width: COL_WIDTHS.DATE }]}><Text style={styles.cellText}>{item.day}</Text></View>
      {TIME_SLOTS.map(slot => (
        <View key={`${item.day}-${slot}`} style={[styles.recordSlot, { width: COL_WIDTHS.RECORD_SLOT_WIDTH }]}>
          <Slot value={item[slot]} onChange={(field, val) => handleRecordChange(item.day, slot, field, val)} editable={editMode} />
        </View>
      ))}
      <View style={[styles.cell, { width: COL_WIDTHS.ACTION }]}>
        {editMode ? (
          <TextInput value={item.correctiveAction} onChangeText={t => handleDailyChange(item.day, 'correctiveAction', t)} placeholder="Action taken..." style={styles.actionInput} />
        ) : (
          <Text style={styles.slotReadText}>{item.correctiveAction}</Text>
        )}
      </View>
      <View style={[styles.cell, { width: COL_WIDTHS.SIGNATURE }]}>
        {editMode ? (
            <SignatureField value={item.supNameSign} onChange={(v) => handleDailyChange(item.day, 'supNameSign', v)} editable={editMode} width={COL_WIDTHS.SIGNATURE - 20} height={44} placeholder="Sup sign" />
        ) : (
          (() => {
            const v = item.supNameSign;
            const uri = normalizeSignatureToDataUri(v);
            return uri ? <SignatureThumb uri={uri} width={COL_WIDTHS.SIGNATURE - 20} height={44} layers={6} spread={0.9} /> : <Text style={styles.slotReadText}>{v || ''}</Text>;
          })()
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
  <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={hookSaveDraft}>
  <ScrollView contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled" scrollEventThrottle={16} decelerationRate="fast" horizontal={false} nestedScrollEnabled={true} directionalLockEnabled={true}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/logo.jpeg')} style={styles.brandLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
                <Text style={styles.brandSub}>Bravo Brands Central</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaText}>Issue Date: {metadata.issueDate}</Text>
              </View>
            </View>

            <Text style={styles.subject}>WALK-IN CHILLER TEMPERATURE CHECKLIST</Text>
            <View style={styles.metaRowSmall}>
              {editMode ? (
                <TextInput value={metadata.month} onChangeText={t => handleMetadataChange('month', t)} placeholder="Month" style={styles.metaInput} />
              ) : (
                <Text style={styles.metaStatic}>{metadata.month}</Text>
              )}
              <View style={{ flex: 1, minWidth: 80, marginRight: 8 }}>
                <Text style={styles.metaStatic}>{metadata.year}</Text>
              </View>
              {editMode ? (
                <TextInput value={metadata.location} onChangeText={t => handleMetadataChange('location', t)} placeholder="Location" style={styles.metaInput} />
              ) : (
                <Text style={styles.metaStatic}>{metadata.location}</Text>
              )}
            </View>
            <Text style={styles.instruction}>Instruction: The temperature of the Walk-in Chiller should be between 0° C and 4° C</Text>
          </View>

          <ScrollView horizontal style={styles.tableScroll} nestedScrollEnabled={true} directionalLockEnabled={true} showsHorizontalScrollIndicator={true} onStartShouldSetResponderCapture={() => true}>
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

          <View style={styles.signaturesRow}>
            <View style={styles.signatureCell}>
              <Text style={styles.signatureLabel}>Verified By: HSEQ Manager</Text>
              {editMode ? (
                <SignatureField value={metadata.hseqManagerSign} onChange={(v) => handleMetadataChange('hseqManagerSign', v)} editable={editMode} width={220} height={60} placeholder="Verified by: HSEQ Manager" />
              ) : (
                (() => {
                  const v = metadata.hseqManagerSign || metadata.hseqManager;
                  const uri = normalizeSignatureToDataUri(v);
                  return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.signatureValue}>{v || ''}</Text>;
                })()
              )}
            </View>
            <View style={styles.signatureCell}>
              <Text style={styles.signatureLabel}>Complex Manager</Text>
              {editMode ? (
                <SignatureField value={metadata.complexManagerSign} onChange={(v) => handleMetadataChange('complexManagerSign', v)} editable={editMode} width={220} height={60} placeholder="Complex Manager Sign" />
              ) : (
                (() => {
                  const v = metadata.complexManagerSign || metadata.complexManager;
                  const uri = normalizeSignatureToDataUri(v);
                  return uri ? <SignatureThumb uri={uri} width={220} height={60} layers={6} spread={1.0} /> : <Text style={styles.signatureValue}>{v || ''}</Text>;
                })()
              )}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}</TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Log</Text>}</TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </EditableFormContainer>
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
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureCell: { flex: 1, padding: 8 },
  signatureLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  signatureValue: { fontSize: 14, color: '#1F2937', marginTop: 6 },
  signInput: { borderBottomWidth: 1, borderBottomColor: '#9CA3AF', paddingVertical: 6, marginBottom: 8 },
  slotReadText: { paddingVertical: 10, paddingHorizontal: 6, textAlign: 'center', fontSize: 14, color: '#111827' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  button: { width: 140, marginLeft: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  draftButton: { backgroundColor: '#F59E0B' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

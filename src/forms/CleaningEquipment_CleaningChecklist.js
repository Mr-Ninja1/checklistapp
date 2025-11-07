import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';

import useFormSave from '../hooks/useFormSave';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { getDraft, removeDraft } from '../utils/formDrafts';

const DRAFT_KEY = 'cleaning_equipment_checklist_draft';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

const CLEANING_EQUIPMENT_LIST = [
  { name: 'Mops', frequency: 'After each use', isItem: true },
  { name: 'Mop buckets & squeezing devices', frequency: 'After each use', isItem: true },
  { name: 'Cloths', frequency: 'After each use', isItem: true },
  { name: 'Brooms/ Brushes', frequency: 'After each use', isItem: true },
  { name: 'Squeezers', frequency: 'After each use', isItem: true },
  { name: 'Spray bottles/Containers', frequency: 'After each use', isItem: true },
];

const initialCleaningState = CLEANING_EQUIPMENT_LIST.filter(i => i.isItem).map((item, index) => {
  const dailyChecks = WEEK_DAYS.reduce((acc, day) => { acc[day] = { checked: false, cleanedBy: '' }; return acc; }, {});
  return { id: index, name: item.name, frequency: item.frequency, checks: dailyChecks };
});

const initialMetadata = {
  location: 'CLEANING EQUIPMENT',
  week: '', month: '', year: '',
  issueDate: '',
  approvedBy: 'Hassani Ali', approvedBySign: '', hseqManager: '', hseqSign: ''
};

const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
    {checked && <Text style={styles.checkboxTick}>✓</Text>}
  </TouchableOpacity>
);

const CleaningCell = React.memo(({ item, day, colWidths, handleCellChange, canInteract }) => (
  <View key={day} style={[styles.dayGroupCell, { width: colWidths.DAY_GROUP_WIDTH }]}>
    <View style={[styles.cell, styles.centerContent, { width: colWidths.CHECK, borderRightWidth: 0, paddingHorizontal: 0 }]}>
      <Checkbox checked={item.checks[day].checked} onPress={() => canInteract && handleCellChange(item.id, day, 'checked')} />
    </View>
    <View style={[styles.cell, styles.centerContent, { flex: 1, borderLeftWidth: 1, borderLeftColor: '#4B5563', paddingHorizontal: 4 }]}>
      <TextInput value={item.checks[day].cleanedBy} editable={canInteract} onChangeText={t => { if (!canInteract) return; handleCellChange(item.id, day, 'cleanedBy', t); }} placeholder="Name" style={styles.cellInput} maxLength={12} />
    </View>
  </View>
));

export default function CleaningEquipmentChecklist() {
  const [formData, setFormData] = useState(initialCleaningState);
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const [metadata, setMetadata] = useState({ ...initialMetadata, month: currentMonth });
  const [busy, setBusy] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) {
            const merged = { ...d.metadata };
            if (!merged.year || String(merged.year).trim() === '') merged.year = currentYear;
            if (!merged.month || String(merged.month).trim() === '') merged.month = currentMonth;
            setMetadata(merged);
          }
        } else if (mounted) {
          setMetadata(prev => ({ ...prev, issueDate: new Date().toLocaleDateString(), year: currentYear, month: currentMonth }));
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    // preload logo as base64 for embedding into saved payloads (best-effort)
    (async () => {
      try {
        const asset = Asset.fromModule(require('../assets/logo.jpeg'));
        await asset.downloadAsync();
        if (asset.localUri) {
          const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 }).catch(() => null);
          if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // Autosave is handled via the canonical hook (scheduleAutoSave) called on edits.

  const handleCellChange = useCallback((id, day, type, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === id) {
        const newChecks = { ...item.checks };
        if (type === 'checked') {
          newChecks[day] = { ...newChecks[day], checked: !newChecks[day].checked };
          if (!newChecks[day].checked) newChecks[day].cleanedBy = '';
        } else if (type === 'cleanedBy') {
          newChecks[day] = { ...newChecks[day], cleanedBy: value };
          if (value.trim() !== '') newChecks[day].checked = true;
        }
        return { ...item, checks: newChecks };
      }
      return item;
    }));
    try { scheduleAutoSave(); } catch (e) { /* ignore if hook not ready */ }
  }, []);

  const handleMetadataChange = (k, v) => {
    setMetadata(prev => ({ ...prev, [k]: v }));
    try { scheduleAutoSave(); } catch (e) { /* ignore if hook not ready */ }
  };

  // Build canonical payload used by the shared save hook
  const buildPayload = (status = 'draft') => {
    const COL_WIDTHS_LOCAL = { AREA: 260, FREQUENCY: 150, DAY_GROUP_WIDTH: 140, CHECK: 40, CLEANED_BY: 100 };
    const tableWidth = COL_WIDTHS_LOCAL.AREA + COL_WIDTHS_LOCAL.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS_LOCAL.DAY_GROUP_WIDTH);
    const layoutHints = { area: COL_WIDTHS_LOCAL.AREA, frequency: COL_WIDTHS_LOCAL.FREQUENCY, dayGroup: COL_WIDTHS_LOCAL.DAY_GROUP_WIDTH, checkWidth: COL_WIDTHS_LOCAL.CHECK, cleanedByWidth: COL_WIDTHS_LOCAL.CLEANED_BY };
    // ensure month is present on saved payloads
    const metaForPayload = { ...metadata };
    if (!metaForPayload.month || String(metaForPayload.month).trim() === '') metaForPayload.month = currentMonth;

    return {
      formType: 'CleaningEquipment_CleaningChecklist',
      templateVersion: '01',
      title: 'CLEANING EQUIPMENT CHECKLIST',
      date: new Date().toLocaleDateString(),
      metadata: metaForPayload,
      formData,
      layoutHints,
      _tableWidth: tableWidth,
      assets: logoDataUri ? { logoDataUri } : {},
      savedAt: Date.now(),
      status,
    };
  };

  // centralized save hook — keeps behavior consistent with other forms
  const { handleSaveDraft: hookSaveDraft, handleSubmit: hookSubmit, isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave } = useFormSave({ buildPayload, draftId: DRAFT_KEY, clearOnSubmit: () => {
    setFormData(initialCleaningState);
    setMetadata(prev => ({ ...prev, week: '', month: currentMonth, year: currentYear, hseqManager: '' }));
  }, waitForSave: true });

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await hookSubmit();
      try { await removeDraft(DRAFT_KEY); } catch (e) {}
    } catch (e) {
      Alert.alert('Error', 'Submission failed');
    } finally { setBusy(false); }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await hookSaveDraft();
    } catch (e) {
      Alert.alert('Error', 'Failed to save draft');
    } finally { setBusy(false); }
  };

  const COL_WIDTHS = useMemo(() => ({ AREA: 260, FREQUENCY: 150, DAY_GROUP_WIDTH: 140, CHECK: 40, CLEANED_BY: 100 }), []);
  const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);

  const renderRow = rowItem => {
    const stateItem = formData.find(i => i.name === rowItem.name);
    const item = stateItem || { id: `fallback-${rowItem.name}`, name: rowItem.name, frequency: rowItem.frequency, checks: WEEK_DAYS.reduce((a, d) => { a[d] = { checked: false, cleanedBy: '' }; return a; }, {}) };
  const canInteract = !!stateItem && editMode;

    return (
      <View key={item.id} style={styles.row}>
        <View style={[styles.cell, { width: COL_WIDTHS.AREA }, styles.leftContent]}>
          <Text style={styles.equipmentText}>{item.name}</Text>
        </View>
        <View style={[styles.cell, { width: COL_WIDTHS.FREQUENCY }, styles.centerContent]}>
          <Text style={styles.equipmentText}>{item.frequency}</Text>
        </View>
        {WEEK_DAYS.map(day => (
          <CleaningCell key={`${item.id}-${day}`} item={item} day={day} colWidths={COL_WIDTHS} handleCellChange={handleCellChange} canInteract={canInteract} />
        ))}
      </View>
    );
  };

  const windowHeight = Dimensions.get('window').height;
  // Action buttons so they remain tappable while viewing (rendered outside
  // the pointer-events blocking children wrapper).
  const actionButtons = (
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}</TouchableOpacity>
      <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Checklist</Text>}</TouchableOpacity>
    </View>
  );

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(420, Math.round(windowHeight * 0.8)) }] }>
          <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/logo.jpeg')} style={styles.brandLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
                <Text style={styles.brandSub}>Bravo Brands Central</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.docText}>Issue Date: {metadata.issueDate || 'N/A'}</Text>
              <Text style={styles.docText}>Page 1 of 1</Text>
            </View>
            <Text style={styles.mainTitle}>CLEANING EQUIPMENT CHECKLIST</Text>
              <View style={styles.areaMetaRow}>
                <View style={[styles.metaField, { flex: 2 }]}>
                  <Text style={styles.metaLabel}>LOCATION:</Text>
                  <TextInput value={metadata.location} onChangeText={t => { if (!editMode) return; handleMetadataChange('location', t); }} style={styles.metaInput} editable={editMode} />
                </View>
                <View style={styles.metaField}>
                  <Text style={styles.metaLabel}>WEEK:</Text>
                  <TextInput value={metadata.week} onChangeText={t => { if (!editMode) return; handleMetadataChange('week', t); }} style={styles.metaInput} placeholder="Week No." editable={editMode} />
                </View>
                <View style={styles.metaField}>
                  <Text style={styles.metaLabel}>MONTH:</Text>
                  <TextInput value={metadata.month} style={[styles.metaInput, styles.uneditable]} editable={false} />
                </View>
                <View style={styles.metaField}>
                  <Text style={styles.metaLabel}>YEAR:</Text>
                  <TextInput value={metadata.year} style={[styles.metaInput, styles.uneditable]} editable={false} />
                </View>
              </View>
            <Text style={styles.areaTitle}>CLEANING EQUIPMENT</Text>
          </View>

          <View style={styles.verificationRow}>
            <View style={[styles.verificationCell, { flex: 1 }]}>
              <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
              {editMode ? (
                <SignatureField value={metadata.hseqSign} onChange={v => handleMetadataChange('hseqSign', v)} editable={true} width={260} height={80} />
              ) : (
                metadata.hseqSign ? (
                  <SignatureThumb uri={String(metadata.hseqSign).startsWith('data:') ? metadata.hseqSign : `data:image/png;base64,${metadata.hseqSign}`} width={260} height={80} layers={6} spread={0.9} />
                ) : (
                  <Text style={styles.metaValue}>{metadata.hseqManager || ''}</Text>
                )
              )}
            </View>
          </View>

          <View style={{ height: 12 }} />
          <View style={styles.signaturesRow}>
            <View style={styles.signatureCell}>
              <Text style={styles.signatureLabel}>Approved By:</Text>
              {editMode ? (
                <SignatureField value={metadata.approvedBySign} onChange={v => handleMetadataChange('approvedBySign', v)} editable={true} width={220} height={80} />
              ) : (
                metadata.approvedBySign ? (
                  <SignatureThumb uri={String(metadata.approvedBySign).startsWith('data:') ? metadata.approvedBySign : `data:image/png;base64,${metadata.approvedBySign}`} width={220} height={80} layers={6} spread={0.9} />
                ) : (
                  <Text style={styles.signatureValue}>{metadata.approvedBy || ''}</Text>
                )
              )}
            </View>
          </View>

          <ScrollView horizontal style={styles.tableScroll}>
            <View style={{ width: TABLE_WIDTH }}>
              <View style={styles.headerRow}>
                <View style={[styles.headerCell, { width: COL_WIDTHS.AREA, height: 40 }]}>
                  <Text style={styles.headerText}>Equipment</Text>
                </View>
                <View style={[styles.headerCell, { width: COL_WIDTHS.FREQUENCY, height: 40 }]}>
                  <Text style={styles.headerText}>Frequency</Text>
                </View>
                {WEEK_DAYS.map(day => (
                  <View key={day} style={[styles.dayHeaderGroup, { width: COL_WIDTHS.DAY_GROUP_WIDTH }]}>
                    <View style={[styles.headerCell, { width: COL_WIDTHS.CHECK, height: 40, borderBottomWidth: 0, borderRightWidth: 0 }]}>
                      <Text style={styles.headerText}>{day}</Text>
                    </View>
                    <View style={[styles.headerCell, { width: COL_WIDTHS.CLEANED_BY, height: 40, borderLeftWidth: 1, borderLeftColor: '#1F2937', borderBottomWidth: 0 }]}>
                      <Text style={styles.headerText}>Cleaned BY</Text>
                    </View>
                  </View>
                ))}
              </View>
              {CLEANING_EQUIPMENT_LIST.map(renderRow)}
            </View>
          </ScrollView>

            {/* buttons moved into EditableFormContainer via actionButtons prop */}
            <LoadingOverlay visible={isSaving} />
            <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
          </View>
        </ScrollView>
      </View>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#1F2937', borderWidth: 1, elevation: 4 },
  header: { borderBottomColor: '#1F2937', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, paddingVertical: 4, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaInput: { flex: 1, borderBottomColor: '#9CA3AF', borderBottomWidth: 1, fontSize: 12, paddingVertical: 2 },
  uneditable: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
  verificationRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#1F2937', marginBottom: 10, backgroundColor: '#E5E7EB' },
  verificationCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  verificationLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#1F2937' },
  verificationInput: { borderBottomColor: '#9CA3AF', borderBottomWidth: 1, fontSize: 14, paddingVertical: 2 },
  tableScroll: { borderRadius: 4, borderWidth: 1, borderColor: '#1F2937' },
  headerRow: { flexDirection: 'row', backgroundColor: '#6B7280', minHeight: 40, borderBottomWidth: 2, borderBottomColor: '#1F2937' },
  headerCell: { padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1F2937' },
  headerText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  dayHeaderGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#1F2937' },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 40 },
  dayGroupCell: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
  cell: { paddingHorizontal: 4, paddingVertical: 6, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#4B5563', minHeight: 40 },
  leftContent: { alignItems: 'flex-start' },
  centerContent: { alignItems: 'center' },
  equipmentText: { fontSize: 12, color: '#1F2937' },
  cellInput: { width: '100%', textAlign: 'center', fontSize: 12, height: 34, padding: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: '#10B981', backgroundColor: '#10B981' },
  checkboxUnchecked: { borderColor: '#4B5563', backgroundColor: '#FFFFFF' },
  checkboxTick: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', lineHeight: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, paddingHorizontal: 8 },
  button: { width: 150, marginLeft: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  draftButton: { backgroundColor: '#FBBF24' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderWidth: 1, borderColor: '#1F2937', backgroundColor: '#F8FAFC' },
  signatureCell: { flex: 1, padding: 8, alignItems: 'center' },
  signatureLabel: { fontSize: 12, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  signatureValue: { fontSize: 13, color: '#1F2937' },
});

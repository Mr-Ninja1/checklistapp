import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import SignatureField from '../components/SignatureField';

import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import useFormSave from '../hooks/useFormSave';
import EditableFormContainer from '../components/EditableFormContainer';

const DRAFT_KEY = 'scullery_area_cleaning_checklist_draft';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

// Items based on the notes in cat.md (scullery list)
const SCULLERY_EQUIPMENT_LIST = [
  { area: 'Scullery', name: 'Slab', frequency: 'Once a week', isItem: true },
  { area: 'Scullery', name: 'Dish Washing Sink', frequency: 'After each use', isItem: true },
  { area: 'Scullery', name: 'Drainages', frequency: 'Daily', isItem: true },
  { area: 'Scullery', name: 'Plastic Sheets', frequency: 'Monthly', isItem: true },
  { area: 'Scullery', name: 'Fence & Walls', frequency: 'Once a week', isItem: true },
  { area: 'Scullery', name: 'Hard to reach areas', frequency: '3 times a week', isItem: true },
  { area: 'Scullery', name: 'Drains and water Pipes', frequency: 'Daily', isItem: true },
  { area: 'Scullery', name: 'Refuse Bins', frequency: 'Daily', isItem: true },
  { area: 'Scullery', name: 'Water Tank', frequency: 'Twice a week', isItem: true },
  { area: 'Scullery', name: 'Lights (clean if visibly dirty)', frequency: 'Once a week', isItem: true },
  { area: 'Scullery', name: 'Chemical Cage', frequency: '3 times a week', isItem: true },
  { area: 'Scullery', name: 'Geyser', frequency: 'Once a week', isItem: true },
];

const initialCleaningState = SCULLERY_EQUIPMENT_LIST.filter(i => i.isItem).map((item, index) => {
  const dailyChecks = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { checked: false, cleanedBy: '' };
    return acc;
  }, {});
  return { id: index, area: item.area, name: item.name, frequency: item.frequency, checks: dailyChecks };
});

const Checkbox = ({ checked, onPress, disabled }) => (
  <TouchableOpacity
    onPress={disabled ? undefined : onPress}
    disabled={!!disabled}
    pointerEvents={disabled ? 'none' : 'auto'}
    style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}
  >
    {checked && <Text style={styles.checkboxTick}>✓</Text>}
  </TouchableOpacity>
);

const CleaningCell = React.memo(({ item, day, colWidths, handleCellChange, canInteract }) => {
  return (
    <View key={day} style={[styles.dayGroupCell, { width: colWidths.DAY_GROUP_WIDTH }]}>
      <View style={[styles.cell, styles.centerContent, { width: colWidths.CHECK, borderRightWidth: 0, paddingHorizontal: 0 }]}>
        <Checkbox checked={item.checks[day].checked} onPress={() => canInteract && handleCellChange(item.id, day, 'checked')} />
      </View>
      <View style={[styles.cell, styles.centerContent, { flex: 1, borderLeftWidth: 1, borderLeftColor: '#4B5563', paddingHorizontal: 4 }]}>
        {canInteract ? (
          <TextInput
            value={item.checks[day].cleanedBy}
            onChangeText={t => canInteract && handleCellChange(item.id, day, 'cleanedBy', t)}
            placeholder="Name"
            style={styles.cellInput}
            maxLength={12}
            editable={canInteract}
          />
        ) : (
          <Text style={styles.cellText}>{item.checks[day].cleanedBy || ''}</Text>
        )}
      </View>
    </View>
  );
});

export default function SculleryAreaChecklist() {
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState({ location: 'SCULLERY', week: '', month: '', year: '', issueDate: '', approvedBy: '', approvedBySign: '', hseqManager: '', hseqManagerSign: '' });
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  // build canonical payload for saving
  const buildPayload = (status = 'draft') => {
    const COL_WIDTHS = { AREA: 260, FREQUENCY: 150, DAY_GROUP_WIDTH: 140, CHECK: 40, CLEANED_BY: 100 };
    const tableWidth = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);
    const layoutHints = { area: COL_WIDTHS.AREA, frequency: COL_WIDTHS.FREQUENCY, dayGroup: COL_WIDTHS.DAY_GROUP_WIDTH, checkWidth: COL_WIDTHS.CHECK, cleanedByWidth: COL_WIDTHS.CLEANED_BY };
    // ensure signature keys are available under common names so presentational
    // components can reliably pick them (some presentational files expect `hseqSign`)
    const metadataOut = { ...metadata };
    if (!metadataOut.hseqSign && metadataOut.hseqManagerSign) metadataOut.hseqSign = metadataOut.hseqManagerSign;
    if (!metadataOut.hseqManagerSign && metadataOut.hseqSign) metadataOut.hseqManagerSign = metadataOut.hseqSign;

    return {
      formType: 'SculleryArea_CleaningChecklist',
      templateVersion: '01',
      title: 'SCULLERY AREA CLEANING CHECKLIST',
      date: metadata.issueDate || new Date().toLocaleDateString(),
      metadata: metadataOut,
      formData,
      layoutHints,
      _tableWidth: tableWidth,
      assets: {},
      savedAt: Date.now(),
      status,
    };
  };

  // hook: use canonical save helper (fast submit)
  const { handleSaveDraft: handleSaveDraftHook, handleSubmit: hookSubmit, isSaving, scheduleAutoSave: scheduleAutoSaveFromHook } = useFormSave({ buildPayload, draftId: DRAFT_KEY, clearOnSubmit: () => { setFormData(initialCleaningState); setMetadata({ location: 'SCULLERY', week: '', month: '', year: '', hseqManager: '' }); }, waitForSave: false });
  const scheduleAutoSave = scheduleAutoSaveFromHook;

  useEffect(() => {
    (async () => {
      const d = await getDraft(DRAFT_KEY);
      const now = new Date();
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const month = monthNames[now.getMonth()];
      const year = String(now.getFullYear());
      const nowStr = now.toLocaleString();
      if (d) {
        if (d.formData) setFormData(d.formData);
        if (d.metadata) {
          setMetadata(prev => ({
            ...d.metadata,
            month: d.metadata.month && d.metadata.month.trim() ? d.metadata.month : month,
            year: d.metadata.year && d.metadata.year.trim() ? d.metadata.year : year,
            issueDate: d.metadata.issueDate && d.metadata.issueDate.trim() ? d.metadata.issueDate : nowStr,
          }));
        } else {
          setMetadata(prev => ({ ...prev, issueDate: nowStr, month, year }));
        }
      } else {
        setMetadata(prev => ({ ...prev, issueDate: nowStr, month, year }));
      }
    })();
  }, []);

  function normalizeSignatureToDataUri(v) {
    if (!v) return null;
    if (typeof v === 'string' && v.startsWith('data:')) return v;
    if (typeof v === 'object') {
      if (v.uri && typeof v.uri === 'string') return v.uri;
      if (v.data && typeof v.data === 'string') return v.data.startsWith('data:') ? v.data : `data:image/png;base64,${v.data}`;
      if (v.signature && typeof v.signature === 'string') return v.signature.startsWith('data:') ? v.signature : `data:image/png;base64,${v.signature}`;
      if (v.base64 && typeof v.base64 === 'string') return `data:image/png;base64,${v.base64}`;
    }
    if (typeof v === 'string') {
      const compact = v.replace(/\s+/g, '');
      if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    }
    return null;
  }

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    // schedule canonical autosave as well
    try { scheduleAutoSave(); } catch (e) {}
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  const handleCellChange = useCallback((id, day, type, value) => {
    setFormData(prev => {
      const newFormData = prev.map(item => {
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
      });
      return newFormData;
    });
  }, []);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    try {
      await hookSubmit();
      Alert.alert('Success', 'Checklist submitted');
      try { await removeDraft(DRAFT_KEY); } catch (e) {}
    } catch (e) {
      console.warn('submit failed', e);
      Alert.alert('Error', 'Submission failed');
    }
  };

  const handleSaveDraftLocal = async () => {
    try {
      await handleSaveDraftHook();
      Alert.alert('Success', 'Draft saved');
    } catch (e) {
      console.warn('save draft failed', e);
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const COL_WIDTHS = useMemo(() => ({ AREA: 260, FREQUENCY: 150, DAY_GROUP_WIDTH: 140, CHECK: 40, CLEANED_BY: 100 }), []);
  const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);

  const renderRow = rowItem => {
    const stateItem = formData.find(i => i.name === rowItem.name && i.area === rowItem.area);
    const item = stateItem || { id: `fallback-${rowItem.area}-${rowItem.name}`, name: rowItem.name, frequency: rowItem.frequency, checks: WEEK_DAYS.reduce((a, d) => { a[d] = { checked: false, cleanedBy: '' }; return a; }, {}) };
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

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraftLocal}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps={'handled'}
          decelerationRate={0.9}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
        >
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
            <Text style={styles.mainTitle}>SCULLERY AREA CLEANING CHECKLIST</Text>
            <View style={styles.areaMetaRow}>
              <View style={[styles.metaField, { flex: 2 }]}>
                <Text style={styles.metaLabel}>LOCATION:</Text>
                {editMode ? (
                  <TextInput value={metadata.location} onChangeText={t => handleMetadataChange('location', t)} style={styles.metaInput} editable={editMode} />
                ) : (
                  <Text style={styles.metaValue}>{metadata.location}</Text>
                )}
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>WEEK:</Text>
                {editMode ? (
                  <TextInput value={metadata.week} onChangeText={t => handleMetadataChange('week', t)} style={styles.metaInput} placeholder="Week No." editable={editMode} />
                ) : (
                  <Text style={styles.metaValue}>{metadata.week}</Text>
                )}
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
            <Text style={styles.areaTitle}>SCULLERY AREA</Text>
          </View>

          <View style={styles.verificationRow}>
            <View style={[styles.verificationCell, { flex: 1 }]}>
              <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
              {editMode ? (
                <SignatureField value={metadata.hseqManagerSign} onChange={v => handleMetadataChange('hseqManagerSign', v)} editable={editMode} width={260} height={80} />
              ) : (
                (() => {
                  const uri = normalizeSignatureToDataUri(metadata.hseqManagerSign || metadata.hseqManager);
                  return uri ? <Image source={{ uri }} style={{ width: 260, height: 80, resizeMode: 'contain' }} /> : <Text style={styles.metaValue}>{metadata.hseqManager}</Text>;
                })()
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            style={styles.tableScroll}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps={'handled'}
            directionalLockEnabled={true}
            onStartShouldSetResponderCapture={() => true}
          >
            <View style={{ width: TABLE_WIDTH }}>
              <View style={styles.headerRow}>
                <View style={[styles.headerCell, { width: COL_WIDTHS.AREA, height: 40 }]}>
                  <Text style={styles.headerText}>Area to be cleaned</Text>
                </View>
                <View style={[styles.headerCell, { width: COL_WIDTHS.FREQUENCY, height: 40 }]}>
                  <Text style={styles.headerText}>Frequency (Per Week)</Text>
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
              {SCULLERY_EQUIPMENT_LIST.map(renderRow)}
            </View>
          </ScrollView>

          <View style={{ height: 12 }} />
          <View style={styles.signaturesRow}>
            <View style={styles.signatureCell}>
              <Text style={styles.signatureLabel}>Approved By:</Text>
              {editMode ? (
                <SignatureField value={metadata.approvedBySign} onChange={v => handleMetadataChange('approvedBySign', v)} editable={editMode} width={220} height={60} />
              ) : (
                (() => {
                  const uri = normalizeSignatureToDataUri(metadata.approvedBySign || metadata.approvedBy);
                  return uri ? <Image source={{ uri }} style={{ width: 220, height: 60, resizeMode: 'contain' }} /> : <Text style={styles.signatureValue}>{metadata.approvedBy || ''}</Text>;
                })()
              )}
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSaveDraftLocal} style={[styles.button, styles.draftButton]} disabled={isSaving}>{isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}</TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={isSaving}>{isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Checklist</Text>}</TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </View>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8, flexGrow: 1 },
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
  cellText: { fontSize: 12, textAlign: 'center', height: 34, lineHeight: 34, color: '#111827' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: '#10B981', backgroundColor: '#10B981' },
  checkboxUnchecked: { borderColor: '#4B5563', backgroundColor: '#FFFFFF' },
  checkboxTick: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', lineHeight: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, paddingHorizontal: 8 },
  button: { width: 150, marginLeft: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  draftButton: { backgroundColor: '#FBBF24' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  signaturesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureCell: { flex: 1, padding: 8 },
  signatureLabel: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  signatureValue: { fontSize: 14, color: '#1F2937', marginTop: 6 }
});

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';

import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

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
  docNo: 'BBN-SHEQ-P-15-R-11q', issueDate: '', revisionDate: 'N/A',
  compiledBy: 'Michael Zulu C.', approvedBy: 'Hassani Ali', versionNo: '01', revNo: '00', hseqManager: ''
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
      <TextInput value={item.checks[day].cleanedBy} onChangeText={t => canInteract && handleCellChange(item.id, day, 'cleanedBy', t)} placeholder="Name" style={styles.cellInput} maxLength={12} />
    </View>
  </View>
));

export default function CleaningEquipmentChecklist() {
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const d = await getDraft(DRAFT_KEY);
      if (d) {
        if (d.formData) setFormData(d.formData);
        if (d.metadata) setMetadata(d.metadata);
      } else {
        setMetadata(prev => ({ ...prev, issueDate: new Date().toLocaleDateString() }));
      }
    })();
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

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
  }, []);

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Cleaning Equipment Cleaning Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(DRAFT_KEY);
      Alert.alert('Success', 'Checklist submitted');
      setFormData(initialCleaningState);
      setMetadata(prev => ({ ...prev, week: '', month: '', year: '', hseqManager: '' }));
    } catch (e) { Alert.alert('Error', 'Submission failed'); }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata }); Alert.alert('Success', 'Draft saved'); }
    catch (e) { Alert.alert('Error', 'Failed to save draft'); }
    finally { setBusy(false); }
  };

  const COL_WIDTHS = useMemo(() => ({ AREA: 260, FREQUENCY: 150, DAY_GROUP_WIDTH: 140, CHECK: 40, CLEANED_BY: 100 }), []);
  const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);

  const renderRow = rowItem => {
    const stateItem = formData.find(i => i.name === rowItem.name);
    const item = stateItem || { id: `fallback-${rowItem.name}`, name: rowItem.name, frequency: rowItem.frequency, checks: WEEK_DAYS.reduce((a, d) => { a[d] = { checked: false, cleanedBy: '' }; return a; }, {}) };
    const canInteract = !!stateItem;

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
                <Text style={styles.brandSub}>Bravo Brands Central</Text>
              </View>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.docText}>Doc No: {metadata.docNo} | Issue Date: {metadata.issueDate || 'N/A'}</Text>
              <Text style={styles.docText}>Page 1 of 1</Text>
            </View>
            <Text style={styles.mainTitle}>CLEANING EQUIPMENT CHECKLIST</Text>
            <View style={styles.areaMetaRow}>
              <View style={[styles.metaField, { flex: 2 }]}>
                <Text style={styles.metaLabel}>LOCATION:</Text>
                <TextInput value={metadata.location} onChangeText={t => handleMetadataChange('location', t)} style={styles.metaInput} />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>WEEK:</Text>
                <TextInput value={metadata.week} onChangeText={t => handleMetadataChange('week', t)} style={styles.metaInput} placeholder="Week No." />
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
              <TextInput value={metadata.hseqManager} onChangeText={t => handleMetadataChange('hseqManager', t)} style={styles.verificationInput} />
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}</TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Checklist</Text>}</TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
});

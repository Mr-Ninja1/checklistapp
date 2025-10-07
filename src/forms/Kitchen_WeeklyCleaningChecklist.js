import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useExportFormAsPDF from '../utils/useExportFormAsPDF';
import generateWeeklyChecklistHtml from '../utils/generateWeeklyChecklistHtml';

// Stubs / utilities (the project already has equivalents; these mirror them)
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'kitchen_weekly_cleaning_checklist_draft';

const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EQUIPMENT_LIST = [
  { name: 'Extractor hood - general', frequency: '1' },
  { name: 'Extractor hood - filters & grease traps', frequency: '1' },
  { name: 'Pizza Oven', frequency: 'After each use' },
  { name: 'Flat top Griddle', frequency: 'After each use' },
  { name: 'Grill', frequency: 'After each use' },
  { name: 'Stove', frequency: 'After each use' },
  { name: 'Food Hot Pass', frequency: 'After each use' },
  { name: 'Deep fryer', frequency: 'After each use' },
  { name: 'Toaster', frequency: 'After each use' },
  { name: 'Vegetable Wash Sink', frequency: 'After each use' },
  { name: 'Vegetable Prep Table', frequency: 'After each use' },
  { name: 'Meat Prep Table', frequency: 'After each use' },
  { name: 'Racks x2', frequency: 'Daily' },
  { name: 'Hard to reach floor areas', frequency: '3' },
  { name: 'General floor areas (after each shift)', frequency: 'After each use' },
  { name: 'Walls', frequency: '2' },
  { name: 'Ceilings (clean if visibly dirty)', frequency: '1' },
  { name: 'Lights (clean if visibly dirty)', frequency: '1' },
  { name: 'Drains x2', frequency: 'Every day' },
  { name: 'Production-Deep Freezer', frequency: '3' },
  { name: 'Under-bar Chillers', frequency: 'After each use' },
  { name: 'Kitchen Waste Bin', frequency: 'At the end of each shift' },
  { name: 'Salamander', frequency: 'After each use' },
  { name: 'Microwave', frequency: 'After each use' },
  { name: 'Mary Chef', frequency: 'After each use' },
  { name: 'Automatic dish washing machine', frequency: 'After each use' },
];

const initialCleaningState = EQUIPMENT_LIST.map((item, idx) => {
  const checks = WEEK_DAYS.reduce((acc, d) => { acc[d] = { checked: false, cleanedBy: '' }; return acc; }, {});
  return { id: idx, name: item.name, frequency: item.frequency, checks };
});

const COL_WIDTHS = {
  AREA: 300,
  FREQ: 150,
  DAY_GROUP: 150,
  CHECK: 60,
  CLEANED_BY: 90,
};

const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
    {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
  </TouchableOpacity>
);

export default function KitchenWeeklyCleaningChecklist() {
  const { ref, exportAsPDF } = useExportFormAsPDF();
  const navigation = useNavigation();
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState({ location: '', week: '', month: '', year: '', hseqManager: '', complexManager: '' });
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
        }
      } catch (e) {
        console.warn('load draft failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  const handleCellChange = (id, day, type, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === id) {
        const newChecks = { ...item.checks };
        if (type === 'checked') newChecks[day].checked = !newChecks[day].checked;
        else if (type === 'cleanedBy') {
          newChecks[day].cleanedBy = value;
          if (value.trim() !== '') newChecks[day].checked = true; // auto-check when name entered
        }
        return { ...item, checks: newChecks };
      }
      return item;
    }));
  };

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { formData, metadata }); Alert.alert('Draft saved'); }
    catch (e) { Alert.alert('Error', 'Failed to save draft'); }
    finally { setBusy(false); }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    setBusy(true);
    try {
      // prepare payload for HTML generator
      const payload = { title: 'Kitchen Weekly Cleaning Checklist', meta: metadata, areas: formData, footerText: 'Verified records kept on file' };
      // embed logo as dataUri if available (skip for now)
      const html = generateWeeklyChecklistHtml(payload);
      const exportResult = await exportAsPDF({ title: payload.title, date: new Date().toLocaleDateString(), formData: payload, });
      if (exportResult && exportResult.pdfPath) {
        Alert.alert('Saved', 'PDF exported and saved to history.');
      } else if (exportResult && exportResult.pdfDataUri) {
        Alert.alert('Saved', 'PDF prepared (web).');
      } else {
        Alert.alert('Error', exportResult.error || 'Export failed');
      }
    } catch (e) {
      console.warn('export failed', e);
      Alert.alert('Error', 'Export failed');
    } finally {
      setExporting(false);
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Kitchen Weekly Cleaning Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(DRAFT_KEY);
      Alert.alert('Success', 'Checklist submitted');
      setFormData(initialCleaningState);
      setMetadata({ location: '', week: '', month: '', year: '', hseqManager: '', complexManager: '' });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit');
    } finally { setBusy(false); }
  };

  const renderRow = (item) => (
    <View key={item.id} style={styles.row}>
      <View style={[styles.cell, { width: COL_WIDTHS.AREA }]}>
        <Text style={styles.areaText}>{item.name}</Text>
      </View>
      <View style={[styles.cell, { width: COL_WIDTHS.FREQ, alignItems: 'center' }]}>
        <Text style={styles.freqText}>{item.frequency}</Text>
      </View>
      {WEEK_DAYS.map(day => (
        <View key={day} style={[styles.dayGroup, { width: COL_WIDTHS.DAY_GROUP }]}>
          <View style={[styles.cell, { width: COL_WIDTHS.CHECK, justifyContent: 'center' }]}>
            <Checkbox checked={item.checks[day].checked} onPress={() => handleCellChange(item.id, day, 'checked')} />
          </View>
          <View style={[styles.cell, { flex: 1, borderLeftWidth: 1, borderLeftColor: '#4B5563' }]}>
            <TextInput style={styles.cellInput} value={item.checks[day].cleanedBy} onChangeText={(t) => handleCellChange(item.id, day, 'cleanedBy', t)} placeholder="Name" maxLength={15} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerTop}>
            <Text style={styles.mainTitle}>KITCHEN WEEKLY CLEANING CHECKLIST</Text>
          </View>

          <View style={styles.metadataRow}>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>LOCATION:</Text>
              <TextInput value={metadata.location} onChangeText={(t)=>handleMetadataChange('location',t)} style={styles.metaInput} />
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>WEEK:</Text>
              <TextInput value={metadata.week} onChangeText={(t)=>handleMetadataChange('week',t)} style={styles.metaInput} placeholder="Week No." />
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>MONTH:</Text>
              <TextInput value={metadata.month} onChangeText={(t)=>handleMetadataChange('month',t)} style={styles.metaInput} />
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>YEAR:</Text>
              <TextInput value={metadata.year} onChangeText={(t)=>handleMetadataChange('year',t)} style={styles.metaInput} placeholder="YYYY" />
            </View>
          </View>

          <View style={styles.verificationRow}>
            <View style={styles.verCell}>
              <Text style={styles.verLabel}>Verified By: HSEQ Manager:</Text>
              <TextInput value={metadata.hseqManager} onChangeText={(t)=>handleMetadataChange('hseqManager',t)} style={styles.verInput} />
            </View>
            <View style={styles.verCell}>
              <Text style={styles.verLabel}>Complex Manager:</Text>
              <TextInput value={metadata.complexManager} onChangeText={(t)=>handleMetadataChange('complexManager',t)} style={styles.verInput} />
            </View>
          </View>

          <ScrollView horizontal style={styles.tableScroll}>
            <View style={{ width: COL_WIDTHS.AREA + COL_WIDTHS.FREQ + WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP }}>
              <View style={styles.headerRow}>
                <View style={[styles.headerCell, { width: COL_WIDTHS.AREA }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
                <View style={[styles.headerCell, { width: COL_WIDTHS.FREQ }]}><Text style={styles.headerText}>Frequency (Per Week)</Text></View>
                {WEEK_DAYS.map(d => (
                  <View key={d} style={[styles.headerGroup, { width: COL_WIDTHS.DAY_GROUP }]}>
                    <View style={[styles.headerCell, { width: COL_WIDTHS.CHECK }]}><Text style={styles.headerText}>{d}</Text></View>
                    <View style={[styles.headerCell, { width: COL_WIDTHS.CLEANED_BY }]}><Text style={styles.headerText}>Cleaned BY</Text></View>
                  </View>
                ))}
              </View>

              {formData.map(renderRow)}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.button, styles.backButton]} disabled={busy || exporting}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy || exporting}><Text style={styles.buttonText}>Save Draft</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleExportPdf} style={[styles.button, { backgroundColor: '#185a9d' }]} disabled={busy || exporting}><Text style={styles.buttonText}>{exporting ? 'Exporting...' : 'Save as PDF'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy || exporting}><Text style={styles.buttonText}>Submit</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#D1D5DB' },
  headerTop: { marginBottom: 12 },
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
  metadataRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 8 },
  metaField: { width: '24%', minWidth: 120, marginVertical: 4 },
  metaLabel: { fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  metaInput: { borderBottomWidth: 1, borderBottomColor: '#9CA3AF', paddingVertical: 4 },
  verificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  verCell: { width: '48%' },
  verLabel: { fontWeight: '700', color: '#374151' },
  verInput: { borderBottomWidth: 1, borderBottomColor: '#9CA3AF', paddingVertical: 6 },
  tableScroll: { marginTop: 12, borderWidth: 1, borderColor: '#4B5563', borderRadius: 6 },
  headerRow: { flexDirection: 'row', backgroundColor: '#4B5563', paddingVertical: 6 },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#4B5563', alignItems: 'center', justifyContent: 'center' },
  headerText: { color: '#fff', fontWeight: '700' },
  headerGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 40, backgroundColor: '#fff' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#4B5563', justifyContent: 'center' },
  areaText: { fontSize: 12, color: '#374151' },
  freqText: { fontSize: 12, color: '#6B7280' },
  dayGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
  checkbox: { width: 26, height: 26, borderWidth: 1.5, borderColor: '#4B5563', borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkboxUnchecked: { backgroundColor: '#fff', borderColor: '#4B5563' },
  checkboxTick: { color: '#fff', fontWeight: '700' },
  cellInput: { width: '100%', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#4B5563', textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  button: { flex: 1, marginHorizontal: 6, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  backButton: { backgroundColor: '#6B7280' },
  draftButton: { backgroundColor: '#FBBF24' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'front_of_house_cleaning_checklist_draft';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

const EQUIPMENT_LIST = [
  { name: 'Counters', frequency: 'Daily' },
  { name: 'Till', frequency: 'Daily' },
  { name: 'Chairs', frequency: 'Daily' },
  { name: 'Sofas', frequency: 'Daily' },
  { name: 'Tables', frequency: 'Daily' },
  { name: 'Display Chillers', frequency: 'Daily' },
  { name: 'Menu Screens', frequency: 'Daily' },
  { name: 'Insect Killer', frequency: 'Once a week' },
  { name: "Tables and chairs' legs", frequency: 'Once a week' },
  { name: 'Automatic Coffee Making Machine', frequency: 'Daily' },
  { name: 'Removing cobwebs', frequency: 'Once a week' },
  { name: 'General Floor Areas', frequency: 'After each shift' },
  { name: 'Windows', frequency: 'Once a week' },
  { name: 'Walls', frequency: 'Once a week' },
];

const initialCleaningState = EQUIPMENT_LIST.map((item, index) => {
  const dailyChecks = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { checked: false, cleanedBy: '' };
    return acc;
  }, {});
  return { id: index, name: item.name, frequency: item.frequency, checks: dailyChecks };
});

const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.checkbox,
      checked ? styles.checkboxChecked : styles.checkboxUnchecked,
    ]}
  >
    {checked && <Text style={styles.checkboxTick}>✓</Text>}
  </TouchableOpacity>
);

export default function FrontOfHouseChecklist() {
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState({
    location: '',
    week: '',
    month: '',
    year: '',
    hseqManager: '',
  });
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
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDraft(DRAFT_KEY, { formData, metadata });
      // console.log('Auto-draft saved.');
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  const handleCellChange = (id, day, type, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === id) {
        const newChecks = { ...item.checks };
        if (type === 'checked') {
          newChecks[day].checked = !newChecks[day].checked;
          if (!newChecks[day].checked) newChecks[day].cleanedBy = '';
        } else if (type === 'cleanedBy') {
          newChecks[day].cleanedBy = value;
          if (value.trim() !== '') newChecks[day].checked = true;
        }
        return { ...item, checks: newChecks };
      }
      return item;
    }));
  };

  const handleMetadataChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({
        title: 'Front of House Cleaning Checklist',
        date: new Date().toLocaleDateString(),
        savedAt: Date.now(),
        meta: { metadata, formData }
      });
      await removeDraft(DRAFT_KEY);
      Alert.alert('Success', 'Checklist Submitted successfully!');
      setFormData(initialCleaningState);
      setMetadata({ location: '', week: '', month: '', year: '', hseqManager: '' });
    } catch (e) {
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await setDraft(DRAFT_KEY, { formData, metadata });
      Alert.alert('Success', 'Draft saved manually.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save draft.');
    } finally {
      setBusy(false);
    }
  };

  const COL_WIDTHS = useMemo(() => ({
    AREA: 300,
    FREQUENCY: 150,
    DAY_GROUP_WIDTH: 150,
    CHECK: 60,
    CLEANED_BY: 90,
  }), []);

  const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);

  const renderRow = (item) => (
    <View key={item.id} style={styles.row}>
      <View style={[styles.cell, { width: COL_WIDTHS.AREA }, styles.leftContent]}>
        <Text style={styles.equipmentText}>{item.name}</Text>
      </View>
      <View style={[styles.cell, { width: COL_WIDTHS.FREQUENCY }, styles.centerContent]}>
        <Text style={styles.equipmentText}>{item.frequency}</Text>
      </View>

      {WEEK_DAYS.map(day => (
        <View key={day} style={[styles.dayGroupCell, { width: COL_WIDTHS.DAY_GROUP_WIDTH }]}>
          <View style={[styles.cell, styles.centerContent, { width: COL_WIDTHS.CHECK, borderRightWidth: 0, paddingHorizontal: 0 }]}>
            <Checkbox
              checked={item.checks[day].checked}
              onPress={() => handleCellChange(item.id, day, 'checked')}
            />
          </View>
          <View style={[styles.cell, styles.centerContent, { flex: 1, borderLeftWidth: 1, borderLeftColor: '#4B5563', paddingHorizontal: 4 }]}>
            <TextInput
              style={styles.cellInput}
              maxLength={5}
              value={item.checks[day].cleanedBy}
              onChangeText={(text) => handleCellChange(item.id, day, 'cleanedBy', text)}
              placeholder="Name"
            />
          </View>
        </View>
      ))}
    </View>
  );

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
              <Text style={styles.docText}>Doc No: BBN-SHEQ-P-16-R-11d | Issue Date: 19/05/2020 | Revision Date: N/A</Text>
              <Text style={styles.docText}>Page 1 of 1</Text>
            </View>
            <Text style={styles.mainTitle}>FRONT OF HOUSE CLEANING CHECKLIST</Text>
            <View style={styles.areaMetaRow}>
              <View style={[styles.metaField, { flex: 2 }]}>
                <Text style={styles.metaLabel}>LOCATION:</Text>
                <TextInput value={metadata.location} onChangeText={(t) => handleMetadataChange('location', t)} style={styles.metaInput} />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>WEEK:</Text>
                <TextInput value={metadata.week} onChangeText={(t) => handleMetadataChange('week', t)} style={styles.metaInput} placeholder="Week No." />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>MONTH:</Text>
                <TextInput value={metadata.month} onChangeText={(t) => handleMetadataChange('month', t)} style={styles.metaInput} />
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>YEAR:</Text>
                <TextInput value={metadata.year} onChangeText={(t) => handleMetadataChange('year', t)} style={styles.metaInput} placeholder="YYYY" />
              </View>
            </View>
            <Text style={styles.areaTitle}>FRONT-OF-HOUSE</Text>
          </View>

          <View style={styles.verificationRow}>
            <View style={[styles.verificationCell, { flex: 1 }]}>
              <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
              <TextInput value={metadata.hseqManager} onChangeText={(t) => handleMetadataChange('hseqManager', t)} style={styles.verificationInput} />
            </View>
          </View>

          <ScrollView horizontal style={styles.tableScroll}>
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
              {formData.map(renderRow)}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Save Draft</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, styles.submitButton]} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Submit Checklist</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    borderColor: '#1F2937',
    borderWidth: 1,
  },
  header: { borderBottomColor: '#1F2937', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  areaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 8,
  },
  mainTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15, borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, paddingVertical: 4, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaInput: { flex: 1, borderBottomColor: '#9CA3AF', borderBottomWidth: 1, fontSize: 12, paddingVertical: 2 },
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
  cellInput: { width: '100%', textAlign: 'center', fontSize: 12, height: 30, padding: 0 },
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

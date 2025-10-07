import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import useResponsive from '../utils/responsive';
import LoadingOverlay from '../components/LoadingOverlay';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CLEANING_AREAS = [
  { name: 'Processing surfaces', frequency: 'After Use' },
  { name: 'Shelves', frequency: '4' },
  { name: 'Table legs and supports', frequency: '4' },
  { name: 'Hard to reach floor areas', frequency: '3' },
  { name: 'General floor areas', frequency: 'After Use' },
  { name: 'Walls', frequency: '2' },
  { name: 'Ceilings (clean if visibly dirty)', frequency: '1' },
  { name: 'Lights (clean if visibly dirty)', frequency: '1' },
  { name: 'Baking Table', frequency: 'After each use' },
  { name: 'Slicing Table', frequency: 'After each use' },
  { name: 'Drains', frequency: 'Every day' },
  { name: 'Oven', frequency: 'After Use' },
  { name: 'Proofer', frequency: 'After Use' },
  { name: 'Mixer', frequency: 'After Use' },
  { name: 'Slicer', frequency: 'After Use' },
  { name: 'Moulds & Lids (clean if visibly dirty)', frequency: '1' },
  { name: 'Trolleys (clean if visibly dirty)', frequency: '1' },
  { name: 'Fat Trap', frequency: '3 times a week' },
  { name: 'Meat & Fish Prep Sink', frequency: 'After each use' },
];

const initialCleaningState = CLEANING_AREAS.map((area, index) => {
  const dayChecks = DAYS_OF_WEEK.reduce((acc, day) => { acc[day] = { checked: false, cleanedBy: '' }; return acc; }, {});
  return { id: index, name: area.name, frequency: area.frequency, days: dayChecks };
});

export default function Bakery_CleaningChecklist() {
  const resp = useResponsive();
  const { s, ms } = resp;
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState({ location: '', week: '', month: '', year: new Date().getFullYear().toString() });
  const [verification, setVerification] = useState({ hseqManager: '', complexManager: '' });
  const [busy, setBusy] = useState(false);
  const draftKey = 'bakery_cleaning_checklist';
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(draftKey);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
          if (d.verification) setVerification(d.verification);
        }
      } catch (e) {}
      return () => { mounted = false; };
    })();
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDraft(draftKey, { formData, metadata, verification });
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata, verification]);

  const handleCheck = (id, day) => setFormData(prev => prev.map(item => item.id === id ? { ...item, days: { ...item.days, [day]: { ...item.days[day], checked: !item.days[day].checked } } } : item));
  const handleCleanedByChange = (id, day, value) => setFormData(prev => prev.map(item => item.id === id ? { ...item, days: { ...item.days, [day]: { ...item.days[day], cleanedBy: value, checked: value.trim() !== '' ? true : item.days[day].checked } } } : item));

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Bakery Cleaning Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, verification, formData } });
      await removeDraft(draftKey);
      alert('Checklist Submitted');
    } catch (e) { alert('Failed'); }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => { setBusy(true); try { await setDraft(draftKey, { formData, metadata, verification }); alert('Draft saved'); } catch (e) { alert('Failed to save'); } finally { setBusy(false); } };
  const handleBack = () => { /* navigate home if available */ };

  const renderRow = (item) => (
    <View key={item.id} style={[styles.row, { minHeight: s(44) }]}> 
      <View style={[styles.areaCell, { minWidth: 180 }]}><Text style={styles.areaText}>{item.name}</Text></View>
      <View style={[styles.freqCell]}><Text style={styles.freqText}>{item.frequency}</Text></View>
      {DAYS_OF_WEEK.map(day => (
        <View key={day} style={styles.dayCol}>
          <TouchableOpacity onPress={() => handleCheck(item.id, day)} style={styles.checkboxWrap}><Text style={styles.checkbox}>{item.days[day].checked ? '✓' : ''}</Text></TouchableOpacity>
          <TextInput value={item.days[day].cleanedBy} onChangeText={(t)=>handleCleanedByChange(item.id, day, t)} style={styles.cleanedByInput} />
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: s(12) }} keyboardShouldPersistTaps="handled">
      <LoadingOverlay visible={busy} message={busy ? 'Working...' : ''} />
      <View style={styles.header}><Text style={[styles.hTitle, { fontSize: ms(16) }]}>BAKERY AREA CLEANING CHECKLIST</Text></View>
      <View style={styles.metaRow}>
        <TextInput placeholder="Location" value={metadata.location} onChangeText={(t)=>setMetadata(prev=>({ ...prev, location: t }))} style={styles.metaInput} />
        <TextInput placeholder="Week" value={metadata.week} onChangeText={(t)=>setMetadata(prev=>({ ...prev, week: t }))} style={styles.metaInput} />
        <TextInput placeholder="Month" value={metadata.month} onChangeText={(t)=>setMetadata(prev=>({ ...prev, month: t }))} style={styles.metaInput} />
        <TextInput placeholder="Year" value={metadata.year} onChangeText={(t)=>setMetadata(prev=>({ ...prev, year: t }))} style={styles.metaInput} />
      </View>

      <ScrollView horizontal nestedScrollEnabled contentContainerStyle={{ minWidth: 1100 }}>
        <View style={{ minWidth: 1100 }}>
          <View style={styles.tableHeader}>
            <View style={[styles.areaCell, { minWidth: 180 }]}><Text style={styles.hCellText}>Area to be cleaned</Text></View>
            <View style={[styles.freqCell]}><Text style={styles.hCellText}>Frequency</Text></View>
            {DAYS_OF_WEEK.map(day => (
              <View key={day} style={styles.dayColHeader}><Text style={styles.hCellText}>{day}</Text><Text style={styles.hCellSub}>Cleaned By</Text></View>
            ))}
          </View>
          {formData.map(renderRow)}
        </View>
      </ScrollView>

      <View style={styles.footerVerify}>
        <TextInput placeholder="Verified By: HSEQ Manager" value={verification.hseqManager} onChangeText={(t)=>setVerification(prev=>({ ...prev, hseqManager: t }))} style={styles.verifyInput} />
        <TextInput placeholder="COMPLEX MANAGER SIGN" value={verification.complexManager} onChangeText={(t)=>setVerification(prev=>({ ...prev, complexManager: t }))} style={styles.verifyInput} />
      </View>

      <View style={styles.actions}><TouchableOpacity onPress={handleBack} style={styles.auxBtn}><Text style={styles.auxBtnText}>Back</Text></TouchableOpacity>
      <TouchableOpacity onPress={handleSaveDraft} style={[styles.auxBtn, styles.warnBtn]}><Text style={styles.auxBtnText}>Save Draft</Text></TouchableOpacity>
      <TouchableOpacity onPress={handleSubmit} style={[styles.auxBtn, styles.primaryBtn]}><Text style={styles.auxBtnText}>Submit</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbff' },
  header: { marginBottom: 8 },
  hTitle: { fontWeight: '800', color: '#185a9d', textAlign: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  metaInput: { borderBottomWidth: 1, borderColor: '#ddd', padding: 6, minWidth: 80 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#777', backgroundColor: '#eee', paddingVertical: 8, alignItems: 'center' },
  areaCell: { padding: 6, borderRightWidth: 1, borderColor: '#ddd', justifyContent: 'center' },
  freqCell: { padding: 6, width: 120, borderRightWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  dayColHeader: { padding: 6, width: 120, borderRightWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  hCellText: { fontWeight: '800', fontSize: 12 },
  hCellSub: { fontSize: 10, color: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e6e6e6', alignItems: 'center', backgroundColor: '#fff' },
  dayCol: { padding: 6, width: 120, borderRightWidth: 1, borderColor: '#eee', alignItems: 'center' },
  checkboxWrap: { width: 32, height: 32, borderWidth: 1, borderColor: '#333', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  checkbox: { fontSize: 16, color: '#008000' },
  cleanedByInput: { borderBottomWidth: 1, borderColor: '#ddd', width: 80, textAlign: 'center', padding: 4 },
  areaText: { fontSize: 12, color: '#333', textAlign: 'left' },
  freqText: { fontSize: 12, color: '#333' },
  footerVerify: { marginTop: 12, borderTopWidth: 1, borderColor: '#eee', paddingTop: 12, gap: 8 },
  verifyInput: { borderBottomWidth: 1, borderColor: '#ddd', padding: 6, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  auxBtn: { backgroundColor: '#777', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  warnBtn: { backgroundColor: '#f0ad4e' },
  primaryBtn: { backgroundColor: '#185a9d' },
  auxBtnText: { color: '#fff', fontWeight: '700' },
});

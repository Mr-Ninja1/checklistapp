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
  Dimensions,
} from 'react-native';

import useFormSave from '../hooks/useFormSave';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';

const DRAFT_KEY = 'coldroom_freezer_room_cleaning_checklist_v2_draft';
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

// Updated equipment list based on the image provided
const EQUIPMENT_LIST = [
  { name: 'Door', frequency: '2' },
  { name: 'Door handle', frequency: 'Daily' },
  { name: 'Door curtains', frequency: '1' },
  { name: 'Shelves', frequency: '3' },
  { name: 'Hard to reach floors & skirting', frequency: '3' },
  { name: 'Wall', frequency: '1' },
  { name: 'Ceiling', frequency: 'As required' },
  { name: 'Floor', frequency: '7' },
  { name: 'Lights', frequency: 'As required' },
  { name: 'Cooling Unit & Fan covers', frequency: 'As required' },
  { name: 'Drain', frequency: '2' },
];

const initialCleaningState = EQUIPMENT_LIST.map((item, index) => {
  const dailyChecks = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { checked: false, cleanedBy: '', supSign: '' };
    return acc;
  }, {});
  return { id: index, name: item.name, frequency: item.frequency, checks: dailyChecks };
});

const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
    {checked && <Text style={styles.checkboxTick}>✓</Text>}
  </TouchableOpacity>
);

export default function ColdRoomFreezerChecklist() {
  const currentYear = new Date().getFullYear().toString();
  const [formData, setFormData] = useState(initialCleaningState);
  const [metadata, setMetadata] = useState({ 
    location: '', week: '', month: '', year: currentYear,
    hseqDaySigns: WEEK_DAYS.reduce((acc, d) => ({ ...acc, [d]: '' }), {}),
    managerDaySigns: WEEK_DAYS.reduce((acc, d) => ({ ...acc, [d]: '' }), {}),
  });
  
  const [busy, setBusy] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState(null);
  const saveTimer = useRef(null);
  const [editMode, setEditMode] = useState(false);

  // Column Widths
  const COL_WIDTHS = useMemo(() => ({ 
    AREA: 220, 
    FREQ: 80, 
    DAY_GROUP: 240, 
    CHECK: 40, 
    NAME: 90, 
    SUP_SIGN: 110 
  }), []);

  const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQ + (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    // Preload Logo
    (async () => {
      try {
        const asset = Asset.fromModule(require('../assets/logo.jpeg'));
        await asset.downloadAsync();
        if (asset.localUri) {
          const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 }).catch(() => null);
          if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
        }
      } catch (e) { }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCellChange = (id, day, type, value) => {
    setFormData(prev => prev.map(item => {
      if (item.id === id) {
        const newChecks = { ...item.checks };
        newChecks[day][type] = value;
        if (type !== 'checked' && value) newChecks[day].checked = true;
        return { ...item, checks: newChecks };
      }
      return item;
    }));
  };

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const buildPayload = (status = 'draft') => ({
    formType: 'ColdRoom_FreezerRoom_V2',
    templateVersion: '02',
    title: 'COLD ROOM & FREEZER ROOM CLEANING CHECKLIST',
    metadata,
    formData,
    assets: logoDataUri ? { logoDataUri } : {},
    savedAt: Date.now(),
    status,
  });

  const { handleSaveDraft: hookSaveDraft, isSaving, showNotification, notificationMessage, setShowNotification } = useFormSave({ 
    buildPayload, 
    draftId: DRAFT_KEY, 
    waitForSave: false
  });

  const handleSubmit = async () => {
    try {
      const payload = buildPayload('submitted');
      await addFormHistory({ title: payload.title, date: payload.metadata?.issueDate || Date.now(), savedAt: Date.now(), payload });
      Alert.alert('Saved', 'Checklist submitted. Your draft has been preserved.');
    } catch (e) {
      console.warn('submit failed', e);
      Alert.alert('Error', 'Submission failed');
      throw e;
    }
  };

  const handleClearDraft = async () => {
    const ok = await new Promise(resolve => {
      Alert.alert('Clear draft', 'This action will clear the draft and all your progress. Are you sure you want to continue?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Yes, Clear', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!ok) return;
    try { await removeDraft(DRAFT_KEY); } catch (e) { console.warn('removeDraft failed', e); }
    setFormData(initialCleaningState);
    setMetadata({ 
      location: '', week: '', month: '', year: currentYear,
      hseqDaySigns: WEEK_DAYS.reduce((acc, d) => ({ ...acc, [d]: '' }), {}),
      managerDaySigns: WEEK_DAYS.reduce((acc, d) => ({ ...acc, [d]: '' }), {}),
    });
    setEditMode(false);
  };

  const renderSignature = (value, onChange, width, height = 40) => {
    if (editMode) {
      return <SignatureField value={value} onChange={onChange} editable={true} width={width} height={height} />;
    }
    return value ? <SignatureThumb uri={value} width={width} height={height} /> : null;
  };

  const actionButtons = (
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={() => hookSaveDraft()} style={[styles.button, styles.draftButton]} disabled={isSaving}>
        <Text style={styles.buttonText}>Save Draft</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleClearDraft()} style={[styles.button, styles.clearButton]} disabled={isSaving}>
        <Text style={[styles.buttonText, { color: '#fff' }]}>Clear Draft</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleSubmit()} style={[styles.button, styles.submitButton]} disabled={isSaving}>
        <Text style={styles.buttonText}>Submit Checklist</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={hookSaveDraft} actionButtons={actionButtons}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* ORIGINAL HEADER LOGIC */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <Image source={require('../assets/logo.jpeg')} style={styles.brandLogo} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
                  <Text style={styles.brandSub}>Bravo Brands Central</Text>
                </View>
              </View>
              <View style={styles.headerMeta}>
                <Text style={styles.docText}>Doc No: BBN-SHEQ-P-16-R-11b</Text>
                <Text style={styles.docText}>Page 1 of 1</Text>
              </View>
              <Text style={styles.mainTitle}>COLD ROOM & FREEZER ROOM CLEANING CHECKLIST</Text>
              
              <View style={styles.areaMetaRow}>
                <View style={styles.metaField}><Text style={styles.metaLabel}>LOCATION:</Text><TextInput value={metadata.location} onChangeText={t => handleMetadataChange('location', t)} style={styles.metaInput} /></View>
                <View style={styles.metaField}><Text style={styles.metaLabel}>WEEK:</Text><TextInput value={metadata.week} onChangeText={t => handleMetadataChange('week', t)} style={styles.metaInput} /></View>
                <View style={styles.metaField}><Text style={styles.metaLabel}>MONTH:</Text><TextInput value={metadata.month} onChangeText={t => handleMetadataChange('month', t)} style={styles.metaInput} /></View>
                <View style={styles.metaField}><Text style={styles.metaLabel}>YEAR:</Text><TextInput value={metadata.year} onChangeText={t => handleMetadataChange('year', t)} style={styles.metaInput} /></View>
              </View>
            </View>

            {/* UPDATED TABLE STRUCTURE */}
            <ScrollView horizontal style={styles.tableScroll}>
              <View style={{ width: TABLE_WIDTH }}>
                <View style={styles.headerRow}>
                  <View style={[styles.headerCell, { width: COL_WIDTHS.AREA }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
                  <View style={[styles.headerCell, { width: COL_WIDTHS.FREQ }]}><Text style={styles.headerText}>Freq</Text></View>
                  {WEEK_DAYS.map(day => (
                    <View key={day} style={[styles.dayHeaderGroup, { width: COL_WIDTHS.DAY_GROUP }]}>
                      <Text style={styles.headerText}>{day}</Text>
                      <View style={styles.subHeaderRow}>
                        <Text style={[styles.subHeaderText, { width: COL_WIDTHS.CHECK }]}>✓</Text>
                        <Text style={[styles.subHeaderText, { width: COL_WIDTHS.NAME }]}>Cleaned By</Text>
                        <Text style={[styles.subHeaderText, { width: COL_WIDTHS.SUP_SIGN, borderRightWidth: 0 }]}>SUP SIGN</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {formData.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <View style={[styles.cell, { width: COL_WIDTHS.AREA }]}><Text style={styles.equipmentText}>{item.name}</Text></View>
                    <View style={[styles.cell, { width: COL_WIDTHS.FREQ, alignItems: 'center' }]}><Text style={styles.equipmentText}>{item.frequency}</Text></View>
                    {WEEK_DAYS.map(day => (
                      <View key={day} style={[styles.dayGroupCell, { width: COL_WIDTHS.DAY_GROUP }]}>
                        <View style={[styles.cell, { width: COL_WIDTHS.CHECK, borderRightWidth: 1, alignItems: 'center' }]}>
                          <Checkbox checked={item.checks[day].checked} onPress={() => handleCellChange(item.id, day, 'checked', !item.checks[day].checked)} />
                        </View>
                        <TextInput style={[styles.cellInput, { width: COL_WIDTHS.NAME, borderRightWidth: 1 }]} value={item.checks[day].cleanedBy} onChangeText={t => handleCellChange(item.id, day, 'cleanedBy', t)} />
                        <View style={{ width: COL_WIDTHS.SUP_SIGN, justifyContent: 'center' }}>
                          {renderSignature(item.checks[day].supSign, v => handleCellChange(item.id, day, 'supSign', v), COL_WIDTHS.SUP_SIGN)}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                {/* FOOTER SIGNATURES (Spanning columns as requested) */}
                <View style={styles.footerSignatureRow}>
                  <View style={[styles.cell, { width: COL_WIDTHS.AREA + COL_WIDTHS.FREQ, backgroundColor: '#f3f4f6' }]}><Text style={styles.footerLabel}>HSEQ SIGN</Text></View>
                  {WEEK_DAYS.map(day => (
                    <View key={day} style={[styles.dayGroupCell, { width: COL_WIDTHS.DAY_GROUP }]}>
                      <View style={{ width: COL_WIDTHS.CHECK, borderRightWidth: 1, backgroundColor: '#f3f4f6', justifyContent: 'center' }}><Text style={styles.dayIndicatorText}>{day}</Text></View>
                      <View style={{ width: COL_WIDTHS.NAME + COL_WIDTHS.SUP_SIGN, justifyContent: 'center' }}>
                        {renderSignature(metadata.hseqDaySigns[day], v => handleMetadataChange('hseqDaySigns', { ...metadata.hseqDaySigns, [day]: v }), COL_WIDTHS.NAME + COL_WIDTHS.SUP_SIGN, 50)}
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.footerSignatureRow}>
                  <View style={[styles.cell, { width: COL_WIDTHS.AREA + COL_WIDTHS.FREQ, backgroundColor: '#f3f4f6' }]}><Text style={styles.footerLabel}>COMPLEX MANAGER / FSC SIGN</Text></View>
                  {WEEK_DAYS.map(day => (
                    <View key={day} style={[styles.dayGroupCell, { width: COL_WIDTHS.DAY_GROUP }]}>
                      <View style={{ width: COL_WIDTHS.CHECK, borderRightWidth: 1, backgroundColor: '#f3f4f6', justifyContent: 'center' }}><Text style={styles.dayIndicatorText}>{day}</Text></View>
                      <View style={{ width: COL_WIDTHS.NAME + COL_WIDTHS.SUP_SIGN, justifyContent: 'center' }}>
                        {renderSignature(metadata.managerDaySigns[day], v => handleMetadataChange('managerDaySigns', { ...metadata.managerDaySigns, [day]: v }), COL_WIDTHS.NAME + COL_WIDTHS.SUP_SIGN, 50)}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </EditableFormContainer>
      <LoadingOverlay visible={isSaving} />
      <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 8, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#1F2937', borderWidth: 1 },
  header: { borderBottomColor: '#1F2937', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8 },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  mainTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, padding: 4, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaInput: { flex: 1, fontSize: 11, paddingVertical: 2 },
  tableScroll: { borderWidth: 1, borderColor: '#1F2937', marginTop: 10 },
  headerRow: { flexDirection: 'row', backgroundColor: '#6B7280' },
  headerCell: { padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1F2937' },
  headerText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  dayHeaderGroup: { borderRightWidth: 1, borderRightColor: '#1F2937', alignItems: 'center' },
  subHeaderRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#fff' },
  subHeaderText: { color: '#fff', fontSize: 9, textAlign: 'center', paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#fff' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#4B5563', minHeight: 45 },
  dayGroupCell: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#4B5563' },
  cell: { padding: 4, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#4B5563' },
  cellInput: { fontSize: 11, textAlign: 'center', padding: 0 },
  equipmentText: { fontSize: 11, color: '#1F2937' },
  footerSignatureRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 65 },
  footerLabel: { fontSize: 9, fontWeight: 'bold', textAlign: 'right', paddingRight: 10 },
  dayIndicatorText: { fontSize: 8, textAlign: 'center', fontWeight: 'bold', color: '#666' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: '#10B981', backgroundColor: '#10B981' },
  checkboxUnchecked: { borderColor: '#4B5563', backgroundColor: '#FFFFFF' },
  checkboxTick: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  button: { width: 140, marginLeft: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  draftButton: { backgroundColor: '#FBBF24' },
  submitButton: { backgroundColor: '#4F46E5' },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
});
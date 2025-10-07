import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'react-native';
import useResponsive from '../utils/responsive';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { useEffect, useRef } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

// TIME SLOTS and equipment list: match the scanned kitchen form (AM shift 06:00-16:00)
const TIME_SLOTS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];
const EQUIPMENT_LIST = [
  'HOT PASS',
  'MAKELINE TABLE',
  'PREPARATION TABLE',
  'MEAT & PASTRY FREEZER',
  'GAS GRILL',
  'VEG SINK',
  // combine FLAT TOP and FISH AND MEAT SINK into one row as requested
  'FLAT TOP\nFISH AND MEAT SINK',
  'PRECOOKED FOOD UNDERBAR-CHILLERS',
];

const initialEquipmentState = EQUIPMENT_LIST.map((name, index) => {
  const times = TIME_SLOTS.reduce((acc, time) => { acc[time] = false; return acc; }, {});
  return { id: index, name, ppm: '', times, staffName: '', staffSign: '', slipName: '', supSign: '' };
});

const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}>
    <Text style={styles.checkboxText}>{checked ? '✓' : ''}</Text>
  </TouchableOpacity>
);

const HeaderCell = ({ children, width, style = {} }) => (
  <View style={[styles.headerCell, { width }, style]}>
    <Text style={styles.headerText}>{children}</Text>
  </View>
);

const DataCell = ({ children, width, style = {} }) => (
  <View style={[styles.dataCell, { width }, style]}>
    {children}
  </View>
);

export default function Kitchen_DailyCleaningForm() {
  const resp = useResponsive();
  const [formData, setFormData] = useState(initialEquipmentState);
  const [busy, setBusy] = useState(false);
  const [loadingDraft, setLoadingDraft] = React.useState(true);
  const draftKey = 'kitchen_daily_cleaning';
  const saveTimer = useRef(null);
  const navigation = (typeof require('@react-navigation/native') !== 'undefined') ? require('@react-navigation/native').useNavigation() : null;

  const now = new Date();
  const sysDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  // Determine current shift automatically from system time
  const sysShift = now.getHours() >= 12 ? 'PM' : 'AM';
  const [metadata, setMetadata] = useState({ date: sysDate, location: '', shift: sysShift, verifiedBy: '' });

  const handleMetadataChange = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleTimeToggle = (id, time) => setFormData(prev => prev.map(r => r.id === id ? { ...r, times: { ...r.times, [time]: !r.times[time] } } : r));
  const handleInput = (id, field, value) => setFormData(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  // load draft on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const draft = await getDraft(draftKey);
        if (draft && mounted) {
          if (draft.formData) setFormData(draft.formData);
          if (draft.metadata) setMetadata(draft.metadata);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingDraft(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // auto-save draft (debounced)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDraft(draftKey, { formData, metadata });
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  const { width: vw, s, ms } = resp;
  const containerPadding = s(12);
  const availableWidth = Math.max(360, vw - containerPadding * 2);
  const targetTableWidth = Math.round(availableWidth * 0.98);

  // Update proportions to match Promptdoc: include PPM and several signature columns
  const PROPORTIONS = useMemo(() => ({
    EQUIPMENT: 0.20,
    PPM: 0.10,
    // Reduce time-slot share slightly to give more room to supervisor fields for printing
    TIME_SLOTS: 0.30,
    STAFF_NAME: 0.10,
    SIGNATURE: 0.10,
    SLIP_NAME: 0.12,
    SUP_SIGN: 0.12,
  }), []);

  const COL_WIDTHS = useMemo(() => {
    const equipment = Math.max(100, Math.round(targetTableWidth * PROPORTIONS.EQUIPMENT));
    const ppm = Math.max(40, Math.round(targetTableWidth * PROPORTIONS.PPM));
  const timeSlotsTotal = Math.max(220, Math.round(targetTableWidth * PROPORTIONS.TIME_SLOTS));
  const perTime = Math.max(56, Math.floor(timeSlotsTotal / TIME_SLOTS.length));
  const staff = Math.max(80, Math.round(targetTableWidth * PROPORTIONS.STAFF_NAME));
  const sign = Math.max(80, Math.round(targetTableWidth * PROPORTIONS.SIGNATURE));
  const slip = Math.max(140, Math.round(targetTableWidth * PROPORTIONS.SLIP_NAME));
  const sup = Math.max(140, Math.round(targetTableWidth * PROPORTIONS.SUP_SIGN));

    return {
      EQUIPMENT: equipment,
      PPM: ppm,
      TIME_SLOT: perTime,
      STAFF_NAME: staff,
      SIGNATURE: sign,
      SLIP_NAME: slip,
      SUP_SIGN: sup,
    };
  }, [targetTableWidth, PROPORTIONS]);

  const TIME_SLOTS_WIDTH = COL_WIDTHS.TIME_SLOT * TIME_SLOTS.length;
  const TOTAL_TABLE_WIDTH = COL_WIDTHS.EQUIPMENT + COL_WIDTHS.PPM + TIME_SLOTS_WIDTH + COL_WIDTHS.STAFF_NAME + COL_WIDTHS.SIGNATURE + COL_WIDTHS.SLIP_NAME + COL_WIDTHS.SUP_SIGN;

  const renderRow = (row) => (
    <View key={row.id} style={[styles.row, { width: TOTAL_TABLE_WIDTH, minHeight: s(56) }]}>
      <DataCell width={COL_WIDTHS.EQUIPMENT} style={styles.leftAlign}>
        <Text numberOfLines={2} style={[styles.dataText, { fontSize: ms(12), flexWrap: 'wrap' }]}>{row.name}</Text>
      </DataCell>
      {/* PPM input column */}
      <DataCell width={COL_WIDTHS.PPM}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} onChangeText={(text) => handleInput(row.id, 'ppm', text)} value={row.ppm} keyboardType="numeric" placeholder="0" /></DataCell>
      <View style={{ flexDirection: 'row', width: TIME_SLOTS_WIDTH }}>{TIME_SLOTS.map(t => (<DataCell key={t} width={COL_WIDTHS.TIME_SLOT}><Checkbox checked={row.times[t]} onPress={()=>handleTimeToggle(row.id,t)} /></DataCell>))}</View>
      <DataCell width={COL_WIDTHS.STAFF_NAME}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} value={row.staffName} onChangeText={(t)=>handleInput(row.id,'staffName',t)} /></DataCell>
      <DataCell width={COL_WIDTHS.SIGNATURE}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} value={row.staffSign} onChangeText={(t)=>handleInput(row.id,'staffSign',t)} /></DataCell>
      <DataCell width={COL_WIDTHS.SLIP_NAME}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} value={row.slipName} onChangeText={(t)=>handleInput(row.id,'slipName',t)} /></DataCell>
      <DataCell width={COL_WIDTHS.SUP_SIGN}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} value={row.supSign} onChangeText={(t)=>handleInput(row.id,'supSign',t)} /></DataCell>
    </View>
  );

  const handleSave = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Kitchen Daily Cleaning', date: metadata.date, savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(draftKey);
      alert('Submitted and saved to history');
      if (navigation && navigation.navigate) navigation.navigate('Home');
    } catch (e) {
      alert('Failed to submit');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await setDraft(draftKey, { formData, metadata });
      alert('Draft saved');
    } catch (e) {
      alert('Failed to save draft');
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    setBusy(true);
    setTimeout(() => {
      if (navigation && navigation.navigate) navigation.navigate('Home');
      setBusy(false);
    }, 180);
  };

  return (
    <ScrollView style={[styles.container, { padding: containerPadding }]} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} alwaysBounceVertical>
      <LoadingOverlay visible={busy} message={busy ? 'Working...' : ''} />
      <View style={styles.headerTop}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.companyName}>Bravo</Text>
        <Text style={[styles.title, { fontSize: ms(14), flex: 1, textAlign: 'center' }]}>KITCHEN DAILY CLEANING & SANITIZING LOG SHEET</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 8, padding: 8, backgroundColor: '#eee', borderRadius: 6 }}><Text>Back</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSaveDraft} style={{ marginRight: 8, padding: 8, backgroundColor: '#f0ad4e', borderRadius: 6 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Save Draft</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={{ padding: 8, backgroundColor: '#185a9d', borderRadius: 6 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          {Object.keys(metadata).map(key => (
            <View key={key} style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { fontSize: ms(10) }]}>{key.charAt(0).toUpperCase()+key.slice(1)}:</Text>
              <TextInput style={[styles.metadataInput, { minWidth: s(80), height: s(28), fontSize: ms(10) }]} value={metadata[key]} onChangeText={(t)=>handleMetadataChange(key,t)} />
            </View>
          ))}
        </View>
        <Text style={[styles.tickInstruction, { fontSize: ms(11) }]}>✓ TICK AFTER CLEANING</Text>
      </View>

      <View onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true} onResponderTerminationRequest={()=>false}>
        <ScrollView horizontal nestedScrollEnabled={true} showsHorizontalScrollIndicator={true} directionalLockEnabled={false} contentContainerStyle={{ flexDirection: 'column', minWidth: TOTAL_TABLE_WIDTH }} keyboardShouldPersistTaps="handled" alwaysBounceHorizontal>
          <View style={{ width: TOTAL_TABLE_WIDTH, minWidth: TOTAL_TABLE_WIDTH }}>
            <View style={[styles.headerRow, { width: TOTAL_TABLE_WIDTH }]}>
              <HeaderCell width={COL_WIDTHS.EQUIPMENT} style={styles.leftAlign}><Text style={[styles.headerText, { fontSize: ms(10) }]}>EQUIPMENT</Text></HeaderCell>
              <HeaderCell width={COL_WIDTHS.PPM}><Text style={[styles.headerText, { fontSize: ms(10) }]}>SANITIZER-VEG WASH </Text></HeaderCell>
              <View style={{ width: TIME_SLOTS_WIDTH, borderLeftWidth: 1, borderColor: '#333' }}>
                <HeaderCell style={{ borderBottomWidth: 1, width: '100%' }}><Text style={[styles.headerText, { fontSize: ms(10) }]}>TIME INTERVAL</Text></HeaderCell>
                <View style={{ flexDirection: 'row' }}>{TIME_SLOTS.map((time, idx)=> (<HeaderCell key={idx} width={COL_WIDTHS.TIME_SLOT} style={styles.timeHeader}><Text numberOfLines={1} style={{ fontSize: ms(9), flexShrink: 1 }}>{time}</Text></HeaderCell>))}</View>
              </View>
              <HeaderCell width={COL_WIDTHS.STAFF_NAME}><Text style={[styles.headerText, { fontSize: ms(10) }]}>STAFF NAME</Text></HeaderCell>
              <HeaderCell width={COL_WIDTHS.SIGNATURE}><Text style={[styles.headerText, { fontSize: ms(10) }]}>STAFF SIGN</Text></HeaderCell>
              <HeaderCell width={COL_WIDTHS.SLIP_NAME}><Text style={[styles.headerText, { fontSize: ms(10) }]}>SUP NAME</Text></HeaderCell>
              <HeaderCell width={COL_WIDTHS.SUP_SIGN}><Text style={[styles.headerText, { fontSize: ms(10) }]}>SUP SIGN</Text></HeaderCell>
            </View>

            {formData.map(renderRow)}
          </View>
        </ScrollView>
      </View>

      <Text style={[styles.instruction, { fontSize: ms(10) }]}>Instruction: All kitchen staff must clean and sanitize the listed areas after use.</Text>

      <View style={{ padding: s(8), alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleSaveDraft} style={{ backgroundColor: '#f0ad4e', paddingVertical: s(8), paddingHorizontal: s(12), borderRadius: 8, marginRight: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(11) }}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#185a9d', paddingVertical: s(8), paddingHorizontal: s(12), borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(11) }}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f9f9f9' },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, paddingVertical: 6, color: '#333' },
  metadataContainer: { marginBottom: 15, borderWidth: 1, borderColor: '#333', padding: 12, borderRadius: 6, backgroundColor: '#fff' },
  metadataRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 6 },
  metadataItem: { flexDirection: 'row', alignItems: 'center', marginRight: 18, marginBottom: 10 },
  metadataLabel: { fontWeight: '700', fontSize: 12, color: '#555' },
  metadataInput: { borderBottomWidth: 1, borderBottomColor: '#aaa', paddingHorizontal: 6, minWidth: 80, height: 28, fontSize: 12 },
  tickInstruction: { marginTop: 6, fontWeight: 'bold', fontSize: 13, color: '#006400' },
  headerRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#333', backgroundColor: '#e9e9e9', borderBottomWidth: 2, minHeight: 48, alignItems: 'center' },
  headerCell: { padding: 8, borderRightWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  timeHeader: { padding: 6, borderRightWidth: 1, borderColor: '#333' },
  headerText: { fontWeight: '800', fontSize: 12, textAlign: 'center', color: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc', minHeight: 44, backgroundColor: '#fff', alignItems: 'center' },
  dataCell: { padding: 6, borderRightWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  leftAlign: { alignItems: 'flex-start', paddingLeft: 12 },
  dataText: { fontSize: 12, color: '#333' },
  textInput: { width: '100%', height: 36, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 6, fontSize: 12, textAlign: 'center', backgroundColor: '#fff', borderRadius: 4 },
  checkboxContainer: { width: 26, height: 26, borderWidth: 1.5, borderColor: '#333', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6fff6' },
  checkboxText: { fontSize: 14, fontWeight: 'bold', color: '#008000' },
  instruction: { marginTop: 22, fontSize: 12, fontStyle: 'italic', padding: 6, textAlign: 'center', color: '#666' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 64, height: 48, marginRight: 8 },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d', marginRight: 12 },
});

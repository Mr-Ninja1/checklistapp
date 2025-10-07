import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'react-native';
import useResponsive from '../utils/responsive';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
// ...existing code... (react hooks consolidated above)
import { useNavigation } from '@react-navigation/native';
import LoadingOverlay from '../components/LoadingOverlay';

// --- DATA STRUCTURE ---
const TIME_SLOTS = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const EQUIPMENT_LIST = [
  'TABLES',
  'CHAIRS',
  'GRAB AND GO CHILLER',
  'GELATO CHILLER',
  'COFFEE MACHINE',
  'MARY CHEF',
  'BLENDERS',
  'JUICE MAKER',
  'FIRE EXTINGUISHERS',
];

const initialEquipmentState = EQUIPMENT_LIST.map((name, index) => {
  const times = TIME_SLOTS.reduce((acc, time) => {
    acc[time] = false;
    return acc;
  }, {});

  return {
    id: index,
    name,
    ppm: '',
    staffName: '',
    staffSign: '',
    slipName: '',
    supSign: '',
    times,
  };
});

// Checkbox component
const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}>
    <Text style={styles.checkboxText}>{checked ? '✓' : ''}</Text>
  </TouchableOpacity>
);

const HeaderCell = ({ children, width, flex = 0, style = {} }) => (
  <View style={[styles.headerCell, { width, flex }, style]}>
    <Text style={styles.headerText}>{children}</Text>
  </View>
);

const DataCell = ({ children, width, flex = 0, style = {} }) => (
  <View style={[styles.dataCell, { width, flex }, style]}>
    {children}
  </View>
);

export default function FOH_DailyCleaningForm() {
  const resp = useResponsive();
  const [formData, setFormData] = useState(initialEquipmentState);
  const [loadingDraft, setLoadingDraft] = React.useState(true);
  const draftKey = 'foh_daily_cleaning';
  const saveTimer = useRef(null);
  const navigation = useNavigation();
  const now = new Date();
  const sysDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const sysShift = now.getHours() >= 12 ? 'PM' : 'AM';
  const [metadata, setMetadata] = useState({ date: sysDate, location: '', shift: sysShift, verifiedBy: '' });

  const handleMetadataChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

  const handleInputChange = (id, field, value) => {
    setFormData(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleTimeCheck = (id, timeSlot) => {
    setFormData(prev => prev.map(item => (item.id === id ? { ...item, times: { ...item.times, [timeSlot]: !item.times[timeSlot] } } : item)));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await getDraft(draftKey);
      if (d && mounted) {
        if (d.formData) setFormData(d.formData);
        if (d.metadata) setMetadata(d.metadata);
      }
      if (mounted) setLoadingDraft(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(draftKey, { formData, metadata }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  // Compute column widths dynamically to fit the available viewport (A4-friendly)
  const { width: vw, height: vh, s, ms } = resp;
  const containerPadding = s(12);
  const availableWidth = Math.max(360, vw - containerPadding * 2); // minimum fallback

  const targetTableWidth = Math.round(availableWidth * 0.98); // aim to fill 98% of available width

  // Proportions for columns (sum ~= 1)
  const PROPORTIONS = useMemo(() => ({
    EQUIPMENT: 0.20,
    PPM: 0.07,
    TIME_SLOTS: 0.36,
    STAFF_NAME: 0.11, // widened
    SIGNATURE: 0.11, // widened
    SLIP_NAME: 0.095,
    SUP_SIGN: 0.095,
  }), []);

  const COL_WIDTHS = useMemo(() => {
    const equipment = Math.max(100, Math.round(targetTableWidth * PROPORTIONS.EQUIPMENT));
    const ppm = Math.max(40, Math.round(targetTableWidth * PROPORTIONS.PPM));
    const timeSlotsTotal = Math.max(100, Math.round(targetTableWidth * PROPORTIONS.TIME_SLOTS));
    const perTime = Math.max(28, Math.floor(timeSlotsTotal / TIME_SLOTS.length));
    const staff = Math.max(60, Math.round(targetTableWidth * PROPORTIONS.STAFF_NAME));
    const sign = Math.max(60, Math.round(targetTableWidth * PROPORTIONS.SIGNATURE));
    const slip = Math.max(60, Math.round(targetTableWidth * PROPORTIONS.SLIP_NAME));
    const sup = Math.max(60, Math.round(targetTableWidth * PROPORTIONS.SUP_SIGN));

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

  const renderLogRow = (item) => (
    <View key={item.id} style={[styles.row, { width: TOTAL_TABLE_WIDTH, minHeight: s(44) }]}> 
      <DataCell width={COL_WIDTHS.EQUIPMENT} style={styles.leftAlign}><Text style={[styles.dataText, { fontSize: ms(12) }]}>{item.name}</Text></DataCell>
      <DataCell width={COL_WIDTHS.PPM}>
        <TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} onChangeText={(text) => handleInputChange(item.id, 'ppm', text)} value={item.ppm} keyboardType="numeric" placeholder="0" />
      </DataCell>
      <View style={{ flexDirection: 'row', width: TIME_SLOTS_WIDTH }}>
        {TIME_SLOTS.map(time => (
          <DataCell key={time} width={COL_WIDTHS.TIME_SLOT}>
            <Checkbox checked={item.times[time]} onPress={() => handleTimeCheck(item.id, time)} />
          </DataCell>
        ))}
      </View>
      <DataCell width={COL_WIDTHS.STAFF_NAME}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} onChangeText={(text) => handleInputChange(item.id, 'staffName', text)} value={item.staffName} /></DataCell>
      <DataCell width={COL_WIDTHS.SIGNATURE}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} onChangeText={(text) => handleInputChange(item.id, 'staffSign', text)} value={item.staffSign} /></DataCell>
      <DataCell width={COL_WIDTHS.SLIP_NAME}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} onChangeText={(text) => handleInputChange(item.id, 'slipName', text)} value={item.slipName} /></DataCell>
      <DataCell width={COL_WIDTHS.SUP_SIGN}><TextInput style={[styles.textInput, { height: s(36), fontSize: ms(12) }]} onChangeText={(text) => handleInputChange(item.id, 'supSign', text)} value={item.supSign} /></DataCell>
    </View>
  );

  const handleSave = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'FOH Daily Cleaning', date: metadata.date, savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(draftKey);
      alert('Submitted and saved to history');
      navigation.navigate('Home');
    } catch (e) { alert('Failed to submit'); }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await setDraft(draftKey, { formData, metadata });
      alert('Draft saved');
    } catch (e) { alert('Failed to save draft'); }
    finally { setBusy(false); }
  };

  const handleBack = () => navigation.navigate('Home');
  const [busy, setBusy] = useState(false);

  const needsHorizontal = TOTAL_TABLE_WIDTH > availableWidth;

  return (
    <ScrollView style={[styles.container, { padding: containerPadding }]} keyboardShouldPersistTaps="handled">
      <LoadingOverlay visible={busy} message={busy ? 'Working...' : ''} />
      {/* Header with logo and company name */}
      <View style={styles.headerTop}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.companyName}>Bravo</Text>
        <Text style={[styles.title, { fontSize: ms(14), flex: 1, textAlign: 'center' }]}>FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH</Text>
      </View>

      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          {Object.keys(metadata).map(key => (
            <View key={key} style={styles.metadataItem}>
              <Text style={[styles.metadataLabel, { fontSize: ms(10) }]}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
              <TextInput style={[styles.metadataInput, { minWidth: s(80), height: s(28), fontSize: ms(10) }]} value={metadata[key]} onChangeText={(t) => handleMetadataChange(key, t)} />
            </View>
          ))}
        </View>
        <Text style={[styles.tickInstruction, { fontSize: ms(11) }]}>✓ TICK AFTER CLEANING</Text>
      </View>

      {/* Table area: allow horizontal scroll when needed (wrap in responder-enabled View so horizontal swipes register) */}
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
      >
        <ScrollView
          horizontal={true}
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={true}
          directionalLockEnabled={true}
          contentContainerStyle={{ flexDirection: 'column', minWidth: TOTAL_TABLE_WIDTH }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: TOTAL_TABLE_WIDTH, minWidth: TOTAL_TABLE_WIDTH }}>
          <View style={[styles.headerRow, { width: TOTAL_TABLE_WIDTH }]}>
            <HeaderCell width={COL_WIDTHS.EQUIPMENT} style={styles.leftAlign}><Text style={[styles.headerText, { fontSize: ms(10) }]}>EQUIPMENT</Text></HeaderCell>
            <HeaderCell width={COL_WIDTHS.PPM}><Text style={[styles.headerText, { fontSize: ms(10) }]}>SANITIZER-VEG WASH (PPM?)</Text></HeaderCell>
            <View style={{ width: TIME_SLOTS_WIDTH, borderLeftWidth: 1, borderColor: '#333' }}>
              <HeaderCell style={{ borderBottomWidth: 1, width: '100%' }}><Text style={[styles.headerText, { fontSize: ms(10) }]}>TIME INTERVAL</Text></HeaderCell>
              <View style={{ flexDirection: 'row' }}>{TIME_SLOTS.map((time, index) => (<HeaderCell key={index} width={COL_WIDTHS.TIME_SLOT} style={styles.timeHeader}><Text style={{ fontSize: ms(9) }}>{time}</Text></HeaderCell>))}</View>
            </View>
            <HeaderCell width={COL_WIDTHS.STAFF_NAME}><Text style={[styles.headerText, { fontSize: ms(10) }]}>STAFF NAME</Text></HeaderCell>
            <HeaderCell width={COL_WIDTHS.SIGNATURE}><Text style={[styles.headerText, { fontSize: ms(10) }]}>STAFF SIGN</Text></HeaderCell>
            <HeaderCell width={COL_WIDTHS.SLIP_NAME}><Text style={[styles.headerText, { fontSize: ms(10) }]}>SLIP NAME</Text></HeaderCell>
            <HeaderCell width={COL_WIDTHS.SUP_SIGN}><Text style={[styles.headerText, { fontSize: ms(10) }]}>SUP SIGN</Text></HeaderCell>
          </View>

          {formData.map(renderLogRow)}
        </View>
      </ScrollView>
  </View>

      <Text style={[styles.instruction, { fontSize: ms(10) }]}>Instruction: All food handlers are required to clean and sanitize the equipment used every after use.</Text>

      <View style={{ padding: s(8), alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: s(8) }}>
        <TouchableOpacity onPress={handleBack} style={{ backgroundColor: '#777', paddingVertical: s(8), paddingHorizontal: s(12), borderRadius: 8, marginRight: s(8) }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(11) }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSaveDraft} style={{ backgroundColor: '#f0ad4e', paddingVertical: s(8), paddingHorizontal: s(12), borderRadius: 8, marginRight: s(8) }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(11) }}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#185a9d', paddingVertical: s(8), paddingHorizontal: s(12), borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(11) }}>Submit</Text>
        </TouchableOpacity>
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

// add simple button styles used in new UI
const extraButtonStyles = StyleSheet.create({
  auxButton: { backgroundColor: '#777', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  auxButtonSaveDraft: { backgroundColor: '#f0ad4e', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  auxButtonText: { color: '#fff', fontWeight: '700' },
});

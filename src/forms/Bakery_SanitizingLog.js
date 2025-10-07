import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import useResponsive from '../utils/responsive';
import LoadingOverlay from '../components/LoadingOverlay';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';

// TIME SLOTS (AM shift) from cat.md
const TIME_SLOTS = [
  '06:00AM','07:00AM','08:00AM','09:00AM','10:00AM','11:00AM','12:00PM','13:00PM','14:00PM','15:00PM','16:00PM'
];

const EQUIPMENT_LIST = [
  'MIXING BOWL',
  'PRODUCTION TABLE',
  'FINISHED PRODUCT TBLE',
  'SLICING MACHINE',
  'DUMPING TABLE',
  'BREAD SHELF',
  'SCRAPER',
  'PASTRY TABLE',
];

const makeInitial = () => EQUIPMENT_LIST.map((name, idx) => {
  const times = TIME_SLOTS.reduce((acc, t) => { acc[t] = false; return acc; }, {});
  return { id: idx, name, ppm: '', staffName: '', staffSign: '', supName: '', supSign: '', times };
});

export default function Bakery_SanitizingLog() {
  const resp = useResponsive();
  const { width: vw, s, ms } = resp;
  const [formData, setFormData] = useState(makeInitial());
  const now = new Date();
  const sysDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const sysShift = now.getHours() >= 12 ? 'PM' : 'AM';
  const [metadata, setMetadata] = useState({ date: sysDate, location: '', shift: sysShift, verifiedBy: '' });
  const [busy, setBusy] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const draftKey = 'bakery_sanitizing_log';
  const saveTimer = useRef(null);
  const navigation = (typeof require('@react-navigation/native') !== 'undefined') ? require('@react-navigation/native').useNavigation() : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(draftKey);
        if (d && mounted) {
          if (d.formData) setFormData(d.formData);
          if (d.metadata) setMetadata(d.metadata);
        }
      } catch (e) {}
      if (mounted) setLoadingDraft(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDraft(draftKey, { formData, metadata });
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData, metadata]);

  const COL_WIDTHS = useMemo(() => ({
    EQUIP: Math.max(120, Math.round(vw * 0.22)),
    PPM: Math.max(60, Math.round(vw * 0.12)),
    TIME: Math.max(44, Math.round(vw * 0.04)),
    STAFF: Math.max(90, Math.round(vw * 0.12)),
    SIGN: Math.max(90, Math.round(vw * 0.12)),
    SUP: Math.max(100, Math.round(vw * 0.14)),
  }), [vw]);

  const handleToggle = (id, t) => setFormData(prev => prev.map(r => r.id === id ? { ...r, times: { ...r.times, [t]: !r.times[t] } } : r));
  const handleInput = (id, field, v) => setFormData(prev => prev.map(r => r.id === id ? { ...r, [field]: v } : r));
  const handleMeta = (k, v) => setMetadata(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setBusy(true);
    try {
      await addFormHistory({ title: 'Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery', date: metadata.date || new Date().toLocaleDateString(), savedAt: Date.now(), meta: { metadata, formData } });
      await removeDraft(draftKey);
      alert('Submitted and saved to history');
      if (navigation && navigation.navigate) navigation.navigate('Home');
    } catch (e) { alert('Failed to submit'); }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => { setBusy(true); try { await setDraft(draftKey, { formData, metadata }); alert('Draft saved'); } catch (e) { alert('Failed to save draft'); } finally { setBusy(false); } };
  const handleBack = () => { setBusy(true); setTimeout(()=>{ if (navigation && navigation.navigate) navigation.navigate('Home'); setBusy(false); }, 150); };

  return (
    <ScrollView style={[styles.container, { padding: s(12) }]} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <LoadingOverlay visible={busy} message={busy ? 'Working...' : ''} />
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.companyName}>Bravo</Text>
        </View>
        <Text style={[styles.title, { fontSize: ms(16), flex: 1, textAlign: 'center' }]}>FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET - BAKERY</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleBack} style={styles.ghostBtn}><Text>Back</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSaveDraft} style={styles.warnBtn}><Text style={{ color: '#fff' }}>Save Draft</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.primaryBtn}><Text style={{ color: '#fff' }}>Submit</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.metadataContainer}>
        {Object.keys(metadata).map(k => (
          <View key={k} style={styles.metaItem}>
            <Text style={styles.metaLabel}>{k.charAt(0).toUpperCase()+k.slice(1)}:</Text>
            <TextInput value={metadata[k]} onChangeText={(t)=>handleMeta(k,t)} style={styles.metaInput} />
          </View>
        ))}
        <Text style={styles.tick}>✓ TICK AFTER CLEANING</Text>
      </View>

      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: 900 }}>
        <View style={{ minWidth: 900 }}>
          <View style={[styles.tableHeader, { minWidth: 900 }]}>
            <View style={[styles.hCell, { width: COL_WIDTHS.EQUIP }]}><Text style={styles.hText}>EQUIPMENT</Text></View>
            <View style={[styles.hCell, { width: COL_WIDTHS.PPM }]}><Text style={styles.hText}>SANITIZER (PPM)</Text></View>
            <View style={{ flexDirection: 'row', width: COL_WIDTHS.TIME * TIME_SLOTS.length }}>{TIME_SLOTS.map(t => (<View key={t} style={[styles.hCell, { width: COL_WIDTHS.TIME }]}><Text style={styles.hTextSmall}>{t.replace(/(AM|PM)/,'')}</Text></View>))}</View>
            <View style={[styles.hCell, { width: COL_WIDTHS.STAFF }]}><Text style={styles.hText}>STAFF NAME</Text></View>
            <View style={[styles.hCell, { width: COL_WIDTHS.SIGN }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCell, { width: COL_WIDTHS.SUP }]}><Text style={styles.hText}>SUP NAME</Text></View>
            <View style={[styles.hCell, { width: COL_WIDTHS.SUP }]}><Text style={styles.hText}>SUP SIGN</Text></View>
          </View>

          {formData.map(row => (
            <View key={row.id} style={[styles.row, { minWidth: 900 }]}>
              <View style={[styles.cell, { width: COL_WIDTHS.EQUIP }]}><Text style={styles.cellText}>{row.name}</Text></View>
              <View style={[styles.cell, { width: COL_WIDTHS.PPM }]}><TextInput value={row.ppm} onChangeText={(t)=>handleInput(row.id,'ppm',t)} style={styles.smallInput} keyboardType="numeric" /></View>
              <View style={{ flexDirection: 'row', width: COL_WIDTHS.TIME * TIME_SLOTS.length }}>{TIME_SLOTS.map(t => (
                <View key={t} style={[styles.cell, { width: COL_WIDTHS.TIME }]}>
                  <TouchableOpacity onPress={()=>handleToggle(row.id,t)} style={styles.boxTouchable} accessible accessibilityRole="checkbox" accessibilityState={{ checked: !!row.times[t] }} activeOpacity={0.7}>
                    <View style={[styles.box, row.times[t] ? { backgroundColor: '#1f8f1f' } : null]}>{row.times[t] ? <Text style={{color:'#fff'}}>✓</Text> : null}</View>
                  </TouchableOpacity>
                </View>
              ))}</View>
              <View style={[styles.cell, { width: COL_WIDTHS.STAFF }]}><TextInput value={row.staffName} onChangeText={(t)=>handleInput(row.id,'staffName',t)} style={styles.smallInput} /></View>
              <View style={[styles.cell, { width: COL_WIDTHS.SIGN }]}><TextInput value={row.staffSign} onChangeText={(t)=>handleInput(row.id,'staffSign',t)} style={styles.smallInput} /></View>
              <View style={[styles.cell, { width: COL_WIDTHS.SUP }]}><TextInput value={row.supName} onChangeText={(t)=>handleInput(row.id,'supName',t)} style={styles.smallInput} /></View>
              <View style={[styles.cell, { width: COL_WIDTHS.SUP }]}><TextInput value={row.supSign} onChangeText={(t)=>handleInput(row.id,'supSign',t)} style={styles.smallInput} /></View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.footer}>Instruction: All food handlers are required to clean and sanitize equipment after use.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontWeight: '800', color: '#185a9d' },
  ghostBtn: { padding: 8, backgroundColor: '#eee', borderRadius: 6, marginRight: 8 },
  warnBtn: { padding: 8, backgroundColor: '#f0ad4e', borderRadius: 6, marginRight: 8 },
  primaryBtn: { padding: 8, backgroundColor: '#185a9d', borderRadius: 6 },
  logo: { width: 48, height: 36, marginRight: 8 },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d', marginRight: 12 },
  boxTouchable: { padding: 6 },
  metadataContainer: { padding: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaLabel: { fontWeight: '700', marginRight: 6, color: '#333' },
  metaInput: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 2, minWidth: 80 },
  tick: { marginTop: 6, color: '#006400', fontWeight: '700' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#777', backgroundColor: '#eee', alignItems: 'center', paddingVertical: 6 },
  hCell: { padding: 6, borderRightWidth: 1, borderColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
  hText: { fontWeight: '800', fontSize: 12 },
  hTextSmall: { fontWeight: '700', fontSize: 11 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#4B5563', alignItems: 'center', backgroundColor: '#fff' },
  cell: { padding: 6, borderRightWidth: 1, borderColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
  cellText: { textAlign: 'left', paddingLeft: 6, fontSize: 12, color: '#333' },
  smallInput: { minWidth: 40, borderBottomWidth: 1, borderColor: '#4B5563', paddingVertical: 2, textAlign: 'center' },
  box: { width: 28, height: 28, borderWidth: 1.5, borderColor: '#4B5563', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6fff6' },
  footer: { marginTop: 12, padding: 10, textAlign: 'center', color: '#666', fontStyle: 'italic' },
});

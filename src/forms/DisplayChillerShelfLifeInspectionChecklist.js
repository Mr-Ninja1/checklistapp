import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formStorage from '../utils/formStorage';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { TouchableOpacity } from 'react-native-gesture-handler';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';

// items sourced from cat.md
const checklistItems = [
  'ENGLISH MUFFIN', 'REUBEN TOASTIE', 'CHICKEN MAYO', 'MANGO CHICKEN RICE BOWL',
  'MOROCCAN CHICKEN BOWL', 'GELATO - VANILLA', 'GELATO - LEMON', 'GELATO - CHOCOLATE',
  'GELATO - STRAWBERRY', 'GELATO - COFFEE', 'BREAKFAST BOWL', 'MUESLI CUP',
  'CHICKEN CAESAR WRAP', 'CHICKEN SCHNITZEL', 'TUNA MAYO BAGUETTE', 'CHIA PUDDING',
  'SWEET POTATO CHICK PEA & CAULIFLOWER BOWL', 'MOROCCAN CHICKEN WRAP', 'BEEF PASTRAMI',
  'CHICKEN CAESAR SALAD', 'CHICKEN HARRISA BAGUETTE', 'BART BAGEL',
  'FRUIT SALADS', 'CHEESE & CARAMELISED ONION TOASTIE', 'HONEY MUSTARD AND CHICKEN SALAD',
  'TUNA PASTA SALAD',
];

const createRowsFromItems = (items) => items.map((it, i) => ({
  id: `${i + 1}`,
  item: it,
  dateIn: '',
  timeIn: '',
  timeOut: '',
  usedBy: '',
  staffName: '',
  quantity: '',
  sign: '',
}));

const createBlankRow = (idx) => ({
  id: `new_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  item: '',
  dateIn: '',
  timeIn: '',
  timeOut: '',
  usedBy: '',
  staffName: '',
  quantity: '',
  sign: '',
});

export default function DisplayChillerShelfLifeInspectionChecklist() {
  const draftKey = 'display_chiller_shelf_life';
  const [rows, setRows] = useState(() => createRowsFromItems(checklistItems));
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = new Date();
  const defaultDate = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth() + 1).padStart(2,'0')}/${today.getFullYear()}`;
  const [issueDate, setIssueDate] = useState(defaultDate);
  const [verifiedBy, setVerifiedBy] = useState('');
  const [verifiedBySign, setVerifiedBySign] = useState('');
  const [baristaSign, setBaristaSign] = useState('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(draftKey);
        if (d && mounted) {
          if (d.rows) setRows(d.rows);
          if (d.issueDate) setIssueDate(d.issueDate);
          if (d.verifiedBy) setVerifiedBy(d.verifiedBy);
          if (d.verifiedBySign) setVerifiedBySign(d.verifiedBySign);
          if (d.baristaSign) setBaristaSign(d.baristaSign);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setDraft(draftKey, { rows, issueDate, verifiedBy, verifiedBySign, baristaSign }), 700);
    return () => clearTimeout(t);
  }, [rows, issueDate, verifiedBy, verifiedBySign, baristaSign]);

  const updateField = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    // limit new rows to max 5 for demo
    const newRowCount = rows.filter(r => String(r.id).startsWith('new_')).length;
    if (newRowCount >= 5) {
      Alert.alert('Limit reached', 'You cannot add more than 5 new rows — the form has become too long.');
      return;
    }
    setRows(prev => {
      const next = [...prev, createBlankRow(prev.length + 1)];
      return next;
    });
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const rowsWithId = rows.map((r, i) => ({ id: r.id || `${i+1}`, ...r }));
        const payload = {
        formType: 'DisplayChillerShelfLifeInspection',
        templateVersion: 'v1.0',
        title: 'DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST',
        frequency: 'DAILY',
    date: issueDate,
    verifiedBy,
    verifiedBySign,
    baristaSign,
      formData: rowsWithId,
    layoutHints: { itemCol: 420, dateCol: 100, timeCol: 100, timeOutCol: 100, usedByCol: 120, staffCol: 220, qtyCol: 80, signCol: 180 },
    _tableWidth: 420 + 100 + 100 + 100 + 120 + 220 + 80 + 180,
        savedAt: Date.now(),
      };

  const formId = `DisplayChillerShelfLifeInspection_${Date.now()}`;
  await formStorage.saveForm(formId, payload);
      try { await removeDraft(draftKey); } catch (e) {}
      Alert.alert('Saved', 'Form saved to history');
        setRows(createRowsFromItems(checklistItems));
      setIssueDate(defaultDate);
      setVerifiedBy('');
      setVerifiedBySign('');
      setBaristaSign('');
    } catch (e) {
      console.warn('Save failed', e);
      Alert.alert('Error', 'Failed to save form');
    }
    setBusy(false);
  };

  const renderRow = ({ item }) => (
    <View style={styles.row} key={item.id}>
      {editMode ? (
        <TextInput style={[styles.cell, styles.itemCol]} value={item.item} onChangeText={(t) => updateField(item.id, 'item', t)} placeholder="Item" multiline={true} editable />
      ) : (
        <Text style={[styles.cell, styles.itemCol]}>{item.item}</Text>
      )}
      {editMode ? (
        <TextInput style={[styles.cell, styles.dateCol]} value={item.dateIn} onChangeText={(t) => updateField(item.id, 'dateIn', t)} editable />
      ) : (
        <Text style={[styles.cell, styles.dateCol]}>{item.dateIn}</Text>
      )}
      {editMode ? (
        <TextInput style={[styles.cell, styles.timeCol]} value={item.timeIn} onChangeText={(t) => updateField(item.id, 'timeIn', t)} editable />
      ) : (
        <Text style={[styles.cell, styles.timeCol]}>{item.timeIn}</Text>
      )}
      {editMode ? (
        <TextInput style={[styles.cell, styles.timeCol]} value={item.timeOut} onChangeText={(t) => updateField(item.id, 'timeOut', t)} editable />
      ) : (
        <Text style={[styles.cell, styles.timeCol]}>{item.timeOut}</Text>
      )}
      {editMode ? (
        <TextInput style={[styles.cell, styles.usedByCol]} value={item.usedBy} onChangeText={(t) => updateField(item.id, 'usedBy', t)} editable />
      ) : (
        <Text style={[styles.cell, styles.usedByCol]}>{item.usedBy}</Text>
      )}
      {editMode ? (
        <TextInput style={[styles.cell, styles.staffCol]} value={item.staffName} onChangeText={(t) => updateField(item.id, 'staffName', t)} editable />
      ) : (
        <Text style={[styles.cell, styles.staffCol]}>{item.staffName}</Text>
      )}
      {editMode ? (
        <TextInput style={[styles.cell, styles.qtyCol]} value={item.quantity} onChangeText={(t) => updateField(item.id, 'quantity', t)} keyboardType="numeric" editable />
      ) : (
        <Text style={[styles.cell, styles.qtyCol]}>{item.quantity}</Text>
      )}
      {editMode ? (
        <View style={[styles.cell, styles.signCol, { alignItems: 'center', justifyContent: 'center' }]}>
            <SignatureField value={item.sign} onChange={(v) => updateField(item.id, 'sign', v)} editable={editMode} width={160} height={120} />
          </View>
      ) : (
        <View style={[styles.cell, styles.signCol, { alignItems: 'center', justifyContent: 'center' }]}>
          {item.sign ? (
            <Image source={{ uri: item.sign.startsWith('data:') ? item.sign : `data:image/png;base64,${item.sign}` }} style={{ width: 160, height: 120, resizeMode: 'contain' }} />
          ) : (
            <Text style={{ color: '#333' }}>{item.sign}</Text>
          )}
        </View>
      )}
    </View>
  );

  const saveDraftLocal = async () => { await setDraft(draftKey, { rows, issueDate, verifiedBy, verifiedBySign, baristaSign }); alert('Draft saved'); };
  const actionButtons = (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
      <TouchableOpacity onPress={() => { if (!editMode || busy) return; addRow(); }} style={{ backgroundColor: '#2e7d32', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }} disabled={!editMode || busy}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{busy ? 'Please wait' : 'Add Row'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { if (!editMode || busy) return; saveDraftLocal(); }} style={{ backgroundColor: '#f0ad4e', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }} disabled={!editMode || busy}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{busy ? 'Saving...' : (!editMode ? 'Edit to Save' : 'Save Draft')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { if (!editMode || busy) return; handleSubmit(); }} style={{ backgroundColor: '#185a9d', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }} disabled={!editMode || busy}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{busy ? 'Submitting...' : (!editMode ? 'Edit to Submit' : 'Submit Checklist')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={saveDraftLocal} actionButtons={actionButtons}>
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 160, paddingRight: 110 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ marginRight: 12 }}>
              <Text style={styles.companyName}>Bravo</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST</Text>
              <Text style={styles.frequency}>FREQUENCY: DAILY</Text>
            </View>
          </View>
        </View>

  <View style={[styles.tableContainer, { paddingRight: 8 }] }>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.itemCol]}>ITEMS</Text>
            <Text style={[styles.headerCell, styles.dateCol]}>DATE IN</Text>
            <Text style={[styles.headerCell, styles.timeCol]}>TIME IN</Text>
            <Text style={[styles.headerCell, styles.timeCol]}>TIME OUT</Text>
            <Text style={[styles.headerCell, styles.usedByCol]}>USED BY</Text>
            <Text style={[styles.headerCell, styles.staffCol]}>BAKER/CHEFS /BARISTAS NAME</Text>
            <Text style={[styles.headerCell, styles.qtyCol]}>QUANTITY</Text>
            <Text style={[styles.headerCell, styles.signCol]}>SIGN</Text>
          </View>

          <ScrollView horizontal nestedScrollEnabled={true} directionalLockEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1, paddingRight: 100 }}>
                <View style={{ width: 420 + 100 + 100 + 100 + 120 + 220 + 80 + 180 }}>
              <FlatList data={rows} renderItem={renderRow} keyExtractor={r => r.id} scrollEnabled={false} />
            </View>
          </ScrollView>
        </View>

        <View style={{ height: 12 }} />
        {editMode ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700' }}>DATE:</Text>
            <TextInput style={{ borderBottomWidth: 0, minWidth: 120, paddingVertical: 4 }} value={issueDate} onChangeText={setIssueDate} />
            <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 12 }}>VERIFIED BY:</Text>
            <View style={{ marginLeft: 8 }}>
              <SignatureField value={verifiedBySign} onChange={setVerifiedBySign} editable={editMode} width={240} height={120} />
            </View>
            <TextInput style={{ borderBottomWidth: 0, minWidth: 140, paddingVertical: 4, marginLeft: 8 }} value={verifiedBy} onChangeText={setVerifiedBy} />
            <Text style={{ fontSize: 12, fontWeight: '700', marginLeft: 12 }}>BARISTA SIGN:</Text>
            <View style={{ marginLeft: 8 }}>
              <SignatureField value={baristaSign} onChange={setBaristaSign} editable={editMode} width={320} height={160} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'column' }}>
            <Text style={{ fontSize: 12, color: '#333' }}>DATE: {issueDate}    VERIFIED BY: {verifiedBy || '______________________'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                {verifiedBySign ? (
                  <SignatureThumb uri={String(verifiedBySign).startsWith('data:') ? verifiedBySign : `data:image/png;base64,${verifiedBySign}`} width={160} height={80} layers={5} spread={0.9} />
                ) : null}
              </View>
              <View style={{ flex: 2, marginLeft: 12 }}>
                {baristaSign ? (
                  <SignatureThumb uri={String(baristaSign).startsWith('data:') ? baristaSign : `data:image/png;base64,${baristaSign}`} width={320} height={160} layers={6} spread={1.0} />
                ) : (
                  <Text style={{ color: '#666' }}>______________________</Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 18 }} />
      </ScrollView>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  frequency: { fontSize: 12, fontWeight: '600' },
  tableContainer: { borderWidth: 1, borderColor: '#000', marginTop: 8 },
  headerRow: { flexDirection: 'row', backgroundColor: '#eee' },
  headerCell: { padding: 6, fontWeight: '700', fontSize: 12, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  row: { flexDirection: 'row', minHeight: 56, borderBottomWidth: 1, borderBottomColor: '#000' },
  cell: { paddingHorizontal: 6, paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  itemCol: { width: 420 },
  dateCol: { width: 100 },
  timeCol: { width: 100 },
  usedByCol: { width: 120 },
  staffCol: { width: 220 },
  qtyCol: { width: 80 },
  signCol: { width: 80, borderRightWidth: 0 },
});

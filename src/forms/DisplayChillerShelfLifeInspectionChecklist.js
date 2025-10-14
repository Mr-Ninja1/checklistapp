import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, ScrollView, TextInput, Image, Alert } from 'react-native';
import formStorage from '../utils/formStorage';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { TouchableOpacity } from 'react-native-gesture-handler';

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
  usedBy: '',
  staffName: '',
  quantity: '',
  sign: '',
}));

export default function DisplayChillerShelfLifeInspectionChecklist() {
  const draftKey = 'display_chiller_shelf_life';
  const [rows, setRows] = useState(() => createRowsFromItems(checklistItems));
  const today = new Date();
  const defaultDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const [issueDate, setIssueDate] = useState(defaultDate);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(draftKey);
        if (d && mounted) {
          if (d.rows) setRows(d.rows);
          if (d.issueDate) setIssueDate(d.issueDate);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setDraft(draftKey, { rows, issueDate }), 700);
    return () => clearTimeout(t);
  }, [rows, issueDate]);

  const updateField = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    try {
      const rowsWithId = rows.map((r, i) => ({ id: r.id || `${i+1}`, ...r }));
      const payload = {
        formType: 'DisplayChillerShelfLifeInspection',
        templateVersion: 'v1.0',
        title: 'DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST',
        frequency: 'DAILY',
        date: issueDate,
        formData: rowsWithId,
        layoutHints: { itemCol: 420, dateCol: 100, timeCol: 100, usedByCol: 120, staffCol: 220, qtyCol: 80, signCol: 80 },
        _tableWidth: 420 + 100 + 100 + 120 + 220 + 80 + 80,
        savedAt: Date.now(),
      };

      const formId = `DisplayChillerShelfLifeInspection_${Date.now()}`;
      await formStorage.saveForm(formId, payload);
      try { await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, meta: { formId } }); } catch (e) {}
      try { await removeDraft(draftKey); } catch (e) {}
      Alert.alert('Saved', 'Form saved to history');
      setRows(createRowsFromItems(checklistItems));
      setIssueDate(defaultDate);
    } catch (e) {
      console.warn('Save failed', e);
      Alert.alert('Error', 'Failed to save form');
    }
  };

  const renderRow = ({ item }) => (
    <View style={styles.row} key={item.id}>
      <TextInput style={[styles.cell, styles.itemCol]} value={item.item} onChangeText={(t) => updateField(item.id, 'item', t)} placeholder="Item" multiline={true} />
      <TextInput style={[styles.cell, styles.dateCol]} value={item.dateIn} onChangeText={(t) => updateField(item.id, 'dateIn', t)} />
      <TextInput style={[styles.cell, styles.timeCol]} value={item.timeIn} onChangeText={(t) => updateField(item.id, 'timeIn', t)} />
      <TextInput style={[styles.cell, styles.usedByCol]} value={item.usedBy} onChangeText={(t) => updateField(item.id, 'usedBy', t)} />
      <TextInput style={[styles.cell, styles.staffCol]} value={item.staffName} onChangeText={(t) => updateField(item.id, 'staffName', t)} />
      <TextInput style={[styles.cell, styles.qtyCol]} value={item.quantity} onChangeText={(t) => updateField(item.id, 'quantity', t)} keyboardType="numeric" />
      <TextInput style={[styles.cell, styles.signCol]} value={item.sign} onChangeText={(t) => updateField(item.id, 'sign', t)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 160 }}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
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

        <View style={styles.tableContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.itemCol]}>ITEMS</Text>
            <Text style={[styles.headerCell, styles.dateCol]}>DATE IN</Text>
            <Text style={[styles.headerCell, styles.timeCol]}>TIME IN</Text>
            <Text style={[styles.headerCell, styles.usedByCol]}>USED BY</Text>
            <Text style={[styles.headerCell, styles.staffCol]}>BAKER/CHEFS /BARISTAS NAME</Text>
            <Text style={[styles.headerCell, styles.qtyCol]}>QUANTITY</Text>
            <Text style={[styles.headerCell, styles.signCol]}>SIGN</Text>
          </View>

          <FlatList data={rows} renderItem={renderRow} keyExtractor={r => r.id} scrollEnabled={false} />
        </View>

        <View style={{ height: 30 }} />
        <Text style={{ fontSize: 12, color: '#333' }}>DATE: ______________________    VERIFIED BY: ______________________    BARISTA SIGN: ______________________</Text>

        {/* Action buttons - placed inside ScrollView so they can be scrolled into view */}
        <View style={{ height: 18 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
          <TouchableOpacity onPress={async () => { await setDraft(draftKey, { rows, issueDate }); alert('Draft saved'); }} style={{ backgroundColor: '#f0ad4e', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: '#185a9d', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Checklist</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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

import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';

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
  const [rows, setRows] = useState(createRowsFromItems(checklistItems));
  const today = new Date();
  const defaultDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const [issueDate, setIssueDate] = useState(defaultDate);

  const updateField = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST</Text>
            <Text style={styles.frequency}>FREQUENCY: DAILY</Text>
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

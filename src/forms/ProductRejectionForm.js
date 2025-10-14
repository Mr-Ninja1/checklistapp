import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';

export default function ProductRejectionForm() {
  const initialRejectionLog = Array.from({ length: 5 }, () => ({ name: '', supplier: '', invoice: '', batch: '', expiry: '', reason: '' }));
  const [rejectionEntries, setRejectionEntries] = useState(initialRejectionLog);
  const [storeOfficer, setStoreOfficer] = useState('');
  const [complexManager, setComplexManager] = useState('');
  const [financeStockController, setFinanceStockController] = useState('');
  const [rejectedProductCollector, setRejectedProductCollector] = useState('');

  const rejectionCriteria = [
    { product: 'Chilled products', criteria: 'Products above 4°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Frozen products', criteria: 'Product above -18°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Dry Goods', criteria: 'Damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Cleaning Chemicals', criteria: 'Not in original containers; damaged packaging; missing MSDS; broken seals; missing expiry.' },
    { product: 'Eggs', criteria: 'Dirty, bad smell, broken, pests; 10/10 float test; missing/incorrect label.' },
    { product: 'Vegetables', criteria: 'Dirty, visible foreign matter, pest damage.' },
  ];

  const updateRejectionEntry = (index, field, value) => {
    setRejectionEntries(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const logo = () => (
    <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}>

        <View style={styles.headerBlock}>
          <View style={styles.headerLeft}>{logo()}<Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text></View>
          <View style={styles.headerRight}>
            <Text style={styles.subject}>PRODUCT REJECTION FORM</Text>
            <View style={styles.docRow}><Text style={styles.docLabel}>Version No:</Text><Text style={styles.docValue}>01</Text></View>
            <View style={styles.docRow}><Text style={styles.docLabel}>Rev No:</Text><Text style={styles.docValue}>00</Text></View>
          </View>
        </View>

        {/* Compiled/Approved */}
        <View style={styles.compiledRow}>
          <View style={styles.compiledItem}><Text style={styles.compiledLabel}>Compiled By:</Text><Text style={styles.compiledValue}>Michael Zulu C.</Text></View>
          <View style={styles.compiledItem}><Text style={styles.compiledLabel}>Approved By:</Text><Text style={styles.compiledValue}>Hassani Ali</Text></View>
        </View>

        {/* Criteria table */}
        <View style={styles.criteriaBox}>
          <Text style={styles.criteriaTitle}>Criteria for Rejecting the product</Text>
          {rejectionCriteria.map((c, i) => (
            <View key={i} style={styles.criteriaRow}>
              <Text style={styles.criteriaProduct}>{c.product}</Text>
              <Text style={styles.criteriaText}>{c.criteria}</Text>
            </View>
          ))}
        </View>

        {/* Rejection log table */}
        <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>
            <View style={styles.tableHeaderRow}>
              <View style={styles.colSn}><Text style={styles.colHeader}>S/N</Text></View>
              <View style={styles.colName}><Text style={styles.colHeader}>Name of product Rejected</Text></View>
              <View style={styles.colSupplier}><Text style={styles.colHeader}>Suppliers Name</Text></View>
              <View style={styles.colInvoice}><Text style={styles.colHeader}>Invoice/Delivery No.</Text></View>
              <View style={styles.colBatch}><Text style={styles.colHeader}>Product Batch No.</Text></View>
              <View style={styles.colExpiry}><Text style={styles.colHeader}>Expiry Date</Text></View>
              <View style={styles.colReason}><Text style={styles.colHeader}>Reason for rejecting the product</Text></View>
            </View>

            {rejectionEntries.map((entry, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colSn}><Text style={styles.cellText}>{idx + 1}.</Text></View>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={entry.name} onChangeText={t => updateRejectionEntry(idx, 'name', t)} /></View>
                <View style={styles.colSupplier}><TextInput style={styles.cellInput} value={entry.supplier} onChangeText={t => updateRejectionEntry(idx, 'supplier', t)} /></View>
                <View style={styles.colInvoice}><TextInput style={styles.cellInput} value={entry.invoice} onChangeText={t => updateRejectionEntry(idx, 'invoice', t)} /></View>
                <View style={styles.colBatch}><TextInput style={styles.cellInput} value={entry.batch} onChangeText={t => updateRejectionEntry(idx, 'batch', t)} /></View>
                <View style={styles.colExpiry}><TextInput style={styles.cellInput} value={entry.expiry} onChangeText={t => updateRejectionEntry(idx, 'expiry', t)} placeholder="DD/MM/YYYY" /></View>
                <View style={styles.colReason}><TextInput style={styles.cellInput} value={entry.reason} onChangeText={t => updateRejectionEntry(idx, 'reason', t)} /></View>
              </View>
            ))}
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}> 
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Name & signature of stores Officer:</Text><TextInput style={styles.sigInput} value={storeOfficer} onChangeText={setStoreOfficer} /></View>
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Verified by complex manager (Name & signature):</Text><TextInput style={styles.sigInput} value={complexManager} onChangeText={setComplexManager} /></View>
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Approved by (Finance and stock controller):</Text><TextInput style={styles.sigInput} value={financeStockController} onChangeText={setFinanceStockController} /></View>
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Rejected product collected by (Name & signature):</Text><TextInput style={styles.sigInput} value={rejectedProductCollector} onChangeText={setRejectedProductCollector} /></View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  headerBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerLeft: { width: 240 },
  headerRight: { flex: 1, paddingLeft: 12 },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 12, fontWeight: '700' },
  subject: { fontSize: 14, fontWeight: '700' },
  docRow: { flexDirection: 'row', marginTop: 4 },
  docLabel: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 12 },

  compiledRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 8, marginBottom: 8 },
  compiledItem: { flex: 1, paddingHorizontal: 8 },
  compiledLabel: { fontSize: 12, fontWeight: '700' },
  compiledValue: { fontSize: 12 },

  criteriaBox: { borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 12 },
  criteriaTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  criteriaRow: { flexDirection: 'row', marginBottom: 6 },
  criteriaProduct: { flex: 0.25, fontWeight: '700' },
  criteriaText: { flex: 0.75 },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', minHeight: 40, alignItems: 'center', borderBottomWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', minHeight: 40, alignItems: 'center', borderBottomWidth: 1, borderColor: '#000' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },

  colSn: { flex: 0.05, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' },
  colName: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colSupplier: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colInvoice: { flex: 0.1, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colBatch: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colExpiry: { flex: 0.1, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colReason: { flex: 0.3, paddingHorizontal: 6 },

  cellInput: { height: 36, paddingHorizontal: 6, fontSize: 12 },
  cellText: { textAlign: 'center' },

  signatures: { marginTop: 12 },
  sigRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sigLabel: { width: 260, fontSize: 12, fontWeight: '700' },
  sigInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 }
});

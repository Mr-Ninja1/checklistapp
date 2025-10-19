import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const MixingControlSheetPresentational = ({ payload }) => {
  const p = payload || {};
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : [];
  const verification = p.verification || {};
  const layoutHints = p.layoutHints || {};
  const tableWidth = p._tableWidth || Object.values(layoutHints).reduce((s, v) => s + (parseInt(v, 10) || 0), 0) || 1200;
  const assets = p.assets || {};

  // Derive column order from layoutHints keys if present, else fallback to known columns
  const defaultCols = [
    { key: 'prodDate', label: 'PRODUCTION DATE' },
    { key: 'prodName', label: 'PRODUCT NAME' },
    { key: 'batchNo', label: 'BATCH NO.' },
    { key: 'ingredients', label: 'INGREDIENTS' },
    { key: 'ingredientsWeight', label: 'INGREDIENTS WEIGHT (kgs)' },
    { key: 'mixingTime', label: 'MIXING TIME' },
    { key: 'mixingTemp', label: 'MIXING TEMP' },
    { key: 'doughDividingScaling', label: 'DOUGH DIVIDING/SCALING (kgs)' },
    { key: 'productQuantity', label: 'PRODUCT QUANTITY' },
    { key: 'mixerManSign', label: 'MIXER MAN SIGN' },
    { key: 'supSign', label: 'SUP SIGN' },
  ];

  const columns = defaultCols.map(c => ({ ...c, width: layoutHints[c.key] || 120 }));

  return (
    <ScrollView horizontal>
      <View style={[styles.container, { width: tableWidth + 24 }]}> {/* add padding */}
        <View style={styles.headerBox}>
          <View style={styles.headerTop}>
            <View style={styles.logoWrap}>
              {assets.logoDataUri ? (
                <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
              ) : (
                <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              )}
              <View>
                <Text style={styles.brand}>Bravo Brands Limited</Text>
                <Text style={styles.sub}>Food Safety Management System</Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Doc No: {metadata.docNo || ''}</Text>
              <Text style={styles.metaLabel}>Issue Date: {metadata.issueDate || ''}</Text>
              <Text style={styles.metaLabel}>Revision Date: {metadata.revisionDate || ''}</Text>
            </View>
          </View>
          <View style={styles.subjectRow}><Text style={styles.subjectText}>Subject: MIXING CONTROL SHEET</Text></View>
          <View style={styles.signRow}>
            <Text style={styles.metaSmall}>Compiled By: {metadata.compiledBy || ''}</Text>
            <Text style={styles.metaSmall}>Approved By: {metadata.approvedBy || ''}</Text>
          </View>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            {columns.map(col => (
              <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>
          {formData.map((row, idx) => (
            <View key={idx} style={styles.row}>
              {columns.map(col => (
                <View key={col.key} style={[styles.cell, { width: col.width }]}>
                  <Text style={styles.cellText}>{row[col.key] || ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.verifyRow}>
          <View style={styles.verifyInput}><Text style={styles.verifyLabel}>VERIFIED BY:</Text><Text style={styles.verifyValue}>{verification.mixerManSign || ''}</Text></View>
          <View style={styles.verifyInput}><Text style={styles.verifyLabel}>COMPLEX MANAGER SIGN:</Text><Text style={styles.verifyValue}>{verification.complexManagerSign || ''}</Text></View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  headerBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef2', marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  sub: { fontSize: 12, color: '#43cea2' },
  metaCol: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 12, color: '#333' },
  subjectRow: { paddingVertical: 8, alignItems: 'center' },
  subjectText: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaSmall: { fontSize: 12, color: '#333' },
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#333' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  verifyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  verifyInput: { flex: 1, marginRight: 8 },
  verifyLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  verifyValue: { fontSize: 12 },
});

export default MixingControlSheetPresentational;

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

/**
 * Read-only presentational renderer for Products Net Content Checklist saved payloads.
 * Expects payload to contain: metadata, formData (array), layoutHints, assets.logoDataUri
 */
const ProductsNetContentChecklistPresentational = ({ payload }) => {
  const p = payload || {};
  const metadata = p.metadata || {};
  const formData = Array.isArray(p.formData) ? p.formData : [];
  const verification = p.verification || {};
  const layoutHints = p.layoutHints || { name: 3, date: 1, expectedWeight: 2, weight1: 1, weight2: 1, weight3: 1, weight4: 1, weight5: 1 };

  const cols = [
    { key: 'name', label: 'NAME OF PRODUCT', flex: layoutHints.name || 3 },
    { key: 'date', label: 'DATE', flex: layoutHints.date || 1 },
    { key: 'expectedWeight', label: 'EXPECTED WEIGHT (g)', flex: layoutHints.expectedWeight || 2 },
    { key: 'weight1', label: 'W1', flex: layoutHints.weight1 || 1 },
    { key: 'weight2', label: 'W2', flex: layoutHints.weight2 || 1 },
    { key: 'weight3', label: 'W3', flex: layoutHints.weight3 || 1 },
    { key: 'weight4', label: 'W4', flex: layoutHints.weight4 || 1 },
    { key: 'weight5', label: 'W5', flex: layoutHints.weight5 || 1 },
  ];

  const assets = p.assets || {};

  // Calculate a rough width so horizontal ScrollView gives reasonable spacing
  const roughWidth = Object.values(layoutHints).reduce((s, v) => s + (v || 0) * 80, 200);

  return (
    <ScrollView horizontal contentContainerStyle={{ padding: 12 }}>
      <View style={[styles.container, { width: roughWidth }]}> 
        <View style={styles.headerBox}>
          <View style={styles.logoRow}>
            {assets.logoDataUri ? (
              <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
            ) : (
              // fallback to the local logo used by the editable form
              <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
            )}
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>Bravo Brands Limited</Text>
              <Text style={styles.brandSub}>Food Safety Inspections</Text>
            </View>
          </View>

          <Text style={styles.title}>PRODUCTS NET CONTENT CHECKLIST</Text>
          <Text style={styles.meta}>Doc No: {metadata.docNo || '-'} • Issue Date: {metadata.issueDate || '-'}</Text>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            {cols.map(col => (
              <View key={col.key} style={[styles.headerCell, { flex: col.flex }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>

          {formData.length === 0 ? (
            <View style={styles.emptyRow}><Text style={styles.emptyText}>No entries</Text></View>
          ) : (
            formData.map((item, idx) => {
              const rowObj = (item && typeof item === 'object') ? item : { value: item };
              return (
                <View key={idx} style={styles.row}>
                  {cols.map(col => {
                    const raw = rowObj[col.key];
                    const text = raw === undefined || raw === null ? (rowObj.value ?? '') : raw;
                    return (
                      <View key={col.key} style={[styles.cell, { flex: col.flex }]}> 
                        <Text style={styles.cellText}>{String(text)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.verifyFooter}>
          <View style={styles.verifyCol}><Text style={styles.verifyLabel}>Verified By</Text></View>
          <View style={styles.verifyCol}>
            <Text style={styles.verifyValue}>Supervisor: {verification.supervisorSign || ''}</Text>
            <Text style={styles.verifyValue}>HSEQ Manager: {verification.hseqManagerSign || ''}</Text>
            <Text style={styles.verifyValue}>Complex Manager: {verification.complexManagerSign || ''}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 40, height: 40, marginRight: 8 },
  brandWrap: { flexDirection: 'column' },
  brand: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  title: { fontWeight: '800', fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 4 },
  meta: { fontSize: 12, color: '#555', marginBottom: 8 },
  tableWrap: { borderWidth: 1, borderColor: '#333', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', minHeight: 44 },
  cell: { padding: 8, borderRightWidth: 1, borderRightColor: '#eee', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  emptyRow: { padding: 12, alignItems: 'center' },
  emptyText: { color: '#666' },
  verifyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  verifyCol: { flex: 1 },
  verifyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifyValue: { fontSize: 12, marginBottom: 6 },
});

export default ProductsNetContentChecklistPresentational;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductsNetContentChecklistPresentational = ({ payload }) => {
  const { metadata = {}, formData = [], verification = {} } = payload || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products Net Content Checklist</Text>
      <Text style={styles.meta}>Doc No: {metadata.docNo || '-' } • Issue Date: {metadata.issueDate || '-'}</Text>
      <View style={styles.list}>
        {formData.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.name}>{item.name || '-'}</Text>
            <Text style={styles.weights}>{[item.weight1, item.weight2, item.weight3, item.weight4, item.weight5].filter(Boolean).join(', ') || '-'}</Text>
            <Text style={styles.expected}>Expected: {item.expectedWeight || '-'}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Verified</Text>
      <View style={styles.verifRow}><Text style={styles.verifLabel}>Supervisor:</Text><Text style={styles.verifVal}>{verification.supervisorSign || '-'}</Text></View>
      <View style={styles.verifRow}><Text style={styles.verifLabel}>HSEQ Manager:</Text><Text style={styles.verifVal}>{verification.hseqManagerSign || '-'}</Text></View>
      <View style={styles.verifRow}><Text style={styles.verifLabel}>Complex Manager:</Text><Text style={styles.verifVal}>{verification.complexManagerSign || '-'}</Text></View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  meta: { fontSize: 12, color: '#666', marginBottom: 8 },
  list: { marginTop: 8 },
  row: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontWeight: '700' },
  weights: { color: '#444', marginTop: 4 },
  expected: { color: '#888', marginTop: 2 },
  sectionTitle: { marginTop: 12, fontWeight: '700' },
  verifRow: { flexDirection: 'row', marginTop: 6 },
  verifLabel: { fontWeight: '700', marginRight: 8 },
  verifVal: { flex: 1 },
});

export default ProductsNetContentChecklistPresentational;

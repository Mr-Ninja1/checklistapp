import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MixingControlSheetPresentational = ({ payload }) => {
  const { metadata = {}, formData = [], verification = {} } = payload || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mixing Control Sheet</Text>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Batch:</Text><Text style={styles.metaValue}>{metadata.batchNumber || '-'}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Issue Date:</Text><Text style={styles.metaValue}>{metadata.issueDate || '-'}</Text></View>
      <Text style={styles.sectionTitle}>Entries</Text>
      {formData.map((row, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.rowText}>{row.time || '-'} — {row.step || '-'} — {row.operator || '-'}</Text>
          <Text style={styles.rowSub}>{row.notes || ''}</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Verification</Text>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Mixer Operator:</Text><Text style={styles.metaValue}>{verification.mixerManSign || '-'}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Supervisor:</Text><Text style={styles.metaValue}>{verification.complexManagerSign || '-'}</Text></View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  metaRow: { flexDirection: 'row', marginBottom: 6 },
  metaLabel: { fontWeight: '600', marginRight: 6 },
  metaValue: { flex: 1 },
  sectionTitle: { marginTop: 10, fontWeight: '700' },
  row: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowText: { fontSize: 14 },
  rowSub: { fontSize: 12, color: '#666' },
});

export default MixingControlSheetPresentational;

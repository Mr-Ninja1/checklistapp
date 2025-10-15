import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function PastInspectionFormPresentational({ payload }) {
  if (!payload) return null;
  const meta = payload.metadata || {};
  const rows = payload.formData || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.title}>Pest Inspection Form</Text>
          <Text style={styles.subtitle}>{meta.companySubtitle || ''}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Compiled By: {meta.compiledBy || ''}</Text>
        <Text style={styles.metaLabel}>Approved By: {meta.approvedBy || ''}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colHeader}>Date</Text>
        <Text style={styles.colHeader}>Area Inspected</Text>
        <Text style={styles.colHeader}>Type</Text>
        <Text style={styles.colHeader}>Qty</Text>
        <Text style={styles.colHeader}>Comment</Text>
        <Text style={styles.colHeader}>Inspector</Text>
        <Text style={styles.colHeader}>Sign</Text>
      </View>

      {rows.map(r => (
        <View key={r.id} style={styles.row}>
          <Text style={styles.cell}>{r.dateLabel}</Text>
          <Text style={styles.cell}>{r.area}</Text>
          <Text style={styles.cell}>{r.type}</Text>
          <Text style={styles.cell}>{r.qty}</Text>
          <Text style={styles.cell}>{r.comment}</Text>
          <Text style={styles.cell}>{r.inspector}</Text>
          <Text style={styles.cell}>{r.sign}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  title: { fontWeight: '700', fontSize: 16 },
  subtitle: { fontSize: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontSize: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', padding: 6 },
  colHeader: { flex: 1, fontWeight: '700', fontSize: 12 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1 },
});

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function BakerySanitizingPresentational({ payload }) {
  const metadata = payload?.metadata || {};
  const rows = payload?.formData || [];
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET - BAKERY</Text>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Date:</Text><Text style={styles.metaVal}>{metadata.date}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Location:</Text><Text style={styles.metaVal}>{metadata.location}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Shift:</Text><Text style={styles.metaVal}>{metadata.shift}</Text></View>
      <View style={styles.tableHeader}><Text style={styles.h}>Equipment</Text><Text style={styles.h}>PPM</Text><Text style={styles.h}>Staff</Text></View>
      {rows.map(r => (
        <View key={r.id} style={styles.row}>
          <Text style={styles.cell}>{r.name}</Text>
          <Text style={styles.cell}>{r.ppm}</Text>
          <Text style={styles.cell}>{r.staffName}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaLabel: { fontWeight: '700', width: 90 },
  metaVal: { flex: 1 },
  tableHeader: { flexDirection: 'row', marginTop: 8, borderBottomWidth: 1, paddingBottom: 6 },
  h: { flex: 1, fontWeight: '700' },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1 },
});

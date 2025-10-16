import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function BakeryCleaningChecklistPresentational({ payload }) {
  const { metadata = {}, formData = [], verification = {} } = payload || {};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BAKERY AREA CLEANING CHECKLIST</Text>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Location:</Text><Text style={styles.metaVal}>{metadata.location}</Text></View>
      <View style={styles.metaRow}><Text style={styles.metaLabel}>Week:</Text><Text style={styles.metaVal}>{metadata.week}</Text></View>
      <View style={styles.tableHeader}><Text style={[styles.h, { flex: 2 }]}>Area</Text><Text style={styles.h}>Mon</Text><Text style={styles.h}>Tue</Text><Text style={styles.h}>Wed</Text><Text style={styles.h}>Thu</Text><Text style={styles.h}>Fri</Text><Text style={styles.h}>Sat</Text><Text style={styles.h}>Sun</Text></View>
      {formData.map(item => (
        <View key={item.id} style={styles.row}>
          <Text style={[styles.cell, { flex: 2 }]}>{item.name}</Text>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <Text key={d} style={styles.cell}>{item.days?.[d]?.checked ? '✓ ' + (item.days[d].cleanedBy || '') : ''}</Text>
          ))}
        </View>
      ))}
      <View style={{ marginTop: 12 }}>
        <Text style={styles.metaLabel}>Verified by (HSEQ): {verification.hseqManager}</Text>
        <Text style={styles.metaLabel}>Complex Manager: {verification.complexManager}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { fontWeight: '900', fontSize: 16, marginBottom: 8 },
  metaRow: { flexDirection: 'row', marginBottom: 6 },
  metaLabel: { fontWeight: '700', width: 90 },
  metaVal: { flex: 1 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 6, marginTop: 8 },
  h: { flex: 1, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1, textAlign: 'center' },
});

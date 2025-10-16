import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function FoodHandlersDailyShoweringPresentational({ payload }) {
  if (!payload) return null;

  const { week = '', month = '', year = '', compiledBy = '', approvedBy = '', verifiedBy = '', logEntries = [] } = payload;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <Text style={styles.title}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Week: {week}</Text>
          <Text style={styles.meta}>Month: {month}</Text>
          <Text style={styles.meta}>Year: {year}</Text>
        </View>

        <View style={styles.table}>
          {logEntries.length === 0 ? (
            <Text style={styles.empty}>No entries saved.</Text>
          ) : (
            logEntries.map((row, rIdx) => (
              <View key={rIdx} style={styles.row}>
                {Array.isArray(row) ? (
                  row.map((cell, cIdx) => (
                    <Text key={cIdx} style={styles.cell}>{cell}</Text>
                  ))
                ) : (
                  <Text style={styles.cell}>{JSON.stringify(row)}</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.meta}>Compiled By: {compiledBy}</Text>
          <Text style={styles.meta}>Approved By: {approvedBy}</Text>
          <Text style={styles.meta}>Verified By: {verifiedBy}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meta: { fontSize: 12 },
  table: { borderTopWidth: 1, borderColor: '#ddd', paddingTop: 8 },
  empty: { color: '#666', fontStyle: 'italic' },
  row: { flexDirection: 'row', paddingVertical: 4 },
  cell: { flex: 1, paddingHorizontal: 4, fontSize: 12 },
  footer: { marginTop: 8 }
});

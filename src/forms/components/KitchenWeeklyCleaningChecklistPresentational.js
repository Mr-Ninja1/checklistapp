import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function KitchenWeeklyCleaningChecklistPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const COL = layoutHints || {};
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? (
                <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} />
              ) : (
                <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              )}
            </View>
            <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{p.title || 'Kitchen Weekly Cleaning Checklist'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Location: {metadata.location || ''}</Text>
              <Text style={styles.metaText}>Week: {metadata.week || ''}</Text>
              <Text style={styles.metaText}>Month: {metadata.month || ''}</Text>
              <Text style={styles.metaText}>Year: {metadata.year || ''}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal contentContainerStyle={{ minWidth: _tableWidth || 800 }}>
          <View style={styles.table}>
            <View style={[styles.headerRow, { backgroundColor: '#f3f5f7' }]}>
              <View style={[styles.headerCell, { width: COL.AREA || 300 }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
              <View style={[styles.headerCell, { width: COL.FREQ || 150 }]}><Text style={styles.headerText}>Frequency</Text></View>
              {WEEK_DAYS.map(d => (
                <View key={d} style={[styles.headerGroup, { width: COL.DAY_GROUP || 150 }]}>
                  <View style={[styles.headerCell, { width: COL.CHECK || 60 }]}><Text style={styles.headerText}>{d}</Text></View>
                  <View style={[styles.headerCell, { width: COL.CLEANED_BY || 90 }]}><Text style={styles.headerText}>Cleaned By</Text></View>
                </View>
              ))}
            </View>

            {formData.map(item => (
              <View key={item.id} style={styles.row}>
                <View style={[styles.cell, { width: COL.AREA || 300 }]}><Text style={styles.areaText}>{item.name}</Text></View>
                <View style={[styles.cell, { width: COL.FREQ || 150 }]}><Text style={styles.freqText}>{item.frequency}</Text></View>
                {WEEK_DAYS.map(d => (
                  <View key={d} style={[styles.dayGroup, { width: COL.DAY_GROUP || 150 }]}>
                    <View style={[styles.cell, { width: COL.CHECK || 60 }]}>
                      <Text>{item.checks?.[d]?.checked ? '✓' : ''}</Text>
                    </View>
                    <View style={[styles.cell, { width: COL.CLEANED_BY || 90 }]}>
                      <Text>{item.checks?.[d]?.cleanedBy || ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Verified By: {metadata.hseqManager || ''}</Text>
          <Text style={styles.footerText}>Complex Manager: {metadata.complexManager || ''}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoWrap: { width: 80, height: 80, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 72, height: 72, resizeMode: 'contain' },
  logoPlaceholder: { width: 72, height: 72, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  companyText: { fontSize: 16, fontWeight: '800', color: '#374151', marginLeft: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
  metaText: { fontSize: 12, color: '#444' },
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  headerRow: { flexDirection: 'row' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' },
  headerGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  headerText: { color: '#111827', fontWeight: '700' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e6e6e6', minHeight: 40, backgroundColor: '#fff' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', justifyContent: 'center' },
  areaText: { fontSize: 12, color: '#374151' },
  freqText: { fontSize: 12, color: '#6B7280' },
  dayGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  footerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, fontWeight: '700' }
});

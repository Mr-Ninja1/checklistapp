import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

const DEFAULT_DAYS = ['Sun','Mon','Tue','Wed','Thurs','Fri','Sat'];

export default function FOH_FrontOfHouseCleaningPresentational({ payload }) {
  if (!payload) return null;
  const { metadata = {}, formData = [], layoutHints = {} } = payload;
  const days = payload.weekDays || payload.timeSlots || DEFAULT_DAYS;

  const hints = layoutHints || {};
  const tableW = payload._tableWidth || 1000;
  const col = (k, defaultW) => ({ width: hints[k] || defaultW });

  const md = metadata || {};
  const location = md.location || '';
  const week = md.week || '';
  const month = md.month || '';
  const year = md.year || '';
  const hseqManager = md.hseqManager || '';

  return (
    <ScrollView style={styles.container} horizontal={true}>
      <View style={{ minWidth: tableW }}>
        <View style={styles.headerTop}>
          {payload.assets?.logoDataUri ? (
            <Image source={{ uri: payload.assets.logoDataUri }} style={styles.logo} />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.companyNameLarge}>Bravo</Text>
          </View>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.formTitle}>FRONT OF HOUSE CLEANING CHECKLIST</Text>
        </View>

        <View style={styles.metaInline}>
          <View style={styles.metaCol}><Text style={styles.metaLabel}>LOCATION:</Text><Text style={styles.metaValue}>{location}</Text></View>
          <View style={styles.metaCol}><Text style={styles.metaLabel}>WEEK:</Text><Text style={styles.metaValue}>{week}</Text></View>
          <View style={styles.metaCol}><Text style={styles.metaLabel}>MONTH:</Text><Text style={styles.metaValue}>{month}</Text></View>
          <View style={styles.metaCol}><Text style={styles.metaLabel}>YEAR:</Text><Text style={styles.metaValue}>{year}</Text></View>
          <View style={[styles.metaFull]}><Text style={styles.metaLabel}>Verified By: HSEQ Manager:</Text><Text style={styles.metaValue}>{hseqManager}</Text></View>
        </View>

        <View style={[styles.tableHeader, styles.tableBorder]}>
          <Text style={[styles.th, col('AREA', 300)]}>Area to be cleaned</Text>
          <Text style={[styles.th, col('FREQUENCY', 150)]}>Frequency (Per Week)</Text>
          {days.map(d => (
            <View key={d} style={[styles.dayGroup, col('DAY_GROUP_WIDTH', 150)]}>
              <Text style={styles.th}>{d}</Text>
              <Text style={styles.thSmall}>Cleaned BY</Text>
            </View>
          ))}
        </View>

        {formData.map((row, idx) => (
          <View key={row.id || idx} style={[styles.row, styles.tableBorderRow]}>
            <Text style={[styles.td, col('AREA', 300)]}>{row.name}</Text>
            <Text style={[styles.td, col('FREQUENCY', 150)]}>{row.frequency}</Text>
            {days.map(d => {
              const cell = (row.checks && row.checks[d]) || {};
              return (
                <View key={d} style={[styles.dayGroupCell, col('DAY_GROUP_WIDTH', 150)]}>
                  <Text style={[styles.td, { width: 50, textAlign: 'center' }]}>{cell.checked ? '✓' : ''}</Text>
                  <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{cell.cleanedBy || ''}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  logo: { width: 56, height: 56, marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  brandName: { fontSize: 14, fontWeight: '800', color: '#185a9d' },
  mainTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginTop: 6 },
  companyNameLarge: { fontSize: 20, fontWeight: '900', color: '#185a9d' },
  titleRow: { alignItems: 'center', marginTop: 6 },
  formTitle: { fontSize: 18, fontWeight: '900', color: '#1f2937' },
  metaInline: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 8, borderRadius: 6, backgroundColor: '#fafafa' },
  metaCol: { width: '25%', padding: 6 },
  metaFull: { width: '100%', padding: 6, marginTop: 4 },
  metaLabel: { fontSize: 12, fontWeight: '700', color: '#444' },
  metaValue: { fontSize: 13, color: '#222', marginTop: 4 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 6, marginTop: 12, alignItems: 'center' },
  tableBorder: { borderWidth: 1, borderColor: '#ccc' },
  tableBorderRow: { borderBottomWidth: 1, borderColor: '#e6e6e6' },
  th: { color: '#111827', fontWeight: '700', padding: 8, textAlign: 'center' },
  thSmall: { color: '#111827', fontWeight: '700', padding: 6, textAlign: 'center', fontSize: 11 },
  dayGroup: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  dayGroupCell: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  td: { padding: 8, textAlign: 'center' },
});

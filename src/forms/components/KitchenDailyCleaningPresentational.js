import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function KitchenDailyCleaningPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const COL = layoutHints || {};

  // Determine time slots list from payload (preserve original order), fallback to default 11 slots
  const DEFAULT_SLOTS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];
  let timesList = DEFAULT_SLOTS;
  for (let i = 0; i < formData.length; i++) {
    const row = formData[i];
    if (row && row.times && typeof row.times === 'object') {
      const keys = Object.keys(row.times);
      if (keys.length > 0) {
        // preserve the keys order as-is; if they look like times, use them
        timesList = keys;
        break;
      }
    }
  }
  const perTimeWidth = COL.TIME_SLOT || 56;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />}
            </View>
            <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{p.title || 'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen)'}</Text>
          </View>
        </View>

        <ScrollView horizontal contentContainerStyle={{ minWidth: _tableWidth || 900 }}>
          <View style={styles.table}>
            {/* Header: main labels and per-slot labels */}
            <View style={[styles.headerRowDark, { alignItems: 'stretch' }]}>
              <View style={[styles.headerCell, { width: COL.EQUIPMENT || 200 }]}><Text style={styles.headerText}>EQUIPMENT</Text></View>
              <View style={[styles.headerCell, { width: COL.PPM || 80 }]}><Text style={styles.headerText}>SANITIZER - PPM</Text></View>
              <View style={[styles.headerCell, { width: perTimeWidth * timesList.length }] }>
                <Text style={styles.headerText}>TIME INTERVAL</Text>
                <View style={{ flexDirection: 'row' }}>
                  {timesList.map((t, i) => (
                    <View key={i} style={[styles.timeHeaderCell, { width: perTimeWidth }]}><Text style={styles.timeHeaderText}>{t}</Text></View>
                  ))}
                </View>
              </View>
              <View style={[styles.headerCell, { width: COL.STAFF_NAME || 120 }]}><Text style={styles.headerText}>STAFF NAME</Text></View>
              <View style={[styles.headerCell, { width: COL.SIGNATURE || 120 }]}><Text style={styles.headerText}>STAFF SIGN</Text></View>
              <View style={[styles.headerCell, { width: COL.SLIP_NAME || 140 }]}><Text style={styles.headerText}>SUP NAME</Text></View>
              <View style={[styles.headerCell, { width: COL.SUP_SIGN || 140 }]}><Text style={styles.headerText}>SUP SIGN</Text></View>
            </View>

            {formData.map((row, idx) => (
              <View key={idx} style={styles.row}>
                <View style={[styles.cell, { width: COL.EQUIPMENT || 200 }]}><Text style={styles.areaText}>{row.name || ''}</Text></View>
                <View style={[styles.cell, { width: COL.PPM || 80 }]}><Text>{row.ppm || ''}</Text></View>
                <View style={{ flexDirection: 'row', width: perTimeWidth * timesList.length }}>
                  {timesList.map((t, ti) => (
                    <View key={ti} style={[styles.timeBox, { width: perTimeWidth }]}>
                      <Text style={styles.checkMark}>{row.times && row.times[t] ? '✓' : ''}</Text>
                    </View>
                  ))}
                </View>
                <View style={[styles.cell, { width: COL.STAFF_NAME || 120 }]}><Text>{row.staffName || ''}</Text></View>
                <View style={[styles.cell, { width: COL.SIGNATURE || 120 }]}><Text>{row.staffSign || ''}</Text></View>
                <View style={[styles.cell, { width: COL.SLIP_NAME || 140 }]}><Text>{row.slipName || ''}</Text></View>
                <View style={[styles.cell, { width: COL.SUP_SIGN || 140 }]}><Text>{row.supSign || ''}</Text></View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  logoWrap: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 64, height: 48, resizeMode: 'contain' },
  companyText: { fontSize: 16, fontWeight: '800', marginLeft: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  table: { borderWidth: 1, borderColor: '#4B5563' },
  headerRowDark: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' },
  headerText: { color: '#111', fontWeight: '700' },
  timeHeaderCell: { padding: 4, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f7f7' },
  timeHeaderText: { color: '#111', fontSize: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', minHeight: 36, alignItems: 'center' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center' },
  timeBox: { padding: 6, borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 14, fontWeight: '700', color: '#008000' },
  areaText: { fontSize: 12 }
});

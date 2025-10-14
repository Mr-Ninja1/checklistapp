import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function FOH_DailyCleaningPresentational({ payload }) {
  if (!payload) return null;
  const { metadata = {}, formData = [], layoutHints = {} } = payload;
  const timeSlots = payload.timeSlots || ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  const hints = layoutHints || {};
  const tableW = payload._tableWidth || 900;
  const col = (k, defaultW) => ({ width: hints[k] || defaultW });

  // Flexible metadata extraction with safe fallbacks
  const md = metadata || {};
  const date = md.date || md.Date || payload.date || payload.savedAt || '';
  const location = md.location || md.Location || md.site || '';
  const shift = md.shift || md.Shift || md.shiftName || '';
  const verifiedBy = md.verifiedBy || md.verified_by || md.VerifiedBy || md.verifier || '';
  const managerSign = md.complexManagerSign || md.managerSign || md.complex_manager_sign || '';
  const tickAfterCleaning = md.tickAfterCleaning || md.tick || md.ticked || false;

  return (
    <ScrollView style={styles.container} horizontal={true}>
      <View style={{ minWidth: tableW }}>
        {/* Header: logo left, centered title */}
        <View style={styles.headerTop}>
          {payload.assets?.logoDataUri ? (
            <Image source={{ uri: payload.assets.logoDataUri }} style={styles.logo} />
          ) : (
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.companyNameLarge}>Bravo</Text>
          </View>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.formTitle}>FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH</Text>
        </View>

        {/* Metadata box to match editable layout */}
        <View style={styles.metaBoxInline}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
          <View style={styles.metaLeft}>
            <Text style={styles.metaLabel}>Location:</Text>
            <Text style={styles.metaValue}>{location}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Shift:</Text>
            <Text style={styles.metaValue}>{shift}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Verified By:</Text>
            <Text style={styles.metaValue}>{verifiedBy}</Text>
          </View>
          <View style={[styles.metaFull, { marginTop: 6 }]}>
            <Text style={styles.metaLabel}>COMPLEX MANAGER SIGN:</Text>
            <Text style={[styles.metaValue, styles.managerSign]}>{managerSign}</Text>
          </View>
          {tickAfterCleaning ? (
            <View style={styles.tickBadgeInline}>
              <Text style={styles.tickText}>✓ TICK AFTER CLEANING</Text>
            </View>
          ) : null}
        </View>

        {/* Table header */}
        <View style={[styles.headerRow, styles.tableBorder] }>
          <Text style={[styles.headerCell, col('EQUIPMENT', 140)]}>EQUIPMENT</Text>
          <Text style={[styles.headerCell, col('PPM', 60)]}>SANITIZER -VEG WASH (PPM?)</Text>
          {timeSlots.map(t => <Text key={t} style={[styles.headerCell, col('TIME_SLOT', 48)]}>{t}</Text>)}
          <Text style={[styles.headerCell, col('STAFF_NAME', 120)]}>STAFF NAME</Text>
          <Text style={[styles.headerCell, col('SIGNATURE', 120)]}>STAFF SIGN</Text>
          <Text style={[styles.headerCell, col('SUP_NAME', 90)]}>SUP NAME</Text>
          <Text style={[styles.headerCell, col('SUP_SIGN', 80)]}>SUP SIGN</Text>
        </View>

        {formData.map((row, idx) => (
          <View key={row.id || idx} style={[styles.row, styles.tableBorderRow]}>
            <Text style={[styles.cell, styles.left, col('EQUIPMENT', 140)]}>{row.name}</Text>
            <Text style={[styles.cell, col('PPM', 60)]}>{row.ppm ?? ''}</Text>
            {(timeSlots).map(t => (
              <Text key={t} style={[styles.cell, col('TIME_SLOT', 48)]}>{row.times && row.times[t] ? '✓' : ''}</Text>
            ))}
            <Text style={[styles.cell, col('STAFF_NAME', 120)]}>{row.staffName || ''}</Text>
            <Text style={[styles.cell, col('SIGNATURE', 120)]}>{row.staffSign || ''}</Text>
            <Text style={[styles.cell, col('SUP_NAME', 90)]}>{row.SUPName || row.slipName || row.supName || ''}</Text>
            <Text style={[styles.cell, col('SUP_SIGN', 80)]}>{row.supSign || ''}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', backgroundColor: '#eee', padding: 8, borderBottomWidth: 1, borderColor: '#ccc' },
  headerCell: { minWidth: 80, paddingHorizontal: 6, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0, borderColor: '#eee' },
  cell: { minWidth: 80, paddingHorizontal: 6, textAlign: 'center' },
  left: { textAlign: 'left', paddingLeft: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#eee' },
  logo: { width: 64, height: 48, marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  companyNameLarge: { fontSize: 20, fontWeight: '900', color: '#185a9d' },
  title: { fontSize: 14, fontWeight: '700', color: '#333' },
  titleRow: { alignItems: 'center', marginTop: 6 },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  metaBoxInline: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 10, borderRadius: 6, backgroundColor: '#fafafa' },
  metaLeft: { width: '35%', paddingRight: 8 },
  metaRight: { width: '25%', paddingRight: 8 },
  metaFull: { width: '100%', marginTop: 8 },
  metaLabel: { fontSize: 12, color: '#666', fontWeight: '700' },
  metaValue: { fontSize: 13, color: '#222', marginTop: 4 },
  managerSign: { minHeight: 24, borderWidth: 1, borderColor: '#eee', padding: 6, borderRadius: 4 },
  tickBadgeInline: { marginLeft: 8, backgroundColor: '#e6f9ed', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, alignSelf: 'center' },
  tickText: { color: '#1b8a3e', fontWeight: '700' },
  tableBorder: { borderWidth: 1, borderColor: '#ccc' },
  tableBorderRow: { borderBottomWidth: 1, borderColor: '#e6e6e6' },
});

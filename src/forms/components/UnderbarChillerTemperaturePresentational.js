import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function UnderbarChillerTemperaturePresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  // legacy support
  const rows = formData && formData.length ? formData : (p.rows || []);

  // Fixed pixel widths for presentational rendering (falls back to sensible defaults)
  // These defaults mimic the original printed form proportions (wider staff sign and corrective action columns)
  const WIDTHS = (layoutHints && layoutHints.WIDTHS) || {
    DATE: 60,
    TEMP: 80,
    SIGN: 120,
    CORRECTIVE_ACTION: 300,
    SUP_NAME_SIGN: 180,
  };

  const COL = WIDTHS;

  // Render 31 rows if no data so presentational matches editable layout
  const rowsToRender = rows && rows.length ? rows : Array.from({ length: 31 }, (_, i) => ({ day: i + 1 }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Top subject band with compiled/approved box on right */}
        <View style={styles.subjectBand}>
          <View style={styles.subjectLeft}>
            <Text style={styles.subjectLabel}>SUBJECT:</Text>
            <Text style={styles.subjectContent}>{p.title || metadata.subject || 'UNDERBAR CHILLER TEMPERATURE LOG SHEET'}</Text>
          </View>
          <View style={styles.compiledBox}>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>COMPILED BY:</Text>
              <Text style={styles.compiledValue}>{metadata.compiledBy || ''}</Text>
            </View>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>APPROVED BY:</Text>
              <Text style={styles.compiledValue}>{metadata.approvedBy || ''}</Text>
            </View>
          </View>
        </View>

        {/* Branding row: logo + company name to the left, metadata fields across */}
        <View style={styles.brandingRow}>
          <View style={styles.logoArea}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />}
            </View>
            <View style={styles.companyArea}>
              <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
            </View>
          </View>
          <View style={styles.metaInfoRow}>
            <View style={styles.metaInfoField}><Text style={styles.metaInfoLabel}>Month:</Text><Text style={styles.metaInfoValue}>{metadata.month || ''}</Text></View>
            <View style={styles.metaInfoField}><Text style={styles.metaInfoLabel}>Year:</Text><Text style={styles.metaInfoValue}>{metadata.year || ''}</Text></View>
            <View style={[styles.metaInfoField, { flex: 1 }]}><Text style={styles.metaInfoLabel}>Location:</Text><Text style={styles.metaInfoValue}>{metadata.location || ''}</Text></View>
          </View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}><Text style={{ fontWeight: '800' }}>Instruction:</Text> {metadata.instruction || 'The temperature of the Underbar Chiller should be between 0°C and 4°C.'}</Text>
        </View>

        <View style={styles.tableWrap}>
          {/* Header row 1: groups */}
          {/* Group header: Date | Morning | Afternoon | Evening | Corrective | Sup */}
          <View style={[styles.tableGroupHeader]}> 
            <View style={[styles.hCellFixed, { width: COL.DATE }]}><Text style={styles.hText}>DATE</Text></View>
            <View style={[styles.hGroupCell, { width: COL.TEMP + COL.SIGN }]}><Text style={styles.hText}>MORNING</Text></View>
            <View style={[styles.hGroupCell, { width: COL.TEMP + COL.SIGN }]}><Text style={styles.hText}>AFTERNOON</Text></View>
            <View style={[styles.hGroupCell, { width: COL.TEMP + COL.SIGN }]}><Text style={styles.hText}>EVENING</Text></View>
            <View style={[styles.hCellFixed, { width: COL.CORRECTIVE_ACTION }]}><Text style={styles.hText}>IF TEMPERATURE IS OUT OF SPECIFICATION, WHAT WAS DONE ABOUT IT?</Text></View>
            <View style={[styles.hCellFixed, { width: COL.SUP_NAME_SIGN }]}><Text style={styles.hText}>SUP NAME AND SIGNATURE</Text></View>
          </View>

          {/* Sub-header row: Temp / Staff Sign repeated */}
          <View style={[styles.tableHeaderRow, styles.detailHeader]}>
            <View style={[styles.hCellFixed, { width: COL.DATE }]} />
            <View style={[styles.hCellFixed, { width: COL.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, { width: COL.SIGN }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, { width: COL.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, { width: COL.SIGN }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, { width: COL.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
            <View style={[styles.hCellFixed, { width: COL.SIGN }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
            <View style={[styles.hCellFixed, { width: COL.CORRECTIVE_ACTION }]} />
            <View style={[styles.hCellFixed, { width: COL.SUP_NAME_SIGN }]} />
          </View>

          {/* Header row 2: details */}
          {/* detail header redundant with fixed header above, skip to rows */}

          {/* Data rows */}
          {rowsToRender.map((r, ri) => (
            <View key={ri} style={styles.row}>
              <View style={[styles.cellFixed, { width: COL.DATE }]}><Text style={styles.cellText}>{r.day || (ri + 1)}</Text></View>

              <View style={[styles.cellFixed, { width: COL.TEMP }]}><Text style={styles.cellText}>{r.tempMorning || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SIGN }]}><Text style={styles.cellText}>{r.staffSignMorning || ''}</Text></View>

              <View style={[styles.cellFixed, { width: COL.TEMP }]}><Text style={styles.cellText}>{r.tempAfternoon || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SIGN }]}><Text style={styles.cellText}>{r.staffSignAfternoon || ''}</Text></View>

              <View style={[styles.cellFixed, { width: COL.TEMP }]}><Text style={styles.cellText}>{r.tempEvening || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SIGN }]}><Text style={styles.cellText}>{r.staffSignEvening || ''}</Text></View>

              <View style={[styles.cellFixed, { width: COL.CORRECTIVE_ACTION }]}><Text style={styles.cellText}>{r.outOfSpecAction || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SUP_NAME_SIGN }]}><Text style={styles.cellText}>{r.supNameSign || ''}</Text></View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  logoArea: { flexDirection: 'row', alignItems: 'center', width: 420 },
  logoWrap: { width: 96, height: 72, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 88, height: 64, resizeMode: 'contain' },
  companyArea: { marginLeft: 8 },
  companyText: { fontSize: 18, fontWeight: '900', color: '#111827' },
  titleSmall: { fontWeight: '800', fontSize: 12, color: '#111827' },
  tableWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e6e6', overflow: 'hidden', marginTop: 12 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  detailHeader: { borderBottomWidth: 1, borderColor: '#e6e6e6' },
  hCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  hCellFixed: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  hGroupCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1', backgroundColor: '#eef2ff', textAlign: 'center' },
  tableGroupHeader: { flexDirection: 'row', backgroundColor: '#eef2ff', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  subjectBand: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', padding: 6, marginBottom: 8 },
  subjectLeft: { flex: 1 },
  subjectLabel: { fontWeight: '700', fontSize: 10, color: '#111827' },
  subjectContent: { fontWeight: '800', fontSize: 12, marginTop: 2 },
  compiledBox: { width: 220, borderLeftWidth: 1, borderLeftColor: '#cbd5e1', paddingLeft: 8, justifyContent: 'center' },
  compiledRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compiledLabel: { fontWeight: '700', fontSize: 10 },
  compiledValue: { fontSize: 10 },
  brandingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  companyArea: { marginLeft: 8 },
  metaInfoRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  metaInfoField: { marginRight: 16 },
  metaInfoLabel: { fontSize: 10, fontWeight: '700' },
  metaInfoValue: { fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingHorizontal: 6 },
  instructionBox: { marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  instructionText: { fontSize: 12 },
  hText: { fontWeight: '700', fontSize: 10, color: '#111827', textAlign: 'center', textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', minHeight: 36, alignItems: 'center' },
  cell: { padding: 6, justifyContent: 'center' },
  cellFixed: { padding: 6, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#cbd5e1' },
  savedBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#10B981', borderRadius: 6 },
  savedText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cellText: { fontSize: 12, color: '#111827' }
});

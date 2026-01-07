import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';


export const EXPORT_KEY = 'underbar_chiller_temperature';
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
    COMPLEX_SIGN: 160,
    FSC_SIGN: 140,
    HSEQ_SIGN: 160,
  };

  const COL = WIDTHS;

  // Render 31 rows if no data so presentational matches editable layout
  const rowsToRender = rows && rows.length ? rows : Array.from({ length: 31 }, (_, i) => ({ day: i + 1 }));

  // Helper: determine whether a stored value looks like a signature and normalize to data: URI
  const normalizeSignature = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    // Heuristic: treat as base64 image only if it's long and composed of base64 chars
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  // Compute total table width for presentational rendering (sum of column widths)
  const TABLE_WIDTH = COL.DATE + (COL.TEMP + COL.SIGN) * 3 + COL.CORRECTIVE_ACTION + COL.SUP_NAME_SIGN + COL.COMPLEX_SIGN + COL.FSC_SIGN + COL.HSEQ_SIGN;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Branding row: logo + company name on top-left above all content */}
        <View style={styles.brandingRowTop}> 
          <View style={styles.logoAreaTop}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} /> : <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />}
            </View>
            <View style={styles.companyAreaTop}>
              <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
            </View>
          </View>
        </View>

        {/* Top subject band with compiled/approved box on right */}
        <View style={styles.subjectBand}>
          <View style={styles.subjectLeft}>
            <Text style={styles.subjectLabel}>SUBJECT:</Text>
            <Text style={styles.subjectContent}>{p.title || metadata.subject || 'UNDERBAR CHILLER TEMPERATURE LOG SHEET'}</Text>
          </View>
          <View style={styles.compiledBox}>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>COMPILED BY:</Text>
              {(() => {
                const v = metadata.compiledBySign || metadata.compiledBy || '';
                const uri = normalizeSignature(v);
                const name = metadata.compiledBy || '';
                return uri ? <SignatureThumb uri={uri} width={160} height={50} layers={6} spread={0.9} /> : <Text style={styles.compiledValue}>{name}</Text>;
              })()}
            </View>
            <View style={styles.compiledRow}>
              <Text style={styles.compiledLabel}>APPROVED BY:</Text>
              {(() => {
                const v = metadata.approvedBySign || metadata.approvedBy || '';
                const uri = normalizeSignature(v);
                const name = metadata.approvedBy || '';
                return uri ? <SignatureThumb uri={uri} width={160} height={50} layers={6} spread={0.9} /> : <Text style={styles.compiledValue}>{name}</Text>;
              })()}
            </View>
          </View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}><Text style={{ fontWeight: '800' }}>Instruction:</Text> {metadata.instruction || 'The temperature of the Underbar Chiller should be between 0°C and 4°C.'}</Text>
        </View>

        <ScrollView horizontal={true} nestedScrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ minWidth: TABLE_WIDTH }}>
          <View style={styles.tableWrap}>
          {/* Header row 1: groups */}
          {/* Group header: Date | Morning | Afternoon | Evening | Corrective | Sup */}
          <View style={[styles.tableGroupHeader]}> 
            <View style={[styles.hCellFixed, { width: COL.DATE }]}><Text style={styles.hText}>DATE</Text></View>
            <View style={[styles.hGroupCell, { width: COL.TEMP + COL.SIGN }]}><Text style={styles.hText}>MORNING</Text></View>
            <View style={[styles.hGroupCell, { width: COL.TEMP + COL.SIGN }]}><Text style={styles.hText}>AFTERNOON</Text></View>
            <View style={[styles.hGroupCell, { width: COL.TEMP + COL.SIGN }]}><Text style={styles.hText}>EVENING</Text></View>
            <View style={[styles.hCellFixed, { width: COL.CORRECTIVE_ACTION }]}><Text style={styles.hText}>IF TEMPERATURE IS OUT OF SPECIFICATION, WHAT WAS DONE ABOUT IT?</Text></View>
            <View style={[styles.hCellFixed, { width: COL.SUP_NAME_SIGN }]}><Text style={styles.hText}>SUP SIGN</Text></View>
            <View style={[styles.hCellFixed, { width: COL.COMPLEX_SIGN }]}><Text style={styles.hText}>COMPLEX MANAGER SIGN</Text></View>
            <View style={[styles.hCellFixed, { width: COL.FSC_SIGN }]}><Text style={styles.hText}>FSC SIGN</Text></View>
            <View style={[styles.hCellFixed, { width: COL.HSEQ_SIGN }]}><Text style={styles.hText}>HSEQ MANAGER SIGN</Text></View>
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
            <View style={[styles.hCellFixed, { width: COL.COMPLEX_SIGN }]} />
            <View style={[styles.hCellFixed, { width: COL.FSC_SIGN }]} />
            <View style={[styles.hCellFixed, { width: COL.HSEQ_SIGN }]} />
          </View>

          {/* Header row 2: details */}
          {/* detail header redundant with fixed header above, skip to rows */}

          {/* Data rows */}
          {rowsToRender.map((r, ri) => (
            <View key={ri} style={styles.row}>
              <View style={[styles.cellFixed, { width: COL.DATE }]}><Text style={styles.cellText}>{r.day || (ri + 1)}</Text></View>

              <View style={[styles.cellFixed, { width: COL.TEMP }]}><Text style={styles.cellText}>{r.tempMorning || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SIGN }]}>{(() => {
                const v = r.staffSignMorning;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(72, COL.SIGN - 20)} height={44} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, { width: COL.TEMP }]}><Text style={styles.cellText}>{r.tempAfternoon || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SIGN }]}>{(() => {
                const v = r.staffSignAfternoon;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(72, COL.SIGN - 20)} height={44} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, { width: COL.TEMP }]}><Text style={styles.cellText}>{r.tempEvening || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SIGN }]}>{(() => {
                const v = r.staffSignEvening;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(72, COL.SIGN - 20)} height={44} layers={5} spread={0.8} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, { width: COL.CORRECTIVE_ACTION }]}><Text style={styles.cellText}>{r.outOfSpecAction || ''}</Text></View>
              <View style={[styles.cellFixed, { width: COL.SUP_NAME_SIGN }]}>{(() => {
                const v = r.supNameSign;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(120, COL.SUP_NAME_SIGN - 20)} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>
              <View style={[styles.cellFixed, { width: COL.COMPLEX_SIGN }]}>{(() => {
                const v = r.complexManagerSign;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(120, COL.COMPLEX_SIGN - 20)} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, { width: COL.FSC_SIGN }]}>{(() => {
                const v = r.fscSign;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(100, COL.FSC_SIGN - 20)} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>

              <View style={[styles.cellFixed, { width: COL.HSEQ_SIGN }]}>{(() => {
                const v = r.hseqManagerSign;
                const uri = normalizeSignature(v);
                return uri ? <SignatureThumb uri={uri} width={Math.max(120, COL.HSEQ_SIGN - 20)} height={44} layers={6} spread={0.9} /> : <Text style={styles.cellText}>{v || ''}</Text>;
              })()}</View>
            </View>
          ))}
          </View>
        </ScrollView>
        {/* Footer signatures removed for Underbar Chiller presentational */}
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
  brandingRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoAreaTop: { flexDirection: 'row', alignItems: 'center' },
  companyAreaTop: { marginLeft: 8 },
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
  ,
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
  footerItem: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  footerLabel: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#374151' },
  footerText: { fontSize: 12, color: '#111827' },
});

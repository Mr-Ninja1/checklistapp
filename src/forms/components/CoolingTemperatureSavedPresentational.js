import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function CoolingTemperatureSavedPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;

  const rows = (formData && formData.length) ? formData : Array.from({ length: 12 }, (_, i) => ({ index: i + 1 }));

  // prefer explicit widths saved in the payload; otherwise fallback to sensible defaults
  const raw = (layoutHints && layoutHints.WIDTHS) || {};
  const WIDTHS = {
    INDEX: raw.INDEX || 40,
    FOOD_ITEM: raw.FOOD_ITEM || 260,
    TIME_INTO_UNIT: raw.TIME_INTO_UNIT || 120,
    TIME: raw.TIME || 64,
    TEMP: raw.TEMP || 48,
    SIGN: raw.SIGN || 40,
    STAFF_NAME: raw.STAFF_NAME || 160,
  };

  const tableWidth = Number(_tableWidth) || 1000;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.logoArea}>
            <Image source={p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg')} style={styles.logo} />
            <Text style={styles.companyText}>{metadata.companyName || 'BRAVO BRANDS LIMITED'}</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={styles.issueLabel}>Issue Date:</Text>
            <Text style={styles.issueValue}>{metadata.issueDate || metadata.date || ''}</Text>
          </View>
        </View>

        <View style={styles.subjectBandRow}>
          <View style={styles.subjectLeft}><Text style={styles.subjectSmall}>SUBJECT: TEMPERATURE RECORD FOR COOLING</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>COMPILED BY: {metadata.compiledBy || ''}</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>APPROVED BY: {metadata.approvedBy || ''}</Text></View>
        </View>

        <View style={[styles.table, { minWidth: tableWidth }]}> 
          <Text style={styles.tableTitle}>COOLING TEMPERATURE LOG</Text>

          <View style={[styles.tableHeaderRow, styles.groupHeader]}>
            <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.INDEX }]}><Text style={styles.hText}>#</Text></View>

            <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.FOOD_ITEM + WIDTHS.TIME_INTO_UNIT }]}>
              <View>
                <Text style={[styles.hText, styles.instructionText]}>COOLING (10 °C within 2hours)</Text>
              </View>
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' }}>
                <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.FOOD_ITEM }]}><Text style={styles.hText}>FOOD ITEM</Text></View>
                <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.TIME_INTO_UNIT }]}>
                  <Text style={[styles.hText, { fontSize: 8 }]}>Time into{"\n"}Fridge/Display{"\n"}Chiller/Deep{"\n"}Freezer/Chiller{"\n"}Room/Freezer Room</Text>
                </View>
              </View>
            </View>

            <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>1ST RECORD</Text></View>
            <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>2ND RECORD</Text></View>
            <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>3RD RECORD</Text></View>

            <View style={[styles.hCell, { width: WIDTHS.STAFF_NAME }]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
          </View>

          <View style={[styles.tableHeaderRow, styles.detailHeader]}>
            <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.INDEX }]} /><View style={[styles.hCell, styles.borderRight, { width: WIDTHS.FOOD_ITEM + WIDTHS.TIME_INTO_UNIT }]} />
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={i}>
                <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.TIME }]}><Text style={styles.hText}>TIME</Text></View>
                <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
                <View style={[styles.hCell, styles.borderRight, { width: WIDTHS.SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
              </React.Fragment>
            ))}
            <View style={[styles.hCell, { width: WIDTHS.STAFF_NAME }]} />
          </View>

          {rows.map((r, ri) => (
            <View key={ri} style={styles.row}>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.INDEX }]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>

              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.FOOD_ITEM }]}><Text style={styles.cellText}>{r.foodItem || ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TIME_INTO_UNIT }]}><Text style={styles.cellText}>{r.timeIntoUnit || r.timeIntoUnit || ''}</Text></View>

              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.SIGN }]}><Text style={styles.cellText}>{r.sign1 || ''}</Text></View>

              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.SIGN }]}><Text style={styles.cellText}>{r.sign2 || ''}</Text></View>

              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
              <View style={[styles.cell, styles.borderRight, { width: WIDTHS.SIGN }]}><Text style={styles.cellText}>{r.sign3 || ''}</Text></View>

              <View style={[styles.cell, { width: WIDTHS.STAFF_NAME }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
            </View>
          ))}

        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
            <Text style={styles.signatureLine}>{metadata.chefSignature || '______________________________'}</Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
            <Text style={styles.textarea}>{metadata.correctiveAction || ''}</Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Verified by:</Text>
            <Text style={{ marginTop: 8, fontSize: 12 }}>HSEQ Manager: {metadata.hseqManagerSignature || '______________________________'}</Text>
            <Text style={{ marginTop: 8, fontSize: 12 }}>Complex Manager: {metadata.complexManagerSignature || '______________________________'}</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  logoArea: { flexDirection: 'row', alignItems: 'center' },
  issueBox: { alignItems: 'flex-end', minWidth: 140, borderWidth: 1, borderColor: '#333', padding: 6 },
  issueLabel: { fontSize: 10 },
  issueValue: { fontSize: 12, fontWeight: '700' },
  logo: { width: 38, height: 28, resizeMode: 'contain' },
  companyText: { fontWeight: '900', fontSize: 14, marginLeft: 6 },
  subjectBandRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333', paddingVertical: 4 },
  subjectLeft: { flex: 1 },
  subjectSmall: { fontWeight: '700', fontSize: 11 },
  compiledBoxThin: { paddingHorizontal: 8 },
  compiledLabelSmall: { fontSize: 10, fontWeight: '700' },
  table: { borderWidth: 1, borderColor: '#333', marginTop: 4, overflow: 'hidden' },
  tableTitle: { textAlign: 'center', fontWeight: '800', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#333' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  groupHeader: { backgroundColor: '#f3f5f7' },
  detailHeader: { backgroundColor: '#f3f5f7', borderBottomWidth: 1 },
  hCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  hText: { fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  instructionText: { fontWeight: '700', fontSize: 10, textAlign: 'center' },
  borderRight: { borderRightWidth: 1, borderRightColor: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', minHeight: 36, alignItems: 'center' },
  cell: { padding: 6, justifyContent: 'center' },
  cellText: { fontSize: 12 },
  footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
  signatureLine: { borderBottomWidth: 1, borderColor: '#333', paddingVertical: 8, fontSize: 14 },
  textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, minHeight: 48 }
});

import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

export default function BinLinersChangingLogPresentational({ payload }) {
  const p = payload || {};
  const entries = p.logEntries || [];
  const logoSource = p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.png');
  const hints = p.layoutHints || {};
  const tableWidth = p._tableWidth || null;

  // build column style overrides from layoutHints (fall back to flex-based styles)
  const colDateStyle = hints.DATE ? { width: hints.DATE, flex: 0 } : null;
  const colChangedByStyle = hints.CHANGED_BY ? { width: hints.CHANGED_BY, flex: 0 } : null;
  const colAreaStyle = hints.AREA ? { width: hints.AREA, flex: 0 } : null;
  const colStaffSignStyle = hints.STAFF_SIGN ? { width: hints.STAFF_SIGN, flex: 0 } : null;
  const colSupervisorSignStyle = hints.SUP_SIGN ? { width: hints.SUP_SIGN, flex: 0 } : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.systemName}>Food Safety Management System</Text>
          <Text style={styles.subject}>Subject: BIN LINERS CHANGING LOG</Text>
        </View>
        <View style={styles.headerCenter}>
          <View style={styles.docRow}><Text style={styles.docLabel}>Doc No:</Text><Text style={styles.docValue}>BBN-SHEQ-F-BL-2</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docValue}>{p.date || ''}</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Revision Date:</Text><Text style={styles.docValue}>N/A</Text></View>
        </View>
        <View style={styles.headerRight}><Text style={styles.pageInfo}>Page 1 of 1</Text></View>
      </View>

      {/* Table: enable horizontal scrolling and enforce widths from layoutHints */}
      <ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth || undefined }}>
        <View style={[styles.tableOuter, tableWidth ? { width: tableWidth } : { width: '100%' }]}> 
          <View style={styles.tableHeaderRow}>
            <View style={[styles.colDate, colDateStyle]}><Text style={styles.colHeader}>DATE</Text></View>
            <View style={[styles.colChangedBy, colChangedByStyle]}><Text style={styles.colHeader}>CHANGED BY</Text></View>
            <View style={[styles.colArea, colAreaStyle]}><Text style={styles.colHeader}>AREA</Text></View>
            <View style={[styles.colStaffSign, colStaffSignStyle]}><Text style={styles.colHeader}>STAFF SIGN</Text></View>
            <View style={[styles.colSupervisorSign, colSupervisorSignStyle]}><Text style={styles.colHeader}>SUPERVISOR SIGN</Text></View>
          </View>
          {entries.map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.colDate, colDateStyle]}><Text>{e.date || ''}</Text></View>
              <View style={[styles.colChangedBy, colChangedByStyle]}><Text>{e.changedBy || ''}</Text></View>
              <View style={[styles.colArea, colAreaStyle]}><Text>{e.area || ''}</Text></View>
              <View style={[styles.colStaffSign, colStaffSignStyle]}><Text>{e.staffSign || ''}</Text></View>
              <View style={[styles.colSupervisorSign, colSupervisorSignStyle]}><Text>{e.supervisorSign || ''}</Text></View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.verificationBlock}>
        <View style={styles.verifyRow}><Text style={styles.verifyLabel}>VERIFIED BY:</Text><Text style={styles.verifyValue}>{p.metadata?.verifiedBy || ''}</Text></View>
        <View style={styles.verifyRow}><Text style={styles.verifyLabel}>HSEQ Manager:</Text><Text style={styles.verifyValue}>{p.metadata?.hseqManager || ''}</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  topHeader: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8 },
  headerLeft: { width: 260, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#000' },
  headerCenter: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  headerRight: { width: 120, justifyContent: 'center', alignItems: 'flex-end' },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 10, fontWeight: '700' },
  systemName: { fontSize: 9, lineHeight: 10, marginBottom: 6 },
  subject: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 10 },
  pageInfo: { fontSize: 10, fontWeight: '700' },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', minHeight: 40, alignItems: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 40, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },

  colDate: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colChangedBy: { flex: 0.25, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colArea: { flex: 0.2, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colStaffSign: { flex: 0.2, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colSupervisorSign: { flex: 0.2, paddingHorizontal: 6 },

  verificationBlock: { marginTop: 12, paddingHorizontal: 4 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  verifyLabel: { width: 120, fontSize: 12, fontWeight: '700' },
  verifyValue: { flex: 1 }
});

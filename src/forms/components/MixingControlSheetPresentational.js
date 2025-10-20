import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

// Dummy presentational used for debugging: ignores payload and renders static content
export default function MixingControlSheetPresentational({ payload }) {
  const rows = Array.isArray(payload?.formData) ? payload.formData : [];
  const tableWidth = payload?._tableWidth || 1500;
  const metadata = payload?.metadata || {};
  // Prefer savedAt (ISO or timestamp) then metadata.issueDate
  let issueDate = '';
  if (payload?.savedAt) {
    try { issueDate = new Date(payload.savedAt).toLocaleDateString(); } catch (e) { issueDate = String(payload.savedAt); }
  } else if (metadata.issueDate) issueDate = String(metadata.issueDate);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={styles.headerTop}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              <View>
                <Text style={styles.brand}>Bravo Brands Limited</Text>
                <Text style={styles.sub}>Food Safety Management System</Text>
              </View>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Issue Date: {String(issueDate)}</Text>
            </View>
          </View>
          <View style={styles.subjectRow}><Text style={styles.subjectText}>Subject: MIXING CONTROL SHEET</Text></View>
        </View>

        {/* make table horizontally scrollable to fit wide columns */}
        <ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth }}>
          <View style={[styles.tableWrap, { width: tableWidth }]}> 
            <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { width: 120 }]}><Text style={styles.headerText}>PRODUCTION DATE</Text></View>
            <View style={[styles.headerCell, { width: 180 }]}><Text style={styles.headerText}>PRODUCT NAME</Text></View>
            <View style={[styles.headerCell, { width: 100 }]}><Text style={styles.headerText}>BATCH NO.</Text></View>
            <View style={[styles.headerCell, { width: 220 }]}><Text style={styles.headerText}>INGREDIENTS</Text></View>
            <View style={[styles.headerCell, { width: 160 }]}><Text style={styles.headerText}>INGREDIENTS WEIGHT (kgs)</Text></View>
            <View style={[styles.headerCell, { width: 120 }]}><Text style={styles.headerText}>MIXING TIME</Text></View>
            <View style={[styles.headerCell, { width: 120 }]}><Text style={styles.headerText}>MIXING TEMP</Text></View>
            <View style={[styles.headerCell, { width: 160 }]}><Text style={styles.headerText}>DOUGH DIVIDING/SCALING (kgs)</Text></View>
            <View style={[styles.headerCell, { width: 120 }]}><Text style={styles.headerText}>PRODUCT QUANTITY</Text></View>
            <View style={[styles.headerCell, { width: 140 }]}><Text style={styles.headerText}>MIXER MAN SIGN</Text></View>
            <View style={[styles.headerCell, { width: 140 }]}><Text style={styles.headerText}>SUP SIGN</Text></View>
          </View>

          {rows.map((row, idx) => (
            <View key={idx} style={styles.row}>
              <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{String(row?.prodDate ?? '')}</Text></View>
              <View style={[styles.cell, { width: 180 }]}><Text style={styles.cellText}>{String(row?.prodName ?? '')}</Text></View>
              <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{String(row?.batchNo ?? '')}</Text></View>
              <View style={[styles.cell, { width: 220 }]}><Text style={styles.cellText}>{String(row?.ingredients ?? '')}</Text></View>
              <View style={[styles.cell, { width: 160 }]}><Text style={styles.cellText}>{String(row?.ingredientsWeight ?? '')}</Text></View>
              <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{String(row?.mixingTime ?? '')}</Text></View>
              <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{String(row?.mixingTemp ?? '')}</Text></View>
              <View style={[styles.cell, { width: 160 }]}><Text style={styles.cellText}>{String(row?.doughDividingScaling ?? '')}</Text></View>
              <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{String(row?.productQuantity ?? '')}</Text></View>
              <View style={[styles.cell, { width: 140 }]}><Text style={styles.cellText}>{String(row?.mixerManSign ?? '')}</Text></View>
              <View style={[styles.cell, { width: 140 }]}><Text style={styles.cellText}>{String(row?.supSign ?? '')}</Text></View>
            </View>
          ))}
          </View>
        </ScrollView>
        <View style={styles.footerRow}>
          <View style={styles.footerCol}><Text style={styles.footerLabel}>VERIFIED BY: {String(payload?.verification?.mixerManSign || '')}</Text></View>
          <View style={styles.footerCol}><Text style={styles.footerLabel}>COMPLEX MANAGER: {String(payload?.verification?.complexManagerSign || '')}</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 12 },
  headerBox: { padding: 12, marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  sub: { fontSize: 12, color: '#43cea2' },
  metaCol: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 12, color: '#333' },
  subjectRow: { paddingVertical: 8, alignItems: 'center' },
  subjectText: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaSmall: { fontSize: 12, color: '#333' },
  tableWrap: { borderWidth: 1, borderColor: '#333', borderRadius: 6, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#333' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  footerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerCol: { flex: 1, minWidth: 140, paddingRight: 8 },
  footerLabel: { fontSize: 12, color: '#333', fontWeight: '700' },
});

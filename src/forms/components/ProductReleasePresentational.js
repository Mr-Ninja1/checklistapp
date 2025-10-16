import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

export default function ProductReleasePresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  return (
    <ScrollView contentContainerStyle={styles.outer}>
      <View style={styles.docHeader}>
        <View style={styles.logoAndSystem}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
          <View>
            <Text style={styles.logoText}>Bravo</Text>
            <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
          </View>
        </View>
        <View style={styles.docDetailsRight}>
          <Text style={styles.detailLabel}>Issue Date: {meta.issueDate || ''}</Text>
        </View>
      </View>

      <View style={styles.subjectRow}>
        <Text style={styles.subjectValue}>PRODUCT RELEASE FORM</Text>
      </View>

      <View style={styles.subDetailRow}>
        <View style={styles.subDetailItem}><Text style={styles.subDetailLabel}>Compiled By:</Text><Text style={styles.subDetailValue}>{meta.compiledBy || 'Michael C. Zulu'}</Text></View>
        <View style={styles.subDetailItem}><Text style={styles.subDetailLabel}>Approved By:</Text><Text style={styles.subDetailValue}>{meta.approvedBy || 'Hassani Ali'}</Text></View>
      </View>

      <View style={styles.siteDetailsSection}>
        <Text style={styles.siteLabel}>SITE NAME: {meta.site || ''}</Text>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
          <Text style={[styles.headerCell, styles.productNameCol]}>Product Name</Text>
          <Text style={[styles.headerCell, styles.batchNumberCol]}>Batch Number</Text>
          <Text style={[styles.headerCell, styles.productionDateCol]}>Production Date</Text>
          <Text style={[styles.headerCell, styles.expiryDateCol]}>Expiry Date</Text>
          <Text style={[styles.headerCell, styles.signatureCol]}>Signature of Head of Section</Text>
          <Text style={[styles.headerCell, styles.approvedCol]}>Approved by HSEQ Manager</Text>
        </View>

        {rows.map(r => (
          <View key={r.id} style={styles.tableRow}>
            <Text style={[styles.dataCell, styles.dateCol]}>{r.date}</Text>
            <Text style={[styles.dataCell, styles.productNameCol]}>{r.productName}</Text>
            <Text style={[styles.dataCell, styles.batchNumberCol]}>{r.batchNumber}</Text>
            <Text style={[styles.dataCell, styles.productionDateCol]}>{r.productionDate}</Text>
            <Text style={[styles.dataCell, styles.expiryDateCol]}>{r.expiryDate}</Text>
            <Text style={[styles.dataCell, styles.signatureCol]}>{r.signatureHead}</Text>
            <Text style={[styles.dataCell, styles.approvedCol]}>{r.approvedHSEQ}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { padding: 12, backgroundColor: '#fff' },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#000', padding: 6, marginBottom: 6 },
  logoAndSystem: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 8 },
  logoText: { fontWeight: 'bold', fontSize: 20 },
  systemText: { fontSize: 10 },
  docDetailsRight: { justifyContent: 'center' },
  detailLabel: { fontSize: 12 },
  subjectRow: { borderWidth: 1, borderColor: '#000', padding: 6, backgroundColor: '#eee', marginBottom: 8 },
  subjectValue: { fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  subDetailRow: { flexDirection: 'row', marginBottom: 8 },
  subDetailItem: { flex: 1, padding: 6, borderWidth: 1, borderColor: '#000', marginRight: 4 },
  subDetailLabel: { fontWeight: 'bold' },
  subDetailValue: {},
  siteDetailsSection: { marginBottom: 8 },
  siteLabel: { fontWeight: 'bold' },
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee' },
  headerCell: { fontWeight: 'bold', fontSize: 10, padding: 6, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  dataCell: { fontSize: 10, padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  dateCol: { width: 80 },
  productNameCol: { width: 260, textAlign: 'left' },
  batchNumberCol: { width: 100 },
  productionDateCol: { width: 100 },
  expiryDateCol: { width: 100 },
  signatureCol: { width: 160 },
  approvedCol: { width: 160, borderRightWidth: 0 },
});

import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

export default function VegetablesFruitsReceivingPresentational({ payload }) {
  if (!payload) return null;
  // normalize wrapper payloads saved by formStorage
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];

  return (
    <ScrollView contentContainerStyle={styles.outerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Vegetables and Fruits Receiving Checklist</Text>
            <Text style={styles.subtitle}>Bravo Brands Limited — Food Safety Management System</Text>
            <Text style={styles.issueDate}>Issue Date: {meta.issueDate || ''}</Text>
          </View>
        </View>
        <View style={styles.savedStamp}>
          <Text style={styles.savedText}>Saved: {p.savedAt || ''}</Text>
        </View>
      </View>

      {/* Compiled / Approved row + Specification and Delivery details to match editable form */}
      <View style={styles.compiledRow}>
        <View style={styles.compiledItem}>
          <Text style={styles.compiledLabel}>Compiled By:</Text>
          <Text style={styles.compiledValue}>{(meta.compiledBy || meta.compiled_by || 'Michael Zulu C.')}</Text>
        </View>
        <View style={styles.compiledItem}>
          <Text style={styles.compiledLabel}>Approved By:</Text>
          <Text style={styles.compiledValue}>{(meta.approvedBy || meta.approved_by || 'Hassani Ali')}</Text>
        </View>
      </View>

      <View style={styles.specificationSection}>
        <Text style={styles.specLabel}>Specification:</Text>
        <Text style={styles.specText}>{meta.specification || 'Vegetables and fruits must be delivered clean, practically free of any visible foreign matter such as soils; practically free from pests; practically free from damage caused by pests.'}</Text>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Date of Delivery:</Text><Text style={styles.deliveryValue}>{meta.dateOfDelivery || meta.date || ''}</Text></View>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Received By:</Text><Text style={styles.deliveryValue}>{meta.receivedBy || ''}</Text></View>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Complex Manager:</Text><Text style={styles.deliveryValue}>{meta.complexManager || ''}</Text></View>
        </View>
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Time of Delivery:</Text><Text style={styles.deliveryValue}>{meta.timeOfDelivery || ''}</Text></View>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Invoice No:</Text><Text style={styles.deliveryValue}>{meta.invoiceNo || ''}</Text></View>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Drivers Name:</Text><Text style={styles.deliveryValue}>{meta.driversName || ''}</Text></View>
        </View>
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryPair}><Text style={styles.deliveryLabel}>Vehicle Reg No:</Text><Text style={styles.deliveryValue}>{meta.vehicleRegNo || ''}</Text></View>
          <View style={[styles.deliveryPair, { flex: 1 }]}><Text style={styles.deliveryLabel}>Signature:</Text><Text style={styles.deliveryValue}>{meta.signature || ''}</Text></View>
        </View>
      </View>

      {/* table with horizontal scroll and printed min width */}
      <ScrollView horizontal contentContainerStyle={{ minWidth: 1123 }}>
        <View style={dailyStyles.tableContainer}>
          <View style={dailyStyles.tableHeader}>
            <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}>Type of Veg / Fruit</Text>
            <Text style={[dailyStyles.headerCell, dailyStyles.supplierCol, dailyStyles.spanTwoRows]}>Supplier</Text>

            <View style={dailyStyles.groupHeaderCol}>
              <Text style={dailyStyles.groupHeaderTitle}>Delivery Vehicle</Text>
              <View style={dailyStyles.subHeaderRow}>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.cleanCol]}>Clean</Text>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.tempCol, dailyStyles.lastSubHeaderCell]}>Temp</Text>
              </View>
            </View>

            <View style={[dailyStyles.groupHeaderCol, dailyStyles.lastGroupHeaderCol]}>
              <Text style={dailyStyles.groupHeaderTitle}>Product</Text>
              <View style={dailyStyles.subHeaderRow}>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.stateOfProductCol]}>State of{"\n"}Product</Text>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                <Text style={[dailyStyles.subHeaderCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}>Remarks</Text>
              </View>
            </View>
          </View>

          {rows.map((r, idx) => (
            <View style={dailyStyles.tableRow} key={r.id || r._id || `row-${idx}`}>
              <Text style={[dailyStyles.dataCell, dailyStyles.nameCol]}>{r.typeOfVegFruit}</Text>
              <Text style={[dailyStyles.dataCell, dailyStyles.supplierCol]}>{r.supplier}</Text>
              <Text style={[dailyStyles.dataCell, dailyStyles.cleanCol, dailyStyles.checkboxCell]}>{r.clean ? 'Yes' : 'No'}</Text>
              <Text style={[dailyStyles.dataCell, dailyStyles.tempCol]}>{r.temp}</Text>
              <Text style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]}>{r.stateOfProduct}</Text>
              <Text style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]}>{r.expiryDate}</Text>
              <Text style={[dailyStyles.dataCell, dailyStyles.remarksCol]}>{r.remarks}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { padding: 12, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 56, height: 56, marginRight: 12 },
  title: { fontWeight: '700', fontSize: 16 },
  subtitle: { fontSize: 12, color: '#333' },
  issueDate: { fontSize: 12, color: '#333', marginTop: 6 },
  savedStamp: { alignItems: 'flex-end' },
  savedText: { fontSize: 12, color: '#666' },
  compiledRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1, borderColor: '#000', padding: 6 },
  compiledItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  compiledLabel: { fontWeight: '700', width: 120 },
  compiledValue: { fontSize: 12 },
  specificationSection: { marginBottom: 8, padding: 8, borderWidth: 1, borderColor: '#000' },
  specLabel: { fontWeight: '700', marginBottom: 6 },
  specText: { fontSize: 12, lineHeight: 18 },
  deliveryDetails: { marginBottom: 12, padding: 8, borderWidth: 1, borderColor: '#000' },
  deliveryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  deliveryPair: { minWidth: 160, flex: 1, marginRight: 8 },
  deliveryLabel: { fontWeight: '700', fontSize: 12 },
  deliveryValue: { fontSize: 12 },
});

const dailyStyles = StyleSheet.create({
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  spanTwoRows: { minHeight: 90 },
  groupHeaderCol: { borderRightWidth: 1, borderRightColor: '#000', width: 180 },
  lastGroupHeaderCol: { borderRightWidth: 0, width: 560 },
  groupHeaderTitle: { fontWeight: 'bold', fontSize: 14, paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 45, flexWrap: 'wrap' },
  subHeaderRow: { flexDirection: 'row', height: 45 },
  subHeaderCell: { fontWeight: 'bold', fontSize: 12, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
  lastSubHeaderCell: { borderRightWidth: 0 },
  // column widths copied from editable form
  nameCol: { width: 260 },
  supplierCol: { width: 180 },
  cleanCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
  tempCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
  stateOfProductCol: { width: 140 },
  expiryDateCol: { width: 120 },
  remarksCol: { width: 300, borderRightWidth: 0 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
  dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
  checkboxCell: { justifyContent: 'center', alignItems: 'center' },
  checkboxText: { fontSize: 18, fontWeight: 'bold' },
});

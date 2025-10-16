import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

export default function BeverageReceivingPresentational({ payload }) {
  const p = payload || {};
  const rows = p.formData || [];
  const logoSource = p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg');
  const hints = p.layoutHints || {};
  const tableWidth = p._tableWidth || 1200;
  const meta = p.metadata || {};

  // Column style overrides
  const colName = hints.NAME ? { width: hints.NAME, flex: 0 } : null;
  const colSupplier = hints.SUPPLIER ? { width: hints.SUPPLIER, flex: 0 } : null;
  const colClean = hints.CLEAN ? { width: hints.CLEAN, flex: 0 } : null;
  const colTemp = hints.TEMP ? { width: hints.TEMP, flex: 0 } : null;
  const colTempOfBeverage = hints.TEMP_OF_BEVERAGE ? { width: hints.TEMP_OF_BEVERAGE, flex: 0 } : null;
  const colStateOfProduct = hints.STATE_OF_PRODUCT ? { width: hints.STATE_OF_PRODUCT, flex: 0 } : null;
  const colExpiryDate = hints.EXPIRY_DATE ? { width: hints.EXPIRY_DATE, flex: 0 } : null;
  const colRemarks = hints.REMARKS ? { width: hints.REMARKS, flex: 0 } : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.docHeader}>
        <View style={styles.logoAndSystem}>
          <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.systemDetailsWrap}>
            <Text style={styles.logoText}>Bravo</Text>
            <View style={styles.systemDetails}>
              <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.systemText}>Food Safety Management System</Text>
            </View>
          </View>
        </View>
        <View style={styles.docDetailsRight}>
          <Text style={styles.detailLabel}>Issue Date:</Text>
          <Text style={styles.detailValue}>{p.date || ''}</Text>
          <Text style={styles.detailLabel}>Page:</Text>
          <Text style={styles.detailValue}>1 of 1</Text>
        </View>
      </View>
      <View style={styles.subjectRow}>
        <View style={styles.subjectItem}><Text style={styles.subjectLabel}>Subject:</Text><Text style={styles.subjectValue}>Beverage and Water Receiving Checklist</Text></View>
        <View style={styles.versionDetails}><Text style={styles.versionText}>Version No: v1.0</Text></View>
      </View>
      <View style={styles.subDetailRow}>
        <View style={styles.subDetailItem}><Text style={styles.subDetailLabel}>Compiled By:</Text><Text style={styles.subDetailValue}>Patrnan</Text></View>
        <View style={styles.subDetailItem}><Text style={styles.subDetailLabel}>Approved By:</Text><Text style={styles.subDetailValue}>Hassani Ali</Text></View>
      </View>
      <View style={styles.specificationSection}>
        <Text style={styles.specLabel}>Specification:</Text>
        <Text style={styles.specText}>Beverages and water shall be at Room temperature (20-25°C); packaging shall be intact; no signs of pests, cars shall be intact, seals shall not be broken and label shall be legible and correct.</Text>
      </View>
      {/* Delivery Details */}
      <View style={styles.deliveryDetails}>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Date of Delivery:</Text><Text style={styles.deliveryValue}>{meta.dateOfDelivery || ''}</Text>
          <Text style={styles.deliveryLabel}>Received By:</Text><Text style={styles.deliveryValue}>{meta.receivedBy || ''}</Text>
          <Text style={styles.deliveryLabel}>Complex Manager:</Text><Text style={styles.deliveryValue}>{meta.complexManager || ''}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Time of Delivery:</Text><Text style={styles.deliveryValue}>{meta.timeOfDelivery || ''}</Text>
          <Text style={styles.deliveryLabel}>Invoice No:</Text><Text style={styles.deliveryValue}>{meta.invoiceNo || ''}</Text>
          <Text style={styles.deliveryLabel}>Drivers Name:</Text><Text style={styles.deliveryValue}>{meta.driversName || ''}</Text>
        </View>
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Vehicle Reg No:</Text><Text style={styles.deliveryValue}>{meta.vehicleRegNo || ''}</Text>
          <Text style={styles.deliveryLabel}>Signature:</Text><Text style={styles.deliveryValue}>{meta.signature || ''}</Text>
        </View>
      </View>
      {/* Table: horizontal scroll, fixed widths */}
      <ScrollView horizontal contentContainerStyle={{ minWidth: tableWidth }}>
        <View style={[tableStyles.tableContainer, { width: tableWidth }]}>
          <View style={tableStyles.tableHeader}>
            <Text style={[tableStyles.headerCell, tableStyles.nameCol, colName]}>Name of Product</Text>
            <Text style={[tableStyles.headerCell, tableStyles.supplierCol, colSupplier]}>Supplier</Text>
            <Text style={[tableStyles.headerCell, tableStyles.cleanCol, colClean]}>Clean</Text>
            <Text style={[tableStyles.headerCell, tableStyles.tempCol, colTemp]}>Temp</Text>
            <Text style={[tableStyles.headerCell, tableStyles.tempOfBeverageCol, colTempOfBeverage]}>Temp of Beverage</Text>
            <Text style={[tableStyles.headerCell, tableStyles.stateOfProductCol, colStateOfProduct]}>State of Product</Text>
            <Text style={[tableStyles.headerCell, tableStyles.expiryDateCol, colExpiryDate]}>Expiry Date</Text>
            <Text style={[tableStyles.headerCell, tableStyles.remarksCol, colRemarks]}>Remarks</Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={tableStyles.tableRow}>
              <Text style={[tableStyles.dataCell, tableStyles.nameCol, colName]}>{row.nameOfProduct || ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.supplierCol, colSupplier]}>{row.supplier || ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.cleanCol, colClean]}>{row.clean ? '✓' : ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.tempCol, colTemp]}>{row.temp || ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.tempOfBeverageCol, colTempOfBeverage]}>{row.tempOfBeverage || ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.stateOfProductCol, colStateOfProduct]}>{row.stateOfProduct || ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.expiryDateCol, colExpiryDate]}>{row.expiryDate || ''}</Text>
              <Text style={[tableStyles.dataCell, tableStyles.remarksCol, colRemarks]}>{row.remarks || ''}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      {/* Verification Footer */}
      <View style={styles.verificationFooter}>
        <Text style={styles.verificationText}>VERIFIED BY</Text>
        <Text style={styles.verificationSignature}>HSEQ MANAGER..................................</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 10, paddingBottom: 120 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#000', marginBottom: 5, padding: 2 },
  logoAndSystem: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 5, flex: 1.5 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33', marginRight: 10 },
  systemDetails: { justifyContent: 'center' },
  systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
  docDetailsRight: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
  detailLabel: { fontWeight: 'bold', fontSize: 12 },
  detailValue: { fontSize: 12 },
  subjectRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderBottomWidth: 0 },
  subjectItem: { flex: 4, padding: 5, backgroundColor: '#eee', borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  subjectLabel: { fontWeight: 'bold', fontSize: 14 },
  subjectValue: { fontSize: 16, marginLeft: 8 },
  versionDetails: { flex: 1, padding: 5, justifyContent: 'center', alignItems: 'flex-start' },
  versionText: { fontSize: 8 },
  subDetailRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  subDetailItem: { flex: 1, padding: 5, borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  subDetailLabel: { fontWeight: 'bold', fontSize: 9 },
  subDetailValue: { fontSize: 9, marginLeft: 5, borderBottomWidth: 1, borderBottomColor: '#000', flex: 1 },
  specificationSection: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  specLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
  specText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  deliveryDetails: { marginBottom: 10, padding: 5, borderWidth: 1, borderColor: '#000' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' },
  deliveryLabel: { fontWeight: 'bold', fontSize: 12, marginRight: 8, flexShrink: 0 },
  deliveryValue: { fontSize: 12, minWidth: 60, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4, marginRight: 15 },
  verificationFooter: { marginTop: 10 },
  verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
  verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});

const tableStyles = StyleSheet.create({
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
  headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
  nameCol: { width: 260 }, supplierCol: { width: 180 }, cleanCol: { width: 90 }, tempCol: { width: 90 }, tempOfBeverageCol: { width: 120 }, stateOfProductCol: { width: 140 }, expiryDateCol: { width: 120 }, remarksCol: { width: 300 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
  dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
});

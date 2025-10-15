import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

const ChemicalsReceivingPresentational = ({ payload }) => {
    const { metadata = {}, formData = [] } = payload || {};
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 8 }}>
            <View style={styles.docHeader}>
                <View style={styles.logoAndSystem}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                    <View>
                        <Text style={styles.logoText}>Bravo</Text>
                        <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
                        <Text style={styles.systemText}>Food Safety Management System</Text>
                    </View>
                </View>
                <View style={styles.docDetailsRight}>
                    <Text>Issue Date: {metadata.issueDate}</Text>
                    <Text>Version: {metadata.versionNo}</Text>
                </View>
            </View>

            <View style={styles.specificationSection}>
                <Text style={styles.specLabel}>Chemicals shall be received in original containers, seal must not be broken, label must be legible and correct, the chemical shall be food grade, shall not be expired and a Safety Data Sheet shall accompany the chemical.</Text>
            </View>

            <View style={styles.deliveryDetails}>
                <Text>Date of Delivery: {metadata.dateOfDelivery}</Text>
                <Text>Received By: {metadata.receivedBy}</Text>
                <Text>Complex Manager: {metadata.complexManager}</Text>
                <Text>Time of Delivery: {metadata.timeOfDelivery}</Text>
                <Text>Invoice No: {metadata.invoiceNo}</Text>
                <Text>Driver: {metadata.driversName}</Text>
                <Text>Vehicle Reg No: {metadata.vehicleRegNo}</Text>
            </View>

            {/* Table: top grouped header row + subheader row to match editable form */}
            <ScrollView horizontal contentContainerStyle={{ minWidth: 1123 }}>
                <View style={styles.tableContainer}>
                    <View style={styles.groupHeaderRow}>
                        <Text style={[styles.groupCell, styles.nameCol]}>Name of Product</Text>
                        <Text style={[styles.groupCell, styles.supplierCol]}>Supplier</Text>
                        <Text style={[styles.groupCell, styles.deliveryGroupCol]}>Delivery{"\n"}Vehicle</Text>
                        <Text style={[styles.groupCell, styles.productGroupCol]}>Product</Text>
                    </View>
                    <View style={styles.subHeaderRow}>
                        <Text style={[styles.subCell, styles.nameCol]} />
                        <Text style={[styles.subCell, styles.supplierCol]} />
                        <Text style={[styles.subCell, styles.cleanCol]}>Clean</Text>
                        <Text style={[styles.subCell, styles.stateOfProductCol]}>State of Product</Text>
                        <Text style={[styles.subCell, styles.expiryDateCol]}>Expiry Date</Text>
                        <Text style={[styles.subCell, styles.remarksCol]}>Remarks</Text>
                    </View>

                    {formData.map((r) => (
                        <View key={r.id} style={styles.row}>
                            <Text style={[styles.cell, styles.nameCol]}>{r.nameOfProduct}</Text>
                            <Text style={[styles.cell, styles.supplierCol]}>{r.supplier}</Text>
                            <Text style={[styles.cell, styles.cleanCol]}>{r.clean ? '✓' : ''}</Text>
                            <Text style={[styles.cell, styles.stateOfProductCol]}>{r.stateOfProduct}</Text>
                            <Text style={[styles.cell, styles.expiryDateCol]}>{r.expiryDate}</Text>
                            <Text style={[styles.cell, styles.remarksCol]}>{r.remarks}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#fff' },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, padding: 6, marginBottom: 6 },
    logoAndSystem: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 48, height: 48, marginRight: 8 },
    logoText: { fontWeight: 'bold', fontSize: 20, color: '#007A33' },
    systemText: { fontSize: 12 },
    docDetailsRight: { justifyContent: 'center' },
    specificationSection: { marginBottom: 8 },
    specLabel: { fontSize: 12 },
    deliveryDetails: { marginBottom: 8 },
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    groupHeaderRow: { flexDirection: 'row', backgroundColor: '#eee' },
    groupCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: '700' },
    subHeaderRow: { flexDirection: 'row', backgroundColor: '#eee' },
    subCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: '700' },
    row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000' },
    cell: { padding: 8, borderRightWidth: 1, borderRightColor: '#000' },
    nameCol: { width: 260 },
    supplierCol: { width: 180 },
    // Delivery group is a single Clean column (width 90)
    deliveryGroupCol: { width: 90 },
    cleanCol: { width: 90 },
    // Product subcolumns total to 560 (140 + 120 + 300)
    productGroupCol: { width: 560 },
    stateOfProductCol: { width: 140 },
    expiryDateCol: { width: 120 },
    remarksCol: { width: 300, borderRightWidth: 0 },
});

export default ChemicalsReceivingPresentational;

import React, { useState, useMemo } from 'react';
import formStorage from '../utils/formStorage';
import useFormSave from '../hooks/useFormSave';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, TextInput, Image, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

// --- Helper Data for the Receiving Log ---
const createInitialProductData = (count) => Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    nameOfProduct: '',
    supplier: '',
    clean: false,
    temp: '',
    stateOfProduct: '',
    expiryDate: '',
    remarks: '',
}));

const DryGoodsReceivingForm = () => {
    const [receivingData, setReceivingData] = useState(createInitialProductData(10));
    const today = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const defaultIssueDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
    const [issueDate, setIssueDate] = useState(defaultIssueDate);
    const docRef = useMemo(() => 'BBN-SHEQ-P-F-9.7', []);
    const versionNo = useMemo(() => '01', []);
    const revNo = useMemo(() => '00', []);

    // Delivery details state
    const [deliveryDetails, setDeliveryDetails] = useState({
        dateOfDelivery: '',
        receivedBy: '',
        complexManager: '',
        timeOfDelivery: '',
        invoiceNo: '',
        driversName: '',
        vehicleRegNo: '',
        signature: '',
    });

    // Save status
    const [isSaving, setIsSaving] = useState(false);

    // Update delivery details
    const updateDeliveryDetail = (field, value) => {
        setDeliveryDetails(prev => ({ ...prev, [field]: value }));
    };

    const updateReceivingField = (id, field, value) => {
        setReceivingData(prevData => prevData.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const toggleClean = (id) => {
        setReceivingData(prevData => prevData.map(item => item.id === id ? { ...item, clean: !item.clean } : item));
    };

    const renderReceivingLogItem = ({ item }) => (
        <View style={dailyStyles.tableRow} key={item.id}>
            <TextInput style={[dailyStyles.dataCell, dailyStyles.nameCol]} value={item.nameOfProduct} onChangeText={(t) => updateReceivingField(item.id, 'nameOfProduct', t)} />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.supplierCol]} value={item.supplier} onChangeText={(t) => updateReceivingField(item.id, 'supplier', t)} />
            <TouchableOpacity style={[dailyStyles.dataCell, dailyStyles.cleanCol, dailyStyles.checkboxCell]} onPress={() => toggleClean(item.id)} activeOpacity={0.7}>
                <Text style={dailyStyles.checkboxText}>{item.clean ? '✓' : ''}</Text>
            </TouchableOpacity>
            <TextInput style={[dailyStyles.dataCell, dailyStyles.tempCol]} value={item.temp} onChangeText={(t) => updateReceivingField(item.id, 'temp', t)} keyboardType="numeric" placeholder="°C" />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]} value={item.stateOfProduct} onChangeText={(t) => updateReceivingField(item.id, 'stateOfProduct', t)} />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]} value={item.expiryDate} onChangeText={(t) => updateReceivingField(item.id, 'expiryDate', t)} />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.remarksCol]} value={item.remarks} onChangeText={(t) => updateReceivingField(item.id, 'remarks', t)} />
        </View>
    );

    // --- Save Draft & Submit Logic ---
    const getLogoDataUri = () => {
        // If you have a logo as base64, return it here. Otherwise, return null.
        return null;
    };

    const buildCanonicalPayload = (status) => {
        return {
            formType: 'DryGoodsReceiving',
            templateVersion: versionNo,
            title: 'Dry Goods Receiving Checklist',
            metadata: {
                issueDate,
                docRef,
                versionNo,
                revNo,
                ...deliveryDetails,
                status,
            },
            formData: receivingData,
            layoutHints: {},
            assets: {
                logoDataUri: getLogoDataUri(),
            },
            savedAt: new Date().toISOString(),
        };
    };

    const getPayload = (status) => buildCanonicalPayload(status);
    const { isSaving: saving, showNotification, notificationMessage, setShowNotification, setNotificationMessage, autoSaveDraft, handleSaveDraft, handleSubmit } = useFormSave(getPayload, { formType: 'DryGoodsReceivingForm', draftId: 'DryGoodsReceivingForm_draft' });

    // clear form wrapper used on submit
    const onClear = () => clearForm();

    const clearForm = () => {
        setReceivingData(createInitialProductData(10));
        setIssueDate(defaultIssueDate);
        setDeliveryDetails({
            dateOfDelivery: '',
            receivedBy: '',
            complexManager: '',
            timeOfDelivery: '',
            invoiceNo: '',
            driversName: '',
            vehicleRegNo: '',
            signature: '',
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollViewContent, { flexGrow: 1, paddingBottom: 140 }]}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
            >
                <View style={styles.container}>
                    {/* ...existing code... */}
                    <View style={styles.docHeader}>
                        <View style={styles.logoAndSystem}>
                            <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                            <View style={styles.systemDetailsWrap}>
                                <Text style={styles.logoText}>Bravo</Text>
                                <View style={styles.systemDetails}>
                                    <Text style={styles.systemText}>BRAVO BRANDS LIMITED</Text>
                                    <Text style={styles.systemText}>Food Safety Management System</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.docDetailsRight}>
                            <View style={styles.detailRowItem}>
                                <Text style={styles.detailLabel}>Issue Date:</Text>
                                <TextInput style={styles.detailValueInput} value={issueDate} onChangeText={setIssueDate} />
                            </View>
                            <View style={styles.detailRowItem}>
                                <Text style={styles.detailLabel}>Page:</Text>
                                <Text style={styles.detailValue}>1 of 1</Text>
                            </View>
                        </View>
                    </View>
                    {/* ...existing code... */}
                    <View style={styles.subjectRow}>
                        <View style={styles.subjectItem}>
                            <Text style={styles.subjectLabel}>Subject:</Text>
                            <Text style={styles.subjectValue}>Dry Goods Receiving Checklist</Text>
                        </View>
                        <View style={styles.versionDetails}>
                            <Text style={styles.versionText}>Version No: {versionNo}</Text>
                        </View>
                    </View>
                    <View style={styles.subDetailRow}>
                            <View style={styles.verificationFooter}>
                                <Text style={styles.verificationText}>VERIFIED BY</Text>
                                <Text style={styles.verificationSignature}>HSEQ MANAGER..................................</Text>
                            </View>
                        <View style={styles.subDetailItem}>
                            <Text style={styles.subDetailLabel}>Compiled By:</Text>
                            <Text style={styles.subDetailValue}>Michael Zulu C.</Text>
                        </View>
                        <View style={styles.subDetailItem}>
                            <Text style={styles.subDetailLabel}>Approved By:</Text>
                            <Text style={styles.subDetailValue}>Hassani Ali</Text>
                        </View>
                    </View>
                    <View style={styles.specificationSection}>
                        <Text style={styles.specLabel}>Specification:</Text>
                        <Text style={styles.specText}>
                            Packaging shall be intact, no signs of pests; seals shall be intact and labels shall be legible and correct.
                        </Text>
                    </View>
                    <View style={styles.deliveryDetails}>
                        <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>Date of Delivery:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.dateOfDelivery} onChangeText={t => updateDeliveryDetail('dateOfDelivery', t)} />
                            <Text style={styles.deliveryLabel}>Received By:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.receivedBy} onChangeText={t => updateDeliveryDetail('receivedBy', t)} />
                            <Text style={styles.deliveryLabel}>Complex Manager:</Text>
                            <Text style={styles.deliveryInput} value={deliveryDetails.complexManager} onChangeText={t => updateDeliveryDetail('complexManager', t)} />
                        </View>
                        <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>Time of Delivery:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.timeOfDelivery} onChangeText={t => updateDeliveryDetail('timeOfDelivery', t)} />
                            <Text style={styles.deliveryLabel}>Invoice No.:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.invoiceNo} onChangeText={t => updateDeliveryDetail('invoiceNo', t)} />
                            <Text style={styles.deliveryLabel}>Drivers Name:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.driversName} onChangeText={t => updateDeliveryDetail('driversName', t)} />
                        </View>
                        <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>Vehicle Reg No.:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.vehicleRegNo} onChangeText={t => updateDeliveryDetail('vehicleRegNo', t)} />
                            <Text style={styles.deliveryLabel}>Signature:</Text>
                            <TextInput style={[styles.deliveryInput, { flex: 2 }]} value={deliveryDetails.signature} onChangeText={t => updateDeliveryDetail('signature', t)} />
                        </View>
                    </View>
                    {/* ...existing code... */}
                    <View style={dailyStyles.tableContainer}>
                        {/* Grouped header row */}
                        <View style={{ flexDirection: 'row', backgroundColor: '#eee' }}>
                            <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}></Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.supplierCol, dailyStyles.spanTwoRows]}></Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={[dailyStyles.groupHeader, { width: dailyStyles.cleanCol.width + dailyStyles.tempCol.width }]}>Delivery Vehicle</Text>
                                <Text style={[dailyStyles.groupHeader, { width: dailyStyles.stateOfProductCol.width + dailyStyles.expiryDateCol.width }]}>Product</Text>
                            </View>
                            <Text style={[dailyStyles.headerCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}></Text>
                        </View>
                        {/* Actual column header row */}
                        <View style={dailyStyles.tableHeader}>
                            <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}>Name of Product</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.supplierCol, dailyStyles.spanTwoRows]}>Supplier</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.cleanCol]}>Clean</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.tempCol]}>Temp</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.stateOfProductCol]}>State of Product</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}>Remarks</Text>
                        </View>
                        <FlatList
                            data={receivingData}
                            renderItem={renderReceivingLogItem}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                    <View style={styles.verificationFooter}>
                        <Text style={styles.verificationText}>VERIFIED BY</Text>
                        <Text style={styles.verificationSignature}>HSEQ MANAGER..................................</Text>
                    </View>
                    {/* --- Action buttons --- */}
                    <View style={{ height: 18 }} />
                        <View style={{ marginTop: 12 }}>
                            <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={() => handleSubmit(onClear)} showSavePdf={false} />
                        </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Reuse same styles as other receiving forms
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: { padding: 10 },
    container: { flex: 1, backgroundColor: '#fff', minWidth: 1123, paddingHorizontal: 8 },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#000', marginBottom: 5, padding: 2 },
    logoAndSystem: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 5, flex: 1.5 },
    logoImage: { width: 48, height: 48, marginRight: 10 },
    logoText: { fontWeight: 'bold', fontSize: 28, color: '#007A33', marginRight: 10 },
    systemDetails: { justifyContent: 'center' },
    systemText: { fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
    docDetails: { flex: 1, paddingLeft: 5, justifyContent: 'space-between' },
    detailRowItem: { flexDirection: 'row', fontSize: 8, paddingVertical: 1 },
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
    deliveryInput: { borderBottomWidth: 1, borderBottomColor: '#000', flex: 1, fontSize: 12, paddingVertical: 4, marginRight: 15 },
    verificationFooter: { marginTop: 10 },
    verificationText: { fontWeight: 'bold', fontSize: 12, marginBottom: 8 },
    verificationSignature: { fontSize: 12, fontWeight: 'bold' },
});

const dailyStyles = StyleSheet.create({
    groupHeader: { fontWeight: 'bold', fontSize: 14, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', backgroundColor: '#eee', height: 36, textAlignVertical: 'center' },
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
    headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
    spanTwoRows: { minHeight: 90 },
    deliveryGroupHeaderCol: { width: 180, borderRightWidth: 1, borderRightColor: '#000' },
    productGroupHeaderCol: { width: 560, borderRightWidth: 0 },
    groupHeaderTitle: { fontWeight: 'bold', fontSize: 14, padding: 6, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', height: 36, textAlignVertical: 'center' },
    subHeaderRow: { flexDirection: 'row', height: 45 },
    subHeaderCell: { fontWeight: 'bold', fontSize: 12, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
    lastSubHeaderCell: { borderRightWidth: 0 },
    nameCol: { width: 260 },
    supplierCol: { width: 180 },
    cleanCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
    tempCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
    stateOfProductCol: { width: 140 },
    expiryDateCol: { width: 120, borderRightWidth: 1, borderRightColor: '#000' },
    remarksCol: { width: 400, borderRightWidth: 0, textAlign: 'left', paddingLeft: 12 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
    dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
    checkboxCell: { justifyContent: 'center', alignItems: 'center' },
    checkboxText: { fontSize: 18, fontWeight: 'bold' },
});

export default DryGoodsReceivingForm;

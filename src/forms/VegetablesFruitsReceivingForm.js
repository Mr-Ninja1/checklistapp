import React, { useState, useMemo, useEffect } from 'react';
import useFormSave from '../hooks/useFormSave';
import { Alert } from 'react-native';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import formStorage from '../utils/formStorage';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, TextInput, Image, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const createInitialProductData = (count) => Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    typeOfVegFruit: '',
    supplier: '',
    clean: false,
    temp: '',
    stateOfProduct: '',
    expiryDate: '',
    remarks: '',
}));

const VegetablesFruitsReceivingForm = () => {
    const [receivingData, setReceivingData] = useState(createInitialProductData(10));
    const [deliveryDetails, setDeliveryDetails] = useState({ dateOfDelivery: '', receivedBy: '', complexManager: '', timeOfDelivery: '', invoiceNo: '', driversName: '', vehicleRegNo: '', signature: '' });
    const updateDeliveryDetail = (field, value) => { setDeliveryDetails(prev => ({ ...prev, [field]: value })); scheduleAutoSave(); };

    const today = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const defaultIssueDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
    const [issueDate, setIssueDate] = useState(defaultIssueDate);
    // docRef/version/rev removed per request

    const updateReceivingField = (id, field, value) => {
        setReceivingData(prevData => prevData.map(item => item.id === id ? { ...item, [field]: value } : item));
        scheduleAutoSave();
    };

    const toggleClean = (id) => {
        setReceivingData(prevData => prevData.map(item => item.id === id ? { ...item, clean: !item.clean } : item));
        scheduleAutoSave();
    };

    const buildCanonicalPayload = (status = 'draft') => ({
        formType: 'VegetablesFruitsReceiving',
        templateVersion: '01',
        title: 'Vegetables and Fruits Receiving Checklist',
        metadata: { issueDate, templateVersion: '01', status, ...deliveryDetails },
        formData: receivingData,
        layoutHints: {},
        assets: { logoDataUri: null },
        savedAt: new Date().toISOString(),
    });

    // clear form helper
    const clearForm = () => {
        setReceivingData(createInitialProductData(10));
        setDeliveryDetails({ dateOfDelivery: '', receivedBy: '', complexManager: '', timeOfDelivery: '', invoiceNo: '', driversName: '', vehicleRegNo: '', signature: '' });
        setIssueDate(defaultIssueDate);
    };

    const getPayload = (status) => buildCanonicalPayload(status);
    const { isSaving, showNotification, notificationMessage, setShowNotification, setNotificationMessage, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload: getPayload, draftId: 'VegetablesFruitsReceiving_draft', clearOnSubmit: () => clearForm() });

    useEffect(() => { if (showNotification) { Alert.alert(notificationMessage || 'Saved'); setShowNotification(false); } }, [showNotification]);

    // preload draft if present
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const wrapped = await formStorage.loadForm('VegetablesFruitsReceiving_draft');
                const payload = wrapped?.payload || null;
                if (payload && mounted) {
                    if (payload.metadata) {
                        setIssueDate(payload.metadata.issueDate || defaultIssueDate);
                        setDeliveryDetails(prev => ({ ...prev, ...payload.metadata }));
                    }
                    if (payload.formData) {
                        setReceivingData(payload.formData || createInitialProductData(10));
                    }
                }
            } catch (e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []);

    const renderReceivingLogItem = ({ item }) => (
        <View style={dailyStyles.tableRow} key={item.id}>
            <TextInput style={[dailyStyles.dataCell, dailyStyles.nameCol]} value={item.typeOfVegFruit} onChangeText={(t) => updateReceivingField(item.id, 'typeOfVegFruit', t)} />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.supplierCol]} value={item.supplier} onChangeText={(t) => updateReceivingField(item.id, 'supplier', t)} />
            <TouchableOpacity style={[dailyStyles.dataCell, dailyStyles.cleanCol, dailyStyles.checkboxCell]} onPress={() => toggleClean(item.id)} activeOpacity={0.7}>
                <Text style={dailyStyles.checkboxText}>{item.clean ? '✓' : ''}</Text>
            </TouchableOpacity>
            <TextInput style={[dailyStyles.dataCell, dailyStyles.tempCol]} value={item.temp} onChangeText={(t) => updateReceivingField(item.id, 'temp', t)} keyboardType="numeric" placeholder="°C" />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]} value={item.stateOfProduct} onChangeText={(t) => updateReceivingField(item.id, 'stateOfProduct', t)} />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]} value={item.expiryDate} onChangeText={(t) => updateReceivingField(item.id, 'expiryDate', t)} placeholder="D/M/Y" />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.remarksCol]} value={item.remarks} onChangeText={(t) => updateReceivingField(item.id, 'remarks', t)} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[styles.scrollViewContent, { flexGrow: 1, paddingBottom: 140 }]}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                    >
                <View style={styles.container}>
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

                                    <View style={styles.subjectRow}>
                                        <View style={styles.subjectItem}>
                                            <Text style={styles.subjectLabel}>Subject:</Text>
                                            <Text style={styles.subjectValue}>Vegetables and Fruits Receiving Checklist</Text>
                                        </View>
                                    </View>
                    <View style={styles.subDetailRow}>
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
                            Vegetables and fruits must be delivered clean, practically free of any visible foreign matter such as soils; practically free from pests; practically free from damage caused by pests.
                        </Text>
                    </View>

                    <View style={styles.deliveryDetails}>
                        <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>Date of Delivery:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.dateOfDelivery} onChangeText={t => updateDeliveryDetail('dateOfDelivery', t)} />
                            <Text style={styles.deliveryLabel}>Received By:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.receivedBy} onChangeText={t => updateDeliveryDetail('receivedBy', t)} />
                            <Text style={styles.deliveryLabel}>Complex Manager:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.complexManager} onChangeText={t => updateDeliveryDetail('complexManager', t)} />
                        </View>
                        <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>Time of Delivery:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.timeOfDelivery} onChangeText={t => updateDeliveryDetail('timeOfDelivery', t)} />
                            <Text style={styles.deliveryLabel}>Invoice No:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.invoiceNo} onChangeText={t => updateDeliveryDetail('invoiceNo', t)} />
                            <Text style={styles.deliveryLabel}>Drivers Name:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.driversName} onChangeText={t => updateDeliveryDetail('driversName', t)} />
                        </View>
                        <View style={styles.deliveryRow}>
                            <Text style={styles.deliveryLabel}>Vehicle Reg No:</Text>
                            <TextInput style={styles.deliveryInput} value={deliveryDetails.vehicleRegNo} onChangeText={t => updateDeliveryDetail('vehicleRegNo', t)} />
                            <Text style={styles.deliveryLabel}>Signature:</Text>
                            <TextInput style={[styles.deliveryInput, { flex: 2 }]} value={deliveryDetails.signature} onChangeText={t => updateDeliveryDetail('signature', t)} />
                        </View>
                    </View>

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

                        <FlatList data={receivingData} renderItem={renderReceivingLogItem} keyExtractor={item => item.id} scrollEnabled={false} />
                    </View>

                    <View style={styles.verificationFooter}>
                        <Text style={styles.verificationText}>VERIFIED BY</Text>
                        <Text style={styles.verificationSignature}>QA MANAGER..................................</Text>
                    </View>
                                    <View style={{ height: 18 }} />
                                    <View style={{ marginTop: 12 }}>
                                        <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={() => handleSubmit(() => clearForm())} showSavePdf={false} />
                                    </View>
                                    <LoadingOverlay visible={isSaving} />
                                    <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Reuse the same styles from packaging/beverage forms (copied below)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        padding: 10,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        minWidth: 1123,
        paddingHorizontal: 8,
    },
    docHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 5,
        padding: 2,
    },
    logoAndSystem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        paddingRight: 5,
        flex: 1.5,
    },
    logoImage: { width: 48, height: 48, marginRight: 10 },
    logoText: {
        fontWeight: 'bold',
        fontSize: 28,
        color: '#007A33', 
        marginRight: 10,
    },
    systemDetails: {
        justifyContent: 'center',
    },
    systemText: {
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 14,
    },
    docDetails: {
        flex: 1,
        paddingLeft: 5,
        justifyContent: 'space-between',
    },
    detailRowItem: {
        flexDirection: 'row',
        fontSize: 8,
        paddingVertical: 1,
    },
    detailLabel: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    detailValue: {
        fontSize: 12,
    },
    subjectRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        borderBottomWidth: 0,
    },
    subjectItem: {
        flex: 4,
        padding: 5,
        backgroundColor: '#eee',
        borderRightWidth: 1,
        borderRightColor: '#000',
        flexDirection: 'row',
    },
    subjectLabel: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    subjectValue: {
        fontSize: 16,
        marginLeft: 8,
    },
    versionDetails: {
        flex: 1,
        padding: 5,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    versionText: {
        fontSize: 8,
    },
    subDetailRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 10,
    },
    subDetailItem: {
        flex: 1,
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: '#000',
        flexDirection: 'row',
    },
    subDetailLabel: {
        fontWeight: 'bold',
        fontSize: 9,
    },
    subDetailValue: {
        fontSize: 9,
        marginLeft: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        flex: 1,
    },
    specificationSection: {
        marginBottom: 10,
        padding: 5,
        borderWidth: 1,
        borderColor: '#000',
    },
    specLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 6,
    },
    specText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    deliveryDetails: {
        marginBottom: 10,
        padding: 5,
        borderWidth: 1,
        borderColor: '#000',
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        justifyContent: 'space-between',
    },
    deliveryLabel: {
        fontWeight: 'bold',
        fontSize: 12,
        marginRight: 8,
        flexShrink: 0,
    },
    deliveryInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        flex: 1,
        fontSize: 12,
        paddingVertical: 4,
        marginRight: 15,
    },
    verificationFooter: {
        marginTop: 10,
    },
    verificationText: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 8,
    },
    verificationSignature: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

const dailyStyles = StyleSheet.create({
    tableContainer: {
        borderWidth: 1,
        borderColor: '#000',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#eee',
        alignItems: 'stretch',
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 12,
        padding: 8,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        minHeight: 60,
        textAlignVertical: 'center',
    },
    spanTwoRows: {
        minHeight: 90,
    },
    groupHeaderCol: {
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    lastGroupHeaderCol: {
        borderRightWidth: 0,
    },
    groupHeaderTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        padding: 6,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        height: 36,
        textAlignVertical: 'center',
    },
    subHeaderRow: {
        flexDirection: 'row',
        height: 45,
    },
    subHeaderCell: {
        fontWeight: 'bold',
        fontSize: 12,
        padding: 4,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        textAlignVertical: 'center',
    },
    lastSubHeaderCell: {
        borderRightWidth: 0,
    },
    nameCol: { width: 260 },
    supplierCol: { width: 180 },
    cleanCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
    tempCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' },
    tempOfBeverageCol: { width: 120 },
    stateOfProductCol: { width: 140 },
    expiryDateCol: { width: 120 },
    remarksCol: { width: 300, borderRightWidth: 0 },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 48,
        alignItems: 'stretch',
    },
    dataCell: {
        fontSize: 12,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRightWidth: 1,
        borderRightColor: '#000',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    checkboxCell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default VegetablesFruitsReceivingForm;

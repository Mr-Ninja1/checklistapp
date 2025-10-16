import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import FormActionBar from '../components/FormActionBar';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

const createInitialProductData = (count) => Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    categoryOfEggs: '',
    supplier: '',
    clean: false,
    stateOfProduct: '',
    expiryDate: '',
    remarks: '',
}));

const EggsReceivingForm = () => {
    const [receivingData, setReceivingData] = useState(createInitialProductData(12));
    const [deliveryDetails, setDeliveryDetails] = useState({ dateOfDelivery: '', receivedBy: '', complexManager: '', timeOfDelivery: '', invoiceNo: '', driversName: '', vehicleRegNo: '', signature: '' });
    const updateDeliveryDetail = (field, value) => { setDeliveryDetails(prev => ({ ...prev, [field]: value })); scheduleAutoSave(); };

    const today = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const defaultIssueDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
    const [issueDate, setIssueDate] = useState(defaultIssueDate);
    const versionNo = useMemo(() => '01', []);

    const updateReceivingField = (id, field, value) => {
        setReceivingData(prevData => prevData.map(item => item.id === id ? { ...item, [field]: value } : item));
        scheduleAutoSave();
    };

        const [logoDataUri, setLogoDataUri] = React.useState(null);

        // embed logo as base64 for saved payloads
        React.useEffect(() => {
            let mounted = true;
            (async () => {
                try {
                    const asset = Asset.fromModule(require('../assets/logo.jpeg'));
                    if (!asset.localUri) await asset.downloadAsync();
                    const uri = asset.localUri || asset.uri;
                    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                    if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
                } catch (e) {
                    // ignore
                }
            })();
            return () => { mounted = false; };
        }, []);

    let scheduleAutoSave = (delay = 1500) => { /* will be injected by hook */ };

    const toggleClean = (id) => {
        setReceivingData(prevData => prevData.map(item => item.id === id ? { ...item, clean: !item.clean } : item));
    };

    // clear the editable form after successful submit
    const clearForm = () => {
        setReceivingData(createInitialProductData(12));
        setDeliveryDetails({ dateOfDelivery: '', receivedBy: '', complexManager: '', timeOfDelivery: '', invoiceNo: '', driversName: '', vehicleRegNo: '', signature: '' });
        setIssueDate(defaultIssueDate);
    };

    const buildCanonicalPayload = (status = 'draft') => ({
        formType: 'EggsReceiving',
        templateVersion: versionNo,
        title: 'Eggs Receiving Checklist',
        metadata: { issueDate, versionNo, status, ...deliveryDetails },
        formData: receivingData,
        layoutHints: {
            CATEGORY: 300,
            SUPPLIER: 180,
            CLEAN: 90,
            STATE: 140,
            EXPIRY: 120,
            REMARKS: 300,
            gap: 8
        },
        _tableWidth: 300 + 180 + 90 + 140 + 120 + 300,
        assets: { logoDataUri: logoDataUri || null },
        savedAt: new Date().toISOString(),
    });

    const getPayload = (status) => buildCanonicalPayload(status);
    const { isSaving, showNotification, notificationMessage, setShowNotification, setNotificationMessage, scheduleAutoSave: _scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload: getPayload, draftId: 'EggsReceiving_draft', clearOnSubmit: () => clearForm() });
    // attach scheduleAutoSave to local name used above
    scheduleAutoSave = _scheduleAutoSave;

    useEffect(() => { if (showNotification) { Alert.alert(notificationMessage || 'Saved'); setShowNotification(false); } }, [showNotification]);

    const renderReceivingLogItem = ({ item }) => (
        <View style={dailyStyles.tableRow} key={item.id}>
            <TextInput style={[dailyStyles.dataCell, dailyStyles.categoryCol]} value={item.categoryOfEggs} onChangeText={(t) => updateReceivingField(item.id, 'categoryOfEggs', t)} placeholder="Large/Medium/Small" />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.supplierCol]} value={item.supplier} onChangeText={(t) => updateReceivingField(item.id, 'supplier', t)} />
            <TouchableOpacity style={[dailyStyles.dataCell, dailyStyles.cleanCol, dailyStyles.checkboxCell]} onPress={() => toggleClean(item.id)} activeOpacity={0.7}>
                <Text style={dailyStyles.checkboxText}>{item.clean ? '✓' : ''}</Text>
            </TouchableOpacity>
            <TextInput style={[dailyStyles.dataCell, dailyStyles.stateOfProductCol]} value={item.stateOfProduct} onChangeText={(t) => updateReceivingField(item.id, 'stateOfProduct', t)} />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]} value={item.expiryDate} onChangeText={(t) => updateReceivingField(item.id, 'expiryDate', t)} placeholder="D/M/Y" />
            <TextInput style={[dailyStyles.dataCell, dailyStyles.remarksCol]} value={item.remarks} onChangeText={(t) => updateReceivingField(item.id, 'remarks', t)} />
        </View>
    );

    const saveAndRecord = async () => {
        try {
            await handleSubmit();
            await addFormHistory({ title: 'Eggs Receiving Checklist', date: new Date().toLocaleDateString(), savedAt: Date.now(), meta: { payload: buildCanonicalPayload('final') } });
        } catch (e) {
            console.warn('save failed', e);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* The outer ScrollView handles all vertical scrolling */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollViewContent, { flexGrow: 1, paddingBottom: 140 }]} keyboardShouldPersistTaps="handled">
                
                {/* The entire content that *might* exceed the screen width is wrapped in the horizontal ScrollView. 
                  We remove the redundant nesting of ScrollViews around the table.
                */}
                <ScrollView horizontal={true} nestedScrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={styles.horizontalScrollContent}>
                    <View style={styles.container}>
                        <View style={styles.docHeader}>
                            <View style={styles.logoAndSystem}>
                                <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
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
                                <Text style={styles.subjectValue}>Eggs Receiving Checklist</Text>
                            </View>
                            <View style={styles.versionDetails}>
                                <Text style={styles.versionText}>Version No: {versionNo}</Text>
                            </View>
                        </View>
                        <View style={styles.subDetailRow}>
                            <View style={styles.subDetailItem}>
                                <Text style={styles.subDetailLabel}>Compiled By:</Text>
                                <Text style={styles.subDetailValue}>Michael</Text>
                            </View>
                            <View style={styles.subDetailItem}>
                                <Text style={styles.subDetailLabel}>Approved By:</Text>
                                <Text style={styles.subDetailValue}>Hassani Ali</Text>
                            </View>
                        </View>

                        <View style={styles.specificationSection}>
                            <Text style={styles.specLabel}>Specification:</Text>
                            <Text style={styles.specText}>
                                Eggs must be fresh, clean, without bad smell, not broken and no signs of pests; the tray must be of plastic; 10 randomly selected eggs shall be able to sink when placed in fresh water and label shall be legible and correct.
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

                        <View style={{ height: 18 }} />

                        <View style={dailyStyles.tableContainer}>
                            <View style={dailyStyles.tableHeader}>
                                <Text style={[dailyStyles.headerCell, dailyStyles.categoryCol, dailyStyles.spanTwoRows]}>Category of Eggs (Large, Medium, Small or mixed sizes)</Text>
                                <Text style={[dailyStyles.headerCell, dailyStyles.supplierCol, dailyStyles.spanTwoRows]}>Supplier</Text>

                                <View style={dailyStyles.deliveryGroupHeaderCol}>
                                            <Text style={dailyStyles.groupHeaderTitle}>{'Delivery\nVehicle'}</Text>
                                            <View style={dailyStyles.subHeaderRow}>
                                                <Text style={[dailyStyles.subHeaderCell, dailyStyles.cleanCol, dailyStyles.lastSubHeaderCell]}>Clean</Text>
                                            </View>
                                </View>

                                <View style={dailyStyles.productGroupHeaderCol}>
                                    <Text style={dailyStyles.groupHeaderTitle}>Product</Text>
                                    <View style={dailyStyles.subHeaderRow}>
                                        <Text style={[dailyStyles.subHeaderCell, dailyStyles.stateOfProductCol]}>State of Product</Text>
                                        <Text style={[dailyStyles.subHeaderCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                                        <Text style={[dailyStyles.subHeaderCell, dailyStyles.remarksCol, dailyStyles.lastSubHeaderCell]}>Remarks</Text>
                                    </View>
                                </View>
                            </View>

                            <FlatList data={receivingData} renderItem={renderReceivingLogItem} keyExtractor={item => item.id} scrollEnabled={false} />
                        </View>

                        {/* Form action buttons should appear below the form content so they are
                            reachable on mobile screens and do not interfere with the table layout. */}
                        <View style={{ marginTop: 12 }}>
                            <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} showSavePdf={false} />
                        </View>

                        <View style={styles.verificationFooter}>
                            <Text style={styles.verificationText}>VERIFIED BY</Text>
                            <Text style={styles.verificationSignature}>HSEQ MANAGER..................................</Text>
                        </View>

                    </View>
                </ScrollView>
            </ScrollView>
        </SafeAreaView>
    );
};

// ---------------------------------------------------------------------------------------

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    scrollViewContent: { padding: 10 },
    // This is the key fix: We removed flexGrow: 1 from the horizontalScrollContent
    // and ensured the container has a fixed width to enable horizontal scroll.
    horizontalScrollContent: { flexGrow: 1 }, 
    // The total width of the content is calculated by summing up the table column widths + margins.
    // The previous 1123 was correct, but we'll ensure the View takes this min width.
    container: { backgroundColor: '#fff', minWidth: 1123, paddingHorizontal: 8 }, 
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

// ---------------------------------------------------------------------------------------

const dailyStyles = StyleSheet.create({
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
    headerCell: { fontWeight: 'bold', fontSize: 12, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
    spanTwoRows: { minHeight: 90 },
    
    // Group header widths (aligned to cells)
    deliveryGroupHeaderCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' }, 
    productGroupHeaderCol: { width: 560, borderRightWidth: 0 }, 
    
    groupHeaderTitle: { fontWeight: 'bold', fontSize: 14, paddingHorizontal: 6, paddingVertical: 6, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 45, flexWrap: 'wrap' },
    subHeaderRow: { flexDirection: 'row', height: 45 },
    subHeaderCell: { fontWeight: 'bold', fontSize: 12, padding: 4, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
    lastSubHeaderCell: { borderRightWidth: 0 },
    
    // Column widths
    categoryCol: { width: 300 }, 
    supplierCol: { width: 180 }, 
    cleanCol: { width: 90, borderRightWidth: 1, borderRightColor: '#000' }, 
    stateOfProductCol: { width: 210 },
    expiryDateCol: { width: 120 }, 
    remarksCol: { width: 230, borderRightWidth: 0 }, 
    
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 48, alignItems: 'stretch' },
    dataCell: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
    checkboxCell: { justifyContent: 'center', alignItems: 'center' },
    checkboxText: { fontSize: 18, fontWeight: 'bold' },
});

export default EggsReceivingForm;
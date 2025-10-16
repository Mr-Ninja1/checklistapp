import React, { useState, useMemo, useEffect } from 'react';
import useFormSave from '../hooks/useFormSave';
import formStorage from '../utils/formStorage';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, TextInput, Image } from 'react-native';

const { width } = Dimensions.get('window');

// --- Helper Data for the Product Log ---
const createInitialProductData = (count) => Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    date: '',
    productName: '',
    batchNumber: '',
    productionDate: '',
    expiryDate: '',
    signatureHead: '',
    approvedHSEQ: '',
}));

// --- Main Form Component (PRODUCT RELEASE FORM) ---
const ProductReleaseForm = () => {
    const [productData, setProductData] = useState(createInitialProductData(10));

    // auto-populate issue date to today, format DD/MM/YYYY
    const today = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const defaultIssueDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
    const [issueDate, setIssueDate] = useState(defaultIssueDate);
    const docRef = useMemo(() => 'BBN-SHEQ-P-F-8.9', []);

    const updateProductField = (id, field, value) => {
        setProductData(prevData => prevData.map(item => item.id === id ? { ...item, [field]: value } : item));
        scheduleAutoSave();
    };

    const renderProductLogItem = ({ item }) => (
        <View style={dailyStyles.tableRow} key={item.id}>
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.dateCol]}
                value={item.date}
                onChangeText={(t) => updateProductField(item.id, 'date', t)}
                placeholder="D/M/Y"
            />
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.productNameCol]}
                value={item.productName}
                onChangeText={(t) => updateProductField(item.id, 'productName', t)}
                placeholder="Product"
            />
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.batchNumberCol]}
                value={item.batchNumber}
                onChangeText={(t) => updateProductField(item.id, 'batchNumber', t)}
                placeholder="Batch"
            />
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.productionDateCol]}
                value={item.productionDate}
                onChangeText={(t) => updateProductField(item.id, 'productionDate', t)}
                placeholder="D/M/Y"
            />
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.expiryDateCol]}
                value={item.expiryDate}
                onChangeText={(t) => updateProductField(item.id, 'expiryDate', t)}
                placeholder="D/M/Y"
            />
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.signatureCol]}
                value={item.signatureHead}
                onChangeText={(t) => updateProductField(item.id, 'signatureHead', t)}
                placeholder="Signature"
            />
            <TextInput
                style={[dailyStyles.dataCell, dailyStyles.approvedCol]}
                value={item.approvedHSEQ}
                onChangeText={(t) => updateProductField(item.id, 'approvedHSEQ', t)}
                placeholder="Signature"
            />
        </View>
    );

    // Build payload for saving
    const buildPayload = (status = 'draft') => ({
        formType: 'ProductReleaseForm',
        templateVersion: '01',
        title: 'Product Release Form',
        metadata: { issueDate },
        formData: productData,
        layoutHints: {},
        assets: {},
        savedAt: new Date().toISOString(),
        status,
    });

    const draftId = 'ProductReleaseForm_draft';
    const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => { setProductData(createInitialProductData(10)); setIssueDate(defaultIssueDate); } });

    // preload draft if present
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const wrapped = await formStorage.loadForm(draftId);
                const payload = wrapped?.payload || null;
                if (payload && mounted) {
                    if (payload.formData) setProductData(payload.formData);
                    if (payload.metadata) setIssueDate(payload.metadata.issueDate || defaultIssueDate);
                }
            } catch (e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.container}>
                    <View style={styles.docHeader}>
                        <View style={styles.logoAndSystem}>
                            <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
                            <View>
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
                            <Text style={styles.subjectValue}>PRODUCT RELEASE FORM</Text>
                        </View>
                        <View style={styles.versionDetails} />
                    </View>

                    <View style={styles.subDetailRow}>
                        <View style={styles.subDetailItem}>
                            <Text style={styles.subDetailLabel}>Compiled By:</Text>
                            <Text style={styles.subDetailValue}>Michael C. Zulu</Text>
                        </View>
                        <View style={styles.subDetailItem}>
                            <Text style={styles.subDetailLabel}>Approved By:</Text>
                            <Text style={styles.subDetailValue}>Hassani Ali</Text>
                        </View>
                    </View>

                    <View style={styles.siteDetailsSection}>
                        <View style={styles.siteDetailLine}>
                            <Text style={styles.siteLabel}>SITE NAME:</Text>
                            <TextInput style={styles.siteInput} />
                        </View>
                        <View style={styles.dateDetailRow}>
                            <Text style={styles.dateLabel}>WEEK STARTING:</Text>
                            <TextInput style={[styles.dateInput, { flex: 1.5 }]} />
                            <Text style={styles.dateLabel}>MONTH:</Text>
                            <TextInput style={[styles.dateInput, { flex: 1 }]} />
                            <Text style={styles.dateLabel}>YEAR:</Text>
                            <TextInput style={[styles.dateInput, { flex: 1 }]} />
                        </View>
                    </View>

                    <View style={dailyStyles.tableContainer}>
                        <View style={dailyStyles.tableHeader}>
                            <Text style={[dailyStyles.headerCell, dailyStyles.dateCol]}>Date</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.productNameCol]}>Product Name</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.batchNumberCol]}>Batch{"\n"}Number</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.productionDateCol]}>Production{"\n"}Date</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.expiryDateCol]}>Expiry Date</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.signatureCol]}>Signature of Head{"\n"}of Section</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.approvedCol]}>Approved by HSEQ{"\n"}Manager</Text>
                        </View>

                        <FlatList
                            data={productData}
                            renderItem={renderProductLogItem}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                                        <View style={{ height: 18 }} />
                                        <View style={{ marginTop: 12 }}>
                                            <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={() => handleSubmit(() => { setProductData(createInitialProductData(10)); setIssueDate(defaultIssueDate); })} showSavePdf={false} />
                                        </View>
                                        <LoadingOverlay visible={isSaving} />
                                        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- GENERAL STYLES ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    scrollViewContent: { padding: 10 },
    container: { flex: 1, backgroundColor: '#fff', minWidth: 900 },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#000', padding: 5, marginBottom: 5 },
    logoAndSystem: { flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 22, fontWeight: 'bold', marginRight: 8 },
    logoImage: { width: 48, height: 48, marginRight: 10 },
    systemDetails: {},
    systemText: { fontSize: 10 },
    docDetails: { alignItems: 'flex-start' },
    detailRowItem: { flexDirection: 'row' },
    detailLabel: { fontWeight: 'bold', marginRight: 6 },
    detailValue: {},
    subjectRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    subjectItem: { flex: 2 },
    subjectLabel: { fontWeight: 'bold' },
    subjectValue: { fontSize: 18, fontWeight: 'bold' },
    versionDetails: { alignItems: 'flex-end' },
    versionText: {},
    subDetailRow: { flexDirection: 'row', marginTop: 8 },
    subDetailItem: { flex: 1 },
    subDetailLabel: { fontWeight: 'bold' },
    subDetailValue: {},
    siteDetailsSection: { marginTop: 8, marginBottom: 8 },
    siteDetailLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    siteLabel: { fontWeight: 'bold', marginRight: 6 },
    siteInput: { borderBottomWidth: 1, borderBottomColor: '#000', flex: 1 },
    dateDetailRow: { flexDirection: 'row', alignItems: 'center' },
    dateLabel: { fontWeight: 'bold', marginRight: 6 },
    dateInput: { borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 2, marginRight: 10 },
    footerSignatures: { marginTop: 20 },
});

// --- DAILY TABLE STYLES ---
const dailyStyles = StyleSheet.create({
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#eee' },
    headerCell: { fontWeight: 'bold', fontSize: 10, padding: 5, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 45 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 35 },
    dataCell: { fontSize: 10, padding: 5, borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
    dateCol: { width: 80 },
    productNameCol: { width: 260, textAlign: 'left' },
    batchNumberCol: { width: 100 },
    productionDateCol: { width: 100 },
    expiryDateCol: { width: 100 },
    signatureCol: { width: 160 },
    approvedCol: { width: 160, borderRightWidth: 0 },
});

export default ProductReleaseForm;

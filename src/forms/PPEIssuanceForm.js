import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import NotificationModal from '../components/NotificationModal';
import LoadingOverlay from '../components/LoadingOverlay';
import formStorage from '../utils/formStorage';
import { addFormHistory } from '../utils/formHistory';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const { width } = Dimensions.get('window');

// --- Component for a single checkbox (Switch) ---
const PPECheckbox = ({ isChecked, onToggle }) => (
    <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer}>
        <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
            {isChecked ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
    </TouchableOpacity>
);

// --- Dummy Data Structure for the FlatList ---
const initialPPEData = Array.from({ length: 13 }, (_, i) => ({
    id: `${i + 1}`,
    name: '', jobTitle: '', 
    apron: false, cap: false, chefHat: false, trousers: false, safetyBoots: false, 
    shirt: false, golfTShirt: false, workSuit: false, chefCoat: false, 
    staffNrc: '', staffSign: '', supSign: '' 
}));


// --- Main Form Component ---
const PPEIssuanceForm = () => {
    const [data, setData] = useState(initialPPEData);
    const [logoDataUri, setLogoDataUri] = useState(null);
    // compute issue date once
    const issueDate = useMemo(() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }, []);

    // helper to update text fields in row
    const updateField = (id, key, value) => {
        setData(prevData => prevData.map(item => item.id === id ? { ...item, [key]: value } : item));
    };

    // Function to update the checked state for a specific person and PPE item
    const togglePPE = (id, ppeKey) => {
        setData(prevData =>
            prevData.map(item =>
                item.id === id ? { ...item, [ppeKey]: !item[ppeKey] } : item
            )
        );
    };

    // --- Table Row Renderer for FlatList ---
    const renderItem = ({ item }) => (
        <View style={styles.tableRow} key={item.id}>
            <Text style={[styles.cell, styles.noCol]}>{item.id}</Text>
            {/* These are placeholders for input fields in a real app, kept as Text to match the table structure */}
            <TextInput
                style={[styles.inputCell, styles.nameCol]}
                value={item.name}
                onChangeText={(t) => updateField(item.id, 'name', t)}
                placeholder="Name"
            />
            <TextInput
                style={[styles.inputCell, styles.jobTitleCol]}
                value={item.jobTitle}
                onChangeText={(t) => updateField(item.id, 'jobTitle', t)}
                placeholder="Job Title"
            />
            
            {/* PPE Checkboxes */}
            <PPECheckbox isChecked={item.apron} onToggle={() => togglePPE(item.id, 'apron')} />
            <PPECheckbox isChecked={item.cap} onToggle={() => togglePPE(item.id, 'cap')} />
            <PPECheckbox isChecked={item.chefHat} onToggle={() => togglePPE(item.id, 'chefHat')} />
            <PPECheckbox isChecked={item.trousers} onToggle={() => togglePPE(item.id, 'trousers')} />
            <PPECheckbox isChecked={item.safetyBoots} onToggle={() => togglePPE(item.id, 'safetyBoots')} />
            <PPECheckbox isChecked={item.shirt} onToggle={() => togglePPE(item.id, 'shirt')} />
            <PPECheckbox isChecked={item.golfTShirt} onToggle={() => togglePPE(item.id, 'golfTShirt')} />
            <PPECheckbox isChecked={item.workSuit} onToggle={() => togglePPE(item.id, 'workSuit')} />
            <PPECheckbox isChecked={item.chefCoat} onToggle={() => togglePPE(item.id, 'chefCoat')} />
            
            {/* Signature/ID Columns (editable) */}
            <TextInput
                style={[styles.inputCell, styles.signCol]}
                value={item.staffNrc}
                onChangeText={(t) => updateField(item.id, 'staffNrc', t)}
                placeholder="Staff NRC"
            />
            <TextInput
                style={[styles.inputCell, styles.signCol]}
                value={item.staffSign}
                onChangeText={(t) => updateField(item.id, 'staffSign', t)}
                placeholder="Staff Sign"
            />
            <TextInput
                style={[styles.inputCell, styles.supSignCol]}
                value={item.supSign}
                onChangeText={(t) => updateField(item.id, 'supSign', t)}
                placeholder="Sup Sign"
            />
        </View>
    );

        // preload logo for saved payloads
        useEffect(() => {
            let mounted = true;
            (async () => {
                try {
                    const asset = Asset.fromModule(require('../assets/logo.jpeg'));
                    await asset.downloadAsync();
                    if (asset.localUri && mounted) {
                        const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
                        if (b64) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
                    }
                } catch (e) { /* ignore */ }
            })();
            return () => { mounted = false; };
        }, []);

        // build payload for save/submit - include layoutHints and assets
        const columnFlex = [1,3,2,1,1,1,1,1,1,1,1,1,2,2,2];
        const buildPayload = (status = 'draft') => ({
            formType: 'PPEIssuanceForm',
            templateVersion: '01',
            title: 'PPE Issuance',
            metadata: { subject: 'Personal Protective Equipment', issueDate },
            formData: data,
            layoutHints: { id: 1, name: 3, jobTitle: 2, apron: 1, cap: 1, chefHat: 1, trousers: 1, safetyBoots: 1, shirt: 1, golfTShirt: 1, workSuit: 1, chefCoat: 1, staffNrc: 2, staffSign: 2, supSign: 2 },
            _tableWidth: columnFlex.reduce((s, v) => s + v, 0),
            assets: logoDataUri ? { logoDataUri } : {},
            savedAt: new Date().toISOString(),
            status,
        });

    // wire save hook
    const { handleSaveDraft, handleSubmit, isSaving, showNotification, notificationMessage, setShowNotification } = useFormSave({ buildPayload, draftId: 'PPEIssuance_draft', clearOnSubmit: () => { setData(initialPPEData); } });

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* ScrollView allows the content, especially the wide table, to be visible */}
            <ScrollView horizontal={true} contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.container}>
                    {/* --- HEADER SECTION --- */}
                    <View style={styles.header}>
                        <View style={styles.logoAndTitle}>
                            <Image source={require('../assets/logo.jpeg')} style={styles.logoImageLeft} />
                            <Text style={styles.logoText}>Bravo</Text>
                            <View style={styles.titleBlock}>
                                <Text style={styles.documentTitle}>BRAVO BRANDS LIMITED</Text>
                                <Text style={styles.documentTitleSub}>Food Safety Management System</Text>
                            </View>
                        </View>
                        <View style={styles.docDetails}>
                            <Text style={styles.detailText}>Issue Date: {issueDate}</Text>
                        </View>
                        <Text style={styles.pageNumber}>Page 1 of 1</Text>
                    </View>

                    <Text style={[styles.subjectText, { fontSize: 16, fontWeight: '800' }]}>
                        <Text style={styles.boldText}>Subject:</Text> Personal Protective Equipment
                    </Text>

                    {/* --- INFO/VERSION SECTION --- */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoText}>
                                <Text style={styles.boldText}>Compiled By:</Text> Michael Zulu
                            </Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoText}>
                                <Text style={styles.boldText}>Approved By:</Text> Hassani Ali
                            </Text>
                        </View>
                        {/* Version and revision removed per user request */}
                    </View>
                    {/* Date row left as optional sign date area; removed fixed DATE placeholder */}

                    {/* --- TABLE HEADERS --- */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.noCol]}>NO.</Text>
                        <Text style={[styles.headerCell, styles.nameCol]}>NAME</Text>
                        <Text style={[styles.headerCell, styles.jobTitleCol]}>JOB{"\n"}TITLE</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>APRON</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>CAP</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>CHEF{"\n"}HAT</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>TROUSERS</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>SAFETY{"\n"}BOOTS</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>SHIRT</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>GOLF{"\n"}T-SHIRT</Text> 
                        <Text style={[styles.headerCell, styles.ppeCol]}>WORK{"\n"}SUIT</Text>
                        <Text style={[styles.headerCell, styles.ppeCol]}>CHEF{"\n"}COAT</Text>
                        <Text style={[styles.headerCell, styles.signCol]}>STAFF NRC</Text>
                        <Text style={[styles.headerCell, styles.signCol]}>STAFF SIGN</Text>
                        <Text style={[styles.headerCell, styles.supSignCol]}>SUP{"\n"}SIGN</Text>
                    </View>

                    {/* --- TABLE ROWS (using FlatList) --- */}
                                    <FlatList
                                        data={data}
                                        renderItem={renderItem}
                                        keyExtractor={item => item.id}
                                        scrollEnabled={false} 
                                    />

                                    {/* Save / Submit buttons wired to useFormSave */}
                                                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 }}>
                                                                            <TouchableOpacity
                                                                                style={[styles.btn, { backgroundColor: '#f6c342', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 }]}
                                                                                onPress={async () => { try { await handleSaveDraft(); } catch(e){console.warn(e);} }}
                                                                                disabled={isSaving}
                                                                            >
                                                                                <Text style={{ fontWeight: '700', fontSize: 16 }}>{'Save Draft'}</Text>
                                                                            </TouchableOpacity>

                                                                            <TouchableOpacity
                                                                                style={[styles.btn, { backgroundColor: '#3b82f6', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 }]}
                                                                                                                        onPress={async () => {
                                                                                                                            try {
                                                                                                                                await handleSubmit();
                                                                                        // Register history record in background
                                                                                        addFormHistory({ title: 'PPE Issuance', date: issueDate, savedAt: Date.now(), meta: { metadata: { issueDate }, formData: data } })
                                                                                            .catch(e => console.warn('addFormHistory failed', e));
                                                                                    } catch (e) {
                                                                                        console.warn('submit failed', e);
                                                                                    }
                                                                                }}
                                                                                disabled={isSaving}
                                                                            >
                                                                                <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{isSaving ? 'Submitting...' : 'Submit Checklist'}</Text>
                                                                            </TouchableOpacity>
                                                                        </View>

                                    {/* --- FOOTER SIGNATURES --- */}
                                    <View style={styles.footerSignatures}>
                                        <Text style={styles.footerText}>HSEQ MANAGER..................................</Text>
                                        <Text style={styles.footerText}>COMPLEX MANAGER..................................</Text>
                                        <Text style={styles.footerText}>FINANCIAL CONTROLLER..................................</Text>
                                    </View>
                                                                <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
                                                                <LoadingOverlay visible={isSaving} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- STYLES ---
// Defined based on visual approximation of the image for optimal layout
const columnWidths = {
    no: 40,
    name: 180,
    jobTitle: 140,
    ppe: 60, // Width for each PPE column (with checkbox)
    sign: 120, // Width for Staff NRC, Staff Sign, Sup Sign
};

const totalWidth = columnWidths.no + columnWidths.name + columnWidths.jobTitle + 
                   (columnWidths.ppe * 9) + (columnWidths.sign * 3);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        minWidth: Math.max(width, totalWidth), 
    },
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
        width: totalWidth, // Total width of the table (padding is internal)
    },
    boldText: {
        fontWeight: 'bold',
    },

    // --- HEADER STYLES ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#000',
        padding: 5,
        marginBottom: 5,
    },
    logoAndTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 2,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#A00',
        marginRight: 10,
    },
    titleBlock: {
        borderLeftWidth: 1,
        borderLeftColor: '#000',
        paddingLeft: 10,
    },
    documentTitle: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    documentTitleSub: {
        fontSize: 10,
    },
    docDetails: {
        flex: 1.5,
        alignItems: 'flex-start',
        marginLeft: 10,
    },
    detailText: {
        fontSize: 10,
    },
    logoImage: {
        width: 60,
        height: 40,
        resizeMode: 'contain',
        marginBottom: 4,
    },
    logoImageLeft: {
        width: 36,
        height: 36,
        resizeMode: 'contain',
        marginRight: 8,
    },
    pageNumber: {
        position: 'absolute',
        top: 5,
        right: 15,
        fontSize: 10,
    },
    subjectText: {
        fontSize: 12,
        marginBottom: 5,
        paddingBottom: 2,
    },

    // --- INFO/VERSION STYLES ---
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 3,
    },
    infoCol: {
        width: '35%',
    },
    infoColSmall: {
        width: '15%',
    },
    dateRow: {
        marginBottom: 8,
    },
    infoText: {
        fontSize: 10,
    },

    // --- TABLE STYLES ---
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#eee',
        borderWidth: 1,
        borderColor: '#000',
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 10,
        paddingHorizontal: 3,
        paddingVertical: 5,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        minHeight: 45, // Increased height to accommodate multi-line headers
        textAlignVertical: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 35,
    },
    cell: {
        fontSize: 10,
        padding: 5,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        textAlignVertical: 'center',
    },

    // --- COLUMN WIDTHS (Matching Headers and Cells) ---
    noCol: { width: columnWidths.no },
    nameCol: { width: columnWidths.name, textAlign: 'left' },
    jobTitleCol: { width: columnWidths.jobTitle, textAlign: 'center' },
    ppeCol: { width: columnWidths.ppe },
    signCol: { width: columnWidths.sign, borderRightWidth: 1, borderRightColor: '#000' },
    supSignCol: { width: columnWidths.sign, borderRightWidth: 1, borderRightColor: '#000' }, 

    // --- CHECKBOX STYLES ---
    checkboxContainer: {
        width: columnWidths.ppe,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#4CAF50',
    },
    checkMark: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 14,
    },
    inputCell: {
        fontSize: 10,
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        textAlign: 'center',
        minHeight: 30,
    },

    // --- FOOTER STYLES ---
    footerSignatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    footerText: {
        fontSize: 10,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10,
    },
});

export default PPEIssuanceForm;

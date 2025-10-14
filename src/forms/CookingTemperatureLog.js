import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';

// MOCK UTILITIES for standalone environment
// In a real RN project, these would be imported from formDrafts and formHistory
const getDraft = async (key) => {
    // Mock draft loading
    return null;
};
const setDraft = async (key, data) => {
    console.log(`[DRAFT SAVED] ${key}:`, data);
};
const removeDraft = async (key) => {
    console.log(`[DRAFT CLEARED] ${key}`);
};
const addFormHistory = async (data) => {
    console.log(`[SUBMITTED]`, data);
    Alert.alert("Success", "Log successfully submitted and saved to history!");
};


const DRAFT_KEY = 'cooking_temperature_log_draft';
const MAX_ROWS = 15;

const emptyRow = {
    foodItem: '',
    // record 1
    time1: '', temp1: '', sign1: '',
    // record 2
    time2: '', temp2: '', sign2: '',
    // record 3
    time3: '', temp3: '', sign3: '',
    staffName: '',
};

const initialRows = Array.from({ length: MAX_ROWS }, () => ({ ...emptyRow }));

// Updated metadata to reflect the form's header details
const initialMeta = {
    subject: 'COOKING TEMPERATURE LOG',
    docNo: 'BBN-SHEQ-RIV-SUP-0.0.10a',
    issueDate: '', // Will be set on load
    revisionDate: 'N/A',
    compiledBy: 'Michael C. Zulu',
    approvedBy: 'Hassani Ali',
    versionNo: '01',
    revNo: '00',
    chefSignature: '',
    correctiveAction: '',
    complexManagerSignature: '',
};

export default function CookingTemperatureLog() {
    const [rows, setRows] = useState(initialRows);
    const [meta, setMeta] = useState(initialMeta);
    const [busy, setBusy] = useState(false);
    const saveTimer = useRef(null);

    // Helper to format date
    const getTodayDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    // Load Draft and Set Initial Date
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await getDraft(DRAFT_KEY);
                if (d && mounted) {
                    if (d.rows) setRows(d.rows);
                    if (d.meta) setMeta(d.meta);
                }
                // Always ensure issue date is current if not loaded from draft
                if (mounted && (!d || !d.meta.issueDate)) {
                    setMeta(prev => ({ ...prev, issueDate: getTodayDate() }));
                }
            } catch (e) { console.warn('load draft', e); }
        })();
        return () => { mounted = false; };
    }, []);

    // Autosave Draft
    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { rows, meta }), 700);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [rows, meta]);

    const setCell = useCallback((r, k, v) => setRows(prev => prev.map((row, i) => i === r ? { ...row, [k]: v } : row)), []);
    const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async () => {
        const logData = rows.filter(r => r.foodItem.trim() !== '');
        if (logData.length === 0) {
            Alert.alert("Cannot Submit", "Please enter at least one food item before submitting the log.");
            return;
        }

        setBusy(true);
        try {
            await addFormHistory({ 
                title: 'Cooking Temperature Log', 
                date: new Date().toLocaleDateString(), 
                savedAt: Date.now(), 
                meta: { ...meta, rows: logData } 
            });
            await removeDraft(DRAFT_KEY);
            // Reset form
            setRows(initialRows);
            setMeta(prev => ({ 
                ...initialMeta, 
                issueDate: getTodayDate(), 
                chefSignature: '', 
                correctiveAction: '', 
                complexManagerSignature: '' 
            }));
        } catch (e) { 
            console.warn('submit error', e); 
            Alert.alert("Error", "Failed to submit log. Please try again.");
        }
        setBusy(false);
    };

    const handleSaveDraft = async () => {
        setBusy(true);
        try { await setDraft(DRAFT_KEY, { rows, meta }); } catch (e) { console.warn('save draft error', e); }
        setBusy(false);
    };

    // Flex values for column widths (Total Flex: 14.1)
    const COL_FLEX = {
        INDEX: 0.6,
        FOOD_ITEM: 3.0,
        TIME_TEMP_SIGN: 1.0, // Each T/T/S column
        STAFF_NAME: 1.5,
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                
                {/* --- 1. Document Header (Metadata Block) --- */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaHeaderBox}>
                        <View style={styles.brandRow}>
                            <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                            <View style={styles.brandTextWrap}>
                                <Text style={styles.brandTitle}>BRAVO BRANDS LIMITED</Text>
                                <Text style={styles.brandSubtitle}>Food Safety Management System</Text>
                            </View>
                        </View>
                        <View style={styles.docInfoGrid}>
                            <Text style={styles.docInfoLabel}>Issue Date:</Text>
                            <Text style={styles.docInfoValue}>{meta.issueDate}</Text>
                        </View>
                    </View>
                    <View style={styles.metaBottomRow}>
                        <Text style={styles.metaBottomItem}><Text style={styles.metaBold}>SUBJECT:</Text> {meta.subject}</Text>
                        <Text style={styles.metaBottomItem}><Text style={styles.metaBold}>Compiled By:</Text> {meta.compiledBy}</Text>
                        <Text style={styles.metaBottomItem}><Text style={styles.metaBold}>Approved By:</Text> {meta.approvedBy}</Text>
                    </View>
                </View>

                {/* --- 2. Table Block --- */}
                <View style={styles.tableWrap}>
                    <Text style={styles.tableTitle}>COOKING TEMPERATURE LOG</Text>

                    {/* Header Row 1: Probe Thermometer / Date */}
                    <View style={styles.logHeaderRow1}>
                        <Text style={[styles.logHeaderRow1Text, { fontSize: 14 }]}>PROBE THERMOMETER TEMPERATURE LOG FOR COOKED FOOD</Text>
                        <Text style={[styles.logHeaderRow1Text, { fontSize: 14 }]}>DATE: {meta.issueDate}</Text>
                    </View>
                    
                    {/* Header Row 2: Group Labels (FOOD ITEM, 1ST RECORD, 2ND RECORD, 3RD RECORD) */}
                    <View style={[styles.tableHeaderRow, styles.groupHeader]}>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.INDEX }]} />
                        
                        {/* Food Item / Instruction Column */}
                        <View style={{ flex: COL_FLEX.FOOD_ITEM, borderRightWidth: 1, borderColor: '#333', justifyContent: 'center' }}>
                            <View style={styles.instructionBox}>
                                <Text style={[styles.hText, styles.instructionText]}>
                                    COOKING (≥ 75°C)
                                </Text>
                            </View>
                            <View style={{ paddingVertical: 4 }}>
                                <Text style={[styles.hText, { fontSize: 16 }]}>FOOD ITEM</Text>
                            </View>
                        </View>

                        {/* Record Group Spans */}
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>1ST RECORD</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>2ND RECORD</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>3RD RECORD</Text></View>
                        
                        <View style={[styles.hCell, { flex: COL_FLEX.STAFF_NAME }]}>
                            <Text style={styles.hText}>STAFF'S NAME</Text>
                        </View>
                    </View>

                    {/* Header Row 3: Detail Labels (#, TIME, TEMP, SIGN) */}
                    <View style={[styles.tableHeaderRow, styles.detailHeader]}>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.INDEX }]}><Text style={styles.hText}>#</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM }]} />
                        
                        {/* T/T/S columns */}
                        {[...Array(3)].map((_, i) => (
                            <React.Fragment key={i}>
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>TIME</Text></View>
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>TEMP</Text></View>
                                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
                            </React.Fragment>
                        ))}

                        <View style={[styles.hCell, { flex: COL_FLEX.STAFF_NAME }]} />
                    </View>

                    {/* Data Rows */}
                    {rows.map((row, ri) => (
                        <View key={ri} style={styles.row}>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.INDEX }]}><Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700' }}>{ri + 1}</Text></View>
                            
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM }]}>
                                <TextInput style={styles.input} value={row.foodItem} onChangeText={v => setCell(ri, 'foodItem', v)} placeholder="e.g., Chicken Fillet" />
                            </View>

                            {/* 1st Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.time1} onChangeText={v => setCell(ri, 'time1', v)} placeholder="HH:MM" /></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.temp1} onChangeText={v => setCell(ri, 'temp1', v)} placeholder="°C" keyboardType="numeric" /></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.sign1} onChangeText={v => setCell(ri, 'sign1', v)} placeholder="Sign" /></View>

                            {/* 2nd Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.time2} onChangeText={v => setCell(ri, 'time2', v)} placeholder="HH:MM" /></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.temp2} onChangeText={v => setCell(ri, 'temp2', v)} placeholder="°C" keyboardType="numeric" /></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.sign2} onChangeText={v => setCell(ri, 'sign2', v)} placeholder="Sign" /></View>

                            {/* 3rd Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.time3} onChangeText={v => setCell(ri, 'time3', v)} placeholder="HH:MM" /></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.temp3} onChangeText={v => setCell(ri, 'temp3', v)} placeholder="°C" keyboardType="numeric" /></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><TextInput style={styles.input} value={row.sign3} onChangeText={v => setCell(ri, 'sign3', v)} placeholder="Sign" /></View>

                            {/* Staff Name */}
                            <View style={[styles.cell, { flex: COL_FLEX.STAFF_NAME }]}>
                                <TextInput style={styles.input} value={row.staffName} onChangeText={v => setCell(ri, 'staffName', v)} placeholder="Name" />
                            </View>
                        </View>
                    ))}
                </View>

                {/* --- 3. Footer Section --- */}
                <View style={styles.footerSection}>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 16 }}>CHEF Signature:</Text>
                        <TextInput style={[styles.signatureInput, { fontSize: 14 }]} value={meta.chefSignature} onChangeText={v => setMetaField('chefSignature', v)} placeholder="" />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 16 }}>Corrective Action:</Text>
                        <TextInput style={[styles.textarea, { fontSize: 14 }]} value={meta.correctiveAction} onChangeText={v => setMetaField('correctiveAction', v)} placeholder="Document corrective action" multiline numberOfLines={4} />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 16 }}>COMPLEX Manager Signature:</Text>
                        <TextInput style={[styles.signatureInput, { fontSize: 14 }]} value={meta.complexManagerSignature} onChangeText={v => setMetaField('complexManagerSignature', v)} placeholder="" />
                    </View>

                    {/* Verified by line (visual label as in the template image) */}
                    <View style={{ paddingHorizontal: 4, marginTop: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700' }}>Verified by:</Text>
                        <Text style={{ marginTop: 8, fontSize: 14 }}>Complex Manager: ......................................................</Text>
                    </View>
                </View>

                {/* --- 4. Action Buttons --- */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}><Text style={[styles.btnText, { fontSize: 14 }]}>{busy ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={[styles.btnText, { fontSize: 14 }]}>{busy ? 'Submitting...' : 'Submit Log'}</Text></TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fbfc' },
    content: { padding: 12 },
    
    // --- Metadata Styles ---
    metaContainer: {
        borderWidth: 2,
        borderColor: '#333',
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    metaHeaderBox: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 4,
        borderBottomWidth: 1,
        borderColor: '#333'
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', width: '50%' },
    logoPlaceholder: { 
        width: 48, 
        height: 48, 
        borderRadius: 8, 
        marginRight: 8, 
        backgroundColor: '#fff', 
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    logoText: { fontSize: 24, fontWeight: '900', color: '#185a9d' },
    brandTextWrap: { flexDirection: 'column', flexShrink: 1 },
    brandTitle: { fontSize: 10, fontWeight: '700', color: '#333' },
    brandSubtitle: { fontSize: 8, color: '#444', fontWeight: '500' },
    logoImage: { width: 56, height: 56, marginRight: 8 },

    docInfoGrid: {
        width: '50%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 8,
    },
    docInfoLabel: { 
        width: '50%', 
        padding: 2, 
        fontWeight: '700', 
        borderRightWidth: 1, 
        borderBottomWidth: 1, 
        borderColor: '#333', 
        textAlign: 'left'
    },
    docInfoValue: { 
        width: '50%', 
        padding: 2, 
        fontWeight: '400', 
        borderBottomWidth: 1, 
        borderColor: '#333', 
        textAlign: 'left'
    },
    metaBottomRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderColor: '#333',
    },
    metaBottomItem: {
        flex: 1, 
        padding: 4, 
        fontSize: 8, 
        borderLeftWidth: 1, 
        borderColor: '#333'
    },
    metaBold: { fontWeight: '700', textTransform: 'uppercase' },

    // --- Table Styles ---
    tableWrap: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
    tableTitle: { 
        fontSize: 14, 
        fontWeight: '800', 
        textAlign: 'center', 
        paddingVertical: 6, 
        borderBottomWidth: 2, 
        borderColor: '#333', 
        textTransform: 'uppercase' 
    },
    logHeaderRow1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
        borderBottomWidth: 1,
        borderColor: '#333',
        backgroundColor: '#f9f9f9',
    },
    logHeaderRow1Text: {
        fontSize: 14,
        fontWeight: '700',
    },
    tableHeaderRow: { 
        flexDirection: 'row', 
        backgroundColor: '#f3f5f7', 
        paddingVertical: 0,
    },
    groupHeader: {
        borderBottomWidth: 1,
        borderColor: '#333',
    },
    detailHeader: {
        borderBottomWidth: 2,
        borderColor: '#333',
    },
    instructionBox: {
        padding: 4, 
        borderBottomWidth: 1, 
        borderBottomColor: '#333', 
        backgroundColor: '#e8e8e8',
        alignItems: 'center'
    },
    instructionText: {
        textAlign: 'left', 
        fontWeight: 'bold', 
        fontSize: 9, 
        textTransform: 'none'
    },
    hCell: { 
        paddingVertical: 4, 
        paddingHorizontal: 2, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    hText: { 
        fontWeight: '800', 
        fontSize: 8, // Smaller font for detail header
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    borderRight: { borderRightWidth: 1, borderRightColor: '#333' },

    // --- Data Row Styles ---
    row: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderColor: '#ddd', 
        minHeight: 38 
    },
    cell: { 
        padding: 1, // Reduced padding
        justifyContent: 'center', 
    },
    input: { 
        padding: 2, 
        fontSize: 10, // Smaller font for input
        textAlign: 'center', 
        minHeight: 36,
        color: '#444',
    },
    
    // --- Footer Styles ---
    footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
    signatureInput: { borderBottomWidth: 1, borderColor: '#333', padding: 6, minHeight: 36, fontSize: 12 },
    textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, textAlignVertical: 'top', fontSize: 12 },
    buttonRow: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        paddingVertical: 12, 
        paddingHorizontal: 4, 
        gap: 8 
    },
    btn: { 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 8, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 3.84 
    },
    btnText: { color: '#fff', fontWeight: '700' },
});

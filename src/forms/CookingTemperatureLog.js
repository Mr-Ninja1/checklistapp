import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';

// Defensive text renderer: always returns a <Text> with a string value.
// Use this for any dynamic values that may be undefined/null/objects to
// avoid the RN runtime error about Text string children.
const SafeText = ({ value, style, ...rest }) => {
    const text = value === undefined || value === null ? '' : (typeof value === 'string' ? value : String(value));
    return <Text style={style} {...rest}>{text}</Text>;
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
    const [logoDataUri, setLogoDataUri] = useState(null);
    const saveTimer = useRef(null);
    const [editMode, setEditMode] = useState(false);

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
        // embed logo as base64 for deterministic saved payload rendering
        (async () => {
            try {
                const asset = Asset.fromModule(require('../assets/logo.jpeg'));
                if (!asset.localUri) await asset.downloadAsync();
                const uri = asset.localUri || asset.uri;
                const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
            } catch (e) { /* ignore */ }
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
        // Save all rows (including empty) so presentational matches exact editable form
        const logData = rows.map((r, i) => ({ index: i + 1, ...r }));

        setBusy(true);
        try {
            const payload = {
                formType: 'CookingTemperatureLog',
                templateVersion: 'v1.0',
                title: 'Cooking Temperature Log',
                date: meta.issueDate || new Date().toLocaleDateString(),
                metadata: meta,
                formData: logData,
                layoutHints: { COL_FLEX },
                _tableWidth: 1000,
                assets: logoDataUri ? { logoDataUri } : {},
                savedAt: Date.now(),
            };

            await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, payload });
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
            Alert.alert('Saved', 'Form saved');
        } catch (e) {
            console.warn('submit error', e);
            Alert.alert('Error', 'Failed to submit log. Please try again.');
        }
        setBusy(false);
    };

    const handleSaveDraft = async () => {
        if (!editMode) return;
        setBusy(true);
        try { await setDraft(DRAFT_KEY, { rows, meta }); } catch (e) { console.warn('save draft error', e); }
        setBusy(false);
    };

    // Action buttons rendered outside the pointer-events-blocking children wrapper
    // so they remain tappable even when editMode is off.
    const actionButtons = (
        <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}>
                <Text style={[styles.btnText, { fontSize: 14 }]}>{busy ? 'Saving...' : 'Save Draft'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}>
                <Text style={[styles.btnText, { fontSize: 14 }]}>{busy ? 'Submitting...' : 'Submit Log'}</Text>
            </TouchableOpacity>
        </View>
    );

    // Flex values for column widths (Total Flex: 14.1)
    const COL_FLEX = {
        INDEX: 0.6,
        FOOD_ITEM: 3.0,
        TIME_TEMP_SIGN: 1.0, // Each T/T/S column
        STAFF_NAME: 1.5,
    };

    return (
        <View style={styles.container}>
            <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 180 }] } keyboardShouldPersistTaps="handled">
                
                {/* --- 1. Document Header (Metadata Block) --- */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaHeaderBox}>
                        <View style={styles.brandRow}>
                            <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
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
                        <View style={styles.metaBottomItem}>
                            <Text style={styles.metaBold}>SUBJECT:</Text>
                            <SafeText style={{ marginTop: 4 }} value={meta.subject} />
                        </View>
                        <View style={styles.metaBottomItem}>
                            <Text style={styles.metaBold}>Compiled By:</Text>
                            <SafeText style={{ marginTop: 4 }} value={meta.compiledBy} />
                        </View>
                        <View style={styles.metaBottomItem}>
                            <Text style={styles.metaBold}>Approved By:</Text>
                            <SafeText style={{ marginTop: 4 }} value={meta.approvedBy} />
                        </View>
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
                                {editMode ? (
                                    <TextInput style={styles.input} value={row.foodItem} onChangeText={v => setCell(ri, 'foodItem', v)} placeholder="e.g., Chicken Fillet" />
                                ) : (
                                    <SafeText style={styles.readOnlyCell} value={row.foodItem} />
                                )}
                            </View>

                            {/* 1st Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time1} onChangeText={v => setCell(ri, 'time1', v)} placeholder="HH:MM" /> : <SafeText style={styles.readOnlyCell} value={row.time1} />}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp1} onChangeText={v => setCell(ri, 'temp1', v)} placeholder="°C" keyboardType="numeric" /> : <SafeText style={styles.readOnlyCell} value={row.temp1} />}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.sign1} onChangeText={v => setCell(ri, 'sign1', v)} placeholder="Sign" /> : <SafeText style={styles.readOnlyCell} value={row.sign1} />}</View>

                            {/* 2nd Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time2} onChangeText={v => setCell(ri, 'time2', v)} placeholder="HH:MM" /> : <SafeText style={styles.readOnlyCell} value={row.time2} />}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp2} onChangeText={v => setCell(ri, 'temp2', v)} placeholder="°C" keyboardType="numeric" /> : <SafeText style={styles.readOnlyCell} value={row.temp2} />}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.sign2} onChangeText={v => setCell(ri, 'sign2', v)} placeholder="Sign" /> : <SafeText style={styles.readOnlyCell} value={row.sign2} />}</View>

                            {/* 3rd Record */}
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time3} onChangeText={v => setCell(ri, 'time3', v)} placeholder="HH:MM" /> : <SafeText style={styles.readOnlyCell} value={row.time3} />}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp3} onChangeText={v => setCell(ri, 'temp3', v)} placeholder="°C" keyboardType="numeric" /> : <SafeText style={styles.readOnlyCell} value={row.temp3} />}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.sign3} onChangeText={v => setCell(ri, 'sign3', v)} placeholder="Sign" /> : <SafeText style={styles.readOnlyCell} value={row.sign3} />}</View>

                            {/* Staff Name */}
                            <View style={[styles.cell, { flex: COL_FLEX.STAFF_NAME }]}>
                                {editMode ? (
                                    <TextInput style={styles.input} value={row.staffName} onChangeText={v => setCell(ri, 'staffName', v)} placeholder="Name" />
                                ) : (
                                    <SafeText style={styles.readOnlyCell} value={row.staffName} />
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* --- 3. Footer Section --- */}
                <View style={styles.footerSection}>
                    <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 16 }}>CHEF Signature:</Text>
                            {editMode ? (
                                <SignatureField value={meta.chefSignature} onChange={v => setMetaField('chefSignature', v)} editable={editMode} width={220} height={80} />
                            ) : (
                                meta.chefSignature ? (
                                    <Image source={{ uri: String(meta.chefSignature).startsWith('data:') ? meta.chefSignature : `data:image/png;base64,${meta.chefSignature}` }} style={{ width: 220, height: 80, resizeMode: 'contain', marginTop: 6 }} />
                                ) : (
                                    <Text style={[styles.signatureInput, { fontSize: 14 }]}>{meta.chefSignature}</Text>
                                )
                            )}
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 16 }}>Corrective Action:</Text>
                        <TextInput style={[styles.textarea, { fontSize: 14 }]} value={meta.correctiveAction} onChangeText={v => setMetaField('correctiveAction', v)} placeholder="Document corrective action" multiline numberOfLines={4} />
                    </View>

                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 16 }}>COMPLEX Manager Signature:</Text>
                        {editMode ? (
                            <SignatureField value={meta.complexManagerSignature} onChange={v => setMetaField('complexManagerSignature', v)} editable={editMode} width={220} height={80} />
                        ) : (
                            meta.complexManagerSignature ? (
                                <Image source={{ uri: String(meta.complexManagerSignature).startsWith('data:') ? meta.complexManagerSignature : `data:image/png;base64,${meta.complexManagerSignature}` }} style={{ width: 220, height: 80, resizeMode: 'contain', marginTop: 6 }} />
                            ) : (
                                <Text style={[styles.signatureInput, { fontSize: 14 }]}>{meta.complexManagerSignature}</Text>
                            )
                        )}
                    </View>

                    {/* Verified by line (visual label as in the template image) */}
                    <View style={{ paddingHorizontal: 4, marginTop: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700' }}>Verified by:</Text>
                        <Text style={{ marginTop: 8, fontSize: 14 }}>Complex Manager: ......................................................</Text>
                    </View>
                </View>

                {/* buttons moved into EditableFormContainer via actionButtons prop */}

            </ScrollView>
            </EditableFormContainer>
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const DRAFT_KEY = 'thawing_temperature_log_draft';
const MAX_ROWS = 20;

const emptyRow = {
    foodItem: '',
    time1: '', temp1: '', sign1: '',
    time2: '', temp2: '', sign2: '',
    time3: '', temp3: '', sign3: '',
    staffName: '',
};

const initialRows = Array.from({ length: MAX_ROWS }, () => ({ ...emptyRow }));

const initialMeta = {
    subject: 'TEMPERATURE RECORD FOR THAWED FOOD',
    issueDate: '',
    compiledBy: 'Michael C. Zulu',
    approvedBy: 'Hassani Ali',
    chefSignature: '',
    complexManagerSignature: '',
    hseqManagerSignature: '',
};

export default function ThawingTemperatureLog() {
    const [rows, setRows] = useState(initialRows);
    const [meta, setMeta] = useState(initialMeta);
    const [logoDataUri, setLogoDataUri] = useState(null);
    const [busy, setBusy] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const saveTimer = useRef(null);

    const getTodayDate = () => {
        const t = new Date();
        const dd = String(t.getDate()).padStart(2,'0');
        const mm = String(t.getMonth()+1).padStart(2,'0');
        const yyyy = t.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await getDraft(DRAFT_KEY);
                if (d && mounted) {
                    if (d.rows) setRows(d.rows);
                    if (d.meta) setMeta(d.meta);
                }
                if (mounted && (!d || !d.meta.issueDate)) {
                    setMeta(prev => ({ ...prev, issueDate: getTodayDate() }));
                }
            } catch (e) { console.warn('load draft', e); }
        })();
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

    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { rows, meta }), 700);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [rows, meta]);

    const setCell = useCallback((r,k,v) => setRows(prev => prev.map((row,i) => i===r?{...row,[k]:v}:row)), []);
    const setMetaField = (k,v) => setMeta(prev => ({ ...prev, [k]: v }));

    const resolvePreviewUri = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            const s = val.trim();
            if (!s) return null;
            if (s.startsWith('data:')) return s;
            if (s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
            const compact = s.replace(/\s+/g, '');
            const base64ish = /^[A-Za-z0-9+/=]+$/;
            if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
            return null;
        }
        if (typeof val === 'object') {
            if (val.uri) return val.uri;
            if (val.data) {
                const d = String(val.data).trim();
                if (!d) return null;
                return d.startsWith('data:') ? d : `data:image/png;base64,${d}`;
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        const logData = rows.map((r, i) => ({ index: i + 1, ...r }));
        setBusy(true);
        try {
            const normalizedMeta = { companyName: 'BRAVO BRANDS LIMITED', ...meta };
            const TABLE_WIDTH = 900;
            const flexMap = COL_FLEX || {};
            const flexTotal = Object.values(flexMap).reduce((s,v)=>s+(Number(v)||0),0) || 1;
            const widthFor = k => Math.round((TABLE_WIDTH * (Number(flexMap[k]) || 0)) / flexTotal);
            const WIDTHS = {
                INDEX: widthFor('INDEX'),
                FOOD_ITEM: widthFor('FOOD_ITEM'),
                TIME: widthFor('TIME_TEMP_SIGN'),
                TEMP: widthFor('TIME_TEMP_SIGN'),
                SIGN: widthFor('TIME_TEMP_SIGN'),
                STAFF_NAME: widthFor('STAFF_NAME'),
            };

            const payload = {
                formType: 'ThawingTemperatureLog',
                templateVersion: 'v1.0',
                title: 'Thawing Temperature Log',
                date: normalizedMeta.issueDate || getTodayDate(),
                metadata: normalizedMeta,
                formData: logData,
                layoutHints: { COL_FLEX: flexMap, WIDTHS },
                _tableWidth: TABLE_WIDTH,
                assets: logoDataUri ? { logoDataUri } : {},
                savedAt: Date.now(),
            };

            await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, payload });
            
            // KEY CHANGE: removeDraft(DRAFT_KEY) is removed so the draft persists in storage.
            // Also, state resets (setRows/setMeta) are removed to keep UI populated.

            Alert.alert('Success', 'Form submitted. Your data and draft have been preserved.');
        } catch (e) { 
            console.warn('submit error', e); 
            Alert.alert('Error','Failed to submit log.'); 
        }
        setBusy(false);
    };

    const handleSaveDraft = async () => { 
        setBusy(true); 
        try { await setDraft(DRAFT_KEY, { rows, meta }); } 
        catch (e) { console.warn('save draft', e); } 
        setBusy(false); 
    };

    const handleClearDraft = async () => {
        const ok = await new Promise(resolve => {
            Alert.alert('Clear draft', 'This action will clear the draft and all your progress. Are you sure you want to continue?', [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Yes, Clear', style: 'destructive', onPress: () => resolve(true) },
            ]);
        });
        if (!ok) return;
        try { if (saveTimer.current) clearTimeout(saveTimer.current); } catch (e) {}
        try { await removeDraft(DRAFT_KEY); } catch (e) { console.warn('removeDraft failed', e); }
        setRows(initialRows);
        setMeta(initialMeta);
        setLogoDataUri(null);
        setEditMode(false);
    };

    const actionButtons = (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#f6c342' }]}
                onPress={() => { if (busy) return; handleSaveDraft(); }}
                disabled={busy}
            >
                <Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#3b82f6' }]}
                onPress={() => { if (busy) return; handleSubmit(); }}
                disabled={busy}
            >
                <Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Log'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#e53e3e' }]} onPress={() => { if (busy) return; handleClearDraft(); }} disabled={busy}>
                <Text style={styles.btnText}>Clear Draft</Text>
            </TouchableOpacity>
        </View>
    );

    const COL_FLEX = { INDEX: 0.45, FOOD_ITEM: 1.5, TIME_TEMP_SIGN: 1.0, STAFF_NAME: 2.5 };

    return (
        <View style={styles.container}>
            <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 220 }]} keyboardShouldPersistTaps="handled"> 
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
                            {editMode ? (
                                <TextInput
                                    style={styles.docInfoValue}
                                    value={meta.issueDate}
                                    onChangeText={v => setMetaField('issueDate', v)}
                                    placeholder="dd/mm/yyyy"
                                />
                            ) : (
                                <Text style={styles.docInfoValue}>{meta.issueDate}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.metaBottomRow}>
                        <Text style={styles.metaBottomItem}><Text style={styles.metaBold}>SUBJECT:</Text> {meta.subject}</Text>
                        <Text style={styles.metaBottomItem}><Text style={styles.metaBold}>Compiled By:</Text> {meta.compiledBy}</Text>
                        <Text style={styles.metaBottomItem}><Text style={styles.metaBold}>Approved By:</Text> {meta.approvedBy}</Text>
                    </View>
                </View>

                <View style={styles.tableWrap}>
                    <Text style={styles.tableTitle}>THAWING TEMPERATURE LOG</Text>
                    <View style={styles.logHeaderRow1}>
                        <Text style={styles.logHeaderRow1Text}>PROBE THERMOMETER TEMPERATURE LOG FOR THAWED FOOD</Text>
                        <Text style={styles.logHeaderRow1Text}>DATE: {meta.issueDate}</Text>
                    </View>

                    <View style={[styles.tableHeaderRow, styles.groupHeader]}>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.INDEX }]} />
                        <View style={{ flex: COL_FLEX.FOOD_ITEM, borderRightWidth: 1, borderColor: '#333', justifyContent: 'center' }}>
                            <View style={styles.instructionBox}><Text style={[styles.hText, styles.instructionText]}>THAWING (rapidly to 4°C & below)</Text></View>
                            <View style={{ paddingVertical: 4 }}><Text style={[styles.hText, { fontSize: 12 }]}>FOOD ITEM</Text></View>
                        </View>

                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>1ST RECORD</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>2ND RECORD</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN * 3 }]}><Text style={styles.hText}>3RD RECORD</Text></View>

                        <View style={[styles.hCell, { flex: COL_FLEX.STAFF_NAME }]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
                    </View>

                    <View style={[styles.tableHeaderRow, styles.detailHeader]}>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.INDEX }]}><Text style={styles.hText}>#</Text></View>
                        <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM }]} />
                        {[...Array(3)].map((_,i)=>(<React.Fragment key={i}><View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>TIME</Text></View><View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>TEMP</Text></View><View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}><Text style={styles.hText}>SIGN</Text></View></React.Fragment>))}
                        <View style={[styles.hCell, { flex: COL_FLEX.STAFF_NAME }]} />
                    </View>

                    {rows.map((row, ri)=> (
                        <View key={ri} style={styles.row}>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.INDEX }]}><Text style={{ textAlign: 'center', fontSize: 12 }}>{ri+1}</Text></View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.FOOD_ITEM }]}>
                                {editMode ? <TextInput style={styles.input} value={row.foodItem} onChangeText={v=>setCell(ri,'foodItem',v)} placeholder="e.g., Minced Beef" /> : <Text style={styles.readOnlyCell}>{row.foodItem}</Text>}
                            </View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time1} onChangeText={v=>setCell(ri,'time1',v)} placeholder="HH:MM" /> : <Text style={styles.readOnlyCell}>{row.time1}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp1} onChangeText={v=>setCell(ri,'temp1',v)} placeholder="°C" keyboardType="default" /> : <Text style={styles.readOnlyCell}>{row.temp1}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>
                                {editMode ? (
                                    <SignatureField value={row.sign1} onChange={v=>setCell(ri,'sign1',v)} editable={editMode} width={120} height={56} placeholder="Tap to sign" />
                                ) : (
                                    (() => {
                                        const uri = resolvePreviewUri(row.sign1);
                                        return uri ? <Image source={{ uri }} style={{ width: 120, height: 56, resizeMode: 'contain' }} /> : <Text style={styles.readOnlyCell}>{typeof row.sign1 === 'string' ? row.sign1 : ''}</Text>;
                                    })()
                                )}
                            </View>

                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time2} onChangeText={v=>setCell(ri,'time2',v)} placeholder="HH:MM" /> : <Text style={styles.readOnlyCell}>{row.time2}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp2} onChangeText={v=>setCell(ri,'temp2',v)} placeholder="°C" keyboardType="default" /> : <Text style={styles.readOnlyCell}>{row.temp2}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>
                                {editMode ? (
                                    <SignatureField value={row.sign2} onChange={v=>setCell(ri,'sign2',v)} editable={editMode} width={120} height={56} placeholder="Tap to sign" />
                                ) : (
                                    (() => {
                                        const uri = resolvePreviewUri(row.sign2);
                                        return uri ? <Image source={{ uri }} style={{ width: 120, height: 56, resizeMode: 'contain' }} /> : <Text style={styles.readOnlyCell}>{typeof row.sign2 === 'string' ? row.sign2 : ''}</Text>;
                                    })()
                                )}
                            </View>

                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.time3} onChangeText={v=>setCell(ri,'time3',v)} placeholder="HH:MM" /> : <Text style={styles.readOnlyCell}>{row.time3}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>{editMode ? <TextInput style={styles.input} value={row.temp3} onChangeText={v=>setCell(ri,'temp3',v)} placeholder="°C" keyboardType="default" /> : <Text style={styles.readOnlyCell}>{row.temp3}</Text>}</View>
                            <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TIME_TEMP_SIGN }]}>
                                {editMode ? (
                                    <SignatureField value={row.sign3} onChange={v=>setCell(ri,'sign3',v)} editable={editMode} width={120} height={56} placeholder="Tap to sign" />
                                ) : (
                                    (() => {
                                        const uri = resolvePreviewUri(row.sign3);
                                        return uri ? <Image source={{ uri }} style={{ width: 120, height: 56, resizeMode: 'contain' }} /> : <Text style={styles.readOnlyCell}>{typeof row.sign3 === 'string' ? row.sign3 : ''}</Text>;
                                    })()
                                )}
                            </View>

                            <View style={[styles.cell, { flex: COL_FLEX.STAFF_NAME }]}>{editMode ? <TextInput style={styles.input} value={row.staffName} onChangeText={v=>setCell(ri,'staffName',v)} placeholder="Name" /> : <Text style={styles.readOnlyCell}>{row.staffName}</Text>}</View>
                        </View>
                    ))}
                </View>

                <View style={styles.footerSection}>
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
                            {editMode ? (
                                <SignatureField value={meta.chefSignature} onChange={v => setMetaField('chefSignature', v)} editable={editMode} width={220} height={80} />
                            ) : (
                                (() => {
                                    const val = meta.chefSignature || meta.chefSign;
                                    const uri = resolvePreviewUri(val);
                                    return uri ? <Image source={{ uri }} style={{ width: 220, height: 80, resizeMode: 'contain', marginTop: 6 }} /> : <Text style={[styles.signatureInput, { fontSize: 12 }]}>{meta.chefSignature}</Text>;
                                })()
                            )}
                        </View>

                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
                            <TextInput style={styles.textarea} value={meta.correctiveAction} onChangeText={v => setMetaField('correctiveAction', v)} placeholder="Document corrective action" multiline numberOfLines={4} />
                        </View>

                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Verified by:</Text>
                            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12, marginLeft: 16 }}>Complex Manager Signature:</Text>
                            {editMode ? (
                                    <SignatureField value={meta.complexManagerSignature} onChange={v => setMetaField('complexManagerSignature', v)} editable={editMode} width={220} height={80} />
                                ) : (
                                    (() => {
                                        const uri = resolvePreviewUri(meta.complexManagerSignature);
                                        return uri ? <Image source={{ uri }} style={{ width: 220, height: 80, resizeMode: 'contain', marginTop: 6 }} /> : <Text style={[styles.signatureInput, { fontSize: 12 }]}>{meta.complexManagerSignature}</Text>;
                                    })()
                                )}

                            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12, marginLeft: 16, marginTop: 8 }}>HSEQ Manager Signature:</Text>
                            {editMode ? (
                                <SignatureField value={meta.hseqManagerSignature} onChange={v => setMetaField('hseqManagerSignature', v)} editable={editMode} width={220} height={80} placeholder="Tap to sign - HSEQ Manager" />
                            ) : (
                                (() => {
                                    const uri = resolvePreviewUri(meta.hseqManagerSignature || meta.hseqManagerSign || meta.hseqSign);
                                    return uri ? <Image source={{ uri }} style={{ width: 220, height: 80, resizeMode: 'contain', marginTop: 6 }} /> : <Text style={[styles.signatureInput, { fontSize: 12 }]}>{meta.hseqManagerSignature}</Text>;
                                })()
                            )}
                        </View>
                </View>

                <View style={{ height: 110 }} />

            </ScrollView>
            </EditableFormContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fbfc' },
    content: { padding: 12 },
    metaContainer: { borderWidth: 2, borderColor: '#333', marginBottom: 12, backgroundColor: '#fff' },
    metaHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderColor: '#333' },
    brandRow: { flexDirection: 'row', alignItems: 'center', width: '50%' },
    logoImage: { width: 56, height: 56, marginRight: 8 },
    brandTextWrap: { flexDirection: 'column', flexShrink: 1 },
    brandTitle: { fontSize: 12, fontWeight: '700', color: '#333' },
    brandSubtitle: { fontSize: 10, color: '#444', fontWeight: '500' },
    docInfoGrid: { width: '50%', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#333', fontSize: 10 },
    docInfoLabel: { width: '50%', padding: 4, fontWeight: '700', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#333', textAlign: 'left' },
    docInfoValue: { width: '50%', padding: 4, fontWeight: '400', borderBottomWidth: 1, borderColor: '#333', textAlign: 'left' },
    metaBottomRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' },
    metaBottomItem: { flex: 1, padding: 6, fontSize: 10, borderLeftWidth: 1, borderColor: '#333' },
    metaBold: { fontWeight: '700', textTransform: 'uppercase' },
    tableWrap: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
    tableTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', paddingVertical: 8, borderBottomWidth: 2, borderColor: '#333', textTransform: 'uppercase' },
    logHeaderRow1: { flexDirection: 'row', justifyContent: 'space-between', padding: 6, borderBottomWidth: 1, borderColor: '#333', backgroundColor: '#f9f9f9' },
    logHeaderRow1Text: { fontSize: 12, fontWeight: '700' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f5f7', paddingVertical: 0 },
    groupHeader: { borderBottomWidth: 1, borderColor: '#333' },
    detailHeader: { borderBottomWidth: 2, borderColor: '#333' },
    instructionBox: { padding: 4, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: '#e8e8e8', alignItems: 'center' },
    instructionText: { textAlign: 'left', fontWeight: 'bold', fontSize: 12, textTransform: 'none' },
    hCell: { paddingVertical: 6, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
    hText: { fontWeight: '800', fontSize: 12, textAlign: 'center', textTransform: 'uppercase' },
    borderRight: { borderRightWidth: 1, borderRightColor: '#333' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', minHeight: 44 },
    cell: { padding: 4, justifyContent: 'center' },
    input: { padding: 6, fontSize: 14, textAlign: 'center', minHeight: 40, color: '#444' },
    readOnlyCell: { padding: 6, fontSize: 14, textAlign: 'center', minHeight: 40, color: '#222' },
    footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
    signatureInput: { borderBottomWidth: 1, borderColor: '#333', padding: 8, minHeight: 40, fontSize: 14 },
    textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, textAlignVertical: 'top', fontSize: 14 },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, paddingHorizontal: 4, gap: 8 },
    btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8, elevation: 3 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
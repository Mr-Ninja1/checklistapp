import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import EditableFormContainer from '../components/EditableFormContainer';
import { addFormHistory } from '../utils/formHistory';

const { width, height: windowHeight } = Dimensions.get('window');

// --- Dummy Data Structure for the Weekly Health Log ---
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Layout constants (used by styles and payload builder)
const nameColWidth = 140;
const positionColWidth = 100;
// Increase daily column width and split to fit/comment
const dailyColWidth = 140; // total width per day column
const fitWidth = 40; // fixed width for Fit for work checkbox column
const commentWidth = dailyColWidth - fitWidth; // manager comment column width
const tableWidthConst = nameColWidth + positionColWidth + (daysOfWeek.length * dailyColWidth);

// --- Helper Component for a Checkbox Toggle (Tick/Cross) ---
const FitCheckToggle = ({ isChecked, onToggle }) => (
    <TouchableOpacity onPress={onToggle} style={dailyStyles.fitCheckContainer}>
        <View style={dailyStyles.fitCheckBox}>
            {isChecked === true && <Text style={dailyStyles.checkMark}>✓</Text>}
            {isChecked === false && <Text style={dailyStyles.crossMark}>X</Text>}
        </View>
    </TouchableOpacity>
);

const createInitialWeeklyData = (count) => Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `Staff Name ${i + 1}`,
    position: i % 2 === 0 ? 'Chef' : 'Hygiene Attendant',
    weeklyChecks: daysOfWeek.reduce((acc, day) => ({
        ...acc,
        [day]: { fit: null, comment: '' }
    }), {}),
}));

// --- Main Form Component (BRAVO BRANDS HEALTH STATUS CHECK) ---
const HealthStatusCheck = () => {
    const [weeklyData, setWeeklyData] = useState(createInitialWeeklyData(10));
    const [localSaving, setLocalSaving] = useState(false);
    const [forceHideOverlay, setForceHideOverlay] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [site, setSite] = useState('');
    const [week, setWeek] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [supervisorName, setSupervisorName] = useState('');
    const [complexManagerSign, setComplexManagerSign] = useState('');
    const [hseqManagerSign, setHseqManagerSign] = useState('');
    const [logoDataUri, setLogoDataUri] = useState(null);

    // preload logo as base64 for saved payloads (best-effort)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const asset = Asset.fromModule(require('../assets/logo.jpeg'));
                await asset.downloadAsync();
                if (asset.localUri) {
                    const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
                    if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
                }
            } catch (e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []);

    const issueDate = useMemo(() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }, []);

    // integrate update with autosave scheduling
    let scheduleAutoSave = () => {};
    const updateDailyStatus = (id, day, field, value) => {
        setWeeklyData(prevData => {
            const newData = prevData.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        weeklyChecks: {
                            ...item.weeklyChecks,
                            [day]: {
                                ...item.weeklyChecks[day],
                                [field]: value,
                            }
                        }
                    };
                }
                return item;
            });
            try { scheduleAutoSave(); } catch (e) {}
            return newData;
        });
    };

    // Toggle logic: null -> true -> false -> null
    const toggleFitStatus = (id, day) => {
        setWeeklyData(prevData => {
            const newData = prevData.map(item => {
                if (item.id === id) {
                    let currentFit = item.weeklyChecks[day].fit;
                    let newFit;
                    if (currentFit === null) newFit = true;
                    else if (currentFit === true) newFit = false;
                    else newFit = null;
                    return {
                        ...item,
                        weeklyChecks: {
                            ...item.weeklyChecks,
                            [day]: {
                                ...item.weeklyChecks[day],
                                fit: newFit,
                            }
                        }
                    };
                }
                return item;
            });
            try { scheduleAutoSave(); } catch (e) {}
            return newData;
        });
    };

    const renderDailyCells = (item, day) => (
        <React.Fragment key={day}>
            <View style={{ width: fitWidth }}>
                <FitCheckToggle
                    isChecked={item.weeklyChecks[day].fit}
                    onToggle={editMode ? () => toggleFitStatus(item.id, day) : undefined}
                />
            </View>
            <View style={{ width: commentWidth }}>
                <TextInput
                    style={dailyStyles.commentInput}
                    value={item.weeklyChecks[day].comment}
                    onChangeText={(t) => updateDailyStatus(item.id, day, 'comment', t)}
                    editable={editMode}
                />
            </View>
        </React.Fragment>
    );

    const renderWeeklyLogItem = ({ item }) => (
        <View style={dailyStyles.tableRow} key={item.id}>
            <Text style={[dailyStyles.dataCell, dailyStyles.nameCol]}>{item.name}</Text>
            <Text style={[dailyStyles.dataCell, dailyStyles.positionCol]}>{item.position}</Text>
            {daysOfWeek.map(day => renderDailyCells(item, day))}
        </View>
    );

    // build payload for saving
    const buildPayload = (status = 'draft') => {
        // column widths chosen to match editor layout (use constants above)
        const nameW = 140;
        const positionW = 100;
        const tableWidth = nameW + positionW + (daysOfWeek.length * dailyColWidth);
        const layoutHints = { name: nameW, position: positionW, dayCol: dailyColWidth, fitWidth, commentWidth };

        return {
            formType: 'BravoHealthStatusCheck',
            templateVersion: '01',
            title: 'BRAVO BRANDS HEALTH STATUS CHECK',
            date: issueDate,
            metadata: { docRef: 'BBN-SHEQ-P-R-72', issueDate, site, week, month, year, supervisorName, complexManagerSign, hseqManagerSign },
            formData: weeklyData,
            layoutHints,
            _tableWidth: tableWidth,
            assets: logoDataUri ? { logoDataUri } : {},
            savedAt: Date.now(),
            status,
        };
    };

    const { handleSaveDraft, handleSubmit, isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave: scheduleAutoSaveFromHook } = useFormSave({ buildPayload, draftId: 'HealthStatusCheck_draft', clearOnSubmit: () => {
        setWeeklyData(createInitialWeeklyData(10)); setSite(''); setWeek(''); setMonth(''); setYear(''); setSupervisorName(''); setComplexManagerSign(''); setHseqManagerSign('');
    }, waitForSave: false });

    // Clear local UI saving flags when the background save completes
    useEffect(() => {
        if (!isSaving) {
            // background save finished
            setLocalSaving(false);
            if (forceHideOverlay) setForceHideOverlay(false);
        }
    }, [isSaving]);

    // wire scheduleAutoSave to local variable used above
    scheduleAutoSave = scheduleAutoSaveFromHook;

    return (
        <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft}>
            <View style={styles.scrollViewContent}>
                <View style={styles.container}>
                    <View style={styles.docHeader}>
                        <View style={styles.logoAndTitle}>
                            <Image source={require('../assets/logo.jpeg')} style={styles.logoImageLeft} />
                        </View>
                        <View style={{ flex: 1, paddingLeft: 8 }}>
                            <Text style={styles.documentTitle}>BRAVO BRANDS HEALTH STATUS CHECK</Text>
                            <Text style={styles.documentTitleSub}>Food Safety Management System</Text>
                        </View>
                    </View>
                    <View style={styles.docDetails}>
                            <Text style={styles.detailText}>Doc Ref: BBN-SHEQ-P-R-72</Text>
                            <Text style={styles.detailText}>Issue Date: {issueDate}</Text>
                        </View>
                    <Text style={styles.subjectText}>
                        <Text style={styles.boldText}>BRAVO BRANDS HEALTH STATUS CHECK</Text>
                    </Text>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>SECTION</Text>
                        <View style={styles.detailRow}>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>SITE</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Site" value={site} onChangeText={t => { setSite(t); try { scheduleAutoSave(); } catch (e) {} }} editable={editMode} />
                            </View>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>WEEK</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Week" value={week} onChangeText={t => { setWeek(t); try { scheduleAutoSave(); } catch (e) {} }} />
                            </View>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>MONTH</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Month" value={month} onChangeText={t => { setMonth(t); try { scheduleAutoSave(); } catch (e) {} }} />
                            </View>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>YEAR</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Year" value={year} onChangeText={t => { setYear(t); try { scheduleAutoSave(); } catch (e) {} }} />
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <View style={[styles.detailBox, styles.wideBox]}>
                                <Text style={styles.detailLabel}>Supervisor Name & Sign</Text>
                                <TextInput style={styles.detailInput} placeholder="Name & Sign" value={supervisorName} onChangeText={t => { setSupervisorName(t); try { scheduleAutoSave(); } catch (e) {} }} editable={editMode} />
                            </View>
                            <View style={[styles.detailBox, styles.wideBox]}>
                                <Text style={styles.detailLabel}>Complex Manager Name &</Text>
                                <TextInput style={styles.detailInput} placeholder="Name & Sign" value={complexManagerSign} onChangeText={t => { setComplexManagerSign(t); try { scheduleAutoSave(); } catch (e) {} }} editable={editMode} />
                            </View>
                            <View style={[styles.detailBox, styles.wideBox]}>
                                <Text style={styles.detailLabel}>HSEQ Manager Sign</Text>
                                <TextInput style={styles.detailInput} placeholder="Sign" value={hseqManagerSign} onChangeText={t => { setHseqManagerSign(t); try { scheduleAutoSave(); } catch (e) {} }} editable={editMode} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.questionSection}>
                        <Text style={styles.questionText}>Ask if employee is unwell or if the employee has been unwell on leave or at home?</Text>
                        <Text style={styles.questionText}>Ask if employee is taking/has taken any medicine - Medicine refers to ALL medications e.g. Company doctor prescriptions, local medicines from herbalists, any self-treatment etc</Text>
                        <Text style={styles.questionText}>Ask if employee has taken any banned substances e.g. marijuana, hashish etc.</Text>
                        <Text style={styles.questionTextBold}>Ask if employee has any symptoms or suffering from?</Text>
                        <View style={styles.nestedChecklist}>
                            <Text style={styles.checkItem}>Infection of the ears, nose, throat, eyes, teeth or chest</Text>
                            <Text style={styles.checkItem}>Flu-like infections</Text>
                            <Text style={styles.checkItem}>Skin Infections</Text>
                            <Text style={styles.checkItem}>Vomiting</Text>
                            <Text style={styles.checkItem}>Diarrhoea</Text>
                            <Text style={styles.checkItem}>Jaundice</Text>
                        </View>
                        <Text style={styles.questionTextBold}>Ask the employee if he has been in contact to their knowledge with any person with the following</Text>
                        <View style={styles.nestedChecklist}>
                            <Text style={styles.checkItem}>Typhoid</Text>
                            <Text style={styles.checkItem}>Paraphoid</Text>
                            <Text style={styles.checkItem}>Dysentery</Text>
                            <Text style={styles.checkItem}>Hepatitis</Text>
                            <Text style={styles.checkItem}>Any other infectious disease</Text>
                        </View>
                        <Text style={styles.questionTextBold}>The supervisor must check the following for each employee</Text>
                        <View style={styles.nestedChecklist}>
                            <Text style={styles.checkItem}>All cuts, pimples and boils are covered with a waterproof dressing</Text>
                            <Text style={styles.checkItem}>Jewellery is in line with company policy</Text>
                            <Text style={styles.checkItem}>Chefs have a hat or hair net</Text>
                            <Text style={styles.checkItem}>The employee is wearing their safety shoes</Text>
                            <Text style={styles.checkItem}>The employee is neatly dressed</Text>
                        </View>
                        <Text style={styles.questionText}>If any employee answers to A & B positively then they must be referred to the Complex manager</Text>
                        <Text style={styles.questionText}>If any employee does not comply with company policy (section C), this must be rectified before they start work</Text>
                    </View>

                    <Text style={styles.weeklyLogTitle}>
                        <Text style={styles.boldText}>Note -</Text> The supervisor and the manager will be liable for the health of employees and subordinates once they sign the above
                    </Text>

                    <View style={dailyStyles.tableContainer}>
                        <View style={dailyStyles.tableHeader}>
                            <Text style={[dailyStyles.headerCell, dailyStyles.nameCol, dailyStyles.spanTwoRows]}>NAMES</Text>
                            <Text style={[dailyStyles.headerCell, dailyStyles.positionCol, dailyStyles.spanTwoRows]}>POSITION</Text>
                            {daysOfWeek.map(day => (
                                <View key={day} style={dailyStyles.dayHeaderCol}>
                                    <Text style={dailyStyles.dayHeaderTitle}>{day}</Text>
                                    <View style={dailyStyles.subHeaderRow}>
                                        <Text style={[dailyStyles.subHeaderCell]}>{'Fit for\nwork'}</Text>
                                        <Text style={[dailyStyles.lastSubHeaderCell]}>{'Managers\ncomment'}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <FlatList
                            data={weeklyData}
                            renderItem={renderWeeklyLogItem}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                    

                    <View style={styles.footerSignatures}>
                        <Text style={styles.footerText}>HSEQ MANAGER..................................</Text>
                        <Text style={styles.footerText}>COMPLEX MANAGER..................................</Text>
                        <Text style={styles.footerText}>FINANCIAL CONTROLLER..................................</Text>
                    </View>

                    {/* Buttons placed under Complex Manager - stacked full-width bars */}
                    <View style={styles.stackActionsWrap}>
                        <TouchableOpacity style={[styles.stackBtn, { backgroundColor: '#f6c342' }]} onPress={async () => { try { await handleSaveDraft(); } catch (e) { console.warn('save draft failed', e); } }} disabled={isSaving || localSaving}>
                            <Text style={styles.stackBtnText}>{'Save Draft'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.stackBtn, { backgroundColor: '#3b82f6' }]} onPress={async () => {
                            // wrap handleSubmit with a client-side timeout so UI doesn't hang
                            setLocalSaving(true);
                            const timeoutMs = 5000; // shorter timeout to keep UI responsive
                            let timedOut = false;
                            const timeoutPromise = new Promise((resolve) => setTimeout(() => { timedOut = true; resolve('timeout'); }, timeoutMs));
                            try {
                                const res = await Promise.race([handleSubmit(), timeoutPromise]);
                                if (res === 'timeout' || timedOut) {
                                    // Let the save continue in background but hide the global overlay so UI is usable
                                    setForceHideOverlay(true);
                                    try { setShowNotification(true); } catch (e) {}
                                    Alert.alert('Saving in background', 'The save is taking longer than expected and will continue in the background. You can continue using the app.');
                                }
                            } catch (e) { console.warn('submit failed', e); }
                            // If the submit finished quickly, just clear the local saving flag. If it timed out, leave the background save to clear overlay later via effect.
                            if (!timedOut) setLocalSaving(false);
                        }} disabled={isSaving || localSaving}>
                            <Text style={[styles.stackBtnText, { color: '#fff' }]}>{(isSaving || localSaving) ? 'Submitting...' : 'Submit Checklist'}</Text>
                        </TouchableOpacity>
                    </View>

                    <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
                    <LoadingOverlay visible={isSaving || localSaving} />
                    </View>
                </View>

        {/* Sticky footer removed - buttons are inline under the signatures */}
    </EditableFormContainer>
    );
};

// --- GENERAL STYLES ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    // Reduced bottom padding and minHeight for better on-screen layout
    scrollViewContent: { padding: 10, paddingBottom: Math.max(140, Math.round(windowHeight * 0.25)) },
    container: { flex: 1, backgroundColor: '#fff', minWidth: Math.max(width, tableWidthConst), minHeight: Math.max(800, windowHeight) },
    boldText: { fontWeight: 'bold' },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1, borderColor: '#000', padding: 5, marginBottom: 5 },
    documentTitle: { fontWeight: 'bold', fontSize: 16, flex: 2 },
    docDetails: { flex: 1, alignItems: 'flex-start', marginLeft: 10 },
    logoAndTitle: { flexDirection: 'row', alignItems: 'center', flex: 2 },
    logoImageLeft: { width: 48, height: 36, resizeMode: 'contain', marginRight: 8 },
    logoText: { fontSize: 24, fontWeight: 'bold', color: '#A00', marginRight: 8 },
    documentTitleSub: { fontSize: 12 },
    detailText: { fontSize: 10 },
    subjectText: { fontSize: 16, marginBottom: 10, paddingBottom: 2 },
    sectionHeader: { borderWidth: 1, borderColor: '#000', marginBottom: 10, padding: 5 },
    sectionTitle: { backgroundColor: '#eee', fontWeight: 'bold', fontSize: 14, padding: 3, textAlign: 'center', marginBottom: 5 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    detailBox: { flex: 1, paddingHorizontal: 5 },
    wideBox: { flex: 1.5 },
    detailLabel: { fontSize: 8, fontWeight: 'bold' },
    detailInput: { borderBottomWidth: 1, borderBottomColor: '#000', fontSize: 10, paddingVertical: 2 },
    questionSection: { marginBottom: 15, borderWidth: 1, borderColor: '#000', padding: 5 },
    questionText: { fontSize: 10, marginBottom: 4 },
    questionTextBold: { fontSize: 10, fontWeight: 'bold', marginTop: 5, marginBottom: 2 },
    nestedChecklist: { marginLeft: 10, marginBottom: 5 },
    checkItem: { fontSize: 9, marginLeft: 5 },
    weeklyLogTitle: { fontSize: 10, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 3 },
    footerSignatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    footerText: { fontSize: 10, fontWeight: 'bold', marginRight: 20 },
    footerSticky: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#ddd', elevation: 6, zIndex: 50 },
    saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    stackActionsWrap: { marginTop: 8, width: '100%', alignSelf: 'stretch', alignItems: 'center' },
    stackBtn: { paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginBottom: 8, paddingHorizontal: 14, width: 320 },
    stackBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
});

// --- WEEKLY LOG TABLE STYLES (Daily specific) ---
const dailyStyles = StyleSheet.create({
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
    nameCol: { width: nameColWidth, textAlign: 'left' },
    positionCol: { width: positionColWidth },
    headerCell: { fontWeight: 'bold', fontSize: 10, padding: 5, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
    spanTwoRows: { minHeight: 60 },
    dayHeaderCol: { width: dailyColWidth, borderRightWidth: 1, borderRightColor: '#000' },
    dayHeaderTitle: { fontWeight: 'bold', fontSize: 10, padding: 3, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', height: 30, textAlignVertical: 'center' },
    subHeaderRow: { flexDirection: 'row', height: 30 },
    subHeaderCell: { width: fitWidth, fontWeight: 'bold', fontSize: 8, padding: 2, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
    lastSubHeaderCell: { width: commentWidth, borderRightWidth: 0, fontWeight: 'bold', fontSize: 8, padding: 2, textAlign: 'center', textAlignVertical: 'center' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 35, alignItems: 'stretch' },
    dataCell: { fontSize: 10, padding: 5, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
    fitCheckContainer: { width: fitWidth, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000' },
    fitCheckBox: { width: 18, height: 18, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
    checkMark: { color: '#4CAF50', fontSize: 14, lineHeight: 14, fontWeight: 'bold' },
    crossMark: { color: '#FF0000', fontSize: 14, lineHeight: 14, fontWeight: 'bold' },
    commentInput: { width: commentWidth, fontSize: 9, padding: 3, borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center', textAlign: 'left' },
});

export default HealthStatusCheck;

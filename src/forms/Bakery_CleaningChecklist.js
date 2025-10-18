import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert, // Using Alert for RN native environment
    Image,
} from 'react-native';
import useFormSave from '../hooks/useFormSave';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import { getDraft } from '../utils/formDrafts';

// --- STUBBED ASYNC STORAGE AND API UTILITIES ---
// NOTE: Since this environment cannot access native AsyncStorage, these functions
// are stubs designed to simulate the asynchronous data handling expected in React Native.

const DRAFT_KEY = 'bakery_cleaning_checklist_draft';

const addFormHistory = async (data) => {
    console.log("Form submitted to API:", data);
    return new Promise(resolve => setTimeout(resolve, 300));
};

// --- DATA STRUCTURE ---
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CLEANING_AREAS = [
    { name: 'Processing surfaces', frequency: 'After Use' },
    { name: 'Shelves', frequency: '4' },
    { name: 'Table legs and supports', frequency: '4' },
    { name: 'Hard to reach floor areas', frequency: '3' },
    { name: 'General floor areas', frequency: 'After Use' },
    { name: 'Walls', frequency: '2' },
    { name: 'Ceilings (clean if visibly dirty)', frequency: '1' },
    { name: 'Lights (clean if visibly dirty)', frequency: '1' },
    { name: 'Baking Table', frequency: 'After each use' },
    { name: 'Slicing Table', frequency: 'After each use' },
    { name: 'Drains', frequency: 'Every day' },
    { name: 'Oven', frequency: 'After Use' },
    { name: 'Proofer', frequency: 'After Use' },
    { name: 'Mixer', frequency: 'After Use' },
    { name: 'Slicer', frequency: 'After Use' },
    { name: 'Moulds & Lids (clean if visibly dirty)', frequency: '1' },
    { name: 'Trolleys (clean if visibly dirty)', frequency: '1' },
    { name: 'Fat Trap', frequency: '3 times a week' },
    { name: 'Meat & Fish Prep Sink', frequency: 'After each use' },
];

const initialCleaningState = CLEANING_AREAS.map((area, index) => {
    const dayChecks = DAYS_OF_WEEK.reduce((acc, day) => {
        acc[day] = { checked: false, cleanedBy: '' };
        return acc;
    }, {});
    return { id: index, name: area.name, frequency: area.frequency, days: dayChecks };
});

// --- CUSTOM COMPONENTS ---

const Checkbox = ({ checked, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.checkbox,
            checked ? styles.checkboxChecked : styles.checkboxUnchecked,
        ]}
    >
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
    </TouchableOpacity>
);

// --- MAIN COMPONENT ---

export default function BakeryCleaningChecklist() {
    const [formData, setFormData] = useState(initialCleaningState);
    // derive issue date/month/year from system date
    const systemDate = useMemo(() => new Date(), []);
    const issueDateStr = useMemo(() => {
        const d = systemDate;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }, [systemDate]);
    const issueMonth = useMemo(() => systemDate.toLocaleString(undefined, { month: 'long' }), [systemDate]);
    const issueYear = useMemo(() => String(systemDate.getFullYear()), [systemDate]);

    // Keep location/week editable; month/year derived from system
    const [metadata, setMetadata] = useState({ location: '', week: '', month: issueMonth, year: issueYear });
    const [verification, setVerification] = useState({ hseqManager: '', complexManager: '' });
    const [busy, setBusy] = useState(false);
    
    // useFormSave integration
    const buildPayload = () => ({
        formType: 'BakeryCleaningChecklist',
        templateVersion: 'v1',
        title: 'Bakery Area Cleaning Checklist',
        metadata,
        verification,
        formData,
        // layout hints help presentational renderer to size columns when showing saved forms
        layoutHints: COL_WIDTHS,
        _tableWidth: TABLE_WIDTH,
        savedAt: Date.now(),
    });
    const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId: DRAFT_KEY, formType: 'Bakery_CleaningChecklist', clearOnSubmit: () => {
        setFormData(initialCleaningState); setMetadata({ location: '', week: '', month: issueMonth, year: issueYear }); setVerification({ hseqManager: '', complexManager: '' });
    } });

    // Load Draft Effect
    // NOTE: draft load handled by hook's save/load or external code; autosave triggered below in handlers

    // Handler: Toggle Checkbox
    const handleCheck = (id, day) => {
        setFormData(prev => prev.map(item => {
            if (item.id === id) {
                const newDays = { ...item.days };
                newDays[day].checked = !newDays[day].checked;
                if (!newDays[day].checked) {
                    newDays[day].cleanedBy = ''; // Clear initials if unchecked
                }
                return { ...item, days: newDays };
            }
            return item;
        }));
    };

    // Handler: Cleaned By Initials/Signature
    const handleCleanedByChange = (id, day, value) => {
        setFormData(prev => prev.map(item => {
            if (item.id === id) {
                const newDays = { ...item.days };
                newDays[day].cleanedBy = value;
                // Automatically check the box if initials are entered
                if (value.trim() !== '' && !newDays[day].checked) {
                    newDays[day].checked = true;
                }
                return { ...item, days: newDays };
            }
            return item;
        }));
    }

    // Handler: Metadata
    const handleMetadataChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));

    // Handler: Verification
    const handleVerificationChange = (key, value) => setVerification(prev => ({ ...prev, [key]: value }));


    const handleSubmitLocal = async () => {
        setBusy(true);
        try {
            await addFormHistory({
                title: 'Bakery Cleaning Checklist',
                date: new Date().toLocaleDateString(),
                savedAt: Date.now(),
                meta: { metadata, verification, formData }
            });
            Alert.alert('Success', 'Checklist Submitted successfully!');
        } catch (e) {
            Alert.alert('Error', 'Submission failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleSaveDraftLocal = async () => {
        setBusy(true);
        try {
            await handleSaveDraft();
            Alert.alert('Success', 'Draft saved manually.');
        } catch (e) {
            Alert.alert('Error', 'Failed to save draft.');
        } finally {
            setBusy(false);
        }
    };

    const handleBack = () => {
        Alert.alert('Navigation', 'Navigating back to previous screen...');
    };

    // --- LAYOUT CONSTANTS (Fixed widths for table structure) ---
    const COL_WIDTHS = useMemo(() => ({
        // Increased Area width for more readable text and to take up more space
        AREA: 300, 
        // Increased Frequency width
        FREQ: 150, 
        // Increased day column width to 150 (from 120) to widen the overall table
        DAY_COL: 150, 
    }), []);
    
    // Total width: 300 + 150 + (7 * 150) = 1500 (This is wider for a landscape feel)
    const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQ + (DAYS_OF_WEEK.length * COL_WIDTHS.DAY_COL);

    const renderRow = (item) => (
        <View key={item.id} style={styles.row}>
            {/* Area to be cleaned */}
            <View style={[styles.cell, { width: COL_WIDTHS.AREA }]}>
                <Text style={styles.areaText}>{item.name}</Text>
            </View>

            {/* Frequency */}
            <View style={[styles.cell, { width: COL_WIDTHS.FREQ }, styles.centerContent]}>
                <Text style={styles.freqText}>{item.frequency}</Text>
            </View>

            {/* Daily Check Columns */}
            {DAYS_OF_WEEK.map(day => (
                <View key={day} style={[styles.dayColContainer, { width: COL_WIDTHS.DAY_COL }]}>
                    {/* Check/Tick - 20% of the day column */}
                    <View style={styles.checkSubCol}>
                        <Checkbox
                            checked={item.days[day].checked}
                            onPress={() => handleCheck(item.id, day)}
                        />
                    </View>
                    {/* Cleaned By - 80% of the day column */}
                    <View style={styles.cleanedBySubCol}>
                        <TextInput
                            value={item.days[day].cleanedBy}
                            onChangeText={(value) => handleCleanedByChange(item.id, day, value)}
                            style={styles.cleanedByInput}
                            maxLength={15}
                        />
                    </View>
                </View>
            ))}
        </View>
    );

    // Load draft on mount (if available)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await getDraft(DRAFT_KEY);
                if (!d || !mounted) return;
                if (d.formData) setFormData(d.formData);
                if (d.metadata) setMetadata(d.metadata);
                if (d.verification) setVerification(d.verification);
            } catch (e) {
                // ignore load errors
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Schedule autosave when form data or metadata changes
    useEffect(() => {
        try { scheduleAutoSave(700); } catch (e) { /* ignore */ }
    }, [formData, metadata, verification]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    {/* Header Section - show logo, company name and issued date */}
                    <View style={styles.headerTop}>
                        <Image source={require('../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
                        <View style={{ flex: 1, paddingLeft: 12 }}>
                            <Text style={styles.companyName}>Bravo</Text>
                            <Text style={styles.areaTitle}>BAKERY & CONFECTIONARY AREA</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.mainTitle}>BAKERY AREA CLEANING CHECKLIST</Text>
                            <Text style={styles.docText}>Doc No: BBN-SHEQ-P-16-R-11h | Issue Date: {issueDateStr} | Revision Date: N/A</Text>
                            <Text style={[styles.docText, { marginTop: 4 }]}>Issued: {issueMonth} {issueYear}</Text>
                        </View>
                    </View>

                    {/* Metadata Section */}
                    <View style={styles.metadataContainer}>
                        <View style={styles.metadataField}>
                            <Text style={styles.metadataLabel}>LOCATION:</Text>
                            <TextInput
                                value={metadata.location}
                                onChangeText={(text) => handleMetadataChange('location', text)}
                                style={styles.metadataInput}
                                placeholder="Location"
                            />
                        </View>
                        <View style={styles.metadataField}>
                            <Text style={styles.metadataLabel}>WEEK:</Text>
                            <TextInput
                                value={metadata.week}
                                onChangeText={(text) => handleMetadataChange('week', text)}
                                style={styles.metadataInput}
                                placeholder="Week No."
                            />
                        </View>
                        <View style={styles.metadataField}>
                            <Text style={styles.metadataLabel}>ISSUE MONTH:</Text>
                            <Text style={[styles.metadataInput, { paddingVertical: 6 }]}>{issueMonth}</Text>
                        </View>
                        <View style={styles.metadataField}>
                            <Text style={styles.metadataLabel}>ISSUE YEAR:</Text>
                            <Text style={[styles.metadataInput, { paddingVertical: 6 }]}>{issueYear}</Text>
                        </View>
                    </View>

                    {/* Table Container - Horizontal Scroll */}
                    <ScrollView horizontal style={styles.tableScroll}>
                        {/* We set the width here to force the scroll and allow for landscape printing feel */}
                        <View style={{ width: TABLE_WIDTH }}>
                            {/* Table Header Row */}
                            <View style={styles.headerRow}>
                                <View style={[styles.headerCell, { width: COL_WIDTHS.AREA }]}>
                                    <Text style={styles.headerText}>Area to be cleaned</Text>
                                </View>
                                <View style={[styles.headerCell, { width: COL_WIDTHS.FREQ }]}>
                                    <Text style={styles.headerText}>Frequency (Per Week)</Text>
                                </View>
                                {DAYS_OF_WEEK.map(day => (
                                    <View key={day} style={[styles.dayHeaderContainer, { width: COL_WIDTHS.DAY_COL }]}>
                                        <View style={styles.dayHeaderMain}>
                                            <Text style={styles.dayHeaderText}>{day.toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.dayHeaderSub}>
                                            <View style={[styles.dayHeaderSubCell, { width: '20%' }]}>
                                                <Text style={styles.dayHeaderSubText}>CHECK</Text>
                                            </View>
                                            <View style={[styles.dayHeaderSubCell, { width: '80%' }]}>
                                                <Text style={styles.dayHeaderSubText}>CLEANED BY</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Table Body */}
                            {formData.map(renderRow)}
                        </View>
                    </ScrollView>

                    {/* Footer Verification Section */}
                    <View style={styles.verificationContainer}>
                        <Text style={styles.verificationTitle}>Verification</Text>
                        <View style={styles.verificationField}>
                            <Text style={styles.verificationLabel}>Verified by: HSEQ Manager:</Text>
                            <TextInput
                                value={verification.hseqManager}
                                onChangeText={(text) => handleVerificationChange('hseqManager', text)}
                                style={styles.verificationInput}
                                placeholder="Signature/Name"
                            />
                        </View>
                        <View style={styles.verificationField}>
                            <Text style={styles.verificationLabel}>COMPLEX MANAGER SIGN:</Text>
                            <TextInput
                                value={verification.complexManager}
                                onChangeText={(text) => handleVerificationChange('complexManager', text)}
                                style={styles.verificationInput}
                                placeholder="Signature/Name"
                            />
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={handleBack}
                            style={[styles.button, styles.backButton]}
                            disabled={busy}
                        >
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSaveDraftLocal}
                            style={[styles.button, styles.draftButton]}
                            disabled={busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Save Draft</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                setBusy(true);
                                try {
                                    // useFormSave will persist the canonical payload; afterwards run local history/notification
                                    await handleSubmit();
                                    await handleSubmitLocal();
                                } finally { setBusy(false); }
                            }}
                            style={[styles.button, styles.submitButton]}
                            disabled={busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <LoadingOverlay visible={isSaving || busy} message={(isSaving||busy) ? 'Saving...' : ''} />
            <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
        </View>
    );
}

// --- STYLESHEET ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
    // Reduced padding on the scroll content to allow the card to be wider
    scrollContent: {
        padding: 8, 
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
        borderColor: '#D1D5DB',
        borderWidth: 1,
    },
    // Header Styles
    header: {
        borderBottomColor: '#1F2937',
        borderBottomWidth: 4,
        paddingBottom: 12,
        marginBottom: 20,
    },
    headerMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    docText: {
        fontSize: 10,
        color: '#6B7280',
    },
    areaTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'left',
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '800', // extra-bold
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 8,
    },
    // Metadata Styles
    metadataContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#EFF6FF', // Indigo-50
        borderRadius: 8,
        marginBottom: 20,
    },
    metadataField: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%', // Approx half width for wrap
        minWidth: 150,
        marginVertical: 4,
    },
    metadataLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
        marginRight: 8,
    },
    metadataInput: {
        flex: 1,
        borderBottomColor: '#9CA3AF',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingVertical: 4,
    },
    // Table Styles
    tableScroll: {
        borderRadius: 8,
        borderWidth: 1,
        // Increased main table border visibility
        borderColor: '#1F2937', // Very dark gray
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#4B5563', // Gray-600
        borderBottomWidth: 2,
        borderBottomColor: '#1F2937',
    },
    headerCell: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        // Increased header divider visibility
        borderRightColor: '#4B5563', 
    },
    headerText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    dayHeaderContainer: {
        flexDirection: 'column',
        // Increased header divider visibility
        borderRightWidth: 1,
        borderRightColor: '#4B5563',
    },
    dayHeaderMain: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#6B7280', // Gray-400
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
        height: 25,
    },
    dayHeaderText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    dayHeaderSub: {
        flexDirection: 'row',
        height: 20,
    },
    dayHeaderSubCell: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E5E7EB', // Gray-200
        borderRightWidth: 1,
        // Increased sub-header divider visibility
        borderRightColor: '#4B5563',
    },
    dayHeaderSubText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#1F2937',
    },
    // Row Styles
    row: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        // Increased row border visibility
        borderBottomColor: '#4B5563',
        minHeight: 40,
    },
    cell: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        justifyContent: 'center',
        borderRightWidth: 1,
        // Increased cell border visibility
        borderRightColor: '#4B5563',
    },
    areaCell: {
        alignItems: 'flex-start',
    },
    centerContent: {
        alignItems: 'center',
    },
    areaText: {
        fontSize: 12,
        color: '#374151',
    },
    freqText: {
        fontSize: 12,
        color: '#6B7280',
    },
    dayColContainer: {
        flexDirection: 'row',
        borderRightWidth: 1,
        // Increased column border visibility
        borderRightColor: '#4B5563',
    },
    // CHECK sub-column is 20% width of the day column
    checkSubCol: {
        width: '20%', 
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        // Increased sub-column divider visibility
        borderRightColor: '#4B5563',
    },
    // CLEANED BY sub-column is 80% width of the day column
    cleanedBySubCol: {
        width: '80%', 
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    cleanedByInput: {
        width: '100%',
        textAlign: 'center',
        fontSize: 12,
        borderBottomWidth: 1,
        // Increased input line visibility
        borderBottomColor: '#4B5563',
        height: 25,
        padding: 0,
    },
    // Checkbox Styles
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        borderColor: '#10B981', // Green-500
        backgroundColor: '#10B981',
    },
    checkboxUnchecked: {
        borderColor: '#4B5563', // Gray-600
        backgroundColor: '#FFFFFF',
    },
    checkboxTick: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 18, // Adjust line height for center alignment
    },
    // Verification Styles
    verificationContainer: {
        marginTop: 32,
        padding: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    verificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
        marginBottom: 12,
    },
    verificationField: {
        flexDirection: 'column',
        marginVertical: 8,
    },
    verificationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 4,
    },
    verificationInput: {
        borderBottomWidth: 2,
        borderBottomColor: '#9CA3AF',
        padding: 8,
        fontSize: 14,
    },
    // Button Styles
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingHorizontal: 8,
    },
    button: {
        flex: 1,
        marginHorizontal: 8,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        backgroundColor: '#6B7280', // Gray-500
    },
    draftButton: {
        backgroundColor: '#FBBF24', // Yellow-500
    },
    submitButton: {
        backgroundColor: '#4F46E5', // Indigo-600
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    // Header top with logo (small)
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 2, borderBottomColor: '#E5E7EB', paddingBottom: 8 },
    logo: { width: 72, height: 72, borderRadius: 8 },
    companyName: { fontSize: 22, fontWeight: '800', color: '#185a9d' },
});

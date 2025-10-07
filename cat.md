import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';

// --- STUBBED ASYNC STORAGE AND API UTILITIES ---
// NOTE: These are stubs. In a real RN app, replace them with actual AsyncStorage/API calls.
const DRAFT_KEY = 'kitchen_area_cleaning_checklist_draft';

const getDraft = async (key) => new Promise(resolve => setTimeout(() => resolve(null), 10));
const setDraft = async (key, data) => new Promise(resolve => setTimeout(resolve, 10));
const removeDraft = async (key) => new Promise(resolve => setTimeout(resolve, 10));
const addFormHistory = async (data) => {
    console.log("Form submitted to API:", data);
    return new Promise(resolve => setTimeout(resolve, 300));
};

// --- DATA STRUCTURE: WEEKLY CHECKLIST ---

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

// Data extracted from the image for the Kitchen Area Cleaning Checklist
const EQUIPMENT_LIST = [
    { name: 'Extractor hood - general', frequency: '1' },
    { name: 'Extractor hood - filters & grease traps', frequency: '1' },
    { name: 'Pizza Oven', frequency: 'After each use' },
    { name: 'Flat top Griddle', frequency: 'After each use' },
    { name: 'Grill', frequency: 'After each use' },
    { name: 'Stove', frequency: 'After each use' },
    { name: 'Food Hot Pass', frequency: 'After each use' },
    { name: 'Deep fryer', frequency: 'After each use' },
    { name: 'Toaster', frequency: 'After each use' },
    { name: 'Vegetable Wash Sink', frequency: 'After each use' },
    { name: 'Vegetable Prep Table', frequency: 'After each use' },
    { name: 'Meat Prep Table', frequency: 'After each use' },
    { name: 'Racks x2', frequency: 'Daily' },
    { name: 'Hard to reach floor areas', frequency: '3' },
    { name: 'General floor areas (after each shift)', frequency: 'After each use' },
    { name: 'Walls', frequency: '2' },
    { name: 'Ceilings (clean if visibly dirty)', frequency: '1' },
    { name: 'Lights (clean if visibly dirty)', frequency: '1' },
    { name: 'Drains x2', frequency: 'Every day' },
    { name: 'Production-Deep Freezer', frequency: '3' },
    { name: 'Under-bar Chillers', frequency: 'After each use' },
    { name: 'Kitchen Waste Bin', frequency: 'At the end of each shift' },
    { name: 'Salamander', frequency: 'After each use' },
    { name: 'Microwave', frequency: 'After each use' },
    { name: 'Mary Chef', frequency: 'After each use' },
    { name: 'Automatic dish washing machine', frequency: 'After each use' },
];

const initialCleaningState = EQUIPMENT_LIST.map((item, index) => {
    const dailyChecks = WEEK_DAYS.reduce((acc, day) => {
        // Each day needs a checkbox (checked) and a signature/name (cleanedBy)
        acc[day] = { checked: false, cleanedBy: '' };
        return acc;
    }, {});
    return { id: index, name: item.name, frequency: item.frequency, checks: dailyChecks };
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

export default function KitchenSurfaceLogSheet() {
    const [formData, setFormData] = useState(initialCleaningState);
    const [metadata, setMetadata] = useState({ 
        location: '', 
        week: '', 
        month: '', 
        year: '', 
        hseqManager: '', 
        complexManager: '' 
    });
    const [busy, setBusy] = useState(false);
    const saveTimer = useRef(null);

    // Load Draft Effect (Stub)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const d = await getDraft(DRAFT_KEY);
                if (d && mounted) {
                    if (d.formData) setFormData(d.formData);
                    if (d.metadata) setMetadata(d.metadata);
                }
            } catch (e) {
                console.error("Failed to load draft:", e);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Auto-Save Draft Effect (Stub)
    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            setDraft(DRAFT_KEY, { formData, metadata });
            console.log('Auto-draft saved.');
        }, 700);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [formData, metadata]);

    // Handler: Toggle Checkbox or update "Cleaned By"
    const handleCellChange = (id, day, type, value) => {
        setFormData(prev => prev.map(item => {
            if (item.id === id) {
                const newChecks = { ...item.checks };
                if (type === 'checked') {
                    newChecks[day].checked = !newChecks[day].checked;
                } else if (type === 'cleanedBy') {
                    newChecks[day].cleanedBy = value;
                }
                return { ...item, checks: newChecks };
            }
            return item;
        }));
    };

    // Handler: Metadata
    const handleMetadataChange = (key, value) => setMetadata(prev => ({ ...prev, [key]: value }));
    
    const handleSubmit = async () => {
        setBusy(true);
        try {
            await addFormHistory({
                title: 'Kitchen Area Cleaning Checklist',
                date: new Date().toLocaleDateString(),
                savedAt: Date.now(),
                meta: { metadata, formData }
            });
            await removeDraft(DRAFT_KEY);
            Alert.alert('Success', 'Checklist Submitted successfully!');
            // Reset form after submission
            setFormData(initialCleaningState);
            setMetadata({ 
                location: '', 
                week: '', 
                month: '', 
                year: '', 
                hseqManager: '', 
                complexManager: '' 
            });
        } catch (e) {
            Alert.alert('Error', 'Submission failed.');
        } finally {
            setBusy(false);
        }
    };

    const handleSaveDraft = async () => {
        setBusy(true);
        try {
            await setDraft(DRAFT_KEY, { formData, metadata });
            Alert.alert('Success', 'Draft saved manually.');
        } catch (e) {
            Alert.alert('Error', 'Failed to save draft.');
        } finally {
            setBusy(false);
        }
    };

    // --- LAYOUT CONSTANTS (Fixed widths for A4 landscape table structure) ---

    const COL_WIDTHS = useMemo(() => ({
        // Area to be cleaned column
        AREA: 300, 
        // Frequency column
        FREQUENCY: 150,
        // Day column group (Check + Cleaned By)
        DAY_GROUP_WIDTH: 150,
        // Checkbox column
        CHECK: 60,
        // Cleaned By column
        CLEANED_BY: 90, 
    }), []);

    // Total width calculation: 300 + 150 + (7 days * 150) = 450 + 1050 = 1500
    const TABLE_WIDTH = COL_WIDTHS.AREA + COL_WIDTHS.FREQUENCY + 
                        (WEEK_DAYS.length * COL_WIDTHS.DAY_GROUP_WIDTH);


    const renderRow = (item) => (
        <View key={item.id} style={styles.row}>
            {/* Area to be cleaned */}
            <View style={[styles.cell, { width: COL_WIDTHS.AREA }, styles.leftContent]}>
                <Text style={styles.equipmentText}>{item.name}</Text>
            </View>

            {/* Frequency */}
            <View style={[styles.cell, { width: COL_WIDTHS.FREQUENCY }, styles.centerContent]}>
                <Text style={styles.equipmentText}>{item.frequency}</Text>
            </View>

            {/* Daily Checks and Cleaned By */}
            {WEEK_DAYS.map(day => (
                <View key={day} style={[styles.dayGroupCell, { width: COL_WIDTHS.DAY_GROUP_WIDTH }]}>
                    {/* Checkbox */}
                    <View style={[styles.cell, styles.centerContent, { width: COL_WIDTHS.CHECK, borderRightWidth: 0, paddingHorizontal: 0 }]}>
                        <Checkbox
                            checked={item.checks[day].checked}
                            onPress={() => handleCellChange(item.id, day, 'checked')}
                        />
                    </View>
                    {/* Cleaned By Input */}
                    <View style={[styles.cell, styles.centerContent, { flex: 1, borderLeftWidth: 1, borderLeftColor: '#4B5563', paddingHorizontal: 4 }]}>
                        <TextInput 
                            style={styles.cellInput} 
                            maxLength={5}
                            value={item.checks[day].cleanedBy}
                            onChangeText={(text) => handleCellChange(item.id, day, 'cleanedBy', text)}
                            placeholder="Name"
                        />
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    {/* Top Header Section */}
                    <View style={styles.header}>
                        <View style={styles.headerMeta}>
                            <Text style={styles.docText}>Doc No: BBN-SHEQ-P-16-R-11c | Issue Date: 03/08/2025 | Revision Date: N/A</Text>
                            <Text style={styles.docText}>Page 1 of 1</Text>
                        </View>
                        
                        <Text style={styles.mainTitle}>KITCHEN AREA CLEANING CHECKLIST</Text>
                        
                        <View style={styles.areaMetaRow}>
                            <View style={[styles.metaField, { flex: 2 }]}>
                                <Text style={styles.metaLabel}>LOCATION:</Text>
                                <TextInput
                                    value={metadata.location}
                                    onChangeText={(text) => handleMetadataChange('location', text)}
                                    style={styles.metaInput}
                                />
                            </View>
                            <View style={styles.metaField}>
                                <Text style={styles.metaLabel}>WEEK:</Text>
                                <TextInput
                                    value={metadata.week}
                                    onChangeText={(text) => handleMetadataChange('week', text)}
                                    style={styles.metaInput}
                                    placeholder="Week No."
                                />
                            </View>
                             <View style={styles.metaField}>
                                <Text style={styles.metaLabel}>MONTH:</Text>
                                <TextInput
                                    value={metadata.month}
                                    onChangeText={(text) => handleMetadataChange('month', text)}
                                    style={styles.metaInput}
                                />
                            </View>
                             <View style={styles.metaField}>
                                <Text style={styles.metaLabel}>YEAR:</Text>
                                <TextInput
                                    value={metadata.year}
                                    onChangeText={(text) => handleMetadataChange('year', text)}
                                    style={styles.metaInput}
                                    placeholder="YYYY"
                                />
                            </View>
                        </View>
                        <Text style={styles.areaTitle}>KITCHEN AREA</Text>
                    </View>

                    {/* Verification Row */}
                    <View style={styles.verificationRow}>
                        <View style={[styles.verificationCell, { flex: 1 }]}>
                            <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
                            <TextInput 
                                value={metadata.hseqManager}
                                onChangeText={(text) => handleMetadataChange('hseqManager', text)}
                                style={styles.verificationInput}
                            />
                        </View>
                        <View style={[styles.verificationCell, { flex: 1 }]}>
                            <Text style={styles.verificationLabel}>Complex Manager:</Text>
                            <TextInput 
                                value={metadata.complexManager}
                                onChangeText={(text) => handleMetadataChange('complexManager', text)}
                                style={styles.verificationInput}
                            />
                        </View>
                    </View>

                    {/* Table Container - Horizontal Scroll */}
                    <ScrollView horizontal style={styles.tableScroll}>
                        {/* We set the width here to force the scroll and allow for landscape printing feel */}
                        <View style={{ width: TABLE_WIDTH }}>
                            {/* Table Header Row */}
                            <View style={styles.headerRow}>
                                {/* Area & Frequency Header */}
                                <View style={[styles.headerCell, { width: COL_WIDTHS.AREA, height: 40 }]}>
                                    <Text style={styles.headerText}>Area to be cleaned</Text>
                                </View>
                                <View style={[styles.headerCell, { width: COL_WIDTHS.FREQUENCY, height: 40 }]}>
                                    <Text style={styles.headerText}>Frequency (Per Week)</Text>
                                </View>

                                {/* Day Headers */}
                                {WEEK_DAYS.map(day => (
                                    <View key={day} style={[styles.dayHeaderGroup, { width: COL_WIDTHS.DAY_GROUP_WIDTH }]}>
                                        <View style={[styles.headerCell, { width: COL_WIDTHS.CHECK, height: 40, borderBottomWidth: 0, borderRightWidth: 0 }]}>
                                            <Text style={styles.headerText}>{day}</Text>
                                        </View>
                                        <View style={[styles.headerCell, { width: COL_WIDTHS.CLEANED_BY, height: 40, borderLeftWidth: 1, borderLeftColor: '#1F2937', borderBottomWidth: 0 }]}>
                                            <Text style={styles.headerText}>Cleaned BY</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Table Body */}
                            {formData.map(renderRow)}
                        </View>
                    </ScrollView>
                    
                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={handleSaveDraft}
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
                            onPress={handleSubmit}
                            style={[styles.button, styles.submitButton]}
                            disabled={busy}
                        >
                            {busy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Submit Checklist</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// --- STYLESHEET ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
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
        borderColor: '#1F2937',
        borderWidth: 1,
    },
    // Header Styles
    header: {
        borderBottomColor: '#1F2937',
        borderBottomWidth: 1,
        paddingBottom: 10,
        marginBottom: 10,
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
        paddingTop: 8,
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '800', // extra-bold
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    areaMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    metaField: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 100,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: '#1F2937',
    },
    metaLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
        marginRight: 4,
    },
    metaInput: {
        flex: 1,
        borderBottomColor: '#9CA3AF',
        borderBottomWidth: 1,
        fontSize: 12,
        paddingVertical: 2,
    },
    // Verification Row Styles
    verificationRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#1F2937',
        marginBottom: 10,
        backgroundColor: '#E5E7EB', // Light gray
    },
    verificationCell: {
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: '#1F2937',
    },
    verificationLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        color: '#1F2937',
    },
    verificationInput: {
        borderBottomColor: '#9CA3AF',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingVertical: 2,
    },
    // Table Styles
    tableScroll: {
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#1F2937', // Very dark gray
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#6B7280', // Gray-500
        minHeight: 40,
        borderBottomWidth: 2,
        borderBottomColor: '#1F2937',
    },
    headerCell: {
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#1F2937',
    },
    headerText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    dayHeaderGroup: {
        flexDirection: 'row',
        borderRightWidth: 1,
        borderRightColor: '#1F2937',
    },
    // Row Styles
    row: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#4B5563',
        minHeight: 40,
    },
    dayGroupCell: {
        flexDirection: 'row',
        borderRightWidth: 1,
        borderRightColor: '#4B5563',
    },
    cell: {
        paddingHorizontal: 4,
        paddingVertical: 6,
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#4B5563',
        minHeight: 40,
    },
    leftContent: {
        alignItems: 'flex-start',
    },
    centerContent: {
        alignItems: 'center',
    },
    equipmentText: {
        fontSize: 12,
        color: '#1F2937',
    },
    cellInput: {
        width: '100%',
        textAlign: 'center',
        fontSize: 12,
        height: 30,
        padding: 0,
    },
    // Checkbox Styles
    checkbox: {
        width: 22,
        height: 22,
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
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 20, // Adjust line height for center alignment
    },
    // Button Styles
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        paddingHorizontal: 8,
    },
    button: {
        width: 150,
        marginLeft: 16,
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
});

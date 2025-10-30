import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useFormSave from '../hooks/useFormSave';
import EditableFormContainer from '../components/EditableFormContainer';
import { addFormHistory } from '../utils/formHistory';
import NotificationModal from '../components/NotificationModal';
import LoadingOverlay from '../components/LoadingOverlay';

const { width } = Dimensions.get('window');

// --- Component for a single Checkbox (Custom Touchable) ---
// This component now toggles between a blank state (false) and a checkmark (true)
const ChecklistToggle = ({ isChecked, onToggle, editable = true }) => (
    <TouchableOpacity onPress={editable ? onToggle : undefined} style={styles.checkboxContainer}>
        <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
            {isChecked ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
    </TouchableOpacity>
);

// --- Dummy Data Structure for the Hygiene Checklist ---
const initialHygieneData = Array.from({ length: 13 }, (_, i) => ({
    id: `${i + 1}`,
    date: '', 
    name: '', 
    // Hygiene Check Columns (Boolean) - Defaulting ALL to false (blank)
    hairCover: false, 
    shortNails: false, 
    workSuit: false, 
    jewellery: false, 
    lipstick: false, 
    persistentDiarrhoea: false, 
    persistentCough: false, 
    runningNose: false, 
    skinInfection: false, 
    openWound: false, 
    // Signature/Comment Columns (Text Input)
    comment: '', 
    checkedBy: '' 
}));


// --- Main Form Component (Personnel Hygiene Checklist) ---
const PersonalHygieneChecklist = () => {
    const [data, setData] = useState(initialHygieneData);
    const [editMode, setEditMode] = useState(false);

    // Compute issue date helper (we will set the canonical issueDate at save time)
    const formatIssueDate = (d = new Date()) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };
    const issueDate = useMemo(() => formatIssueDate(), []);

    // Helper to update text fields in row
    const updateField = (id, key, value) => {
        setData(prevData => prevData.map(item => item.id === id ? { ...item, [key]: value } : item));
    };

    // Function to toggle the checked state for a specific person and hygiene item
    const toggleCheck = (id, checkKey) => {
        setData(prevData =>
            prevData.map(item =>
                item.id === id ? { ...item, [checkKey]: !item[checkKey] } : item
            )
        );
    };

    // Build payload to save
    const buildPayload = (status = 'draft') => ({
        formType: 'PersonalHygieneChecklist',
        title: 'Personal Hygiene Checklist',
        metadata: { issueDate: formatIssueDate(), compiledBy: 'Michael Zulu C.' },
        formData: data,
        layoutHints: { columnWidths },
        savedAt: new Date().toISOString(),
        status,
    });

    const { handleSaveDraft, handleSubmit, isSaving, showNotification, notificationMessage, setShowNotification } = useFormSave({ buildPayload, draftId: 'PersonalHygieneChecklist_draft', clearOnSubmit: () => setData(initialHygieneData) });

    // --- Table Row Renderer for FlatList ---
    const renderItem = ({ item }) => (
        <View style={styles.tableRow} key={item.id}>
            {/* DATE (Input) */}
            {editMode ? (
                <TextInput
                    style={[styles.inputCell, styles.dateCol]}
                    value={item.date}
                    editable={true}
                    onChangeText={(t) => updateField(item.id, 'date', t)}
                    placeholder="D/M/Y"
                />
            ) : (
                <Text style={[styles.cell, styles.dateCol]}>{item.date}</Text>
            )}
            
            {/* NAME (Input) */}
            {editMode ? (
                <TextInput
                    style={[styles.inputCell, styles.nameCol]}
                    value={item.name}
                    editable={true}
                    onChangeText={(t) => updateField(item.id, 'name', t)}
                    placeholder="Name"
                />
            ) : (
                <Text style={[styles.cell, styles.nameCol]}>{item.name}</Text>
            )}
            
            {/* Hygiene Checkboxes (10 columns) */}
            <ChecklistToggle isChecked={item.hairCover} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'hairCover') : undefined} />
            <ChecklistToggle isChecked={item.shortNails} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'shortNails') : undefined} />
            <ChecklistToggle isChecked={item.workSuit} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'workSuit') : undefined} />
            <ChecklistToggle isChecked={item.jewellery} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'jewellery') : undefined} />
            <ChecklistToggle isChecked={item.lipstick} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'lipstick') : undefined} />
            <ChecklistToggle isChecked={item.persistentDiarrhoea} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'persistentDiarrhoea') : undefined} />
            <ChecklistToggle isChecked={item.persistentCough} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'persistentCough') : undefined} />
            <ChecklistToggle isChecked={item.runningNose} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'runningNose') : undefined} />
            <ChecklistToggle isChecked={item.skinInfection} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'skinInfection') : undefined} />
            <ChecklistToggle isChecked={item.openWound} editable={editMode} onToggle={editMode ? () => toggleCheck(item.id, 'openWound') : undefined} /> 

            {/* COMMENT (Input) */}
            {editMode ? (
                <TextInput
                    style={[styles.inputCell, styles.commentCol]}
                    value={item.comment}
                    editable={true}
                    onChangeText={(t) => updateField(item.id, 'comment', t)}
                    placeholder="Comment"
                />
            ) : (
                <Text style={[styles.cell, styles.commentCol]}>{item.comment}</Text>
            )}
            
            {/* CHECKED BY? (Input) */}
            {editMode ? (
                <TextInput
                    style={[styles.inputCell, styles.checkedByCol, styles.lastCol]}
                    value={item.checkedBy}
                    editable={true}
                    onChangeText={(t) => updateField(item.id, 'checkedBy', t)}
                    placeholder="Checked By?"
                />
            ) : (
                <Text style={[styles.cell, styles.checkedByCol, styles.lastCol]}>{item.checkedBy}</Text>
            )}
        </View>
    );

    return (
        <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft}>
            <SafeAreaView style={styles.safeArea}>
            {/* Outer vertical scroll allows full page vertical scrolling; inner horizontal ScrollView handles wide table */}
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                style={{ flex: 1 }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
            >
                <View>
                  <ScrollView horizontal={true} contentContainerStyle={{ minWidth: totalWidth + 20 }} nestedScrollEnabled={true}>
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

                    <Text style={styles.subjectText}>
                        <Text style={styles.boldText}>Subject:</Text> Personnel Hygiene Checklist
                    </Text>

                    {/* --- INFO/VERSION SECTION (Using the structure from image_b77cbb.jpg) --- */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoText}>
                                <Text style={styles.boldText}>Compiled By:</Text> Michael Zulu C.
                            </Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoText}>
                                <Text style={styles.boldText}>Approved By:</Text> Hassani Ali
                            </Text>
                        </View>
                        {/* Version and Rev removed per request */}
                    </View>
                    <Text style={styles.infoText}>Tick or cross ($X$) where necessary</Text>
                    
                    {/* --- TABLE HEADERS (Hygiene Checklist) --- */}
                    <View style={styles.tableHeader}>
                        {/* 1st Row of Headers (DATE, NAME) */}
                        <Text style={[styles.headerCell, styles.dateCol, styles.spanTwoRows]}>DATE</Text>
                        <Text style={[styles.headerCell, styles.nameCol, styles.spanTwoRows]}>NAME</Text>
                        
                        {/* 10 Check Columns */}
                        <Text style={[styles.headerCell, styles.checkCol]}>HAIR{"\n"}COVER{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>SHORT{"\n"}NAILS{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>WORK{"\n"}SUIT{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>ANY{"\n"}JEWELLERY{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>ANY{"\n"}LIPSTICK{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>PERSISTENT{"\n"}DIARRHOEA{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>PERSISTENT{"\n"}COUGH{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>RUNNING{"\n"}NOSE{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>SKIN{"\n"}INFECTION{"\n"}?</Text>
                        <Text style={[styles.headerCell, styles.checkCol]}>OPEN{"\n"}WOUND{"\n"}?</Text>

                        {/* Last Two Columns */}
                        <Text style={[styles.headerCell, styles.commentCol, styles.spanTwoRows]}>COMMENT</Text>
                        <Text style={[styles.headerCell, styles.checkedByCol, styles.spanTwoRows, styles.lastCol]}>CHECKED{"\n"}BY?</Text>
                    </View>

                    {/* --- TABLE ROWS (using FlatList) --- */}
                    <FlatList
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        scrollEnabled={true}
                        style={{ maxHeight: 600 }}
                    />

                    {/* --- FOOTER SIGNATURES --- */}
                    <View style={styles.footerSignatures}>
                        {/* Only HSEQ SIGN is visible in the hygiene checklist image */}
                        <Text style={styles.footerText}>HSEQ SIGN:..................................</Text>
                    </View>
                    
                    {/* Inline action buttons removed — footer contains Save/Submit to avoid duplicate controls */}
                                        </View>
                                    </ScrollView>
                                </View>
                        </ScrollView>
            {/* Fixed footer with actions */}
                <View style={{ padding: 10, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity onPress={() => { if (isSaving) return; handleSaveDraft && handleSaveDraft(); }} style={{ backgroundColor: '#f0ad4e', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6, marginRight: 8 }} disabled={isSaving}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Save Draft</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => { if (isSaving) return; try { await handleSubmit(); const snapshot = buildPayload('submitted'); addFormHistory({ title: snapshot.title || 'Personal Hygiene Checklist', date: snapshot.metadata?.issueDate, savedAt: Date.now(), meta: { payload: snapshot } }).catch(e => console.warn('addFormHistory failed', e)); } catch (e) { console.warn('submit failed', e); } }} style={{ backgroundColor: '#185a9d', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6 }} disabled={isSaving}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Notifications and loading overlay */}
            <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
            <LoadingOverlay visible={isSaving} />
        </SafeAreaView>
        </EditableFormContainer>
    );
};

// --- STYLES ---
// Defined based on visual approximation of the image for optimal layout
const columnWidths = {
    date: 70,
    name: 180,
    check: 75, // Width for each checklist column
    comment: 140,
    checkedBy: 110,
};

// Calculate total width based on 10 checklist columns + 4 fixed columns (DATE, NAME, COMMENT, CHECKED BY)
const totalWidth = columnWidths.date + columnWidths.name + (columnWidths.check * 10) + columnWidths.comment + columnWidths.checkedBy;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        // Set the minimum width to the calculated total table width plus padding
        minWidth: totalWidth + 20,
        // Increase vertical depth so forms can scroll further (long forms)
        minHeight: 1200,
        paddingBottom: 400,
    },
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
        // Make the container use the full calculated width to ensure alignment
        width: totalWidth + 20, 
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
    logoImageLeft: {
        width: 48,
        height: 36,
        resizeMode: 'contain',
        marginRight: 8,
    },
    docDetails: {
        flex: 1.5,
        alignItems: 'flex-start',
        marginLeft: 10,
    },
    detailText: {
        fontSize: 10,
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
        marginBottom: 8, 
    },
    infoCol: {
        width: 200, // Adjusted width for columns
    },
    infoColSmall: {
        width: 100,
    },
    infoText: {
        fontSize: 10,
        marginBottom: 5,
    },

    // --- TABLE STYLES ---
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#eee',
        borderWidth: 1,
        borderColor: '#000',
        alignItems: 'stretch',
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 10,
        paddingHorizontal: 3,
        paddingVertical: 5,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#000',
        minHeight: 45, // Ensure headers have enough height
        textAlignVertical: 'center',
    },
    // The columns that span two rows in the visual design are set to a fixed height here
    spanTwoRows: {
        minHeight: 70, 
    },

    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#000',
        minHeight: 35,
    },
    // Base style for TextInput cells
    inputCell: {
        fontSize: 10,
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#000',
        textAlign: 'center',
        minHeight: 35,
        textAlignVertical: 'center',
    },

    // --- COLUMN WIDTHS (Matching Headers and Cells) ---
    dateCol: { width: columnWidths.date, borderRightWidth: 1, borderRightColor: '#000' },
    nameCol: { width: columnWidths.name, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'left' },
    checkCol: { width: columnWidths.check }, 
    commentCol: { width: columnWidths.comment, borderRightWidth: 1, borderRightColor: '#000' },
    checkedByCol: { width: columnWidths.checkedBy }, 
    lastCol: { borderRightWidth: 0 }, // Used for the last column to terminate the row border
    

    // --- CHECKBOX STYLES (ChecklistToggle Component) ---
    checkboxContainer: {
        width: columnWidths.check,
        justifyContent: 'center',
        alignItems: 'center',
        // All checkbox columns have a right border 
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
        backgroundColor: '#4CAF50', // Green checkmark background
    },
    checkMark: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 14,
        fontWeight: 'bold',
    },
    
    // --- FOOTER STYLES ---
    footerSignatures: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 20,
        paddingHorizontal: 10,
    },
    footerText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 20,
    },
});

export default PersonalHygieneChecklist;

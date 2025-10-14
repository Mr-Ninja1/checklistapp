import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';

const { width } = Dimensions.get('window');

// --- Component for a single Checkbox (Custom Touchable) ---
// This component now toggles between a blank state (false) and a checkmark (true)
const ChecklistToggle = ({ isChecked, onToggle }) => (
    <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer}>
        <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
            {/* If checked (true), show Checkmark */}
            {isChecked ? <Text style={styles.checkMark}>✓</Text> : null}
            {/* If unchecked (false), show Cross (X) */}
            {/* NOTE: If you need a third state for N/A, the logic would need to change from boolean to a ternary state (0, 1, 2) */}
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

    // Compute issue date for the header
    const issueDate = useMemo(() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        // Matching the format from the PPE image header example
        return `${dd}/${mm}/${yyyy}`; 
    }, []);

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

    // --- Table Row Renderer for FlatList ---
    const renderItem = ({ item }) => (
        <View style={styles.tableRow} key={item.id}>
            {/* DATE (Input) */}
            <TextInput
                style={[styles.inputCell, styles.dateCol]}
                value={item.date}
                onChangeText={(t) => updateField(item.id, 'date', t)}
                placeholder="D/M/Y"
            />
            
            {/* NAME (Input) */}
            <TextInput
                style={[styles.inputCell, styles.nameCol]}
                value={item.name}
                onChangeText={(t) => updateField(item.id, 'name', t)}
                placeholder="Name"
            />
            
            {/* Hygiene Checkboxes (10 columns) */}
            <ChecklistToggle isChecked={item.hairCover} onToggle={() => toggleCheck(item.id, 'hairCover')} />
            <ChecklistToggle isChecked={item.shortNails} onToggle={() => toggleCheck(item.id, 'shortNails')} />
            <ChecklistToggle isChecked={item.workSuit} onToggle={() => toggleCheck(item.id, 'workSuit')} />
            <ChecklistToggle isChecked={item.jewellery} onToggle={() => toggleCheck(item.id, 'jewellery')} />
            <ChecklistToggle isChecked={item.lipstick} onToggle={() => toggleCheck(item.id, 'lipstick')} />
            <ChecklistToggle isChecked={item.persistentDiarrhoea} onToggle={() => toggleCheck(item.id, 'persistentDiarrhoea')} />
            <ChecklistToggle isChecked={item.persistentCough} onToggle={() => toggleCheck(item.id, 'persistentCough')} />
            <ChecklistToggle isChecked={item.runningNose} onToggle={() => toggleCheck(item.id, 'runningNose')} />
            <ChecklistToggle isChecked={item.skinInfection} onToggle={() => toggleCheck(item.id, 'skinInfection')} />
            <ChecklistToggle isChecked={item.openWound} onToggle={() => toggleCheck(item.id, 'openWound')} /> 

            {/* COMMENT (Input) */}
            <TextInput
                style={[styles.inputCell, styles.commentCol]}
                value={item.comment}
                onChangeText={(t) => updateField(item.id, 'comment', t)}
                placeholder="Comment"
            />
            
            {/* CHECKED BY? (Input) */}
            <TextInput
                style={[styles.inputCell, styles.checkedByCol, styles.lastCol]}
                value={item.checkedBy}
                onChangeText={(t) => updateField(item.id, 'checkedBy', t)}
                placeholder="Checked By?"
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView horizontal={true} contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.container}>
                    {/* --- HEADER SECTION --- */}
                    <View style={styles.header}>
                <View style={styles.logoAndTitle}>
                    <Image source={require('../assets/logo.png')} style={styles.logoImageLeft} />
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
                        scrollEnabled={false} 
                    />

                    {/* --- FOOTER SIGNATURES --- */}
                    <View style={styles.footerSignatures}>
                        {/* Only HSEQ SIGN is visible in the hygiene checklist image */}
                        <Text style={styles.footerText}>HSEQ SIGN:..................................</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
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

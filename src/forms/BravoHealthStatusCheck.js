import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Dimensions, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';

const { width } = Dimensions.get('window');

// --- Helper Component for a Checkbox Toggle (Tick/Cross) ---
const FitCheckToggle = ({ isChecked, onToggle }) => (
    <TouchableOpacity onPress={onToggle} style={dailyStyles.fitCheckContainer}>
        <View style={dailyStyles.fitCheckBox}>
            {isChecked === true && <Text style={dailyStyles.checkMark}>✓</Text>}
            {isChecked === false && <Text style={dailyStyles.crossMark}>X</Text>}
        </View>
    </TouchableOpacity>
);

// --- Dummy Data Structure for the Weekly Health Log ---
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

    const issueDate = useMemo(() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }, []);

    const updateDailyStatus = (id, day, field, value) => {
        setWeeklyData(prevData => prevData.map(item => {
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
        }));
    };

    // Toggle logic: null -> true -> false -> null
    const toggleFitStatus = (id, day) => {
        setWeeklyData(prevData => prevData.map(item => {
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
        }));
    };

    const renderDailyCells = (item, day) => (
        <React.Fragment key={day}>
            <FitCheckToggle
                isChecked={item.weeklyChecks[day].fit}
                onToggle={() => toggleFitStatus(item.id, day)}
            />
            <TextInput
                style={dailyStyles.commentInput}
                value={item.weeklyChecks[day].comment}
                onChangeText={(t) => updateDailyStatus(item.id, day, 'comment', t)}
            />
        </React.Fragment>
    );

    const renderWeeklyLogItem = ({ item }) => (
        <View style={dailyStyles.tableRow} key={item.id}>
            <Text style={[dailyStyles.dataCell, dailyStyles.nameCol]}>{item.name}</Text>
            <Text style={[dailyStyles.dataCell, dailyStyles.positionCol]}>{item.position}</Text>
            {daysOfWeek.map(day => renderDailyCells(item, day))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.container}>
                    <View style={styles.docHeader}>
                        <View style={styles.logoAndTitle}>
                            <Image source={require('../assets/logo.png')} style={styles.logoImageLeft} />
                            <View>
                                <Text style={styles.logoText}>Bravo</Text>
                                <Text style={styles.documentTitle}>FOOD PRODUCTION AND SERVICE PERSONNEL</Text>
                                <Text style={styles.documentTitleSub}>Food Safety Management System</Text>
                            </View>
                        </View>
                        <View style={styles.docDetails}>
                            <Text style={styles.detailText}>Doc Ref: BBN-SHEQ-P-R-72</Text>
                            <Text style={styles.detailText}>Issue Date: {issueDate}</Text>
                        </View>
                    </View>
                    <Text style={styles.subjectText}>
                        <Text style={styles.boldText}>BRAVO BRANDS HEALTH STATUS CHECK</Text>
                    </Text>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>SECTION</Text>
                        <View style={styles.detailRow}>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>SITE</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Site" />
                            </View>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>WEEK</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Week" />
                            </View>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>MONTH</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Month" />
                            </View>
                            <View style={styles.detailBox}>
                                <Text style={styles.detailLabel}>YEAR</Text>
                                <TextInput style={styles.detailInput} placeholder="Enter Year" />
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <View style={[styles.detailBox, styles.wideBox]}>
                                <Text style={styles.detailLabel}>Supervisor Name & Sign</Text>
                                <TextInput style={styles.detailInput} placeholder="Name & Sign" />
                            </View>
                            <View style={[styles.detailBox, styles.wideBox]}>
                                <Text style={styles.detailLabel}>Complex Manager Name &</Text>
                                <TextInput style={styles.detailInput} placeholder="Name & Sign" />
                            </View>
                            <View style={[styles.detailBox, styles.wideBox]}>
                                <Text style={styles.detailLabel}>HSEQ Manager Sign</Text>
                                <TextInput style={styles.detailInput} placeholder="Sign" />
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
                                        <Text style={dailyStyles.subHeaderCell}>Fit for{"\n"}work</Text>
                                        <Text style={[dailyStyles.subHeaderCell, dailyStyles.lastSubHeaderCell]}>Managers{"\n"}comment</Text>
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
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- GENERAL STYLES ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    scrollViewContent: { padding: 10 },
    container: { flex: 1, backgroundColor: '#fff', minWidth: width * 1.5 },
    boldText: { fontWeight: 'bold' },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1, borderColor: '#000', padding: 5, marginBottom: 5 },
    documentTitle: { fontWeight: 'bold', fontSize: 14, flex: 2 },
    docDetails: { flex: 1, alignItems: 'flex-start', marginLeft: 10 },
    logoAndTitle: { flexDirection: 'row', alignItems: 'center', flex: 2 },
    logoImageLeft: { width: 48, height: 36, resizeMode: 'contain', marginRight: 8 },
    logoText: { fontSize: 24, fontWeight: 'bold', color: '#A00', marginRight: 8 },
    documentTitleSub: { fontSize: 10 },
    detailText: { fontSize: 10 },
    subjectText: { fontSize: 14, marginBottom: 10, paddingBottom: 2 },
    sectionHeader: { borderWidth: 1, borderColor: '#000', marginBottom: 10, padding: 5 },
    sectionTitle: { backgroundColor: '#eee', fontWeight: 'bold', fontSize: 12, padding: 3, textAlign: 'center', marginBottom: 5 },
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
});

// --- WEEKLY LOG TABLE STYLES (Daily specific) ---
const dailyColWidth = 80;
const dailyStyles = StyleSheet.create({
    tableContainer: { borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#eee', alignItems: 'stretch' },
    nameCol: { width: 140, textAlign: 'left' },
    positionCol: { width: 100 },
    headerCell: { fontWeight: 'bold', fontSize: 10, padding: 5, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', minHeight: 60, textAlignVertical: 'center' },
    spanTwoRows: { minHeight: 60 },
    dayHeaderCol: { width: dailyColWidth, borderRightWidth: 1, borderRightColor: '#000' },
    dayHeaderTitle: { fontWeight: 'bold', fontSize: 10, padding: 3, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', height: 30, textAlignVertical: 'center' },
    subHeaderRow: { flexDirection: 'row', height: 30 },
    subHeaderCell: { width: dailyColWidth / 2, fontWeight: 'bold', fontSize: 8, padding: 2, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center' },
    lastSubHeaderCell: { borderRightWidth: 0 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 35, alignItems: 'stretch' },
    dataCell: { fontSize: 10, padding: 5, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', textAlignVertical: 'center' },
    fitCheckContainer: { width: dailyColWidth / 2, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000' },
    fitCheckBox: { width: 18, height: 18, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
    checkMark: { color: '#4CAF50', fontSize: 14, lineHeight: 14, fontWeight: 'bold' },
    crossMark: { color: '#FF0000', fontSize: 14, lineHeight: 14, fontWeight: 'bold' },
    commentInput: { width: dailyColWidth / 2, fontSize: 9, padding: 3, borderRightWidth: 1, borderRightColor: '#000', textAlignVertical: 'center', textAlign: 'left' },
});

export default HealthStatusCheck;

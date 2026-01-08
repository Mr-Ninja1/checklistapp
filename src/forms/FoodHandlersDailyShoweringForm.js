import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Dimensions, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useFormSave from '../hooks/useFormSave';
import { getDraft } from '../utils/formDrafts';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import FormActionBar from '../components/FormActionBar';
import SignatureField from '../components/SignatureField';
import Signature from 'react-native-signature-canvas';

// --- Configuration Constants ---
const W_FIXED = {
  headerHeight: 40,
  rowHeight: 45, // Slightly increased for better touch targets on tablets
  dailyTimeCol: 70, 
  dailySignCol: 100,
  supSignCol: 160,
  largeCol: 180, // Fixed width for Full Name
  mediumCol: 120, // Fixed width for Job Title
};

const DATA_ROWS = 15;
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Calculated constant widths to prevent recalculation during render
const DAILY_BLOCK_WIDTH = W_FIXED.dailyTimeCol + W_FIXED.dailySignCol;
const TABLE_WIDTH = W_FIXED.largeCol + W_FIXED.mediumCol + (DAILY_BLOCK_WIDTH * 7) + W_FIXED.supSignCol;

const FINAL_WIDTHS = [
  W_FIXED.largeCol,
  W_FIXED.mediumCol,
  ...Array.from({ length: 7 * 2 }, (_, i) => i % 2 === 0 ? W_FIXED.dailyTimeCol : W_FIXED.dailySignCol),
  W_FIXED.supSignCol
];

// --- Memoized Row Component ---
// This prevents the entire table from lagging when typing in one cell
const DataRow = memo(({ rowIndex, rowData, editMode, onCellChange, onSignPress }) => {
  return (
    <View style={styles.dataRow} pointerEvents={editMode ? 'auto' : 'none'}>
      {FINAL_WIDTHS.map((w, cIdx) => {
        const isSupSign = cIdx === FINAL_WIDTHS.length - 1;
        const dayIndex = cIdx - 2;
        const isDailySign = !isSupSign && dayIndex >= 0 && (dayIndex % 2 === 1);
        const cellValue = rowData[cIdx];

        return (
          <View key={`cell-${rowIndex}-${cIdx}`} style={[styles.cell, { width: w, height: W_FIXED.rowHeight }, styles.bottomBorder, cIdx === FINAL_WIDTHS.length - 1 ? styles.lastCell : styles.rightBorder]}>
            {isDailySign || isSupSign ? (
              <TouchableOpacity
                onPress={() => editMode && onSignPress(rowIndex, cIdx)}
                style={styles.cellTouch}
                disabled={!editMode}
              >
                {cellValue ? (
                  <Image source={{ uri: cellValue }} style={styles.sigImageInsideCell} />
                ) : (
                  <Text style={styles.placeholder}>{editMode ? 'Tap to sign' : ''}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.inputField}
                editable={editMode}
                value={cellValue}
                onChangeText={(text) => onCellChange(rowIndex, cIdx, text)}
                underlineColorAndroid="transparent"
              />
            )}
          </View>
        );
      })}
    </View>
  );
});

export default function FoodHandlersDailyShoweringForm() {
  const now = new Date();
  const dateVal = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const monthName = (new Intl.DateTimeFormat('en-US', { month: 'long' })).format(now).toUpperCase();

  // Basic States
  const [week, setWeek] = useState('A');
  const [month, setMonth] = useState(monthName);
  const [year, setYear] = useState(`${now.getFullYear()}`);
  const [compiledBy, setCompiledBy] = useState('Michael Zulu C.');
  const [approvedBy, setApprovedBy] = useState('Hassani Ali');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Table Data State
  const initialLog = Array.from({ length: DATA_ROWS }, () => Array(FINAL_WIDTHS.length).fill(''));
  const [logEntries, setLogEntries] = useState(initialLog);
  const [logoDataUri, setLogoDataUri] = useState(null);

  // Modal States
  const [sigModalVisible, setSigModalVisible] = useState(false);
  const [sigTarget, setSigTarget] = useState(null);
  const sigRef = useRef(null);

  // Optimized Update Functions (useCallback prevents unnecessary re-renders)
  const handleCellChange = useCallback((rIdx, cIdx, text) => {
    setLogEntries(prev => {
      const next = [...prev];
      next[rIdx] = [...next[rIdx]]; // Shallow clone only the affected row
      next[rIdx][cIdx] = text;
      return next;
    });
    scheduleAutoSave();
  }, []);

  const openSignatureModal = useCallback((rIdx, cIdx) => {
    setSigTarget({ rIdx, cIdx });
    setSigModalVisible(true);
  }, []);

  // Payload Builder
  const buildPayload = () => ({
    formType: 'FoodHandlersDailyShowering',
    templateVersion: 'v1.0',
    title: 'Food Handlers Daily Showering Log',
    week, month, year, compiledBy, approvedBy, verifiedBy,
    logEntries,
    _tableWidth: TABLE_WIDTH,
    assets: logoDataUri ? { logoDataUri } : {},
  });

  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({
    buildPayload,
    draftId: 'FoodHandlersDailyShowering_draft',
    clearOnSubmit: () => {
      setLogEntries(initialLog);
      setWeek('A');
      setVerifiedBy('');
    },
    waitForSave: false
  });

  // Load Draft Logic
  useEffect(() => {
    (async () => {
      try {
        const d = await getDraft('FoodHandlersDailyShowering_draft');
        if (d) {
          if (d.logEntries) setLogEntries(d.logEntries);
          if (d.week) setWeek(d.week);
          if (d.verifiedBy) setVerifiedBy(d.verifiedBy);
          if (d.compiledBy) setCompiledBy(d.compiledBy);
          if (d.approvedBy) setApprovedBy(d.approvedBy);
        }
      } catch (e) { console.log("Draft Load Error", e); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.mainContent}>
            
            {/* Header Section */}
            <View style={styles.docInfoContainer} pointerEvents={editMode ? 'auto' : 'none'}>
              <View style={styles.docInfoRow}>
                <View style={styles.headerColLeft}>
                  <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
                    <Text style={styles.subtitleText}>Food Safety Management System</Text>
                  </View>
                </View>
                <View style={styles.headerTable}>
                  <View style={styles.headerTableRow}><Text style={styles.headerTableCellKey}>Issue Date:</Text><Text style={styles.headerTableCellValue}>{dateVal}</Text></View>
                  <View style={styles.headerTableRow}><Text style={styles.headerTableCellKey}>Review Date:</Text><Text style={styles.headerTableCellValue}>N/A</Text></View>
                </View>
              </View>

              <View style={[styles.textRow, { marginTop: 10 }]}>
                <Text style={styles.labelText}>Subject:</Text>
                <Text style={[styles.valueTextBold, { fontSize: 18 }]}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
              </View>

              <View style={styles.textRow}>
                <Text style={styles.labelText}>Compiled By:</Text>
                <TextInput style={styles.valueTextInput} editable={editMode} value={compiledBy} onChangeText={setCompiledBy} />
                <Text style={styles.labelText}>Approved By:</Text>
                <TextInput style={styles.valueTextInput} editable={editMode} value={approvedBy} onChangeText={setApprovedBy} />
              </View>

              <View style={styles.textRow}>
                <Text style={styles.labelText}>Week:</Text>
                <TextInput style={styles.underlineTextInput} editable={editMode} value={week} onChangeText={setWeek} />
                <Text style={styles.labelText}>Month:</Text>
                <TextInput style={styles.underlineTextInput} editable={editMode} value={month} onChangeText={setMonth} />
                <Text style={styles.labelText}>Year:</Text>
                <TextInput style={styles.underlineTextInput} editable={editMode} value={year} onChangeText={setYear} />
                <Text style={styles.labelText}>Verified By:</Text>
                <SignatureField value={verifiedBy} onChange={(v) => { setVerifiedBy(v); scheduleAutoSave(); }} editable={editMode} width={150} height={40} />
              </View>
            </View>

            {/* Table Horizontal Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar={true}>
              <View style={[styles.tableContainer, { width: TABLE_WIDTH }]}>
                
                {/* Header Row 1 */}
                <View style={[styles.headerRow, { height: W_FIXED.headerHeight }]}>
                  <View style={[styles.headerCell, { width: W_FIXED.largeCol + W_FIXED.mediumCol }]}><Text style={styles.headerText}>Staff Details</Text></View>
                  {daysOfWeek.map((day) => (
                    <View key={day} style={[styles.headerCell, { width: DAILY_BLOCK_WIDTH }]}><Text style={styles.headerText}>{day}</Text></View>
                  ))}
                  <View style={[styles.headerCell, { width: W_FIXED.supSignCol }]}><Text style={styles.headerText}>Supervisor</Text></View>
                </View>

                {/* Header Row 2 */}
                <View style={[styles.headerRow, { height: W_FIXED.headerHeight }]}>
                  <View style={[styles.headerCell, { width: W_FIXED.largeCol }]}><Text style={styles.headerText}>Full Name</Text></View>
                  <View style={[styles.headerCell, { width: W_FIXED.mediumCol }]}><Text style={styles.headerText}>Job Title</Text></View>
                  {daysOfWeek.flatMap((d, i) => [
                    <View key={`t-${i}`} style={[styles.headerCell, { width: W_FIXED.dailyTimeCol }]}><Text style={styles.subHeaderText}>Time</Text></View>,
                    <View key={`s-${i}`} style={[styles.headerCell, { width: W_FIXED.dailySignCol }]}><Text style={styles.subHeaderText}>Sign</Text></View>
                  ])}
                  <View style={[styles.headerCell, { width: W_FIXED.supSignCol }]}><Text style={styles.headerText}>Sup Sign</Text></View>
                </View>

                {/* Memoized Data Rows */}
                {logEntries.map((row, idx) => (
                  <DataRow 
                    key={`row-${idx}`}
                    rowIndex={idx}
                    rowData={row}
                    editMode={editMode}
                    onCellChange={handleCellChange}
                    onSignPress={openSignatureModal}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.instructionFooter}>
              <Text style={styles.instructionText}><Text style={{ fontWeight: 'bold' }}>Instruction:</Text> All food handlers who handle food directly are required to take a shower before starting work.</Text>
            </View>

            <View style={styles.actionBarTop}>
              <FormActionBar onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} isSaving={isSaving} />
            </View>
          </View>
        </ScrollView>

        {/* Floating Toggle */}
        <TouchableOpacity style={[styles.fabLarge, editMode ? styles.fabActiveLarge : null]} onPress={() => { Keyboard.dismiss(); setEditMode(!editMode); }}>
          <Text style={styles.fabTextLarge}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>

        {/* Optimized Signature Modal */}
        <Modal visible={sigModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Signature
                ref={sigRef}
                onOK={(base64) => {
                  handleCellChange(sigTarget.rIdx, sigTarget.cIdx, base64);
                  setSigModalVisible(false);
                }}
                descriptionText="Please Sign Below"
                clearText="Clear"
                confirmText="Save Signature"
                webStyle={`
                  .m-signature-pad--footer { display: none; }
                  .m-signature-pad--body { height: 100%; }
                  .m-signature-pad--body canvas { width: 100% !important; height: 100% !important; }
                `}
                // increase pen thickness and make strokes more consistent/darker
                penColor="#000000"
                minWidth={4}
                maxWidth={10}
                dotSize={3}
                velocityFilterWeight={0.7}
                backgroundColor="rgba(255,255,255,1)"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setSigModalVisible(false)} style={[styles.signBtn, { backgroundColor: '#6b7280' }]}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => sigRef.current.readSignature()} style={styles.signBtn}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <LoadingOverlay visible={isSaving} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  mainContent: { padding: 12 },
  docInfoContainer: { marginBottom: 15 },
  docInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerColLeft: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 60, height: 40 },
  companyName: { fontSize: 14, fontWeight: 'bold' },
  subtitleText: { fontSize: 10, color: '#666' },
  headerTable: { borderWidth: 1, padding: 4 },
  headerTableRow: { flexDirection: 'row' },
  headerTableCellKey: { fontSize: 10, fontWeight: 'bold', width: 80 },
  headerTableCellValue: { fontSize: 10 },
  textRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  labelText: { fontSize: 11, fontWeight: 'bold', marginRight: 5 },
  valueTextInput: { flex: 1, borderBottomWidth: 1, borderColor: '#ccc', fontSize: 11, padding: 2 },
  underlineTextInput: { width: 60, borderBottomWidth: 1, textAlign: 'center', fontSize: 11, marginRight: 10 },
  tableContainer: { borderWidth: 1, borderColor: '#000' },
  headerRow: { flexDirection: 'row', backgroundColor: '#f3f4f6' },
  headerCell: { borderRightWidth: 1, borderBottomWidth: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
  headerText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  subHeaderText: { fontSize: 9 },
  dataRow: { flexDirection: 'row' },
  cell: { borderRightWidth: 1, justifyContent: 'center', alignItems: 'center' },
  bottomBorder: { borderBottomWidth: 1 },
  lastCell: { borderRightWidth: 0 },
  inputField: { width: '100%', height: '100%', textAlign: 'center', fontSize: 10, padding: 0 },
  cellTouch: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  sigImageInsideCell: { width: '90%', height: '80%', resizeMode: 'contain' },
  placeholder: { fontSize: 8, color: '#999' },
  instructionFooter: { marginTop: 15, padding: 10, backgroundColor: '#f9fafb', borderRadius: 5 },
  instructionText: { fontSize: 11, color: '#4b5563' },
  actionBarTop: { marginTop: 20, marginBottom: 40 },
  fabLarge: { position: 'absolute', right: 20, bottom: 40, width: 65, height: 65, borderRadius: 33, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabActiveLarge: { backgroundColor: '#10b981' },
  fabTextLarge: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { height: 400, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
  signBtn: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 5, backgroundColor: '#2563eb' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
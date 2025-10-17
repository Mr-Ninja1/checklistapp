import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Dimensions, SafeAreaView, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import FormActionBar from '../components/FormActionBar';
// Note: Delayed focus wrapper removed — using native TextInput for editability

// --- Configuration Constants ---

const W_FIXED = {
  headerHeight: 40, // Height of one header band (total height of table header is 2 * 40 = 80)
  rowHeight: 35,
  dailyTimeCol: 60, // Increased from 45 to 60 for better space
  dailySignCol: 45, // Increased from 35 to 45 for better space
  supSignCol: 110, // Sup Sign (increased to allow two-line label)
};

const DATA_ROWS = 15;
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Width of one pair of daily columns (Shower Time + Sign)
const DAILY_BLOCK_WIDTH = W_FIXED.dailyTimeCol + W_FIXED.dailySignCol; 
// Total width of all 7 daily blocks plus the Supervisor block
const TOTAL_LOG_WIDTH = (DAILY_BLOCK_WIDTH * 7) + W_FIXED.supSignCol; 

// Initial minimum width set for the flexible columns
const W_FLEX = {
  largeCol: 150, // Full Name (Min width, slightly adjusted)
  mediumCol: 90, // Job Title (Min width, slightly adjusted)
};

// Total required minimum width of the entire table 
const TOTAL_TABLE_WIDTH_MIN = W_FLEX.largeCol + W_FLEX.mediumCol + TOTAL_LOG_WIDTH;

// Total width allocated to flexible columns (used for calculating dynamic ratios)
const TOTAL_FLEX_WIDTH_MIN = W_FLEX.largeCol + W_FLEX.mediumCol;

// Define how the additional space should be distributed:
// We want more weight on Full Name, less on Job Title.
const LARGE_COL_RATIO = W_FLEX.largeCol / TOTAL_FLEX_WIDTH_MIN;
const MEDIUM_COL_RATIO = W_FLEX.mediumCol / TOTAL_FLEX_WIDTH_MIN;

// Calculate dynamic widths based on the available space
const calculateDynamicWidths = (screenWidth) => {
  // Padding of mainContent is 24 (12 on each side)
  const availableScreenContentWidth = screenWidth - 24; 

  // If the screen is less than the required minimum width, use minimum widths
  if (availableScreenContentWidth < TOTAL_TABLE_WIDTH_MIN) {
    return {
      largeCol: W_FLEX.largeCol,
      mediumCol: W_FLEX.mediumCol,
      totalTableWidth: TOTAL_TABLE_WIDTH_MIN
    };
  }

  // Calculate the excess space available beyond the fixed log columns
  const availableFlexSpace = availableScreenContentWidth - TOTAL_LOG_WIDTH;

  // Distribute the available flex space using ratios
  let dynamicLargeCol, dynamicMediumCol;

  if (availableFlexSpace > TOTAL_FLEX_WIDTH_MIN) {
      // If there is excess space, distribute it based on the established ratio
      dynamicLargeCol = availableFlexSpace * LARGE_COL_RATIO;
      dynamicMediumCol = availableFlexSpace * MEDIUM_COL_RATIO;
  } else {
      // If available space is less than or equal to the minimum flex space, stick to the minimums
      dynamicLargeCol = W_FLEX.largeCol;
      dynamicMediumCol = W_FLEX.mediumCol;
  }
  
  return {
    largeCol: dynamicLargeCol,
    mediumCol: dynamicMediumCol,
    totalTableWidth: dynamicLargeCol + dynamicMediumCol + TOTAL_LOG_WIDTH
  };
};

// --- Main Component ---

export default function FoodHandlersDailyShoweringForm() {
  const now = new Date();
  const dateVal = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const monthName = (new Intl.DateTimeFormat('en-US', { month: 'long' })).format(now).toUpperCase();

  const [week, setWeek] = useState('A');
  const [month, setMonth] = useState(monthName);
  const [year, setYear] = useState(`${now.getFullYear()}`);
  const [compiledBy, setCompiledBy] = useState('Michael Zulu C.');
  const [approvedBy, setApprovedBy] = useState('Hassani Ali');
  const [verifiedBy, setVerifiedBy] = useState('');
  
  const screenWidth = Dimensions.get('window').width;
  const { largeCol, mediumCol, totalTableWidth } = calculateDynamicWidths(screenWidth);

  // Recalculate the array of widths whenever dynamic widths change
  const finalWidths = [
    largeCol, // Full Name (Dynamic width)
    mediumCol, // Job Title (Dynamic width)
    // 7 days of (Time, Sign)
    ...Array.from({ length: 7 * 2 }, (_, i) => i % 2 === 0 ? W_FIXED.dailyTimeCol : W_FIXED.dailySignCol), 
    W_FIXED.supSignCol // Sup Sign
  ];

  // Initializing log entries state (Data not fully implemented for brevity, but structure is ready)
  const initialLog = Array.from({ length: DATA_ROWS }, () => Array(finalWidths.length).fill(''));
  const [logEntries, setLogEntries] = useState(initialLog);
  const [logoDataUri, setLogoDataUri] = useState(null);

  // useFormSave integration
  const draftId = 'FoodHandlersDailyShowering_draft';
  const buildPayload = () => ({
    formType: 'FoodHandlersDailyShowering',
    templateVersion: 'v1.0',
    title: 'Food Handlers Daily Showering Log',
    week,
    month,
    year,
    compiledBy,
    approvedBy,
    verifiedBy,
    logEntries,
    layoutHints: { largeCol, mediumCol, widths: finalWidths },
    _tableWidth: totalTableWidth,
    assets: logoDataUri ? { logoDataUri } : {},
  });

  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => {
    setLogEntries(initialLog);
    setWeek('A');
    setMonth(monthName);
    setYear(`${now.getFullYear()}`);
    setCompiledBy('Michael Zulu C.');
    setApprovedBy('Hassani Ali');
    setVerifiedBy('');
  }, waitForSave: false });

  // Edit mode toggles whether inputs are editable. Default: read-only so scrolling works everywhere.
  const [editMode, setEditMode] = useState(false);

  // embed logo as base64 for deterministic presentational rendering
  React.useEffect(() => {
    let mounted = true;
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


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1 }}
          // Let moves (drag gestures) be captured so scrolling can start even when touching inputs
          onStartShouldSetResponderCapture={() => false}
          onMoveShouldSetResponderCapture={() => true}
        >
          <View style={styles.mainContent}>
          
          {/* Document Header & Info */}
          <View style={styles.docInfoContainer}>
            
            {/* Top Banner Row */}
            <View style={styles.docInfoRow}>
              <View style={styles.headerColLeft}>
                <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
                <View style={{ flexDirection: 'column', marginLeft: 8 }}>
                  <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
                  <Text style={styles.subtitleText}>Food Safety Management System</Text>
                </View>
              </View>

              <View style={styles.headerTable}>
                <View style={styles.headerTableRow}>
                  <Text style={styles.headerTableCellKey}>Issue Date:</Text>
                  <Text style={styles.headerTableCellValue}>{dateVal}</Text>
                </View>
                <View style={styles.headerTableRow}>
                  <Text style={styles.headerTableCellKey}>Review Date:</Text>
                  <Text style={styles.headerTableCellValue}>N/A</Text>
                </View>
              </View>

              <Text style={styles.pageText}>Page 1 of 1</Text>
            </View>

            {/* Subject and Version Row */}
            <View style={[styles.textRow, { marginTop: 10 }]}> 
              <Text style={styles.labelText}>Subject:</Text>
              <Text style={[styles.valueTextBold, { fontSize: 20 }]}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
            </View>

            {/* Compiled/Approved Row */}
            <View style={styles.textRow}>
              <Text style={styles.labelText}>Compiled By:</Text>
              {editMode ? (
                <TextInput style={[styles.valueTextInput, { flex: 1 }]} editable={editMode} value={compiledBy} onChangeText={setCompiledBy} />
              ) : (
                <Text style={[styles.valueTextInput, { flex: 1 }, styles.readOnlyText]}>{compiledBy}</Text>
              )}
              <Text style={styles.labelText}>Approved By:</Text>
              {editMode ? (
                <TextInput style={[styles.valueTextInput, { flex: 1 }]} editable={editMode} value={approvedBy} onChangeText={setApprovedBy} />
              ) : (
                <Text style={[styles.valueTextInput, { flex: 1 }, styles.readOnlyText]}>{approvedBy}</Text>
              )}
            </View>

            {/* Week/Month/Year/Verified Row */}
            <View style={styles.textRow}>
              <Text style={styles.labelText}>Week:</Text>
              {editMode ? (
                <TextInput style={styles.underlineTextInput} editable={editMode} value={week} onChangeText={setWeek} />
              ) : (
                <Text style={[styles.underlineTextInput, styles.readOnlyText]}>{week}</Text>
              )}
              <Text style={styles.labelText}>Month:</Text>
              {editMode ? (
                <TextInput style={styles.underlineTextInput} editable={editMode} value={month} onChangeText={setMonth} />
              ) : (
                <Text style={[styles.underlineTextInput, styles.readOnlyText]}>{month}</Text>
              )}
              <Text style={styles.labelText}>Year:</Text>
              {editMode ? (
                <TextInput style={styles.underlineTextInput} editable={editMode} value={year} onChangeText={setYear} />
              ) : (
                <Text style={[styles.underlineTextInput, styles.readOnlyText]}>{year}</Text>
              )}
              <Text style={styles.labelText}>Verified By:</Text>
              {editMode ? (
                <TextInput style={styles.underlineTextInput} editable={editMode} value={verifiedBy} onChangeText={setVerifiedBy} />
              ) : (
                <Text style={[styles.underlineTextInput, styles.readOnlyText]}>{verifiedBy}</Text>
              )}
            </View>
          </View>
          {/* Table Container - Allows horizontal scrolling, now fills screen width */}

          {/* Action buttons (moved to top center) */}
          <View style={styles.actionBarTop}>
            <FormActionBar onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} isSaving={isSaving} />
          </View>

          {/* Table Container - Allows horizontal scrolling, now fills screen width */}
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onStartShouldSetResponderCapture={() => false}
            onMoveShouldSetResponderCapture={() => true}
            contentContainerStyle={[
              styles.horizontalScrollContent,
              // Ensure minWidth is set correctly to expand up to screen width if needed
              { minWidth: Math.max(totalTableWidth, screenWidth - 24) }
            ]}
          >
            <View
              style={[styles.tableContainer, { minWidth: totalTableWidth, flex: 1 }]}
              // capture move gestures at the table container level to allow scrolling
              onStartShouldSetResponderCapture={() => false}
              onMoveShouldSetResponderCapture={() => true}
            >
              
              {/* --- HEADER ROWS (Layered) --- */}
              
              {/* Top Header Band (Day Headers) - Row 1 */}
              <View style={[styles.headerRow, { height: W_FIXED.headerHeight, borderBottomWidth: 0 }]}>
                {/* Fixed Columns (Empty cells in top band, but reserve space) */}
                <View style={{ width: largeCol + mediumCol }} />
                
                {/* Day Headers (Sun, Mon, ..., Sat) */}
                {daysOfWeek.map((day, i) => (
                  <View key={`day-${i}`} style={[styles.headerCell, styles.dayHeaderCell, { width: DAILY_BLOCK_WIDTH, borderTopWidth: 0, borderBottomWidth: 0 }]}>
                    <Text style={styles.headerText}>{day}</Text>
                  </View>
                ))}

                {/* Space for the absolutely positioned Sup Sign cell in Row 2 */}
                <View style={{ width: W_FIXED.supSignCol, borderRightWidth: 0 }} /> 
              </View>

              {/* Bottom Header Band (Sub-Headers) - Row 2 */}
              <View style={[styles.headerRow, { height: W_FIXED.headerHeight }]}>
                
                {/* Full Name & Job Title (Cells spanning both rows) - ABSOLUTELY positioned to overlap rows 1 & 2 */}
                <View style={[styles.headerCell, styles.headerSpanningCell, { width: largeCol, height: W_FIXED.headerHeight * 2, position: 'absolute', top: -W_FIXED.headerHeight, left: 0, justifyContent: 'center' }]}>
                  <Text style={styles.headerText}>Full Name</Text>
                </View>
                <View style={[styles.headerCell, styles.headerSpanningCell, { width: mediumCol, height: W_FIXED.headerHeight * 2, position: 'absolute', top: -W_FIXED.headerHeight, left: largeCol, justifyContent: 'center' }]}>
                  <Text style={styles.headerText}>Job Title</Text>
                </View>

                {/* SUPERVISOR SIGN (Cells spanning both rows) - ABSOLUTELY positioned - FIX APPLIED HERE */}
                <View 
                  style={[
                    styles.headerCell, 
                    styles.headerSpanningCell, 
                    { 
                      width: W_FIXED.supSignCol, 
                      height: W_FIXED.headerHeight * 2, 
                      position: 'absolute', 
                      top: -W_FIXED.headerHeight, 
                      right: 0, 
                      justifyContent: 'center',
                      // Ensure borders are fully drawn for this spanning cell
                      borderLeftWidth: 1, 
                      borderRightWidth: 1, 
                      borderTopWidth: 1, 
                      borderBottomWidth: 1, 
                    }
                  ]}
                >
                  {/* FIXED: Use newline character for full text visibility */}
                  <Text style={styles.headerText}>Sup{"\n"}Sign</Text> 
                </View>

                {/* Content Flow for Row 2 (Sub-headers) */}
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#000' }}>
                  {/* Offset for fixed columns (to push the sub-headers to the right) */}
                  <View style={{ width: largeCol + mediumCol }} /> 

                  {/* Sub Headers (Shower Time / Sign) */}
                  {daysOfWeek.flatMap(() => [
                    { width: W_FIXED.dailyTimeCol, text: 'Shower Time' },
                    { width: W_FIXED.dailySignCol, text: 'Sign' }
                  ]).map((col, idx) => (
                    <View key={`sub-${idx}`} style={[styles.headerCell, { width: col.width, height: W_FIXED.headerHeight, backgroundColor: '#f0f0f0' }]}>
                      <Text style={styles.headerText}>{col.text.replace(' ', '\n')}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Space for Supervisor Sign (already handled by the spanning cell) */}
                <View style={{ width: W_FIXED.supSignCol, borderRightWidth: 0 }} /> 
              </View>

              {/* --- DATA ROWS --- */}
              <View> 
                {Array.from({ length: DATA_ROWS }).map((_, rIdx) => (
                  <View key={`row-${rIdx}`} style={styles.dataRow}>
                    {/* The 17 columns of input fields */}
                    {finalWidths.map((w, cIdx) => (
                              <View 
                                key={`cell-${rIdx}-${cIdx}`} 
                                style={[
                                  styles.cell, 
                                  { width: w, height: W_FIXED.rowHeight },
                                  styles.bottomBorder, // All data cells need a bottom border for separation
                                  cIdx === finalWidths.length - 1 ? styles.lastCell : styles.rightBorder // Ensure right border is consistently applied
                                ]}
                              >
                                {editMode ? (
                                  <TextInput
                                    style={styles.inputField}
                                    editable={editMode}
                                    value={logEntries[rIdx]?.[cIdx]}
                                    onChangeText={(text) => {
                                      setLogEntries(prev => {
                                        const next = prev.map(row => row.slice());
                                        next[rIdx][cIdx] = text;
                                        return next;
                                      });
                                      scheduleAutoSave();
                                    }}
                                  />
                                ) : (
                                  <Text style={[styles.inputField, styles.readOnlyCell]}>{logEntries[rIdx]?.[cIdx]}</Text>
                                )}
                              </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Instruction Footer */}
          <View style={[styles.instructionFooter, styles.border]}>
            <Text style={styles.instructionText}>
                <Text style={{fontWeight: '900'}}>Instruction:</Text> All food handlers who handle food directly are required to take a shower before starting work.
            </Text>
          </View>

          <LoadingOverlay visible={isSaving} />
          <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Floating Edit toggle button */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={editMode ? 'Finish editing form' : 'Edit form'}
        accessibilityRole="button"
        style={[styles.fabLarge, editMode ? styles.fabActiveLarge : null]}
        onPress={() => {
          if (editMode) {
            // Leaving edit mode: blur keyboard and save draft
            Keyboard.dismiss();
            handleSaveDraft();
          }
          setEditMode(!editMode);
        }}
      >
        <Text style={styles.fabTextLarge}>{editMode ? 'Done' : 'Edit'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  mainContent: { padding: 12 },
  
  // --- Global Styles ---
  border: { borderWidth: 1, borderColor: '#000' },
  rightBorder: { borderRightWidth: 1, borderRightColor: '#000' },
  bottomBorder: { borderBottomWidth: 1, borderBottomColor: '#000' },
  topBottomBorder: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#000' }, 

  // --- Header Info Styles ---
  docInfoContainer: { marginBottom: 14 },
  docInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 8 },
  headerColLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  companyName: { fontSize: 16, fontWeight: '900', color: '#000' },
  logoImage: { width: 72, height: 36 },
  subtitleText: { fontSize: 12, color: '#333' },
  pageText: { fontSize: 9, position: 'absolute', top: 0, right: 0 },
  
  headerTable: { borderWidth: 1, borderColor: '#000', padding: 4, backgroundColor: '#f5f5f5' },
  headerTableRow: { flexDirection: 'row' },
  headerTableCellKey: { fontSize: 12, fontWeight: 'bold', marginRight: 6, minWidth: 60 },
  headerTableCellValue: { fontSize: 12 },
  
  textRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 },
  labelText: { fontSize: 10, fontWeight: 'bold', marginRight: 6, color: '#444' },
  valueTextInput: { fontSize: 10, flexGrow: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderColor: '#000', marginRight: 12, height: 20, padding: 0 },
  underlineTextInput: { fontSize: 10, borderBottomWidth: 1, borderColor: '#000', minWidth: 40, textAlign: 'center', marginRight: 12, height: 20, padding: 0 },
  valueTextBold: { fontSize: 10, fontWeight: '900', marginRight: 12, minWidth: 150 },
  versionText: { fontSize: 9, fontWeight: '500', marginLeft: 8 },

  // --- Table Styles ---
  horizontalScrollContent: { 
    flexGrow: 1, 
  },
  tableContainer: {
    borderWidth: 1, 
    borderColor: '#000',
  },
  headerRow: { flexDirection: 'row', backgroundColor: '#e0e0e0' },
  headerCell: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRightWidth: 1, 
    borderColor: '#000', 
    paddingHorizontal: 1
  },
  headerSpanningCell: {
    // These styles are applied when the cell is spanning two rows via absolute positioning
    borderWidth: 1, 
    borderColor: '#000',
    backgroundColor: '#e0e0e0',
    zIndex: 5,
    elevation: 5,
  },
  dayHeaderCell: {
    borderLeftWidth: 1, 
    borderColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  headerText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', lineHeight: 16 },
  
  dataRow: { flexDirection: 'row' },
  cell: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRightWidth: 1, 
    borderColor: '#000', 
    paddingHorizontal: 0, 
    paddingVertical: 0 
  },
  inputField: { 
    width: '100%', 
    height: '100%', 
    fontSize: 9, 
    padding: 0, 
    textAlign: 'center' 
  },
  lastCell: { 
    borderRightWidth: 0, 
  },
  
  // --- Footer ---
  instructionFooter: { marginTop: 12, padding: 8, backgroundColor: '#f9f9f9' },
  instructionText: { fontSize: 10, lineHeight: 14, color: '#444' },
  actionBarTop: { alignItems: 'center', marginVertical: 10 },
  fab: {
    position: 'absolute',
    right: 18,
    top: '48%',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 50,
  },
  fabActive: { backgroundColor: '#34C759' },
  fabText: { color: '#fff', fontWeight: '700' },
  // Large, attention-grabbing floating button styles
  fabLarge: {
    position: 'absolute',
    right: 14,
    top: '44%',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 200,
  },
  fabActiveLarge: {
    backgroundColor: '#34C759'
  },
  fabTextLarge: { color: '#fff', fontWeight: '900', fontSize: 16 },
  readOnlyInput: { backgroundColor: 'transparent' },
  readOnlyCell: { backgroundColor: 'transparent' },
  readOnlyText: { color: '#000', paddingVertical: 2, textAlign: 'center' },
});

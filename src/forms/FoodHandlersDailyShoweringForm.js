import React from 'react';
import { View, Text, ScrollView, TextInput, Image, StyleSheet, Dimensions } from 'react-native';

// Layout constants inspired by cat.md but tuned to be responsive within a horizontal scroll
const W = {
  header: 70,
  rowHeight: 40,
  largeCol: 150,
  mediumCol: 100,
  dailySubCol: 70,
  signCol: 50,
  supSignCol: 80,
};

const LOG_BLOCKS = [
  { day: 'Sun', subCols: ['Shower Time', 'Sign', 'Mon'] },
  { day: 'Mon', subCols: ['Shower Time', 'Sign', 'Time'] },
  { day: 'Tue', subCols: ['Shower Time', 'Sign', 'Wed'] },
  { day: 'Wed', subCols: ['Shower Time', 'Sign', 'Thu'] },
  { day: 'Thu', subCols: ['Shower Time', 'Sign', 'Fri'] },
  { day: 'Fri', subCols: ['Shower Time', 'Sign', 'Sat'] },
  { day: 'Sat', subCols: ['Shower Time', 'Sign', 'Sup Sign'] },
];

const DATA_ROWS = 15;

const TOTAL_DAILY_BLOCK_WIDTH = (W.dailySubCol + W.signCol + W.signCol) * 7;
const TOTAL_WIDTH = W.largeCol + W.mediumCol + TOTAL_DAILY_BLOCK_WIDTH + W.supSignCol;

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

export default function FoodHandlersDailyShoweringForm() {
  const now = new Date();
  const dateVal = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

  // Build the data row widths array used for rendering inputs
  const dailyWidths = LOG_BLOCKS.flatMap((block) => block.subCols.map((col) => (col === 'Shower Time' ? W.dailySubCol : W.signCol))).slice(0, -1);
  const finalWidths = [W.largeCol, W.mediumCol, ...dailyWidths, W.supSignCol];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.docInfoContainer}>
          <View style={styles.docInfoRow}>
            <View style={styles.headerColLeft}>
              <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
              <Text style={styles.titleText}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.subtitleText}>Food Safety Management System</Text>
            </View>

            <View style={styles.headerTable}>
              <View style={styles.headerTableRow}>
                <Text style={styles.headerTableCellKey}>Doc No:</Text>
                <Text style={styles.headerTableCellValue}>BBN-SHEQ-P-R-16-5a</Text>
              </View>
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

          <View style={[styles.textRow, { marginTop: 10 }]}>
            <Text style={styles.labelText}>Subject:</Text>
            <Text style={styles.valueTextBold}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
            <Text style={styles.versionText}>Version No.: 01</Text>
            <Text style={styles.versionText}>Rev No.: 00</Text>
          </View>

          <View style={styles.textRow}>
            <Text style={styles.labelText}>Compiled By:</Text>
            <TextInput style={styles.valueTextInput} defaultValue="" />
            <Text style={styles.labelText}>Approved By:</Text>
            <TextInput style={styles.valueTextInput} defaultValue="" />
          </View>

          <View style={styles.textRow}>
            <Text style={styles.labelText}>Week:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue="" />
            <Text style={styles.labelText}>Month:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue="" />
            <Text style={styles.labelText}>Year:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue={`${now.getFullYear()}`} />
            <Text style={styles.labelText}>Verified By:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue="" />
          </View>
        </View>

        <ScrollView horizontal contentContainerStyle={{ width: Math.max(TOTAL_WIDTH, Dimensions.get('window').width) }}>
          <View style={{ width: TOTAL_WIDTH }}>
            {/* Header row */}
            <View style={[styles.headerRow, { height: W.header * 2 }]}>
              <View style={[styles.cell, { width: W.largeCol, height: W.header * 2, backgroundColor: '#e0e0e0' }]}>
                <Text style={styles.headerText}>Full Name</Text>
              </View>
              <View style={[styles.cell, { width: W.mediumCol, height: W.header * 2, backgroundColor: '#e0e0e0' }]}>
                <Text style={styles.headerText}>Job Title</Text>
              </View>

              {/* Day headers */}
              {LOG_BLOCKS.map((block, i) => (
                <View key={`day-${i}`} style={[styles.dayHeaderCell, { width: W.dailySubCol + W.signCol + W.signCol, height: W.header }]}>
                  <Text style={styles.headerText}>{block.day}</Text>
                </View>
              ))}

              <View style={[styles.dayHeaderCell, { width: W.supSignCol, height: W.header * 2 }]}>
                <Text style={styles.headerText}>Sup{"\n"}Sign</Text>
              </View>
            </View>

            {/* Sub header row */}
            <View style={[styles.headerRow, { height: W.header }]}>
              <View style={{ width: W.largeCol }} />
              <View style={{ width: W.mediumCol }} />
              {LOG_BLOCKS.flatMap((block) => block.subCols).slice(0, -1).map((col, idx) => (
                <View key={`sub-${idx}`} style={[styles.cell, { width: col === 'Shower Time' ? W.dailySubCol : W.signCol, height: W.header, backgroundColor: '#f0f0f0' }]}>
                  <Text style={styles.headerText}>{col.replace(' ', '\n')}</Text>
                </View>
              ))}
              <View style={{ width: W.supSignCol, height: W.header }} />
            </View>

            {/* Data rows */}
            <View style={{ paddingTop: W.header * 2 }}>
              {Array.from({ length: DATA_ROWS }).map((_, rIdx) => (
                <View key={`row-${rIdx}`} style={styles.dataRow}>
                  {finalWidths.map((w, cIdx) => (
                    <View key={`cell-${rIdx}-${cIdx}`} style={[styles.cell, { width: w, height: W.rowHeight }]}>
                      <TextInput style={styles.inputField} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.instructionFooter}>
          <Text style={styles.instructionText}>Instruction: All food handlers who handle food directly are required to take a shower before starting work.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mainContent: { padding: 12, minHeight: '100%' },
  docInfoContainer: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8 },
  docInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerColLeft: { flexDirection: 'column', alignItems: 'flex-start', flex: 1, paddingRight: 10 },
  logoImage: { width: 96, height: 36, marginBottom: 4 },
  titleText: { fontSize: 14, fontWeight: 'bold' },
  subtitleText: { fontSize: 10 },
  pageText: { fontSize: 10, position: 'absolute', top: 0, right: 0 },
  headerTable: { borderWidth: 1, borderColor: '#000', padding: 6 },
  headerTableRow: { flexDirection: 'row', justifyContent: 'space-between' },
  headerTableCellKey: { fontSize: 9, fontWeight: 'bold', marginRight: 6 },
  headerTableCellValue: { fontSize: 9 },
  textRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  labelText: { fontSize: 11, fontWeight: 'bold', marginRight: 6 },
  valueTextInput: { fontSize: 11, flexGrow: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderColor: '#000', marginRight: 12, height: 20 },
  underlineTextInput: { fontSize: 11, borderBottomWidth: 1, borderColor: '#000', minWidth: 50, textAlign: 'center', marginRight: 12, height: 20 },
  valueTextBold: { fontSize: 11, fontWeight: '900', marginRight: 12 },
  versionText: { fontSize: 10, fontWeight: '500', marginLeft: 8 },
  headerRow: { flexDirection: 'row' },
  dayHeaderCell: { justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#e0e0e0' },
  headerText: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  dataRow: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#000', paddingHorizontal: 2, paddingVertical: 1 },
  cellText: { fontSize: 8, textAlign: 'center' },
  inputField: { width: '100%', height: '100%', fontSize: 10, padding: 0 },
  instructionFooter: { marginTop: 12 },
  instructionText: { fontSize: 12, fontStyle: 'italic' },
});

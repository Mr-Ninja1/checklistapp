import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';

// --- Constants for consistent styling and layout ---

// Define standard cell widths for the log table to enforce a fixed, wide layout
const W = {
  header: 70, // Standard height for top headers
  rowHeight: 40,
  largeCol: 150, // Full Name
  mediumCol: 100, // Job Title
  dailySubCol: 70, // Shower Time
  signCol: 50, // Sign, Mon, Time, etc.
  supSignCol: 80,
};

// Calculate total table width to enable horizontal scrolling
const TOTAL_DAILY_BLOCK_WIDTH = (W.dailySubCol + W.signCol + W.signCol) * 7; // 3 columns per day * 7 days
const TOTAL_WIDTH = W.largeCol + W.mediumCol + TOTAL_DAILY_BLOCK_WIDTH + W.supSignCol; 
// 150 (Name) + 100 (Job) + 1260 (Daily Blocks) + 80 (Sup Sign) = 1590

const DATA_ROWS = 15; // Number of log rows

// Define the column structure for the daily log blocks, strictly matching the visual content (including inconsistencies)
// The unusual labels ('Mon', 'Wed', 'Thu', 'Fri', 'Sat') likely represent a sign-off for the next day/shift or just visual clutter. 
// We keep them as is to maintain the visual fidelity of the original form.
const LOG_BLOCKS = [
    { day: 'Sun', subCols: ['Shower Time', 'Sign', 'Mon'] },
    { day: 'Mon', subCols: ['Shower Time', 'Sign', 'Time'] },
    { day: 'Tue', subCols: ['Shower Time', 'Sign', 'Wed'] },
    { day: 'Wed', subCols: ['Shower Time', 'Sign', 'Thu'] },
    { day: 'Thu', subCols: ['Shower Time', 'Sign', 'Fri'] },
    { day: 'Fri', subCols: ['Shower Time', 'Sign', 'Sat'] },
    { day: 'Sat', subCols: ['Shower Time', 'Sign', 'Sup Sign'] },
];


// --- Sub-Components ---

/**
 * Renders a single cell for the log table.
 */
const TableCell = ({ text, width, height = W.rowHeight, isHeader = false }) => (
  <View style={[styles.cell, { width, height, backgroundColor: isHeader ? '#f0f0f0' : 'white' }]}>
    <Text style={[styles.cellText, isHeader && styles.headerText]}>{text}</Text>
  </View>
);

/**
 * Renders a single row of the log table for data entry.
 */
const LogDataRow = ({ index }) => {
    // Collect all sub-column widths based on the LOG_BLOCKS structure.
    const dailyWidths = LOG_BLOCKS.flatMap(block => 
        block.subCols.map(colName => (colName === 'Shower Time' ? W.dailySubCol : W.signCol))
    ).slice(0, -1); // Remove the extra 'Sup Sign' width from the Sat block, as it's added separately.

    const finalWidths = [W.largeCol, W.mediumCol, ...dailyWidths, W.supSignCol]; // Full Name, Job Title, 7 Days * 3 Cols, Sup Sign

    return (
        <View style={styles.dataRow} key={index}>
            {finalWidths.map((width, colIndex) => (
                <View key={colIndex} style={[styles.cell, { width, height: W.rowHeight }]}>
                    {/* Using TextInput for data entry fields */}
                    <TextInput 
                        style={styles.inputField} 
                        // Placeholder text can be added here if needed, e.g., placeholder={colIndex === 0 ? 'Enter Name' : ''}
                    />
                </View>
            ))}
        </View>
    );
};


// --- Main Component ---

const ShoweringLogForm = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainContent}>

        {/* --- Top Header / Document Info Section --- */}
        <View style={styles.docInfoContainer}>
          <View style={styles.docInfoRow}>
            {/* Left/Center Header */}
            <View style={styles.headerColLeft}>
              <Text style={styles.logoText}>BRAVO {'\u2022'}</Text>
              <Text style={styles.titleText}>[BRAVO BRANDS LIMITED]</Text>
              <Text style={styles.subtitleText}>Food Safety Management System</Text>
            </View>
            
            {/* Right Header Table */}
            <View style={styles.headerTable}>
                <View style={styles.headerTableRow}>
                    <Text style={styles.headerTableCellKey}>Doc No:</Text>
                    <Text style={styles.headerTableCellValue}>BBN-SHEQ-P-R-16-5a</Text>
                </View>
                <View style={styles.headerTableRow}>
                    <Text style={styles.headerTableCellKey}>Issue Date:</Text>
                    <Text style={styles.headerTableCellValue}>0/0/2025</Text>
                </View>
                <View style={styles.headerTableRow}>
                    <Text style={styles.headerTableCellKey}>Review Date:</Text>
                    <Text style={styles.headerTableCellValue}>N/A</Text>
                </View>
            </View>
            
            <Text style={styles.pageText}>Page 1 of 1</Text>
          </View>

          {/* Subject/Compiler/Approval Row */}
          <View style={[styles.textRow, {marginTop: 10}]}>
            <Text style={styles.labelText}>Subject:</Text>
            <Text style={styles.valueTextBold}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
            
            <Text style={styles.versionText}>Version No.: 01</Text>
            <Text style={styles.versionText}>Rev No.: 00</Text>
          </View>
          
          <View style={styles.textRow}>
            <Text style={styles.labelText}>Compiled By:</Text>
            {/* Using a simple underline placeholder for the text input effect */}
            <TextInput style={styles.valueTextInput} defaultValue="Michael Zulu C" />
            
            <Text style={styles.labelText}>Approved By:</Text>
            <TextInput style={styles.valueTextInput} defaultValue="Hassani Ali" />
          </View>
          
          {/* Week/Month/Year Row */}
          <View style={styles.textRow}>
            <Text style={styles.labelText}>Week:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue="A" />
            
            <Text style={styles.labelText}>Month:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue="SEPTEMBER" />
            
            <Text style={styles.labelText}>Year:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue="2025" />
            
            <Text style={styles.labelText}>Verified By:</Text>
            <TextInput style={styles.underlineTextInput} defaultValue=".........." />
          </View>
        </View>

        {/* --- Log Table Section (Horizontal Scrollable) --- */}
        <ScrollView 
            horizontal={true} 
            contentContainerStyle={{ flexDirection: 'column', width: TOTAL_WIDTH }}
            // Fix the sticky header positioning by adjusting marginTop and zIndex 
        >
            {/* Header Rows Container (Fixed to the top of the ScrollView) */}
            <View style={styles.logHeaderContainer}>
                {/* Row 1: Full Name, Job Title, Days */}
                <View style={styles.headerRow}>
                    <TableCell text="Full Name" width={W.largeCol} height={W.header * 2} isHeader={true} />
                    <TableCell text="Job Title" width={W.mediumCol} height={W.header * 2} isHeader={true} />
                    
                    {/* Daily Block Headers (span 3 sub-columns) */}
                    {LOG_BLOCKS.map((block, index) => (
                        <View 
                            key={`day-header-${index}`} 
                            style={[
                                styles.dayHeaderCell, 
                                { 
                                    width: (W.dailySubCol + W.signCol + W.signCol), 
                                    height: W.header 
                                }
                            ]}
                        >
                            <Text style={styles.headerText}>{block.day}</Text>
                        </View>
                    ))}
                    
                    {/* The table structure in the image is a bit ambiguous for the last column. 
                        We make a single cell for the overall 'Sup Sign' here to balance the first row's height. */}
                    <View style={[styles.dayHeaderCell, { width: W.supSignCol, height: W.header * 2, borderBottomWidth: 0 }]}>
                         <Text style={styles.headerText}>Sup{"\n"}Sign</Text>
                    </View>
                </View>

                {/* Row 2: Sub-Column Labels (ST, Sign, Mon, etc. - aligned with the bottom half of Full Name/Job Title) */}
                <View style={[styles.headerRow, { position: 'absolute', top: W.header, left: 0 }]}>
                    {/* Two empty views to push the sub-columns to the right, aligning under the days */}
                    <View style={{ width: W.largeCol }} />
                    <View style={{ width: W.mediumCol }} />
                    
                    {/* Daily Sub-columns */}
                    {LOG_BLOCKS.flatMap((block, blockIndex) => (
                        block.subCols.map((colName, colIndex) => (
                            <TableCell 
                                key={`sub-col-${blockIndex}-${colIndex}`} 
                                text={colName.replace(' ', '\n')} 
                                width={colName === 'Shower Time' ? W.dailySubCol : W.signCol} 
                                height={W.header} 
                                isHeader={true} 
                            />
                        ))
                    )).slice(0, -1)} 
                    {/* Slice to remove the last 'Sup Sign' which is repeated/covered */}
                    
                    {/* Empty cell to align with the final Sup Sign column from Row 1 */}
                    <View style={{ width: W.supSignCol, height: W.header }} />
                </View>
            </View>

            {/* Data Rows (Pushed down by the header height) */}
            <View style={{ width: TOTAL_WIDTH, paddingTop: W.header * 2 }}>
                {Array.from({ length: DATA_ROWS }).map((_, index) => (
                    <LogDataRow key={index} index={index} />
                ))}
            </View>
            
        </ScrollView>
        {/* --- End Log Table Section --- */}
        
        {/* --- Instruction Footer --- */}
        <View style={styles.instructionFooter}>
            <Text style={styles.instructionText}>
                Instruction: All food handlers who handle food directly are required to take a shower before starting work.
            </Text>
        </View>

      </View>
    </ScrollView>
  );
};

// --- Stylesheet ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    padding: 15,
    minHeight: '100%',
  },

  // Document Info Styles
  docInfoContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  docInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  headerColLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginTop: -5,
  },
  subtitleText: {
    fontSize: 10,
    color: '#000',
  },
  pageText: {
    fontSize: 10,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  headerTable: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
  },
  headerTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTableCellKey: {
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 5,
  },
  headerTableCellValue: {
    fontSize: 9,
    fontWeight: 'normal',
  },
  
  // Details and Verification Styles
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 5,
    color: '#333',
  },
  // Style for inputs replacing the old text/underline style
  valueTextInput: {
    fontSize: 11,
    flexGrow: 1,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: '#000',
    marginRight: 15,
    padding: 0,
    textAlignVertical: 'center',
    height: 18, // ensure height is adequate for text input
  },
  underlineTextInput: {
    fontSize: 11,
    borderBottomWidth: 1,
    borderColor: '#000',
    minWidth: 50,
    textAlign: 'center',
    marginRight: 15,
    padding: 0,
    height: 18,
  },
  valueTextBold: {
    fontSize: 11,
    fontWeight: '900',
    marginRight: 20,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 10,
  },
  
  // Log Table Styles
  logHeaderContainer: {
    // This container holds the two rows of headers, effectively making the header fixed relative to the horizontal scroll
    height: W.header * 2,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: '#fff', // Ensure background is white to cover scrolling content if needed
  },
  headerRow: {
    flexDirection: 'row',
  },
  dayHeaderCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    // Removed borderBottomWidth here as it's added to individual cells
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderColor: '#000',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  cellText: {
    fontSize: 8,
    textAlign: 'center',
  },
  inputField: {
    width: '100%',
    height: '100%',
    fontSize: 10,
    padding: 0,
    textAlign: 'center',
    // border width removed from here as it is handled by the cell view
  },
  
  // Footer Style
  instructionFooter: {
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#000',
  },
  instructionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
  },
});

export default ShoweringLogForm;

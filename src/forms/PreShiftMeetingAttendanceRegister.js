import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';

export default function PreShiftMeetingRegister() {
  // Mock image asset placeholder since local assets aren't available in this environment
  // Use app logo from assets
  const logo = () => (
    <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
  );

  // 20 total rows: 10 left, 10 right
  const rows = Array.from({ length: 20 }, (_, i) => i + 1);
  const [agenda, setAgenda] = useState(''); // Updated from Subject
  const [presenter, setPresenter] = useState('');
  const [dateVal, setDateVal] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [issues, setIssues] = useState(['', '', '', '']); // Updated from Topics
  
  // Initialize state for 20 rows, using only 4 fields (NRC removed)
  const [cells, setCells] = useState(() => {
    const state = { left: {}, right: {} };
    // Initialize 10 rows for the left table
    for (let i = 1; i <= 10; i++) state.left[i] = { name: '', job: '', sign: '' }; 
    // Initialize 10 rows for the right table (indices 11 to 20)
    for (let i = 11; i <= 20; i++) state.right[i] = { name: '', job: '', sign: '' }; 
    return state;
  });

  const updateCell = (side, idx, field, value) => {
    setCells(prev => ({
      ...prev,
      [side]: { ...prev[side], [idx]: { ...prev[side][idx], [field]: value } }
    }));
  };

  // --- Component Rendering ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* The main ScrollView now manages vertical scrolling only */}
      <ScrollView contentContainerStyle={styles.mainScrollContent}> 

        {/* TOP HEADER BLOCK */}
        <View style={styles.topHeader}>
          
          {/* LEFT COLUMN: Logo and System Info */}
          <View style={styles.headerLeft}>
            {logo()}
            <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.systemName}>Safety Management System</Text>
          </View>
          
          {/* RIGHT COLUMN: Document Info Block (Updated Doc No for Pre-Shift Meeting) */}
          <View style={styles.headerRight}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Doc No:</Text>
              <Text style={styles.docValue}>BBN-SHEQ-PSM-R-01</Text> 
              <Text style={[styles.docLabel, { marginLeft: 12 }]}>Page 1 of 1</Text>
            </View>
            
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Issue Date:</Text>
              <Text style={styles.docValue}>{dateVal}</Text>
              <Text style={[styles.docLabel, { marginLeft: 12 }]}>Review Date:</Text>
              <Text style={styles.docValue}>N/A</Text>
            </View>
            
            <View style={[styles.docRow, { marginTop: 8, borderTopWidth: 1, borderColor: '#000', paddingTop: 4 }]}>
              <Text style={styles.docLabel}>Compiled By:</Text>
              <Text style={styles.docValue}>Michael C. Zulu</Text>
              <Text style={[styles.docLabel, { marginLeft: 12 }]}>Approved By:</Text>
              <Text style={styles.docValue}>Hasani Al</Text>
            </View>
            
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Version No:</Text>
              <Text style={styles.docValue}>01</Text>
              <Text style={[styles.docLabel, { marginLeft: 12 }]}>Rev No:</Text>
              <Text style={styles.docValue}>00</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>PRE-SHIFT MEETING ATTENDANCE REGISTER</Text>

        {/* INFO BLOCK: Agenda, Presenter, Date & Items/Issues */}
        <View style={styles.infoBlock}>
          
          {/* Row 1: AGENDA, PRESENTER, DATE (using underline inputs) */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AGENDA:</Text>
            <TextInput 
              style={[styles.infoFill, styles.inputUnderline, { flex: 2.5 }]} 
              value={agenda} 
              onChangeText={setAgenda} 
              placeholder="e.g., Daily Production Targets" 
            />
            
            <Text style={[styles.infoLabel, { marginLeft: 16 }]}>PRESENTER:</Text>
            <TextInput 
              style={[styles.infoFill, styles.inputUnderline, { flex: 1.5 }]} 
              value={presenter} 
              onChangeText={setPresenter} 
              placeholder="..." 
            />
            
            <Text style={[styles.infoLabel, { marginLeft: 16 }]}>DATE:</Text>
            <TextInput 
              style={[styles.infoFill, styles.inputUnderline, { flex: 1 }]} 
              value={dateVal} 
              onChangeText={setDateVal} 
              placeholder="DD/MM/YYYY" 
            />
          </View>

          {/* Row 2: ITEMS/ISSUES DISCUSSED */}
          <View style={styles.topicsBlock}>
            <Text style={styles.topicsTitle}>ITEMS/ISSUES DISCUSSED:</Text>
            
            {issues.map((issue, index) => (
              <View key={index} style={styles.topicLine}>
                <Text style={styles.dot}>{index + 1}.</Text>
                <TextInput 
                  style={[styles.topicInput, styles.inputUnderline]} 
                  value={issue} 
                  onChangeText={t => setIssues(prev => { 
                    const c = [...prev]; 
                    c[index] = t; 
                    return c; 
                  })} 
                  placeholder="" 
                />
              </View>
            ))}
          </View>
        </View>

        {/* ATTENDANCE TABLE - Removed horizontal ScrollView and using flex for widths */}
        <View style={styles.tableOuter}>
          
          {/* Header Row (Two 4-column tables side-by-side) */}
          <View style={styles.tableHeaderRow}>
            {/* Left Table Headers */}
            <View style={styles.colSn}><Text style={styles.colHeader}>S/N</Text></View>
            <View style={styles.colName}><Text style={styles.colHeader}>FULL NAME</Text></View>
            <View style={styles.colJob}><Text style={styles.colHeader}>JOB TITLE</Text></View>
            <View style={styles.colSign}><Text style={styles.colHeader}>SIGNATURE</Text></View> 

            {/* Right Table Headers (separated by a gap) */}
            <View style={[styles.colSn, styles.gap]}><Text style={styles.colHeader}>S/N</Text></View>
            <View style={styles.colName}><Text style={styles.colHeader}>FULL NAME</Text></View>
            <View style={styles.colJob}><Text style={styles.colHeader}>JOB TITLE</Text></View>
            <View style={styles.colSign}><Text style={styles.colHeader}>SIGNATURE</Text></View>
          </View>

          {/* Data Rows (1 to 10, and 11 to 20) */}
          {rows.slice(0, 10).map((n) => (
            <View key={`row-${n}`} style={styles.tableRow}>
              {/* Left Table Data (Rows 1-10) */}
              <View style={styles.colSn}><Text style={styles.cellText}>{n}.</Text></View>
              <View style={styles.colName}><TextInput style={styles.cellInput} value={cells.left[n]?.name} onChangeText={(t) => updateCell('left', n, 'name', t)} placeholder="" /></View>
              <View style={styles.colJob}><TextInput style={styles.cellInput} value={cells.left[n]?.job} onChangeText={(t) => updateCell('left', n, 'job', t)} placeholder="" /></View>
              <View style={styles.colSign}><TextInput style={styles.cellInput} value={cells.left[n]?.sign} onChangeText={(t) => updateCell('left', n, 'sign', t)} placeholder="" /></View>

              {/* Right Table Data (Rows 11-20) - separated by a gap */}
              <View style={[styles.colSn, styles.gap]}><Text style={styles.cellText}>{n + 10}.</Text></View>
              <View style={styles.colName}><TextInput style={styles.cellInput} value={cells.right[n + 10]?.name} onChangeText={(t) => updateCell('right', n + 10, 'name', t)} placeholder="" /></View>
              <View style={styles.colJob}><TextInput style={styles.cellInput} value={cells.right[n + 10]?.job} onChangeText={(t) => updateCell('right', n + 10, 'job', t)} placeholder="" /></View>
              <View style={styles.colSign}><TextInput style={styles.cellInput} value={cells.right[n + 10]?.sign} onChangeText={(t) => updateCell('right', n + 10, 'sign', t)} placeholder="" /></View>
            </View>
          ))}
        </View>
        {/* End of table */}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },

  // 1. TOP HEADER BLOCK STYLES
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingRight: 10
  },
  headerLeft: {
    width: 240, 
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#000',
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1, 
    paddingLeft: 12,
  },
  logoPlaceholder: { 
    width: 80, 
    height: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#333'
  },
  logoText: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#333' 
  },
  logoImage: {
    width: 96,
    height: 36,
    marginBottom: 6,
  },
  companyName: { 
    fontSize: 10, 
    fontWeight: '700',
    lineHeight: 12,
    marginTop: -8 
  },
  systemName: {
    fontSize: 9,
    lineHeight: 10,
    marginBottom: 8,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 4, lineHeight: 12 },
  docValue: { fontSize: 10, color: '#111', marginRight: 12, flexShrink: 1, lineHeight: 12 },
  
  // 2. TITLE AND INFO BLOCK STYLES
  title: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginVertical: 8, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4 },
  infoBlock: { borderWidth: 1, borderColor: '#000', padding: 10, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 },
  infoLabel: { fontWeight: '700', marginRight: 6, fontSize: 13 },
  infoFill: { flex: 1, marginRight: 0 },
  topicsBlock: { marginTop: 6 },
  topicsTitle: { fontWeight: '700', marginBottom: 6, fontSize: 13 },
  topicLine: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  dot: { width: 20, fontSize: 13, fontWeight: '600' },
  
  // Custom style for underline input (mimics the printed line)
  inputUnderline: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#000', 
    paddingVertical: 0, 
    fontSize: 13,
    height: 20, 
    paddingLeft: 4,
    backgroundColor: '#f9f9f9' 
  },
  topicInput: { flex: 1 },

  // 3. TABLE STYLES (now using flex for responsiveness)
  tableOuter: { 
    borderWidth: 1, 
    borderColor: '#000',
    width: '100%', // Fills the available space
  },
  tableHeaderRow: { 
    flexDirection: 'row', 
    backgroundColor: '#eee', 
    paddingVertical: 6, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#000',
    minHeight: 40 
  },
  colHeader: { fontWeight: '700', textAlign: 'center', fontSize: 10 },
  tableRow: { 
    flexDirection: 'row', 
    minHeight: 36, 
    alignItems: 'stretch', 
    borderBottomWidth: 1, 
    borderBottomColor: '#000' 
  },
  // Column definitions for Left Table (and reused for Right Table)
  // These flex values maintain the proportional width of the original document layout
  colSn: { 
    flex: 0.07, // S/N (~7%)
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colName: { 
    flex: 0.38, // Full Name (~38%)
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colJob: { 
    flex: 0.32, // Job Title (~32%)
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colSign: { 
    flex: 0.23, // Signature (~23%)
    paddingHorizontal: 6, 
    borderRightWidth: 0, 
    justifyContent: 'center'
  },
  gap: {
    // This is the gap between the left and right attendance blocks.
    // We remove the border on the right of the signature column and add a margin-left here.
    marginLeft: 8, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
  },
  cellInput: { 
    flex: 1, 
    paddingHorizontal: 4, 
    paddingVertical: 2, 
    textAlignVertical: 'center',
    fontSize: 12
  },
  cellText: { fontSize: 12, textAlign: 'center' },
  
});

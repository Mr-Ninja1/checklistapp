import React, { useState, useEffect } from 'react';
import useFormSave from '../hooks/useFormSave';
import formStorage from '../utils/formStorage';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';

/**
 * A register component for recording a Toolbox Talk (TBT).
 * It tracks the TBT agenda, presenter, date, key discussion points, and attendee signatures.
 */
export default function ToolboxTalkRegister() {
  // Mock image asset placeholder since local assets aren't available in this environment
  const logo = () => (
    <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
  );

  // 20 total rows for attendees: 10 left, 10 right
  const rows = Array.from({ length: 20 }, (_, i) => i + 1);
  const [agenda, setAgenda] = useState(''); // Topic of the TBT
  const [presenter, setPresenter] = useState(''); // Person conducting the TBT
  const [dateVal, setDateVal] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }); // Date of the TBT
  const [issues, setIssues] = useState(['', '', '', '']); // Key safety items discussed
  
  // Initialize state for 20 rows (Name, Job Title, Signature)
  const [cells, setCells] = useState(() => {
    const state = { left: {}, right: {} };
    for (let i = 1; i <= 10; i++) state.left[i] = { name: '', job: '', sign: '' }; 
    for (let i = 11; i <= 20; i++) state.right[i] = { name: '', job: '', sign: '' }; 
    return state;
  });

  // Function to handle updating attendee cell data
  const updateCell = (side, idx, field, value) => {
    setCells(prev => ({
      ...prev,
      [side]: { ...prev[side], [idx]: { ...prev[side][idx], [field]: value } }
    }));
    scheduleAutoSave();
  };

  // Build payload
  const buildPayload = (status = 'draft') => ({
    formType: 'ToolboxTalkRegister',
    templateVersion: '01',
    title: 'Toolbox Talk Register',
    metadata: { agenda, presenter, date: dateVal },
    formData: { cells, issues },
    layoutHints: {},
    assets: {},
    savedAt: new Date().toISOString(),
    status,
  });

  const draftId = 'ToolboxTalkRegister_draft';
  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => {
    // clear form
    setAgenda(''); setPresenter(''); setIssues(['', '', '', '']);
    setCells(() => {
      const state = { left: {}, right: {} };
      for (let i = 1; i <= 10; i++) state.left[i] = { name: '', job: '', sign: '' };
      for (let i = 11; i <= 20; i++) state.right[i] = { name: '', job: '', sign: '' };
      return state;
    });
  }});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wrapped = await formStorage.loadForm(draftId);
        const payload = wrapped?.payload || null;
        if (payload && mounted) {
          if (payload.metadata) {
            setAgenda(payload.metadata.agenda || '');
            setPresenter(payload.metadata.presenter || '');
            setDateVal(payload.metadata.date || dateVal);
          }
          if (payload.formData) {
            setIssues(payload.formData.issues || ['','','','']);
            if (payload.formData.cells) {
              const loaded = payload.formData.cells;
              if (loaded.left) setCells(prev => ({ ...prev, left: loaded.left }));
              if (loaded.right) setCells(prev => ({ ...prev, right: loaded.right }));
            }
          }
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // Local wrapper for submit so we can pass a stable callback to the action bar
  const handleSubmitLocal = async () => { await handleSubmit(); };

  // --- Component Rendering ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}> 

        {/* TOP HEADER BLOCK */}
        <View style={styles.topHeader}>
          
          {/* LEFT COLUMN: Logo and System Info */}
          <View style={styles.headerLeft}>
            {logo()}
            <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.systemName}>Safety Management System</Text>
          </View>
          
          {/* RIGHT COLUMN: Document Info Block (Updated Doc No for Toolbox Talk) */}
          <View style={styles.headerRight}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Doc No:</Text>
              {/* Updated document number to reflect Toolbox Talk (TBT) */}
              <Text style={styles.docValue}>BBN-SHEQ-TBT-R-01</Text> 
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
          </View>
        </View>

        <Text style={styles.title}>TOOL BOX TALK REGISTER</Text>

        {/* INFO BLOCK: Agenda, Presenter, Date & Items/Issues */}
        <View style={styles.infoBlock}>
          
          {/* Row 1: AGENDA, PRESENTER, DATE (using underline inputs) */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AGENDA/TOPIC:</Text>
            <TextInput 
              style={[styles.infoFill, styles.inputUnderline, { flex: 2.5 }]} 
              value={agenda} 
              onChangeText={setAgenda} 
              placeholder="e.g., Working at Heights Safety" 
            />
            
            <Text style={[styles.infoLabel, { marginLeft: 16 }]}>PRESENTER:</Text>
            <TextInput 
              style={[styles.infoFill, styles.inputUnderline, { flex: 1.5 }]} 
              value={presenter} 
              onChangeText={setPresenter} 
              placeholder="Safety Officer" 
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
            <Text style={styles.topicsTitle}>KEY POINTS DISCUSSED:</Text>
            
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

        {/* ATTENDANCE TABLE - responsive table that fills available width */}
        <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>
            
            {/* Header Row (Two 4-column tables side-by-side) */}
            <View style={styles.tableHeaderRow}>
              {/* Left Table Headers */}
              <View style={styles.colSn}><Text style={styles.colHeader}>S/N</Text></View>
              <View style={styles.colName}><Text style={styles.colHeader}>FULL NAME (Print)</Text></View>
              <View style={styles.colJob}><Text style={styles.colHeader}>JOB TITLE/DEPT</Text></View>
              <View style={styles.colSign}><Text style={styles.colHeader}>SIGNATURE</Text></View> 

              {/* Right Table Headers (separated by a gap) */}
              <View style={[styles.colSn, { marginLeft: 8 }]}><Text style={styles.colHeader}>S/N</Text></View>
              <View style={styles.colName}><Text style={styles.colHeader}>FULL NAME (Print)</Text></View>
              <View style={styles.colJob}><Text style={styles.colHeader}>JOB TITLE/DEPT</Text></View>
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
                <View style={[styles.colSn, { marginLeft: 8 }]}><Text style={styles.cellText}>{n + 10}.</Text></View>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={cells.right[n + 10]?.name} onChangeText={(t) => updateCell('right', n + 10, 'name', t)} placeholder="" /></View>
                <View style={styles.colJob}><TextInput style={styles.cellInput} value={cells.right[n + 10]?.job} onChangeText={(t) => updateCell('right', n + 10, 'job', t)} placeholder="" /></View>
                <View style={styles.colSign}><TextInput style={styles.cellInput} value={cells.right[n + 10]?.sign} onChangeText={(t) => updateCell('right', n + 10, 'sign', t)} placeholder="" /></View>
              </View>
            ))}
          </View>
        </View>
        {/* End of table horizontal scroll view */}

        {/* Action bar + overlays */}
        <View style={styles.buttonRow}>
          <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={handleSubmitLocal} showSavePdf={false} />
        </View>

        <LoadingOverlay visible={isSaving} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />

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

  // 3. TABLE STYLES (4-column structure)
  // Total width: 546 + 546 + 8 (gap) = 1100
  tableOuter: { 
    borderWidth: 1, 
    borderColor: '#000',
    width: '100%', // now responsive
    alignSelf: 'stretch',
    paddingHorizontal: 0,
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
  // Use flex ratios so columns scale
  colSn: { 
    flex: 0.07, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colName: { 
    flex: 0.38, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colJob: { 
    flex: 0.32, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colSign: { 
    flex: 0.23, 
    paddingHorizontal: 6, 
    borderRightWidth: 0, 
    justifyContent: 'center'
  },

  // Logo image sizing for Toolbox Talk header
  logoImage: {
    width: 96,
    height: 36,
    marginBottom: 6,
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

// Add buttonRow style at file end (keeps style block small and localized)
Object.assign(styles, {
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderColor: '#eee' }
});

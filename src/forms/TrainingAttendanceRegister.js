import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import formStorage from '../utils/formStorage';

export default function TrainingAttendanceRegister() {
  // Use app logo from assets if available
  const logo = () => (
    <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
  );

  const rows = Array.from({ length: 18 }, (_, i) => i + 1);
  const getDefaultDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const defaultDate = getDefaultDate();
  const [subject, setSubject] = useState('');
  const [presenter, setPresenter] = useState('');
  const [dateVal, setDateVal] = useState(defaultDate);
  const [topics, setTopics] = useState(['', '', '', '']);
  const [cells, setCells] = useState(() => {
    // structure: { left: {1: {name:'', nrc:'', job:'', sign:''}, ... }, right: {...} }
    const state = { left: {}, right: {} };
    for (let i = 1; i <= 9; i++) state.left[i] = { name: '', nrc: '', job: '', sign: '' };
    for (let i = 10; i <= 18; i++) state.right[i] = { name: '', nrc: '', job: '', sign: '' };
    return state;
  });

  const updateCell = (side, idx, field, value) => {
    setCells(prev => ({
      ...prev,
      [side]: { ...prev[side], [idx]: { ...prev[side][idx], [field]: value } }
    }));
    scheduleAutoSave();
  };

  // Build payload for saving
  const buildPayload = (status = 'draft') => ({
    formType: 'TrainingAttendanceRegister',
    templateVersion: '01',
    title: 'Training Attendance Register',
    metadata: { subject, presenter, date: dateVal },
    formData: { cells, topics },
    layoutHints: {},
    assets: {},
    savedAt: new Date().toISOString(),
    status,
  });

  const draftId = 'TrainingAttendanceRegister_draft';
  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => {
    // clear form when submit completes
    setSubject(''); setPresenter(''); setDateVal(defaultDate);
    setTopics(['', '', '', '']);
    setCells(() => {
      const state = { left: {}, right: {} };
      for (let i = 1; i <= 9; i++) state.left[i] = { name: '', nrc: '', job: '', sign: '' };
      for (let i = 10; i <= 18; i++) state.right[i] = { name: '', nrc: '', job: '', sign: '' };
      return state;
    });
  }});

  // preload draft if present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wrapped = await formStorage.loadForm(draftId);
        const payload = wrapped?.payload || null;
        if (payload && mounted) {
          if (payload.metadata) {
            setSubject(payload.metadata.subject || '');
            setPresenter(payload.metadata.presenter || '');
            setDateVal(payload.metadata.date || payload.metadata.dateVal || defaultDate);
          }
          if (payload.formData) {
            if (payload.formData.topics) setTopics(payload.formData.topics || ['','','','']);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Main ScrollView for vertical scrolling of the entire page. Use keyboardShouldPersistTaps and
          nestedScrollEnabled to avoid the common 'freeze' when interacting with inputs inside lists. */}
      <ScrollView contentContainerStyle={styles.mainScrollContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>

        {/* TOP HEADER BLOCK - Structured to match the printed form */}
        <View style={styles.topHeader}>
          
          {/* LEFT COLUMN: Logo and System Info */}
          <View style={styles.headerLeft}>
            {logo()}
            <View style={{ marginTop: 4 }}>
              <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.systemName}>Food Safety Management System</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            
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

        <Text style={styles.title}>TRAINING ATTENDANCE REGISTER</Text>

        {/* INFO BLOCK: Subject, Presenter, Date & Topics */}
        <View style={styles.infoBlock}>
          
          {/* Row 1: SUBJECT, PRESENTER, DATE (using underline inputs) */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SUBJECT:</Text>
            <TextInput 
              style={[styles.infoFill, styles.inputUnderline, { flex: 2.5 }]} 
              value={subject} 
              onChangeText={setSubject} 
              placeholder="..." 
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
              style={[styles.infoFill, styles.inputUnderline, { flex: 1, backgroundColor: '#eee' }]} 
              value={dateVal} 
              editable={false} 
            />
          </View>

          {/* Row 2: TOPICS DISCUSSED */}
          <View style={styles.topicsBlock}>
            <Text style={styles.topicsTitle}>TOPICS DISCUSSED:</Text>
            
            {topics.map((topic, index) => (
              <View key={index} style={styles.topicLine}>
                <Text style={styles.dot}>{index + 1}.</Text>
                <TextInput 
                  style={[styles.topicInput, styles.inputUnderline]} 
                  value={topic} 
                  onChangeText={t => setTopics(prev => { 
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

    {/* ATTENDANCE TABLE - responsive table that fills available width. Wrap wide rows in a
      horizontal ScrollView in the modal/viewer; here we keep responsive layout but allow
      the table to grow and not block vertical scroll. */}
    <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>
            
            {/* Header Row (Must be wide enough to fit two tables) */}
            <View style={styles.tableHeaderRow}>
              {/* Left Table Headers */}
              <View style={styles.colSn}><Text style={styles.colHeader}>S/N</Text></View>
              <View style={styles.colName}><Text style={styles.colHeader}>FULL NAME</Text></View>
              <View style={styles.colNrc}><Text style={styles.colHeader}>NRC NUMBER</Text></View>
              <View style={styles.colJob}><Text style={styles.colHeader}>JOB TITLE</Text></View>
              <View style={styles.colSign}><Text style={styles.colHeader}>SIGNATURE</Text></View> 

              {/* Right Table Headers (separated by a gap) */}
              <View style={[styles.colSn, { marginLeft: 8 }]}><Text style={styles.colHeader}>S/N</Text></View>
              <View style={styles.colName}><Text style={styles.colHeader}>FULL NAME</Text></View>
              <View style={styles.colNrc}><Text style={styles.colHeader}>NRC NUMBER</Text></View>
              <View style={styles.colJob}><Text style={styles.colHeader}>JOB TITLE</Text></View>
              <View style={styles.colSign}><Text style={styles.colHeader}>SIGNATURE</Text></View>
            </View>

            {/* Data Rows (1 to 9, and 10 to 18) */}
            {rows.slice(0, 9).map((n) => (
              <View key={`row-${n}`} style={styles.tableRow}>
                {/* Left Table Data (Rows 1-9) */}
                <View style={styles.colSn}><Text style={styles.cellText}>{n}.</Text></View>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={cells.left[n].name} onChangeText={(t) => updateCell('left', n, 'name', t)} placeholder="" /></View>
                <View style={styles.colNrc}><TextInput style={styles.cellInput} value={cells.left[n].nrc} onChangeText={(t) => updateCell('left', n, 'nrc', t)} placeholder="" /></View>
                <View style={styles.colJob}><TextInput style={styles.cellInput} value={cells.left[n].job} onChangeText={(t) => updateCell('left', n, 'job', t)} placeholder="" /></View>
                <View style={styles.colSign}><TextInput style={styles.cellInput} value={cells.left[n].sign} onChangeText={(t) => updateCell('left', n, 'sign', t)} placeholder="" /></View>

                {/* Right Table Data (Rows 10-18) - separated by a gap */}
                <View style={[styles.colSn, { marginLeft: 8 }]}><Text style={styles.cellText}>{n + 9}.</Text></View>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={cells.right[n + 9].name} onChangeText={(t) => updateCell('right', n + 9, 'name', t)} placeholder="" /></View>
                <View style={styles.colNrc}><TextInput style={styles.cellInput} value={cells.right[n + 9].nrc} onChangeText={(t) => updateCell('right', n + 9, 'nrc', t)} placeholder="" /></View>
                <View style={styles.colJob}><TextInput style={styles.cellInput} value={cells.right[n + 9].job} onChangeText={(t) => updateCell('right', n + 9, 'job', t)} placeholder="" /></View>
                <View style={styles.colSign}><TextInput style={styles.cellInput} value={cells.right[n + 9].sign} onChangeText={(t) => updateCell('right', n + 9, 'sign', t)} placeholder="" /></View>
              </View>
            ))}
          </View>
        </View>
        {/* End of table horizontal scroll view */}

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
    width: 260, 
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#000',
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1, 
    paddingLeft: 12,
  },
  // FIXED: Simplified logo placeholder for sandbox environment
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
    width: 88,
    height: 36,
    marginBottom: 4,
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

  // 3. TABLE STYLES 
  tableOuter: { 
    borderWidth: 1, 
    borderColor: '#000',
    // Now responsive: fill available width and allow internal columns to scale
    width: '100%', 
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
  // Use flex ratios so columns scale to available width
  colSn: { 
    flex: 0.06, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colName: { 
    flex: 0.36, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colNrc: { 
    flex: 0.16, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colJob: { 
    flex: 0.22, 
    paddingHorizontal: 6, 
    borderRightWidth: 1, 
    borderRightColor: '#000',
    justifyContent: 'center'
  },
  colSign: { 
    flex: 0.2, 
    paddingHorizontal: 6, 
    // Keep no right border for the final column
    borderRightWidth: 0, 
    justifyContent: 'center'
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

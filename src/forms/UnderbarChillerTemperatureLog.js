import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'underbar_chiller_temperature_log_draft';
const MAX_DAYS = 31;

const emptyDayRow = {
  tempMorning: '',
  staffSignMorning: '',
  tempAfternoon: '',
  staffSignAfternoon: '',
  tempEvening: '',
  staffSignEvening: '',
  outOfSpecAction: '',
  supNameSign: '',
};

const initialRows = Array.from({ length: MAX_DAYS }, () => ({ ...emptyDayRow }));

const initialMeta = {
  subject: 'UNDERBAR CHILLER TEMPERATURE LOG SHEET',
  // issueDate will be set to system date when no draft exists
  issueDate: '',
  // Branding
  companyName: 'Bravo',
  compiledBy: 'Michael C. Zulu',
  approvedBy: 'Hassani Ali',
  // Monthly details
  month: '',
  year: new Date().getFullYear().toString(),
  location: '',
  // Footer details
  hseqManagerSign: '',
  complexManagerSign: '',
};

export default function UnderbarChillerTemperatureLog() {
  const [rows, setRows] = useState(initialRows);
  const [meta, setMeta] = useState(initialMeta);
  const [busy, setBusy] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState(null);
  const saveTimer = useRef(null);

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Load Draft
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        if (d && mounted) {
          if (d.rows) setRows(d.rows);
          if (d.meta) setMeta(d.meta);
        }
        if (mounted && (!d || !d.meta || !d.meta.issueDate)) {
          setMeta(prev => ({ ...prev, issueDate: getTodayDate() }));
        }
        // Auto-fill month name if missing
        if (mounted) {
          const now = new Date();
          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const currentMonthName = monthNames[now.getMonth()];
          setMeta(prev => ({ ...prev, month: (prev.month && prev.month.trim() !== '') ? prev.month : currentMonthName }));
        }
        // embed logo
        try {
          const asset = Asset.fromModule(require('../assets/logo.jpeg'));
          if (!asset.localUri) await asset.downloadAsync();
          const uri = asset.localUri || asset.uri;
          const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
        } catch (e) { /* ignore */ }
      } catch (e) { console.warn('load draft', e); }
    })();
    return () => { mounted = false; };
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { rows, meta }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [rows, meta]);

  const setCell = useCallback((r, k, v) => setRows(prev => prev.map((row, i) => i === r ? { ...row, [k]: v } : row)), []);
  const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    // Always save all rows (including empty) so presentational render matches the exact form
    const logData = rows.map((r, i) => ({ day: i + 1, ...r }));

    // Allow submitting even when metadata or log rows are empty (testing mode)

    setBusy(true);
    try {
      const payload = {
        formType: 'UnderbarChillerTemperatureLog',
        templateVersion: 'v1.0',
        title: 'Underbar Chiller Temperature Log',
        date: meta.issueDate || new Date().toLocaleDateString(),
        metadata: meta,
        formData: logData,
        layoutHints: { COL_FLEX, GROUP_FLEX },
        _tableWidth: 800,
        assets: logoDataUri ? { logoDataUri } : {},
        savedAt: Date.now(),
      };
  await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, payload });
  // Show confirmation that form was saved
  try { Alert.alert('Saved', 'Form saved'); } catch (e) { /* ignore */ }
      await removeDraft(DRAFT_KEY);
      // Reset form
      setRows(initialRows);
      setMeta(prev => ({
        ...initialMeta,
        year: new Date().getFullYear().toString(),
        month: '',
        location: '',
        hseqManagerSign: '',
        complexManagerSign: ''
      }));
    } catch (e) {
      console.warn('submit error', e);
      Alert.alert('Error', 'Failed to submit log. Please try again.');
    }
    setBusy(false);
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await setDraft(DRAFT_KEY, { rows, meta }); } catch (e) { console.warn('save draft error', e); }
    setBusy(false);
  };

  // Revised Flex Distribution for perfect alignment (Total Flex: 1.0 + 9.0 + 2.0 + 2.0 = 14.0)
  const COL_FLEX = {
    DATE: 1.0,
    TEMP: 1.5, // Flex for Temperature column
    SIGN: 1.5, // Flex for Staff Sign column
    CORRECTIVE_ACTION: 2.0,
    SUP_NAME_SIGN: 2.0,
  };

  const GROUP_FLEX = {
    MORNING: COL_FLEX.TEMP + COL_FLEX.SIGN, // 3.0
    AFTERNOON: COL_FLEX.TEMP + COL_FLEX.SIGN, // 3.0
    EVENING: COL_FLEX.TEMP + COL_FLEX.SIGN, // 3.0
  };

  return (
    <View style={styles.container}>
  <ScrollView contentContainerStyle={styles.content}>

        {/* --- 1. Header (Metadata Block) --- */}
        <View style={styles.metaContainer}>
          <View style={styles.metaHeaderBox}>
            <View style={styles.brandRow}>
              {/* Logo and company */}
              {
                (() => {
                  try {
                    const logo = require('../assets/logo.jpeg');
                    return <Image source={logo} style={styles.logoImage} resizeMode="contain" />;
                  } catch (e) {
                    return <View style={styles.logoPlaceholder}><Text style={styles.logoText}>Logo</Text></View>;
                  }
                })()
              }
              <View style={styles.brandTextWrap}>
                <Text style={styles.companyName}>{meta.companyName || 'Bravo'}</Text>
                <Text style={styles.brandSubtitle}>Food Safety Management System</Text>
              </View>

              {/* Top action buttons placed inline with logo */}
              <View style={styles.headerButtons}>
                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}>
                  <Text style={styles.headerBtnText}>{busy ? 'Saving...' : 'Save Draft'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}>
                  <Text style={styles.headerBtnText}>{busy ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.docInfoGrid}>
              <Text style={styles.docInfoLabel}>Issue Date:</Text>
              <TextInput
                style={[styles.docInfoValue, styles.headerInput]}
                value={meta.issueDate}
                onChangeText={v => setMetaField('issueDate', v)}
                placeholder="DD/MM/YYYY"
              />
            </View>
          </View>

          <View style={styles.metaBottomRow}>
            <View style={[styles.metaBottomItem, { flex: 3 }]}>
              <Text style={styles.metaBold}>Subject:</Text>
              <TextInput style={styles.monthlyInput} value={meta.subject} onChangeText={v => setMetaField('subject', v)} />
            </View>
            <View style={styles.metaBottomItem}>
              <Text style={styles.metaBold}>Compiled By:</Text>
              <TextInput style={styles.monthlyInput} value={meta.compiledBy} onChangeText={v => setMetaField('compiledBy', v)} />
            </View>
            <View style={styles.metaBottomItem}>
              <Text style={styles.metaBold}>Approved By:</Text>
              <TextInput style={styles.monthlyInput} value={meta.approvedBy} onChangeText={v => setMetaField('approvedBy', v)} />
            </View>
          </View>
        </View>

        {/* --- 2. Monthly/Location Data --- */}
        <View style={styles.monthlyInfo}>
          <View style={styles.monthlyInputRow}>
            <Text style={styles.monthlyLabel}>Month:</Text>
            <TextInput style={styles.monthlyInput} value={meta.month} onChangeText={v => setMetaField('month', v)} placeholder="e.g., October" />
          </View>
          <View style={styles.monthlyInputRow}>
            <Text style={styles.monthlyLabel}>Year:</Text>
            <TextInput style={styles.monthlyInput} value={meta.year} onChangeText={v => setMetaField('year', v)} placeholder="e.g., 2025" keyboardType="numeric" />
          </View>
          <View style={styles.monthlyInputRow}>
            <Text style={styles.monthlyLabel}>Location:</Text>
            <TextInput style={[styles.monthlyInput, { flex: 3 }]} value={meta.location} onChangeText={v => setMetaField('location', v)} placeholder="e.g., Underbar Chiller" />
          </View>
        </View>

        {/* --- 3. Instruction --- */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}><Text style={{ fontWeight: '900' }}>Instruction:</Text> The temperature of the Underbar Chiller should be between 0°C and 4°C.</Text>
        </View>

        {/* --- 4. Table Block --- */}
        <View style={styles.tableWrap}>

          {/* Header Row 1: Group Labels (Morning, Afternoon, Evening, Action, Sup) */}
          <View style={[styles.tableHeaderRow, styles.groupHeader]}>
            <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.DATE }]}><Text style={styles.hText}>Date</Text></View>

            {/* Record Group Spans */}
            <View style={[styles.hCell, styles.borderRight, { flex: GROUP_FLEX.MORNING }]}><Text style={styles.hText}>Morning</Text></View>
            <View style={[styles.hCell, styles.borderRight, { flex: GROUP_FLEX.AFTERNOON }]}><Text style={styles.hText}>Afternoon</Text></View>
            <View style={[styles.hCell, styles.borderRight, { flex: GROUP_FLEX.EVENING }]}><Text style={styles.hText}>Evening</Text></View>

            <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.CORRECTIVE_ACTION }]}>
              <Text style={styles.hText}>If temperature is out of specification, what was done about it?</Text>
            </View>

            <View style={[styles.hCell, { flex: COL_FLEX.SUP_NAME_SIGN }]}>
              <Text style={styles.hText}>Sup Name and Signature</Text>
            </View>
          </View>
          {/* Header Row 2: Detail Labels (Temp, Staff Sign) */}
          <View style={[styles.tableHeaderRow, styles.detailHeader]}>
            <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.DATE }]} />

            {/* T/S columns repeated 3 times */}
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={i}>
                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TEMP }]}><Text style={styles.hText}>Temp</Text></View>
                {/* Ensure Staff Sign column always has a right border to separate it from the next column */}
                <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.SIGN }]}><Text style={styles.hText}>Staff Sign</Text></View>
              </React.Fragment>
            ))}

            <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.CORRECTIVE_ACTION }]} />
            <View style={[styles.hCell, { flex: COL_FLEX.SUP_NAME_SIGN }]} />
          </View>

          {/* Data Rows (1st to 31st) */}
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {/* Date Cell */}
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.DATE }]}>
                <Text style={{ textAlign: 'center', fontSize: 10 }}>{ri + 1}</Text>
              </View>

              {/* Morning Record */}
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TEMP }]}><TextInput style={styles.input} value={row.tempMorning} onChangeText={v => setCell(ri, 'tempMorning', v)} placeholder="°C" keyboardType="numeric" /></View>
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.SIGN }]}><TextInput style={styles.input} value={row.staffSignMorning} onChangeText={v => setCell(ri, 'staffSignMorning', v)} placeholder="Sign" /></View>

              {/* Afternoon Record */}
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TEMP }]}><TextInput style={styles.input} value={row.tempAfternoon} onChangeText={v => setCell(ri, 'tempAfternoon', v)} placeholder="°C" keyboardType="numeric" /></View>
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.SIGN }]}><TextInput style={styles.input} value={row.staffSignAfternoon} onChangeText={v => setCell(ri, 'staffSignAfternoon', v)} placeholder="Sign" /></View>

              {/* Evening Record */}
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TEMP }]}><TextInput style={styles.input} value={row.tempEvening} onChangeText={v => setCell(ri, 'tempEvening', v)} placeholder="°C" keyboardType="numeric" /></View>
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.SIGN }]}><TextInput style={styles.input} value={row.staffSignEvening} onChangeText={v => setCell(ri, 'staffSignEvening', v)} placeholder="Sign" /></View>

              {/* Corrective Action */}
              <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.CORRECTIVE_ACTION }]}>
                <TextInput style={styles.input} value={row.outOfSpecAction} onChangeText={v => setCell(ri, 'outOfSpecAction', v)} placeholder="Action Taken" />
              </View>

              {/* Supervisor Name & Sign */}
              <View style={[styles.cell, { flex: COL_FLEX.SUP_NAME_SIGN }]}>
                <TextInput style={styles.input} value={row.supNameSign} onChangeText={v => setCell(ri, 'supNameSign', v)} placeholder="Name / Sign" />
              </View>
            </View>
          ))}

        </View>

        {/* --- 5. Footer Verification --- */}
        <View style={styles.footerSection}>
          <Text style={{ fontWeight: '700', marginBottom: 10, fontSize: 12 }}>Verified by:</Text>

          <View style={styles.verificationRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>HSEQ Manager:</Text>
              <TextInput style={styles.signatureInput} value={meta.hseqManagerSign} onChangeText={v => setMetaField('hseqManagerSign', v)} placeholder="" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>COMPLEX Manager:</Text>
              <TextInput style={styles.signatureInput} value={meta.complexManagerSign} onChangeText={v => setMetaField('complexManagerSign', v)} placeholder="" />
            </View>
          </View>
        </View>

        {/* add extra bottom padding so content isn't hidden behind the footer */}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfc' },
  content: { padding: 12 },
  
  // --- Metadata Styles ---
  metaContainer: { borderWidth: 2, borderColor: '#333', marginBottom: 12, backgroundColor: '#fff' },
  metaHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderColor: '#333' },
  brandRow: { flexDirection: 'row', alignItems: 'center', width: '40%' },
  logoPlaceholder: { 
    width: 56, 
    height: 56, 
    marginRight: 8, 
    backgroundColor: '#fff', 
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center', 
    alignItems: 'center' ,
    fontSize: 16,
    fontWeight: '900',
    color: '#185a9d'
  },
  logoImage: { width: 56, height: 56, marginRight: 8 },
  logoText: {fontSize: 12, fontWeight: '700', color: '#333'},
  brandTextWrap: { flexDirection: 'column', flexShrink: 1, marginLeft: 4 },
  brandTitle: { fontSize: 12, fontWeight: '700', color: '#333' },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d', marginRight: 12 },
  brandSubtitle: { fontSize: 10, color: '#444', fontWeight: '500' },
  headerButtons: { flexDirection: 'row', marginLeft: 'auto', alignItems: 'center' },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8, elevation: 2 },
  headerBtnText: { color: '#fff', fontWeight: '700' },
  docInfoGrid: { width: '40%', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#333', fontSize: 8 },
  docInfoLabel: { width: '50%', padding: 2, fontWeight: '700', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#333', textAlign: 'left' },
  docInfoValue: { width: '50%', padding: 2, fontWeight: '400', borderBottomWidth: 1, borderColor: '#333', textAlign: 'left' },
  metaBottomRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' },
  metaBottomItem: { padding: 4, fontSize: 10, borderLeftWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'flex-start' },
  metaBold: { fontWeight: '700', textTransform: 'uppercase' },
  headerInput: { borderBottomWidth: 0, padding: 0, fontSize: 10, textAlign: 'left' }, // Used for meta fields inside boxes
  
  // --- Monthly Info Styles ---
  monthlyInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  monthlyInputRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  monthlyLabel: { fontWeight: '700', fontSize: 10, marginRight: 4 },
  monthlyInput: { flex: 1, borderBottomWidth: 1, borderColor: '#333', padding: 4, fontSize: 12 },
  instructionBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#333', padding: 8, marginBottom: 12 },
  instructionText: { fontSize: 12, lineHeight: 18 },
  
  // --- Table Styles ---
  tableWrap: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f5f7', paddingVertical: 0 },
  groupHeader: { borderBottomWidth: 1, borderColor: '#333' },
  detailHeader: { borderBottomWidth: 2, borderColor: '#333' },
  hCell: { paddingVertical: 4, paddingHorizontal: 2, justifyContent: 'center', alignItems: 'center' },
  hText: { fontWeight: '800', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' },
  borderRight: { borderRightWidth: 1, borderRightColor: '#333' },
  
  // --- Data Row Styles ---
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', minHeight: 38 },
  cell: { padding: 1, justifyContent: 'center' },
  input: { padding: 2, fontSize: 10, textAlign: 'center', minHeight: 36, color: '#444' },
  
  // --- Footer Styles ---
  footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
  verificationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureInput: { borderBottomWidth: 1, borderColor: '#333', padding: 6, minHeight: 36, fontSize: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, paddingHorizontal: 4, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  btnText: { color: '#fff', fontWeight: '700' },
});

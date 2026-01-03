import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';
import EditableFormContainer from '../components/EditableFormContainer';
import formatTemp from '../utils/formatTemp';

const DRAFT_KEY = 'bakery_underbar_chiller_temperature_log_draft_1';
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
  complexManagerSign: '',
  hseqManagerSign: '',
  fscSign: '',
};

const initialRows = Array.from({ length: MAX_DAYS }, () => ({ ...emptyDayRow }));

const initialMeta = {
  subject: 'UNDERBAR CHILLER TEMPERATURE LOG SHEET 1',
  issueDate: '',
  companyName: 'Bravo',
  compiledBy: 'Michael C. Zulu',
  approvedBy: 'Hassani Ali',
  month: '',
  year: new Date().getFullYear().toString(),
  location: 'Bakery - Underbar Chiller 1',
  hseqManagerSign: '',
  complexManagerSign: '',
  fscSign: '',
};

// bakery category
initialMeta.category = 'Bakery';

export default function Bakery_UnderbarChillerTemperatureLog1() {
  const [rows, setRows] = useState(initialRows);
  const [meta, setMeta] = useState(initialMeta);
  const [busy, setBusy] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState(null);
  const saveTimer = useRef(null);
  const [editMode, setEditMode] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

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
        if (mounted) {
          const now = new Date();
          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const currentMonthName = monthNames[now.getMonth()];
          setMeta(prev => ({ ...prev, month: (prev.month && prev.month.trim() !== '') ? prev.month : currentMonthName }));
        }
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

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, { rows, meta }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [rows, meta]);

  const setCell = useCallback((r, k, v) => setRows(prev => prev.map((row, i) => i === r ? { ...row, [k]: v } : row)), []);
  const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const logData = rows.map((r, i) => ({
      day: i + 1,
      ...r,
      tempMorning: formatTemp(r.tempMorning),
      tempAfternoon: formatTemp(r.tempAfternoon),
      tempEvening: formatTemp(r.tempEvening),
    }));

    setBusy(true);
    try {
      const payload = {
        formType: 'UnderbarChillerTemperatureLog',
        templateVersion: 'v1.0',
        title: 'Bakery - Underbar Chiller Temperature Log 1',
        date: meta.issueDate || new Date().toLocaleDateString(),
        metadata: { ...meta, category: 'Bakery' },
        formData: logData,
        layoutHints: { COL_FLEX, GROUP_FLEX },
        _tableWidth: 800,
        assets: logoDataUri ? { logoDataUri } : {},
        savedAt: Date.now(),
      };
      await addFormHistory({ title: payload.title, date: payload.date, savedAt: payload.savedAt, payload });
      try { Alert.alert('Saved', 'Form saved'); } catch (e) { /* ignore */ }
      await removeDraft(DRAFT_KEY);
      setRows(initialRows);
      setMeta(prev => ({
        ...initialMeta,
        year: new Date().getFullYear().toString(),
        month: '',
        location: 'Bakery - Underbar Chiller 1',
        hseqManagerSign: '',
        complexManagerSign: '',
        fscSign: ''
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

  const actionButtons = (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
      <TouchableOpacity onPress={handleSaveDraft} style={[styles.btn, { backgroundColor: '#f6c342' }]} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSubmit} style={[styles.btn, { backgroundColor: '#3b82f6' }]} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit'}</Text>
      </TouchableOpacity>
    </View>
  );

  const COL_FLEX = { DATE: 1.0, TEMP: 1.5, SIGN: 1.5, CORRECTIVE_ACTION: 2.0, SUP_NAME_SIGN: 2.0, COMPLEX_SIGN: 1.8, FSC_SIGN: 1.8, HSEQ_SIGN: 1.8 };
  const GROUP_FLEX = { MORNING: COL_FLEX.TEMP + COL_FLEX.SIGN, AFTERNOON: COL_FLEX.TEMP + COL_FLEX.SIGN, EVENING: COL_FLEX.TEMP + COL_FLEX.SIGN };

  return (
    <View style={styles.container}>
      <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
        <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
          {/* Reuse same layout as kitchen form */}
          <View style={styles.metaContainer}>
            <View style={styles.metaHeaderBox}>
              <View style={styles.brandRow}>
                {(() => { try { const logo = require('../assets/logo.jpeg'); return <Image source={logo} style={styles.logoImage} resizeMode="contain" />; } catch (e) { return <View style={styles.logoPlaceholder}><Text style={styles.logoText}>Logo</Text></View>; } })()}
                <View style={styles.brandTextWrap}>
                  <Text style={styles.companyName}>{meta.companyName || 'Bravo'}</Text>
                  <Text style={styles.brandSubtitle}>Food Safety Management System</Text>
                </View>
              </View>
              <View style={styles.docInfoGrid}>
                <Text style={styles.docInfoLabel}>Issue Date:</Text>
                {editMode ? (
                  <TextInput style={[styles.docInfoValue, styles.headerInput]} value={meta.issueDate} onChangeText={v => setMetaField('issueDate', v)} placeholder="DD/MM/YYYY" editable={editMode} />
                ) : (
                  <Text style={styles.readOnlyMeta}>{meta.issueDate}</Text>
                )}
              </View>
            </View>
            <View style={styles.metaBottomRow}>
              <View style={[styles.metaBottomItem, { flex: 3 }]}>
                <Text style={styles.metaBold}>Subject:</Text>
                {editMode ? <TextInput style={styles.monthlyInput} value={meta.subject} onChangeText={v => setMetaField('subject', v)} editable={editMode} /> : <Text style={styles.readOnlyMeta}>{meta.subject}</Text>}
              </View>
              <View style={styles.metaBottomItem}>
                <Text style={styles.metaBold}>Compiled By:</Text>
                {editMode ? <TextInput style={styles.monthlyInput} value={meta.compiledBy} onChangeText={v => setMetaField('compiledBy', v)} editable={editMode} /> : <Text style={styles.readOnlyMeta}>{meta.compiledBy}</Text>}
              </View>
              <View style={styles.metaBottomItem}>
                <Text style={styles.metaBold}>Approved By:</Text>
                {editMode ? <TextInput style={styles.monthlyInput} value={meta.approvedBy} onChangeText={v => setMetaField('approvedBy', v)} editable={editMode} /> : <Text style={styles.readOnlyMeta}>{meta.approvedBy}</Text>}
              </View>
            </View>
          </View>
          <View style={styles.monthlyInfo}>
            <View style={styles.monthlyInputRow}>
              <Text style={styles.monthlyLabel}>Month:</Text>
              {editMode ? <TextInput style={styles.monthlyInput} value={meta.month} onChangeText={v => setMetaField('month', v)} placeholder="e.g., October" editable={editMode} /> : <Text style={styles.readOnlyMeta}>{meta.month}</Text>}
            </View>
            <View style={styles.monthlyInputRow}>
              <Text style={styles.monthlyLabel}>Year:</Text>
              {editMode ? <TextInput style={styles.monthlyInput} value={meta.year} onChangeText={v => setMetaField('year', v)} placeholder="e.g., 2025" keyboardType="default" editable={editMode} /> : <Text style={styles.readOnlyMeta}>{meta.year}</Text>}
            </View>
            <View style={styles.monthlyInputRow}>
              <Text style={styles.monthlyLabel}>Location:</Text>
              {editMode ? <TextInput style={[styles.monthlyInput, { flex: 3 }]} value={meta.location} onChangeText={v => setMetaField('location', v)} placeholder="e.g., Underbar Chiller" editable={editMode} /> : <Text style={[styles.readOnlyMeta, { flex: 3 }]}>{meta.location}</Text>}
            </View>
          </View>
          <View style={styles.instructionBox}><Text style={styles.instructionText}><Text style={{ fontWeight: '900' }}>Instruction:</Text> The temperature of the Underbar Chiller should be between 0°C and 4°C.</Text></View>
          <View style={styles.tableWrap}>
            <View style={[styles.tableHeaderRow, styles.groupHeader]}>
              <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.DATE }]}><Text style={styles.hText}>Date</Text></View>
              <View style={[styles.hCell, styles.borderRight, { flex: GROUP_FLEX.MORNING }]}><Text style={styles.hText}>Morning</Text></View>
              <View style={[styles.hCell, styles.borderRight, { flex: GROUP_FLEX.AFTERNOON }]}><Text style={styles.hText}>Afternoon</Text></View>
              <View style={[styles.hCell, styles.borderRight, { flex: GROUP_FLEX.EVENING }]}><Text style={styles.hText}>Evening</Text></View>
              <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.CORRECTIVE_ACTION }]}><Text style={styles.hText}>If temperature is out of specification, what was done about it?</Text></View>
              <View style={[styles.hCell, { flex: COL_FLEX.SUP_NAME_SIGN }]}><Text style={styles.hText}>SUP SIGN</Text></View>
              <View style={[styles.hCell, { flex: COL_FLEX.COMPLEX_SIGN }]}><Text style={styles.hText}>Complex Manager Sign</Text></View>
              <View style={[styles.hCell, { flex: COL_FLEX.FSC_SIGN }]}><Text style={styles.hText}>FSC Sign</Text></View>
              <View style={[styles.hCell, { flex: COL_FLEX.HSEQ_SIGN }]}><Text style={styles.hText}>HSEQ Manager Sign</Text></View>
            </View>
            <View style={[styles.tableHeaderRow, styles.detailHeader]}>
              <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.DATE }]} />
              {[...Array(3)].map((_, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.TEMP }]}><Text style={styles.hText}>Temp</Text></View>
                  <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.SIGN }]}><Text style={styles.hText}>Staff Sign</Text></View>
                </React.Fragment>
              ))}
              <View style={[styles.hCell, styles.borderRight, { flex: COL_FLEX.CORRECTIVE_ACTION }]} />
              <View style={[styles.hCell, { flex: COL_FLEX.SUP_NAME_SIGN }]} />
              <View style={[styles.hCell, { flex: COL_FLEX.COMPLEX_SIGN }]} />
              <View style={[styles.hCell, { flex: COL_FLEX.FSC_SIGN }]} />
              <View style={[styles.hCell, { flex: COL_FLEX.HSEQ_SIGN }]} />
            </View>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.row}>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.DATE }]}><Text style={{ textAlign: 'center', fontSize: 10 }}>{ri + 1}</Text></View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TEMP }]}>{editMode ? <TextInput style={styles.input} value={row.tempMorning} onChangeText={v => setCell(ri, 'tempMorning', v)} placeholder="°C" keyboardType="default" editable={editMode} /> : <Text style={styles.readOnlyCell}>{row.tempMorning}</Text>}</View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.SIGN }]}>{editMode ? <SignatureField value={row.staffSignMorning} onChange={(v) => setCell(ri, 'staffSignMorning', v)} editable={editMode} width={140} height={40} placeholder="Sign" /> : (() => { const v = row.staffSignMorning; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={140} height={40} layers={5} spread={0.8} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TEMP }]}>{editMode ? <TextInput style={styles.input} value={row.tempAfternoon} onChangeText={v => setCell(ri, 'tempAfternoon', v)} placeholder="°C" keyboardType="default" editable={editMode} /> : <Text style={styles.readOnlyCell}>{row.tempAfternoon}</Text>}</View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.SIGN }]}>{editMode ? <SignatureField value={row.staffSignAfternoon} onChange={(v) => setCell(ri, 'staffSignAfternoon', v)} editable={editMode} width={140} height={40} placeholder="Sign" /> : (() => { const v = row.staffSignAfternoon; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={140} height={40} layers={5} spread={0.8} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.TEMP }]}>{editMode ? <TextInput style={styles.input} value={row.tempEvening} onChangeText={v => setCell(ri, 'tempEvening', v)} placeholder="°C" keyboardType="default" editable={editMode} /> : <Text style={styles.readOnlyCell}>{row.tempEvening}</Text>}</View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.SIGN }]}>{editMode ? <SignatureField value={row.staffSignEvening} onChange={(v) => setCell(ri, 'staffSignEvening', v)} editable={editMode} width={140} height={40} placeholder="Sign" /> : (() => { const v = row.staffSignEvening; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={140} height={40} layers={5} spread={0.8} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
                <View style={[styles.cell, styles.borderRight, { flex: COL_FLEX.CORRECTIVE_ACTION }]}>{editMode ? <TextInput style={styles.input} value={row.outOfSpecAction} onChangeText={v => setCell(ri, 'outOfSpecAction', v)} placeholder="Action Taken" editable={editMode} /> : <Text style={styles.readOnlyCell}>{row.outOfSpecAction}</Text>}</View>
                <View style={[styles.cell, { flex: COL_FLEX.SUP_NAME_SIGN }]}>{editMode ? <SignatureField value={row.supNameSign} onChange={(v) => setCell(ri, 'supNameSign', v)} editable={editMode} width={220} height={44} placeholder="Name / Sign" /> : (() => { const v = row.supNameSign; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={220} height={44} layers={6} spread={0.9} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
                <View style={[styles.cell, { flex: COL_FLEX.COMPLEX_SIGN }]}>{editMode ? <SignatureField value={row.complexManagerSign} onChange={(v) => setCell(ri, 'complexManagerSign', v)} editable={editMode} width={160} height={44} placeholder="Complex Sign" /> : (() => { const v = row.complexManagerSign; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={160} height={44} layers={6} spread={0.9} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
                <View style={[styles.cell, { flex: COL_FLEX.FSC_SIGN }]}>{editMode ? <SignatureField value={row.fscSign} onChange={(v) => setCell(ri, 'fscSign', v)} editable={editMode} width={140} height={44} placeholder="FSC Sign" /> : (() => { const v = row.fscSign; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={140} height={44} layers={6} spread={0.9} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
                <View style={[styles.cell, { flex: COL_FLEX.HSEQ_SIGN }]}>{editMode ? <SignatureField value={row.hseqManagerSign} onChange={(v) => setCell(ri, 'hseqManagerSign', v)} editable={editMode} width={160} height={44} placeholder="HSEQ Sign" /> : (() => { const v = row.hseqManagerSign; const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null; return uri ? <SignatureThumb uri={uri} width={160} height={44} layers={6} spread={0.9} /> : <Text style={styles.readOnlyCell}>{v || ''}</Text>; })()}</View>
              </View>
            ))}
          </View>
          <View style={{ height: 110 }} />
        </ScrollView>
      </EditableFormContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfc' },
  content: { padding: 12 },
  metaContainer: { borderWidth: 2, borderColor: '#333', marginBottom: 12, backgroundColor: '#fff' },
  metaHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderColor: '#333' },
  brandRow: { flexDirection: 'row', alignItems: 'center', width: '40%' },
  logoPlaceholder: { width: 56, height: 56, marginRight: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 56, height: 56, marginRight: 8 },
  logoText: { fontSize: 12, fontWeight: '700', color: '#333' },
  brandTextWrap: { flexDirection: 'column', flexShrink: 1, marginLeft: 4 },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d', marginRight: 12 },
  brandSubtitle: { fontSize: 10, color: '#444', fontWeight: '500' },
  docInfoGrid: { width: '40%', flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#333', fontSize: 8 },
  docInfoLabel: { width: '50%', padding: 2, fontWeight: '700', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#333', textAlign: 'left' },
  docInfoValue: { width: '50%', padding: 2, fontWeight: '400', borderBottomWidth: 1, borderColor: '#333', textAlign: 'left' },
  metaBottomRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333' },
  metaBottomItem: { padding: 4, fontSize: 10, borderLeftWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'flex-start' },
  metaBold: { fontWeight: '700', textTransform: 'uppercase' },
  headerInput: { borderBottomWidth: 0, padding: 0, fontSize: 10, textAlign: 'left' },
  monthlyInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  monthlyInputRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  monthlyLabel: { fontWeight: '700', fontSize: 10, marginRight: 4 },
  monthlyInput: { flex: 1, borderBottomWidth: 1, borderColor: '#333', padding: 4, fontSize: 12 },
  instructionBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#333', padding: 8, marginBottom: 12 },
  instructionText: { fontSize: 12, lineHeight: 18 },
  tableWrap: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f5f7', paddingVertical: 0 },
  groupHeader: { borderBottomWidth: 1, borderColor: '#333' },
  detailHeader: { borderBottomWidth: 2, borderColor: '#333' },
  hCell: { paddingVertical: 4, paddingHorizontal: 2, justifyContent: 'center', alignItems: 'center' },
  hText: { fontWeight: '800', fontSize: 8, textAlign: 'center', textTransform: 'uppercase' },
  borderRight: { borderRightWidth: 1, borderRightColor: '#333' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', minHeight: 38 },
  cell: { padding: 1, justifyContent: 'center' },
  input: { padding: 2, fontSize: 10, textAlign: 'center', minHeight: 36, color: '#444' },
  footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
  verificationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureInput: { borderBottomWidth: 1, borderColor: '#333', padding: 6, minHeight: 36, fontSize: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, paddingHorizontal: 4, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  btnText: { color: '#fff', fontWeight: '700' },
  readOnlyCell: { paddingVertical: 6, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, color: '#374151' },
  readOnlyMeta: { paddingVertical: 4, paddingHorizontal: 2, fontSize: 12, color: '#374151' },
});

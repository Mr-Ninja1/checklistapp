import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import formStorage from '../utils/formStorage';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';

const DRAFT_KEY = 'process_quality_out_of_control_report_draft';

const initialFormData = {
  number: '',
  date: '', // will be auto-filled
  reportedBy: '',
  reportedBySign: '',
  reportedByTime: '',
  notified: '',
  notifiedSign: '',
  notifiedTime: '',
  outOfControlDescription: '',

  q1: '', q2: '',
  why1: '', why2: '', why3: '', why4: '', why5: '',
  rootCause: '',
  fiveWays: '',
  correctiveAction: '',
  followUp: '',

  samples: [
    { id: 1, sampleIdentification: '', result: '', specification: '', resultAfterCorrective: '' },
    { id: 2, sampleIdentification: '', result: '', specification: '', resultAfterCorrective: '' },
    { id: 3, sampleIdentification: '', result: '', specification: '', resultAfterCorrective: '' },
  ],

  outOfControlIssuedBy: '',
  originOfOutOfControl: '',

  hseqManagerSign: '',
  headOfSectionSign: '',
  complexManagerSign: '',
  signed1: '',
  signed2: '',
  signed3: '',
  spacer1: '',
  spacer2: '',
  spacer3: '',
  companyName: 'Bravo',
  companySubtitle: 'Food Safety Management System',
};

export default function ProcessQualityOutOfControlReport() {
  const [formData, setFormData] = useState(initialFormData);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  const getToday = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Load draft
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wrapped = await formStorage.loadForm(DRAFT_KEY);
        const d = wrapped?.payload || null;
        if (d && mounted) setFormData(d);
        if (mounted && (!d || !d.date)) setFormData(prev => ({ ...prev, date: getToday() }));
      } catch (e) { console.warn('load draft', e); }
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-save -> use hook's scheduleAutoSave
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => scheduleAutoSave(), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [formData]);

  const setField = useCallback((k, v) => { setFormData(prev => ({ ...prev, [k]: v })); scheduleAutoSave(); }, []);
  const setSample = (id, key, value) => setFormData(prev => ({
    ...prev,
    samples: prev.samples.map(s => s.id === id ? { ...s, [key]: value } : s)
  }));

  const buildPayload = (status = 'draft') => ({
    formType: 'ProcessQualityOutOfControlReport',
    templateVersion: '01',
    title: 'Process & Quality Out of Control Report',
    metadata: { date: formData.date, number: formData.number },
    formData,
    layoutHints: {},
    assets: {},
    savedAt: new Date().toISOString(),
    status,
  });

  const draftId = DRAFT_KEY;
  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => { setFormData(initialFormData); setFormData(prev => ({ ...prev, date: getToday() })); } });

  const handleSubmitLocal = async () => { await handleSubmit(); };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.leftHeader}>
            {(() => { try { const logo = require('../assets/logo.png'); return <Image source={logo} style={styles.logo} resizeMode="contain"/>; } catch (e) { return <View style={styles.logoPlaceholder}><Text style={styles.logoText}>Logo</Text></View>; } })()}
            <View style={styles.brandWrap}>
              <TextInput style={[styles.companyName, styles.companyNameInput]} value={formData.companyName} onChangeText={v => setField('companyName', v)} />
              <TextInput style={[styles.subtitle, styles.subtitleInput]} value={formData.companySubtitle} onChangeText={v => setField('companySubtitle', v)} />
            </View>
          </View>
          <View style={styles.titleWrap}><TextInput style={[styles.title, styles.titleInput]} value={'Process & Quality Out of Control Report'} editable={false} /></View>
        </View>

        {/* Main content: left form + right problem-solving guide (horizontally scrollable) */}
        <ScrollView horizontal contentContainerStyle={styles.horizContainer} showsHorizontalScrollIndicator={true}>
          <View style={styles.contentRowInner}>
            {/* LEFT COLUMN: Form fields */}
            <View style={[styles.leftColumn, { minWidth: 700 }]}>
            <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>PROCESS AND QUALITY OUT OF CONTROL</Text></View>

            {/* Reporting/Date Grid (4 cells) */}
            <View style={styles.gridRow}>
              <View style={[styles.cell, { flex: 1.5 }]}>
                <Text style={styles.labelText}>Number:</Text>
                <TextInput style={styles.input} value={formData.number} onChangeText={v => setField('number', v)} />
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Reported by:</Text>
                <TextInput style={styles.input} value={formData.reportedBy} onChangeText={v => setField('reportedBy', v)} />
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Sign:</Text>
                <TextInput style={styles.input} value={formData.reportedBySign} onChangeText={v => setField('reportedBySign', v)} />
              </View>
              <View style={[styles.cell, { borderRightWidth: 0 }]}>
                <Text style={styles.labelText}>Time:</Text>
                <TextInput style={styles.input} value={formData.reportedByTime} onChangeText={v => setField('reportedByTime', v)} />
              </View>
            </View>

            {/* Notified Grid */}
            <View style={styles.gridRow}>
              <View style={[styles.cell, { flex: 1.5 }]}>
                <Text style={styles.labelText}>Date:</Text>
                <TextInput style={styles.input} value={formData.date} onChangeText={v => setField('date', v)} />
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Notified:</Text>
                <TextInput style={styles.input} value={formData.notified} onChangeText={v => setField('notified', v)} />
              </View>
              <View style={styles.cell}>
                <Text style={styles.labelText}>Sign:</Text>
                <TextInput style={styles.input} value={formData.notifiedSign} onChangeText={v => setField('notifiedSign', v)} />
              </View>
              <View style={[styles.cell, { borderRightWidth: 0 }]}>
                <Text style={styles.labelText}>Time:</Text>
                <TextInput style={styles.input} value={formData.notifiedTime} onChangeText={v => setField('notifiedTime', v)} />
              </View>
            </View>

            {/* Out of Control Description */}
            <View style={styles.gridRow}>
              <View style={[styles.cell, { flex: 4, borderRightWidth: 0 }]}>
                <Text style={styles.labelText}>Out of control description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={formData.outOfControlDescription} onChangeText={v => setField('outOfControlDescription', v)} multiline />
              </View>
            </View>

            {/* Sample Identification Table */}
            <View style={[styles.gridRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Sample identification</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Result</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Specification</Text>
              <Text style={[styles.tableHeaderText, { flex: 3, borderRightWidth: 0 }]}>Result after corrective</Text>
            </View>
            {[...formData.samples].map((s, idx) => (
              <View key={`sample-${s.id}-${idx}`} style={[styles.gridRow, styles.dataRow]}> 
                <View style={[styles.cell, { flex: 3 }]}>
                  <TextInput style={styles.input} value={s.sampleIdentification} onChangeText={v => setSample(s.id, 'sampleIdentification', v)} />
                </View>
                <View style={[styles.cell, { flex: 2 }]}>
                  <TextInput style={styles.input} value={s.result} onChangeText={v => setSample(s.id, 'result', v)} />
                </View>
                <View style={[styles.cell, { flex: 2 }]}>
                  <TextInput style={styles.input} value={s.specification} onChangeText={v => setSample(s.id, 'specification', v)} />
                </View>
                <View style={[styles.cell, { flex: 3, borderRightWidth: 0 }]}>
                  <TextInput style={styles.input} value={s.resultAfterCorrective} onChangeText={v => setSample(s.id, 'resultAfterCorrective', v)} />
                </View>
              </View>
            ))}

            {/* Issued by / Origin */}
            <View style={styles.gridRow}>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text style={styles.labelText}>Out of Control Issued by:</Text>
                <TextInput style={styles.input} value={formData.outOfControlIssuedBy} onChangeText={v => setField('outOfControlIssuedBy', v)} />
              </View>
              <View style={[styles.cell, { flex: 1, borderRightWidth: 0 }]}>
                <Text style={styles.labelText}>Origin of Out of Control</Text>
                <TextInput style={[styles.input, styles.textArea]} value={formData.originOfOutOfControl} onChangeText={v => setField('originOfOutOfControl', v)} multiline />
              </View>
            </View>

            {/* Spacer rows */}
            {[...Array(3)].map((_, i) => (
              <View key={`space-${i}`} style={[styles.gridRow, styles.spacerRow]}>
                <View style={[styles.cell, { flex: 1 }]}>
                  <TextInput style={styles.input} value={formData[`spacer${i+1}`]} onChangeText={v => setField(`spacer${i+1}`, v)} />
                </View>
                <View style={[styles.cell, { flex: 1, borderRightWidth: 0 }]}> 
                  <TextInput style={styles.input} value={formData[`spacer${i+1 + 3}`]} onChangeText={v => setField(`spacer${i+1 + 3}`, v)} />
                </View>
              </View>
            ))}

            {/* Signature Area */}
            <View style={styles.signatureContainer}>
              <View style={styles.signatureRow}>
                <Text style={styles.signatureTitle}>Signed:</Text>
                <View style={styles.signatureInputContainer}>
                  <TextInput style={[styles.signatureInput, styles.signatureLineInput]} value={formData.signed1} onChangeText={v => setField('signed1', v)} placeholder="" />
                </View>
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.signatureTitle}>HSEQ MANAGER:</Text>
                <View style={styles.signatureInputContainer}>
                  <TextInput style={[styles.signatureInput, styles.signatureLineInput]} value={formData.hseqManagerSign} onChangeText={v => setField('hseqManagerSign', v)} placeholder="" />
                </View>
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.signatureTitle}>Signed:</Text>
                <View style={styles.signatureInputContainer}>
                  <TextInput style={[styles.signatureInput, styles.signatureLineInput]} value={formData.signed2} onChangeText={v => setField('signed2', v)} placeholder="" />
                </View>
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.signatureTitle}>Head of Section:</Text>
                <View style={styles.signatureInputContainer}>
                  <TextInput style={[styles.signatureInput, styles.signatureLineInput]} value={formData.headOfSectionSign} onChangeText={v => setField('headOfSectionSign', v)} placeholder="" />
                </View>
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.signatureTitle}>Signed:</Text>
                <View style={styles.signatureInputContainer}>
                  <TextInput style={[styles.signatureInput, styles.signatureLineInput]} value={formData.signed3} onChangeText={v => setField('signed3', v)} placeholder="" />
                </View>
              </View>

              <View style={styles.signatureRow}>
                <Text style={styles.signatureTitle}>Complex manager:</Text>
                <View style={styles.signatureInputContainer}>
                  <TextInput style={[styles.signatureInput, styles.signatureLineInput]} value={formData.complexManagerSign} onChangeText={v => setField('complexManagerSign', v)} placeholder="" />
                </View>
              </View>
            </View>
            </View>
            {/* RIGHT COLUMN: Problem Solving Guide */}
            <View style={[styles.rightColumn, { minWidth: 420, paddingLeft: 12 }]}> 
              <View style={styles.problemBlock}><Text style={styles.questionText}>1. What happened to process or Quality parameter?</Text><TextInput style={[styles.solutionInput, { minHeight: 60 }]} multiline value={formData.q1} onChangeText={v => setField('q1', v)} /></View>
              <View style={styles.problemBlock}><Text style={styles.questionText}>2. What was the possible cause?</Text><TextInput style={[styles.solutionInput, { minHeight: 60 }]} multiline value={formData.q2} onChangeText={v => setField('q2', v)} /></View>

              <View style={styles.problemBlock}><Text style={styles.questionText}>Five ways to establish root cause. What was wrong?</Text><TextInput style={[styles.solutionInput, { minHeight: 80 }]} multiline value={formData.fiveWays} onChangeText={v => setField('fiveWays', v)} /></View>

              {[1,2,3,4,5].map(i => (
                <View key={`why-${i}`} style={styles.problemBlock}><Text style={styles.actionHeader}>{`${i}. Why?`}</Text><TextInput style={[styles.solutionInput, { minHeight: 40 }]} multiline value={formData[`why${i}`]} onChangeText={v => setField(`why${i}`, v)} /></View>
              ))}

              <View style={styles.problemBlock}><Text style={styles.actionHeader}>Root cause of the problem</Text><TextInput style={[styles.solutionInput, { minHeight: 50 }]} multiline value={formData.rootCause} onChangeText={v => setField('rootCause', v)} /></View>
              <View style={styles.problemBlock}><Text style={styles.actionHeader}>Corrective Action:</Text><TextInput style={[styles.solutionInput, { minHeight: 50 }]} multiline value={formData.correctiveAction} onChangeText={v => setField('correctiveAction', v)} /></View>
              <View style={styles.problemBlock}><Text style={styles.actionHeader}>Follow up:</Text><TextInput style={[styles.solutionInput, { minHeight: 50 }]} multiline value={formData.followUp} onChangeText={v => setField('followUp', v)} /></View>
            </View>
          </View>
  </ScrollView>

  <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={() => setDraft(DRAFT_KEY, formData)} disabled={busy}><Text style={styles.btnText}>Save Draft</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Report'}</Text></TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfc' },
  content: { padding: 12 },
  headerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 56, height: 56, marginRight: 8 },
  logoPlaceholder: { width: 56, height: 56, marginRight: 8, backgroundColor: '#fff', borderWidth:1, borderColor:'#ccc', justifyContent:'center', alignItems:'center' },
  logoText: { fontWeight: '700' },
  brandWrap: { flexDirection: 'column' },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  subtitle: { fontSize: 10, color: '#444' },
  companyNameInput: { padding: 0, borderWidth: 0, fontSize: 16, fontWeight: '800', color: '#185a9d' },
  subtitleInput: { padding: 0, borderWidth: 0, fontSize: 10, color: '#444' },
  titleInput: { padding: 0, borderWidth: 0, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '800' },

  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaItem: { flex: 1, paddingRight: 8 },
  metaLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  input: { borderBottomWidth: 1, borderColor: '#333', padding: 6, marginBottom: 6, backgroundColor: '#fff' },
  smallInput: { borderBottomWidth: 1, borderColor: '#333', padding: 6, marginVertical: 4, backgroundColor: '#fff' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  actionRow: { flexDirection: 'row', marginBottom: 8 },
  actionBlock: { flex: 1, paddingRight: 8 },
  rowSmall: { flexDirection: 'row', gap: 8 },

  section: { marginBottom: 12 },
  sectionTitle: { fontWeight: '800', marginBottom: 6 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#eaeff6', padding: 6 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderColor: '#eee' },
  tableCell: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  tableCellInput: { borderWidth: 0, padding: 4, borderRightWidth: 1, borderRightColor: '#eee' },

  // new grid/cell styles (from template)
  contentRow: { flexDirection: 'row' },
  leftColumn: { flex: 2, borderRightWidth: 1, borderColor: '#000' },
  rightColumn: { flex: 1 },
  sectionHeader: { backgroundColor: '#ddd', padding: 5, borderBottomWidth: 1, borderColor: '#000' },
  sectionHeaderText: { fontWeight: 'bold', textAlign: 'center', fontSize: 12 },
  gridRow: { flexDirection: 'row' },
  cell: { borderBottomWidth: 1, borderColor: '#000', paddingHorizontal: 0, flex: 1 },
  labelText: { fontSize: 10, paddingHorizontal: 4, paddingTop: 2, fontWeight: 'bold', backgroundColor: '#fff' },
  tableHeaderRow: { backgroundColor: '#ccc', borderBottomWidth: 2 },
  tableHeaderText: { fontWeight: 'bold', fontSize: 10, padding: 4, borderRightWidth: 1, borderColor: '#000', textAlign: 'center' },
  dataRow: { minHeight: 30 },
  spacerRow: { minHeight: 30, borderBottomWidth: 1, borderColor: '#000' },

  signatureContainer: { padding: 10, borderTopWidth: 1, borderColor: '#000' },
  signatureRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 0 },
  signatureTitle: { fontSize: 12, fontWeight: 'bold', width: 120, paddingBottom: 2 },
  signatureInputContainer: { flex: 1 },
  signatureInput: { height: 20, fontSize: 12 },
  line: { borderBottomWidth: 1, borderBottomColor: '#000', width: '100%', marginVertical: 2 },

  // make the signature TextInput span the line area visually
  signatureLineInput: { height: 28, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#fff' },

  problemBlock: { borderBottomWidth: 1, borderColor: '#000', minHeight: 40 },
  questionText: { fontSize: 11, padding: 4, fontWeight: 'bold' },
  actionHeader: { fontWeight: 'bold', fontSize: 12, padding: 4 },
  solutionInput: { minHeight: 40, borderTopWidth: 1, borderColor: '#000', padding: 4, fontSize: 12, flex: 1, backgroundColor: '#fff' },
  horizContainer: { paddingLeft: 12, paddingRight: 24 },
  contentRowInner: { flexDirection: 'row' },

  sectionRow: { flexDirection: 'row', marginBottom: 12 },
  halfSection: { flex: 1, paddingRight: 8 },

  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});

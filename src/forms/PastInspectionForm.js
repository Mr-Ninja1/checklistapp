import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import formStorage from '../utils/formStorage';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';

const DRAFT_KEY = 'past_inspection_form_draft';

// --- Hardcoded Row Data (Equivalent to manual entry) ---
// This array explicitly defines all 31 rows with their date labels.
const hardcodedDayRows = [
    // Array of objects with dateLabel property
    { id: 1, dateLabel: '1st', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 2, dateLabel: '2nd', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 3, dateLabel: '3rd', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 4, dateLabel: '4th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 5, dateLabel: '5th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 6, dateLabel: '6th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 7, dateLabel: '7th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 8, dateLabel: '8th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 9, dateLabel: '9th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 10, dateLabel: '10th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 11, dateLabel: '11th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 12, dateLabel: '12th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 13, dateLabel: '13th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 14, dateLabel: '14th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 15, dateLabel: '15th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 16, dateLabel: '16th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 17, dateLabel: '17th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 18, dateLabel: '18th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 19, dateLabel: '19th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 20, dateLabel: '20th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 21, dateLabel: '21st', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 22, dateLabel: '22nd', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 23, dateLabel: '23rd', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 24, dateLabel: '24th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 25, dateLabel: '25th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 26, dateLabel: '26th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 27, dateLabel: '27th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 28, dateLabel: '28th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 29, dateLabel: '29th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 30, dateLabel: '30th', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
    { id: 31, dateLabel: '31st', area: '', type: '', qty: '', comment: '', inspector: '', sign: '' },
];


const initialState = () => {
  return {
    companyName: 'Bravo',
    companySubtitle: 'Food Safety Management System',
    subject: 'Pest Inspection Form',
    compiledBy: '',
    approvedBy: '',
    hseqManager: '',
    issueDate: '',
    rows: hardcodedDayRows,
  };
};

// --- Main Component ---
export default function PastInspectionForm() {
  const [state, setState] = useState(initialState());
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  // build payload for save operations
  const buildPayload = (status = 'draft') => ({
    formType: 'PastInspectionForm',
    templateVersion: '01',
    title: 'Pest Inspection Form',
    metadata: {
      companyName: state.companyName,
      companySubtitle: state.companySubtitle,
      subject: state.subject,
      compiledBy: state.compiledBy,
      approvedBy: state.approvedBy,
      hseqManager: state.hseqManager,
      issueDate: state.issueDate,
    },
    formData: state.rows,
    layoutHints: {},
    assets: {},
    savedAt: new Date().toISOString(),
    status,
  });

  const draftId = DRAFT_KEY;
  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => setState(initialState()) });

  // preload draft if present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wrapped = await formStorage.loadForm(draftId);
        const payload = wrapped?.payload || null;
        if (payload && mounted) {
          if (payload.metadata) {
            setState(prev => ({ ...prev, ...payload.metadata }));
          }
          if (payload.formData) {
            setState(prev => ({ ...prev, rows: payload.formData }));
          }
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  // --- Functional Logic (Kept for completeness) ---
  const setField = useCallback((k, v) => {
    setState(prev => ({ ...prev, [k]: v }));
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const setRow = (id, key, value) => {
    setState(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === id ? { ...r, [key]: value } : r)
    }));
    scheduleAutoSave();
  };

  const handleSubmitLocal = async () => { await handleSubmit(); };

  // --- Column Definitions ---
  // Flex values kept the same for proportional scaling
  const columns = [
    { key: 'date', label: 'Date', flex: 1.2 },
    { key: 'area', label: 'Area Inspected', flex: 3.5 },
    { key: 'type', label: 'Type of Pest', flex: 2 },
    { key: 'qty', label: 'Qty', flex: 1.2 },
    { key: 'comment', label: 'Comment/Corrective Action Taken', flex: 5.5 },
    { key: 'inspector', label: 'Name of Inspector', flex: 2.5 },
    { key: 'sign', label: "Complex Manager's Sign", flex: 3.5 },
  ];

  // --- Inspection Row Component ---
  const InspectionRow = ({ dateLabel, isHeader = false, row = null }) => {
    if (isHeader) {
      return (
        <View style={styles.headerRow}>
          {columns.map((col, index) => (
            index === 0 ? (
              <View key={col.key} style={[styles.dateCell, { flex: col.flex }]} />
            ) : (
              <View key={col.key} style={[styles.headerCell, { flex: col.flex }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            )
          ))}
        </View>
      );
    }

    return (
      <View style={styles.logRow}>
        {/* Column 1: Date (Hardcoded 1st, 2nd, etc.) */}
        <View style={[styles.dateCell, { flex: columns[0].flex }]}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>
        
        {/* Remaining Columns (Data Inputs) */}
        {columns.slice(1).map(col => (
          <View key={col.key} style={[styles.dataCell, { flex: col.flex }]}>
            <TextInput
              style={styles.inputField}
              value={row ? row[col.key] : ''}
              onChangeText={v => { if (row) setRow(row.id, col.key, v); }}
              textAlignVertical="center"
            />
          </View>
        ))}
      </View>
    );
  };

  // --- Render Function ---
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainContainer}>

          {/* Header Section */}
          <View style={styles.metadataHeader}>
            <View style={styles.logoAndSubject}>
              {(() => {
                try {
                  const logo = require('../assets/logo.png');
                  return <Image source={logo} style={styles.brandLogoImage} resizeMode="contain" />;
                } catch (e) {
                  return <Text style={styles.brandLogo}>Bravo</Text>;
                }
              })()}

              <View style={styles.metaTextBox}>
                <TextInput style={styles.companyNameLarge} value={state.companyName} onChangeText={v => setField('companyName', v)} />
                <Text style={styles.formTitleLabel}>Pest Inspection Form</Text>
                <Text style={styles.metaSystem}>{state.companySubtitle}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Compiled by:</Text>
              <TextInput style={styles.metaInput} value={state.compiledBy} onChangeText={v => setField('compiledBy', v)} />

              <Text style={styles.metaLabel}>Approved By:</Text>
              <TextInput style={styles.metaInput} value={state.approvedBy} onChangeText={v => setField('approvedBy', v)} />
              
              {/* version/revision removed as requested */}
            </View>
          </View>

          {/* Table */}
          <View style={styles.logTable}>
            <InspectionRow isHeader={true} />
            {/* Renders all 31 hardcoded rows */}
            {state.rows.map(r => <InspectionRow key={`row-${r.id}`} dateLabel={r.dateLabel} row={r} />)}
          </View>

          {/* Footer */}
          <View style={styles.verificationFooter}>
            <View style={styles.hseqManagerRow}>
              <Text style={styles.verifiedByText}>Verified by:</Text>
              <Text style={styles.hseqLabel}>HSEQ Manager</Text>
              <TextInput 
                style={styles.hseqLineInput} 
                value={state.hseqManager || ''} 
                onChangeText={v => setField('hseqManager', v)} 
              />
            </View>
          </View>

          {/* Functional Buttons provided by FormActionBar */}
          <View style={styles.buttonRow}>
            <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={handleSubmitLocal} showSavePdf={false} />
          </View>

          <LoadingOverlay visible={isSaving} />
          <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />

        </View>
      </ScrollView>
    </View>
  );
}

// --- Stylesheet (Refactored for Larger Form Size) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  scrollContainer: {
    padding: 10,
    alignItems: 'center',
  },
  mainContainer: {
    // Increased size for a bigger form appearance
    width: 800,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    minHeight: 1000,
  },

  // HEADER STYLES (Scaled up proportionally)
  metadataHeader: { padding: 15, paddingBottom: 8 },
  logoAndSubject: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogoImage: { width: 80, height: 80, marginRight: 12 },
   companyNameLarge: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
   formTitleLabel: { fontSize: 22, fontWeight: '900', marginTop: 6, color: '#111' },
  metaTextBox: { flex: 1 },
  metaSystem: { fontSize: 12, color: '#333' },
  formTitle: { fontSize: 23, fontWeight: '800', borderBottomWidth: 0, marginTop: 6 },
  metaCompiled: { fontSize: 12, marginTop: 6 },
  metaApproved: { fontSize: 12, marginTop: 2, color: 'red' },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingTop: 8 },
  metaLabel: { fontSize: 12, marginRight: 3, fontWeight: '400' },
  metaInput: { fontSize: 12, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 1, paddingHorizontal: 3, marginRight: 20, minWidth: 90, height: 18 },

  // TABLE STYLES
  // Add a left border to the grid and make vertical separators stronger so column lines are visible
  logTable: { borderTopWidth: 1, borderLeftWidth: 1.2, borderColor: '#000' },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1.2, borderColor: '#000', minHeight: 50, alignItems: 'stretch' },
  logRow: { flexDirection: 'row', borderBottomWidth: 1.2, borderColor: '#000', minHeight: 35, alignItems: 'stretch' },

  // Header Cells
  headerCell: { borderRightWidth: 1.2, borderColor: '#000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 3 },
  headerText: { fontWeight: '700', fontSize: 11, textAlign: 'center', lineHeight: 14 },

  // Data Cells
  dateCell: { borderRightWidth: 1.2, borderColor: '#000', justifyContent: 'center', alignItems: 'center', paddingVertical: 3 },
  dateLabel: { fontSize: 12, fontWeight: '400', textAlign: 'center' },
  dataCell: { borderRightWidth: 1.2, borderColor: '#000', justifyContent: 'center', padding: 0 },
  inputField: { flex: 1, fontSize: 12, paddingHorizontal: 6, paddingVertical: 3, minHeight: 35, backgroundColor: '#fff', textAlignVertical: 'center' },

  // FOOTER STYLES
  verificationFooter: { padding: 15, paddingBottom: 0, borderTopWidth: 1, borderColor: '#000' },
  verifiedByText: { fontSize: 12, fontWeight: '700', marginRight: 8 },
  hseqManagerRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, marginBottom: 15 },
  hseqLabel: { fontSize: 12, fontWeight: '400', marginRight: 15 },
  hseqLineInput: { flex: 1, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 3, fontSize: 12 },

  // BUTTON STYLES (Functional)
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 15, borderTopWidth: 1, borderColor: '#ccc' },
  btn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
  draftBtn: { backgroundColor: '#f6c342' },
  submitBtn: { backgroundColor: '#3b82f6' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import formStorage from '../utils/formStorage';
import FormActionBar from '../components/FormActionBar';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';

const DRAFT_KEY = 'baking_control_sheet_draft';

const initialEntry = {
  prodDate: '',
  prodName: '',
  batchNo: '',
  proofingTemp: '',
  proofingTime: '',
  ovenTemp: '',
  bakingTime: '',
  bakerSign: '',
  supervisorSign: '',
};

const initialLogState = Array.from({ length: 15 }, () => ({ ...initialEntry }));

const initialMetadata = {
  issueDate: '',
  compiledBy: 'Michael Zulu C.',
  approvedBy: 'Hassani Ali',
};

export default function BakingControlSheet({ navigation }) {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);

  const buildPayload = (status = 'draft') => ({
    formType: 'BakingControlSheet',
    templateVersion: '01',
    title: 'Baking Control Sheet',
    metadata,
    formData,
    layoutHints: {},
    assets: {},
    savedAt: new Date().toISOString(),
    status,
  });

  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({
    buildPayload,
    draftId: DRAFT_KEY,
    clearOnSubmit: () => {
      setFormData(initialLogState);
      setMetadata(initialMetadata);
    },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await formStorage.loadForm(DRAFT_KEY);
        const payload = d?.payload || null;
        if (payload && mounted) {
          if (payload.formData) setFormData(payload.formData);
          if (payload.metadata) setMetadata(payload.metadata);
        } else if (mounted) {
          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const yyyy = today.getFullYear();
          setMetadata(prev => ({ ...prev, issueDate: `${dd}/${mm}/${yyyy}` }));
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, []);

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newData = prev.map((item, i) => i === index ? { ...item, [field]: value } : item);
      scheduleAutoSave();
      return newData;
    });
  }, [scheduleAutoSave]);

  // Wider columns for A4 landscape friendliness
  const columnHeaders = useMemo(() => [
    { key: 'prodDate', label: 'PRODUCTION DATE', width: 120 },
    { key: 'prodName', label: 'PRODUCT NAME', width: 220 },
    { key: 'batchNo', label: 'BATCH NO.', width: 120 },
    { key: 'proofingTemp', label: 'PROOFING TEMP', width: 140 },
    { key: 'proofingTime', label: 'PROOFING TIME', width: 120 },
    { key: 'ovenTemp', label: 'OVEN TEMP', width: 140 },
    { key: 'bakingTime', label: 'BAKING TIME', width: 120 },
    { key: 'bakerSign', label: 'BAKER SIGN', width: 160 },
    { key: 'supervisorSign', label: 'SUPERVISOR SIGN', width: 160 },
  ], []);

  const renderRow = (item, index) => (
    <View key={index} style={styles.row}>
      {columnHeaders.map(col => (
        <View key={col.key} style={[styles.cell, { width: col.width }]}>
          <TextInput
            value={item[col.key]}
            onChangeText={v => handleEntryChange(index, col.key, v)}
            style={styles.input}
            multiline={true}
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
              <View style={styles.headerTop}>
                <View style={styles.logoWrap}>
                  <Image source={require('../assets/logo.jpeg')} style={styles.logo} />
                  <View>
                    <Text style={styles.brand}>Bravo Brands Limited</Text>
                    <Text style={styles.sub}>Food Safety Management System</Text>
                  </View>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Issue Date: {metadata.issueDate}</Text>
                </View>
              </View>
          <View style={styles.subjectRow}><Text style={styles.subjectText}>Subject: BAKING CONTROL SHEET</Text></View>
          <View style={styles.signRow}>
            <Text style={styles.metaSmall}>Compiled By: {metadata.compiledBy}</Text>
            <Text style={styles.metaSmall}>Approved By: {metadata.approvedBy}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={styles.noteText}>This form should be completed daily by both Baker Man and Supervisor. File this form as evidence of performing the controls.</Text>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            {columnHeaders.map(col => (
              <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>
          {formData.map(renderRow)}
        </View>

                        <FormActionBar
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          showSavePdf={false} // or true, depending on requirements
        />
        <LoadingOverlay visible={isSaving} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12 },
  headerBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef2', marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 48, height: 48, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  sub: { fontSize: 12, color: '#43cea2' },
  metaCol: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 12, color: '#333' },
  subjectRow: { paddingVertical: 8, alignItems: 'center' },
  subjectText: { fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaSmall: { fontSize: 12, color: '#333' },
  noteBox: { backgroundColor: '#fff9f0', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#f0d9b5', marginBottom: 12 },
  noteTitle: { fontWeight: '700', marginBottom: 4 },
  noteText: { fontSize: 12, color: '#444' },
  // stronger borders for print and visibility
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.5, borderColor: '#333', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.5, borderColor: '#333' },
  headerCell: { padding: 8, borderRightWidth: 1.2, borderRightColor: '#333' },
  headerText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1.2, borderColor: '#333' },
  cell: { padding: 6, borderRightWidth: 1.2, borderRightColor: '#333' },
  // make inputs taller for multi-line content
  input: { padding: 8, fontSize: 12, textAlign: 'left', minHeight: 48, lineHeight: 18 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});

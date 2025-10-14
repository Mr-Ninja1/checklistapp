import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, Image, Alert, TouchableOpacity, useWindowDimensions } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { addFormHistory } from '../utils/formHistory';
import useExportFormAsPDF from '../utils/useExportFormAsPDF';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import useResponsive from '../utils/responsive';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import formStorage from '../utils/formStorage';
import { useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import LoadingOverlay from '../components/LoadingOverlay';

// Helper functions for dynamic details
function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${day}/${year}`;
}
function getCurrentShift() {
  const hour = new Date().getHours();
  return hour < 12 ? 'AM' : 'PM';
}

const TIME_SLOTS = [
  '06:00AM', '07:00AM', '08:00AM', '09:00AM', '10:00AM',
  '11:00AM', '12:00PM', '13:00PM', '14:00PM', '15:00PM',
];
const NUM_ROWS = 14;

function createInitialChecks() {
  return TIME_SLOTS.reduce((acc, time) => ({ ...acc, [time]: false }), {});
}

export default function FoodHandlersHandwashingForm() {
  const { ref } = useExportFormAsPDF();
  const [exporting, setExporting] = useState(false);
  const [logDetails, setLogDetails] = useState({
    date: getCurrentDate(),
    location: '',
    shift: getCurrentShift(),
    verifiedBy: '',
    complexManagerSign: '',
  });
  const [loadingDraft, setLoadingDraft] = React.useState(true);
  const draftKey = 'foodhandlers_handwashing';
  const saveTimer = useRef(null);
  const navigation = useNavigation();

  // Table state
  const [handlers, setHandlers] = useState(() =>
    Array.from({ length: NUM_ROWS }, () => ({
      fullName: '',
      jobTitle: '',
      checks: createInitialChecks(),
      staffSign: '',
      supName: '',
      supSign: '',
    }))
  );

  const updateHandlerField = (rowIdx, field, value) => {
    setHandlers(prev => prev.map((row, idx) => (idx === rowIdx ? { ...row, [field]: value } : row)));
  };

  const toggleHandlerCheck = (rowIdx, timeSlot) => {
    setHandlers(prev => prev.map((row, idx) =>
      idx === rowIdx
        ? { ...row, checks: { ...row.checks, [timeSlot]: !row.checks[timeSlot] } }
        : row
    ));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await getDraft(draftKey);
      if (d && mounted) {
        if (d.handlers) setHandlers(d.handlers);
        if (d.logDetails) setLogDetails(d.logDetails);
      }
      if (mounted) setLoadingDraft(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(draftKey, { handlers, logDetails }), 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [handlers, logDetails]);

  // responsive helpers
  const resp = useResponsive();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // tweak sizes for landscape to fit more columns
  const dyn = {
    containerPadding: resp.s(isLandscape ? 12 : 20),
    logoSize: resp.s(isLandscape ? 40 : 48),
    logoMargin: resp.s(isLandscape ? 8 : 12),
    titleFont: resp.ms(isLandscape ? 18 : 20),
    inputPadding: resp.s(8),
    inputFont: resp.ms(isLandscape ? 13 : 14),
    managerWidth: resp.s(isLandscape ? 100 : 120),
    timeCellW: resp.s(isLandscape ? 48 : 55),
    nameW: resp.s(isLandscape ? 130 : 160),
    jobW: resp.s(isLandscape ? 100 : 120),
    snW: resp.s(isLandscape ? 36 : 40),
    signW: resp.s(isLandscape ? 80 : 100),
    checkboxW: resp.s(isLandscape ? 48 : 55),
    saveBtnPV: resp.s(isLandscape ? 10 : 12),
    saveBtnPH: resp.s(isLandscape ? 20 : 28),
    saveBtnRadius: resp.s(isLandscape ? 18 : 20),
    saveBtnFont: resp.ms(isLandscape ? 14 : 16),
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLogDetails(prev => ({ ...prev, date: getCurrentDate(), shift: getCurrentShift() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePDF = async () => {
    setExporting(true);
    setBusy(true);
    try {
      await new Promise(res => setTimeout(res, 250));
      const handlersWithId = handlers.map((h, idx) => ({ id: idx + 1, ...h }));

      // try to embed logo as base64 for perfect saved rendering (best-effort)
      let logoDataUri = null;
      try {
        const asset = Asset.fromModule(require('../assets/logo.png'));
        await asset.downloadAsync();
        if (asset.localUri) {
          // read file as base64 (may fail on some environments)
          try {
            const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
            if (b64) logoDataUri = `data:image/png;base64,${b64}`;
          } catch (e) {
            // ignore and proceed without embedded image
            logoDataUri = null;
          }
        }
      } catch (e) {
        // best-effort, ignore failures
        logoDataUri = null;
      }

      const payload = {
        formType: 'FoodHandlersHandwashing',
        templateVersion: 'v1.0',
        title: 'Food Handlers Daily Handwashing Tracking Log Sheet',
        date: logDetails.date,
        location: logDetails.location,
        shift: logDetails.shift,
        verifiedBy: logDetails.verifiedBy,
        timeSlots: TIME_SLOTS,
        handlers: handlersWithId,
        assets: logoDataUri ? { logoDataUri } : undefined,
        layoutHints: {
          nameW: dyn.nameW,
          jobW: dyn.jobW,
          signW: dyn.signW,
        }
      };

      const formId = `FoodHandlersHandwashing_${Date.now()}`;
      try {
        await formStorage.saveForm(formId, payload);
        setExporting(false);
        // clear draft and reset form fields
        try { await removeDraft(draftKey); } catch (e) {}
        setHandlers(Array.from({ length: NUM_ROWS }, () => ({
          fullName: '',
          jobTitle: '',
          checks: createInitialChecks(),
          staffSign: '',
          supName: '',
          supSign: '',
        })));
        setLogDetails({ date: getCurrentDate(), location: '', shift: getCurrentShift(), verifiedBy: '', complexManagerSign: '' });
        Alert.alert('Saved', 'Form saved to history. You can Export PDF from the Saved Forms screen.');
      } catch (e) {
        setExporting(false);
        console.warn('save payload failed', e);
        Alert.alert('Error', 'Failed to save form payload.');
      }
    } catch (e) {
      setExporting(false);
      Alert.alert('Error', 'Failed to save form.');
    } finally {
      // ensure the busy overlay is always cleared
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      // Build a deterministic payload that can be rendered exactly later
      const formId = `FoodHandlersHandwashing_${Date.now()}`;
      const handlersWithId = handlers.map((h, idx) => ({ id: idx + 1, ...h }));
      const payload = {
        formType: 'FoodHandlersHandwashing',
        templateVersion: 'v1.0',
        title: 'Food Handlers Daily Handwashing Tracking Log Sheet',
        date: logDetails.date,
        shift: logDetails.shift,
        location: logDetails.location,
        verifiedBy: logDetails.verifiedBy,
        complexManagerSign: logDetails.complexManagerSign,
        timeSlots: TIME_SLOTS,
        handlers: handlersWithId,
        // layout hints help desktop/renderer match the original spacing if needed
        layoutHints: {
          nameW: dyn.nameW,
          jobW: dyn.jobW,
          signW: dyn.signW,
        }
      };

      await formStorage.saveForm(formId, payload);
      try { await removeDraft(draftKey); } catch (e) {}
      // reset form fields after successful save
      setHandlers(Array.from({ length: NUM_ROWS }, () => ({
        fullName: '',
        jobTitle: '',
        checks: createInitialChecks(),
        staffSign: '',
        supName: '',
        supSign: '',
      })));
      setLogDetails({ date: getCurrentDate(), location: '', shift: getCurrentShift(), verifiedBy: '', complexManagerSign: '' });
      alert('Submitted and saved');
      navigation.navigate('Home');
    } catch (e) { alert('Failed to submit'); }
    finally { setBusy(false); }
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await setDraft(draftKey, { handlers, logDetails });
      alert('Draft saved');
    } catch (e) { alert('Failed to save draft'); }
    finally { setBusy(false); }
  };

  const handleBack = () => navigation.navigate('Home');
  const [busy, setBusy] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoadingOverlay visible={busy || exporting} message={busy ? 'Working...' : 'Saving PDF...'} />
      <Spinner visible={exporting} textContent={'Saving PDF...'} textStyle={{ color: '#fff' }} />
  <ScrollView contentContainerStyle={[styles.container, { padding: dyn.containerPadding }]} ref={ref} horizontal={false} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic" style={{ flex: 1 }}>
        <View style={styles.logoRow}>
          <Image source={require('../assets/logo.png')} style={[styles.logo, { width: dyn.logoSize, height: dyn.logoSize, marginRight: dyn.logoMargin, borderRadius: resp.ms(10) }]} resizeMode="contain" />
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <Text style={[styles.companyNameSmall]}>Bravo</Text>
          </View>
        </View>
        <View style={styles.titleRow}><Text style={[styles.title, { fontSize: dyn.titleFont } ]}>Food Handlers Daily Handwashing Tracking Log Sheet</Text></View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Date:</Text>
            <TextInput
              style={[styles.input, { padding: dyn.inputPadding, fontSize: dyn.inputFont }]}
              value={logDetails.date}
              editable={false}
              placeholder="MM/DD/YYYY"
            />
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Location:</Text>
            <TextInput
              style={[styles.input, { padding: dyn.inputPadding, fontSize: dyn.inputFont }]}
              value={logDetails.location}
              onChangeText={text => setLogDetails(prev => ({ ...prev, location: text }))}
              placeholder="Enter Location"
            />
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Shift:</Text>
            <TextInput
              style={[styles.input, { padding: dyn.inputPadding, fontSize: dyn.inputFont }]}
              value={logDetails.shift}
              editable={false}
            />
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Verified By:</Text>
            <TextInput
              style={[styles.input, { padding: dyn.inputPadding, fontSize: dyn.inputFont }]}
              value={logDetails.verifiedBy}
              onChangeText={text => setLogDetails(prev => ({ ...prev, verifiedBy: text }))}
              placeholder="Enter Verifier Name"
            />
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItemFull}>
            <Text style={styles.label}>Complex Manager Sign:</Text>
            <TextInput
              style={[styles.input, styles.managerSignInput, { width: dyn.managerWidth, minWidth: resp.s(80), maxWidth: resp.s(160), padding: dyn.inputPadding, fontSize: dyn.inputFont }]}
              value={logDetails.complexManagerSign}
              onChangeText={text => setLogDetails(prev => ({ ...prev, complexManagerSign: text }))}
              placeholder="Signature/Initials"
            />
          </View>
        </View>

        {/* Table */}
  {/* horizontal table scroll - allows many time columns on both orientations */}
  <ScrollView horizontal style={[styles.tableScroll, { marginTop: dyn.containerPadding }]} contentContainerStyle={{ flexGrow: 1 }}>
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.snCell, { borderRightWidth: 1, borderColor: '#ccc', minWidth: dyn.snW, width: dyn.snW }]}>S/N</Text>
              <Text style={[styles.headerCell, styles.nameCell, { borderRightWidth: 1, borderColor: '#ccc', minWidth: dyn.nameW, width: dyn.nameW }]}>Full Name</Text>
              <Text style={[styles.headerCell, styles.jobCell, { borderRightWidth: 1, borderColor: '#ccc', minWidth: dyn.jobW, width: dyn.jobW }]}>Job Title</Text>
              {TIME_SLOTS.map((time) => (
                <Text key={time} style={[styles.headerCell, styles.timeCellHeader, { minWidth: dyn.timeCellW, width: dyn.timeCellW }]}>{time}</Text>
              ))}
              <Text style={[styles.headerCell, styles.signCell, { borderRightWidth: 1, borderColor: '#ccc', minWidth: dyn.signW, width: dyn.signW }]}>Staff Sign</Text>
              <Text style={[styles.headerCell, styles.supCell, { borderRightWidth: 1, borderColor: '#ccc', minWidth: dyn.signW, width: dyn.signW }]}>Sup Name</Text>
              <Text style={[styles.headerCell, styles.signCell, { borderRightWidth: 0, minWidth: dyn.signW, width: dyn.signW }]}>Sup Sign</Text>
            </View>

            {handlers.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.tableRow}>
                <Text style={[styles.dataCell, styles.snCell, { minWidth: dyn.snW, width: dyn.snW }]}>{rowIdx + 1}</Text>
                <TextInput
                  style={[styles.inputCell, styles.nameCell, { minWidth: dyn.nameW, width: dyn.nameW, padding: resp.s(4), fontSize: resp.ms(12) }]}
                  value={row.fullName}
                  onChangeText={text => updateHandlerField(rowIdx, 'fullName', text)}
                  placeholder="Full Name"
                />
                <TextInput
                  style={[styles.inputCell, styles.jobCell, { minWidth: dyn.jobW, width: dyn.jobW, padding: resp.s(4), fontSize: resp.ms(12) }]}
                  value={row.jobTitle}
                  onChangeText={text => updateHandlerField(rowIdx, 'jobTitle', text)}
                  placeholder="Job Title"
                />
                {TIME_SLOTS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.checkboxTouchable, { minWidth: dyn.checkboxW, width: dyn.checkboxW, padding: resp.s(2) }]}
                    onPress={() => toggleHandlerCheck(rowIdx, time)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.checkboxCellText, { fontSize: resp.ms(16) }]}>{row.checks[time] ? '☑' : '☐'}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[styles.inputCell, styles.signCell, { minWidth: dyn.signW, width: dyn.signW, padding: resp.s(4), fontSize: resp.ms(12) }]}
                  value={row.staffSign}
                  onChangeText={text => updateHandlerField(rowIdx, 'staffSign', text)}
                  placeholder="Sign"
                />
                <TextInput
                  style={[styles.inputCell, styles.supCell, { minWidth: dyn.signW, width: dyn.signW, padding: resp.s(4), fontSize: resp.ms(12) }]}
                  value={row.supName}
                  onChangeText={text => updateHandlerField(rowIdx, 'supName', text)}
                  placeholder="Sup Name"
                />
                <TextInput
                  style={[styles.inputCell, styles.signCell, { borderRightWidth: 0, minWidth: dyn.signW, width: dyn.signW, padding: resp.s(4), fontSize: resp.ms(12) }]}
                  value={row.supSign}
                  onChangeText={text => updateHandlerField(rowIdx, 'supSign', text)}
                  placeholder="Sup Sign"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
      <View style={styles.saveButtonContainerInner}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: resp.s(8) }}>
          <TouchableOpacity onPress={handleBack} style={[styles.auxButton, { paddingVertical: dyn.saveBtnPV, paddingHorizontal: dyn.saveBtnPH, borderRadius: dyn.saveBtnRadius }]}>
            <Text style={[styles.auxButtonText, { fontSize: dyn.saveBtnFont }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSaveDraft} style={[styles.auxButtonSaveDraft, { paddingVertical: dyn.saveBtnPV, paddingHorizontal: dyn.saveBtnPH, borderRadius: dyn.saveBtnRadius }]}>
            <Text style={[styles.auxButtonText, { fontSize: dyn.saveBtnFont }]}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { paddingVertical: dyn.saveBtnPV, paddingHorizontal: dyn.saveBtnPH, borderRadius: dyn.saveBtnRadius }]} onPress={handleSavePDF} activeOpacity={0.85}>
            <Text style={[styles.saveButtonText, { fontSize: dyn.saveBtnFont }]}>Save as PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6fdff',
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#185a9d',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    paddingRight: 10,
  },
  detailItemFull: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#43cea2',
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: { alignItems: 'center', marginBottom: 12 },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  managerSignInput: {
    width: 120,
    minWidth: 80,
    maxWidth: 160,
  },
  tableScroll: { 
    marginTop: 20,
    borderLeftWidth: 1, 
    borderColor: '#4B5563',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e9e9e9',
    borderTopWidth: 1,
    borderBottomWidth: 1, 
    borderColor: '#4B5563',
    alignItems: 'stretch', 
    minHeight: 36,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'stretch', 
    minHeight: 36,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
    minWidth: 60, 
    flexGrow: 0,
    textAlignVertical: 'center',
  },
  dataCell: {
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#4B5563',
    minWidth: 60,
    flexGrow: 0,
    textAlignVertical: 'center',
  },
  inputCell: {
    fontSize: 11,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#4B5563',
    minWidth: 90,
    backgroundColor: '#f9f9f9',
    flexGrow: 0,
  },
  timeCellHeader: {
    minWidth: 55, 
    width: 55, 
    borderRightWidth: 1,
    borderColor: '#4B5563',
    flexGrow: 0,
    textAlignVertical: 'center',
  },
  checkboxTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#4B5563',
  },
  checkboxCellText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#185a9d',
    textAlignVertical: 'center',
  },
  snCell: { minWidth: 40, width: 40, textAlign: 'center' },
  nameCell: { minWidth: 120 }, 
  jobCell: { minWidth: 90 }, 
  signCell: { minWidth: 80 },
  supCell: { minWidth: 80 },
  saveButtonContainer: {
    padding: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#4B5563',
  },
  saveButton: {
    backgroundColor: '#185a9d',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 28,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  saveButtonContainerInner: {
    padding: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#4B5563',
  },
  auxButton: {
    backgroundColor: '#777',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  auxButtonSaveDraft: {
    backgroundColor: '#f0ad4e',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  auxButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

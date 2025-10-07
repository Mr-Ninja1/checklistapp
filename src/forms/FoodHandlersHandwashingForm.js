import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { addFormHistory } from '../utils/formHistory';
import useExportFormAsPDF from '../utils/useExportFormAsPDF';
import useResponsive from '../utils/responsive';

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

  // responsive helpers
  const resp = useResponsive();
  const dyn = {
    containerPadding: resp.s(20),
    logoSize: resp.s(48),
    logoMargin: resp.s(12),
    titleFont: resp.ms(20),
    inputPadding: resp.s(8),
    inputFont: resp.ms(14),
    managerWidth: resp.s(120),
    timeCellW: resp.s(55),
    nameW: resp.s(160),
    jobW: resp.s(120),
    snW: resp.s(40),
    signW: resp.s(100),
    checkboxW: resp.s(55),
    saveBtnPV: resp.s(12),
    saveBtnPH: resp.s(28),
    saveBtnRadius: resp.s(20),
    saveBtnFont: resp.ms(16),
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLogDetails(prev => ({ ...prev, date: getCurrentDate(), shift: getCurrentShift() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePDF = async () => {
    setExporting(true);
    try {
      await new Promise(res => setTimeout(res, 250));
      const handlersWithId = handlers.map((h, idx) => ({ id: idx + 1, ...h }));

      const formData = {
        title: 'Food Handlers Daily Handwashing Tracking Log Sheet',
        date: logDetails.date,
        location: logDetails.location,
        shift: logDetails.shift,
        verifiedBy: logDetails.verifiedBy,
        handlers: handlersWithId,
        timeSlots: TIME_SLOTS,
      };

      try {
        await addFormHistory({ title: formData.title, date: formData.date, shift: formData.shift, savedAt: Date.now(), meta: formData });
        setExporting(false);
        Alert.alert('Saved', 'Form saved to history. You can Export PDF from the Saved Forms screen.');
      } catch (e) {
        setExporting(false);
        console.warn('save meta failed', e);
        Alert.alert('Error', 'Failed to save form metadata.');
      }
    } catch (e) {
      setExporting(false);
      Alert.alert('Error', 'Failed to save form.');
    }
  };

  return (
    <>
      <Spinner visible={exporting} textContent={'Saving PDF...'} textStyle={{ color: '#fff' }} />
      <ScrollView contentContainerStyle={[styles.container, { padding: dyn.containerPadding }]} ref={ref} horizontal={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
        <View style={styles.logoRow}>
          <Image source={require('../assets/logo.png')} style={[styles.logo, { width: dyn.logoSize, height: dyn.logoSize, marginRight: dyn.logoMargin, borderRadius: resp.ms(10) }]} resizeMode="contain" />
          <Text style={[styles.title, { fontSize: dyn.titleFont, marginBottom: resp.s(12) }]}>Food Handlers Daily Handwashing Tracking Log Sheet</Text>
        </View>
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
  <ScrollView horizontal style={[styles.tableScroll, { marginTop: dyn.containerPadding }]} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}> 
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
                  <Text
                    key={time}
                    style={[styles.checkboxCell, { minWidth: dyn.checkboxW, width: dyn.checkboxW, padding: resp.s(2), fontSize: resp.ms(16) }]}
                    onPress={() => toggleHandlerCheck(rowIdx, time)}
                  >
                    {row.checks[time] ? '☑' : '☐'}
                  </Text>
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
  <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={[styles.saveButton, { paddingVertical: dyn.saveBtnPV, paddingHorizontal: dyn.saveBtnPH, borderRadius: dyn.saveBtnRadius }]} onPress={handleSavePDF} activeOpacity={0.85}>
          <Text style={[styles.saveButtonText, { fontSize: dyn.saveBtnFont }]}>Save as PDF</Text>
        </TouchableOpacity>
      </View>
    </>
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
    borderColor: '#ccc',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e9e9e9',
    borderTopWidth: 1,
    borderBottomWidth: 1, 
    borderColor: '#ccc',
    alignItems: 'stretch', 
    minHeight: 36,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
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
    borderColor: '#eee',
    minWidth: 60,
    flexGrow: 0,
    textAlignVertical: 'center',
  },
  inputCell: {
    fontSize: 11,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#eee',
    minWidth: 90,
    backgroundColor: '#f9f9f9',
    flexGrow: 0,
  },
  timeCellHeader: {
    minWidth: 55, 
    width: 55, 
    borderRightWidth: 1,
    borderColor: '#ccc',
    flexGrow: 0,
    textAlignVertical: 'center',
  },
  checkboxCell: {
    fontSize: 18,
    textAlign: 'center',
    padding: 2,
    color: '#185a9d',
    minWidth: 55,
    width: 55, 
    borderRightWidth: 1,
    borderColor: '#eee',
    flexGrow: 0,
    textAlignVertical: 'center',
  },
  snCell: { minWidth: 40, width: 40, textAlign: 'center' },
  nameCell: { minWidth: 160, width: 160 }, 
  jobCell: { minWidth: 120, width: 120 }, 
  signCell: { minWidth: 100, width: 100 },
  supCell: { minWidth: 100, width: 100 },
  saveButtonContainer: {
    padding: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
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
});

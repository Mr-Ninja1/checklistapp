import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';

// Helper functions for dynamic details
function getCurrentDate() {
  const now = new Date();
  // Using MM/DD/YYYY format as seen in the first image for consistency
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
    setHandlers(prev => prev.map((row, idx) =>
      idx === rowIdx ? { ...row, [field]: value } : row
    ));
  };

  const toggleHandlerCheck = (rowIdx, timeSlot) => {
    setHandlers(prev => prev.map((row, idx) =>
      idx === rowIdx
        ? { ...row, checks: { ...row.checks, [timeSlot]: !row.checks[timeSlot] } }
        : row
    ));
  };

  // Update date and shift periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogDetails(prev => ({
        ...prev,
        date: getCurrentDate(),
        shift: getCurrentShift(),
      }));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoRow}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Food Handlers Daily Handwashing Tracking Log Sheet</Text>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Date:</Text>
            <TextInput
              style={styles.input}
              value={logDetails.date}
              editable={false}
              placeholder="MM/DD/YYYY"
            />
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Location:</Text>
            <TextInput
              style={styles.input}
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
              style={styles.input}
              value={logDetails.shift}
              editable={false}
            />
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Verified By:</Text>
            <TextInput
              style={styles.input}
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
              style={[styles.input, styles.managerSignInput]}
              value={logDetails.complexManagerSign}
              onChangeText={text => setLogDetails(prev => ({ ...prev, complexManagerSign: text }))}
              placeholder="Signature/Initials"
            />
          </View>
        </View>

        {/* Table */}
        <ScrollView horizontal style={styles.tableScroll}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.snCell, { borderRightWidth: 1, borderColor: '#ccc' }]}>S/N</Text>
              <Text style={[styles.headerCell, styles.nameCell, { borderRightWidth: 1, borderColor: '#ccc' }]}>Full Name</Text>
              <Text style={[styles.headerCell, styles.jobCell, { borderRightWidth: 1, borderColor: '#ccc' }]}>Job Title</Text>
              {TIME_SLOTS.map((time) => (
                <Text key={time} style={[styles.headerCell, styles.timeCellHeader]}>{time}</Text>
              ))}
              <Text style={[styles.headerCell, styles.signCell, { borderRightWidth: 1, borderColor: '#ccc' }]}>Staff Sign</Text>
              <Text style={[styles.headerCell, styles.supCell, { borderRightWidth: 1, borderColor: '#ccc' }]}>Sup Name</Text>
              <Text style={[styles.headerCell, styles.signCell, { borderRightWidth: 0 }]}>Sup Sign</Text>
            </View>
            
            {/* Table Rows */}
            {handlers.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.tableRow}>
                <Text style={[styles.dataCell, styles.snCell]}>{rowIdx + 1}</Text>
                <TextInput
                  style={[styles.inputCell, styles.nameCell]}
                  value={row.fullName}
                  onChangeText={text => updateHandlerField(rowIdx, 'fullName', text)}
                  placeholder="Full Name"
                />
                <TextInput
                  style={[styles.inputCell, styles.jobCell]}
                  value={row.jobTitle}
                  onChangeText={text => updateHandlerField(rowIdx, 'jobTitle', text)}
                  placeholder="Job Title"
                />
                {TIME_SLOTS.map((time) => (
                  <Text
                    key={time}
                    style={styles.checkboxCell}
                    onPress={() => toggleHandlerCheck(rowIdx, time)}
                  >
                    {row.checks[time] ? '☑' : '☐'}
                  </Text>
                ))}
                <TextInput
                  style={[styles.inputCell, styles.signCell]}
                  value={row.staffSign}
                  onChangeText={text => updateHandlerField(rowIdx, 'staffSign', text)}
                  placeholder="Sign"
                />
                <TextInput
                  style={[styles.inputCell, styles.supCell]}
                  value={row.supName}
                  onChangeText={text => updateHandlerField(rowIdx, 'supName', text)}
                  placeholder="Sup Name"
                />
                <TextInput
                  style={[styles.inputCell, styles.signCell, { borderRightWidth: 0 }]}
                  value={row.supSign}
                  onChangeText={text => updateHandlerField(rowIdx, 'supSign', text)}
                  placeholder="Sup Sign"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
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
  
  // --- Table Styles ---
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

  // Generic Cell Styles (used as base)
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

  // --- Fixed Width Column Styles ---

  // Standard width for time column headers
  timeCellHeader: {
    minWidth: 55, 
    width: 55, 
    borderRightWidth: 1,
    borderColor: '#ccc',
    flexGrow: 0,
    textAlignVertical: 'center',
  },

  // Checkbox Cell
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

  // Other fixed columns
  snCell: { minWidth: 40, width: 40, textAlign: 'center' },
  // UPDATED: Full Name width increased
  nameCell: { minWidth: 160, width: 160 }, 
  // UPDATED: Job Title width increased
  jobCell: { minWidth: 120, width: 120 }, 
  signCell: { minWidth: 100, width: 100 },
  supCell: { minWidth: 100, width: 100 },
});
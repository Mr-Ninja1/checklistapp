import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
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

  // Update date and shift every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLogDetails(prev => ({
        ...prev,
        date: getCurrentDate(),
        shift: getCurrentShift(),
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Food Handlers Daily Handwashing Tracking Log Sheet</Text>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Date:</Text>
            <TextInput
              style={styles.input}
              value={logDetails.date}
              editable={false}
              placeholder="DD/MM/YYYY"
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
              style={styles.input}
              value={logDetails.complexManagerSign}
              onChangeText={text => setLogDetails(prev => ({ ...prev, complexManagerSign: text }))}
              placeholder="Signature/Initials"
            />
          </View>
        </View>

        {/* Table Header and Rows are inside a single ScrollView for horizontal scrolling */}
        <ScrollView horizontal style={{ marginTop: 20 }}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.snCell]}>S/N</Text>
              <Text style={[styles.headerCell, styles.nameCell]}>Full Name</Text>
              <Text style={[styles.headerCell, styles.jobCell]}>Job Title</Text>
              {TIME_SLOTS.map((time, idx) => (
                {/* Use the timeCell style for time headers */}
                <Text key={time} style={[styles.headerCell, styles.timeCell]}>{time.replace(':00', '').replace('AM', '').replace('PM', '')}</Text>
              ))}
              <Text style={[styles.headerCell, styles.signCell]}>Staff Sign</Text>
              <Text style={[styles.headerCell, styles.supCell]}>Sup Name</Text>
              <Text style={[styles.headerCell, styles.signCell]}>Sup Sign</Text>
            </View>
            {/* Table Rows */}
            {handlers.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.tableRow}>
                <Text style={[styles.dataCell, styles.snCell]}>{rowIdx + 1}</Text>
                <TextInput
                  style={[styles.inputCell, styles.nameCell]}
                  value={row.fullName}
                  onChangeText={text => updateHandlerField(rowIdx, 'fullName', text)}
                  placeholder=""
                />
                <TextInput
                  style={[styles.inputCell, styles.jobCell]}
                  value={row.jobTitle}
                  onChangeText={text => updateHandlerField(rowIdx, 'jobTitle', text)}
                  placeholder=""
                />
                {TIME_SLOTS.map((time, idx) => (
                  {/* Use the timeCell style for checkbox cells */}
                  <Text
                    key={time}
                    style={[styles.checkboxCell, styles.timeCell]}
                    onPress={() => toggleHandlerCheck(rowIdx, time)}
                  >
                    {row.checks[time] ? '☑' : '☐'}
                  </Text>
                ))}
                <TextInput
                  style={[styles.inputCell, styles.signCell]}
                  value={row.staffSign}
                  onChangeText={text => updateHandlerField(rowIdx, 'staffSign', text)}
                  placeholder=""
                />
                <TextInput
                  style={[styles.inputCell, styles.supCell]}
                  value={row.supName}
                  onChangeText={text => updateHandlerField(rowIdx, 'supName', text)}
                  placeholder=""
                />
                <TextInput
                  style={[styles.inputCell, styles.signCell]}
                  value={row.supSign}
                  onChangeText={text => updateHandlerField(rowIdx, 'supSign', text)}
                  placeholder=""
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
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e9e9e9',
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'stretch', // ensures cells stretch to full height
    minHeight: 36,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'stretch', // ensures cells stretch to full height
    minHeight: 36,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8, // Added to center text vertically
  },
  dataCell: {
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8, // Added to center text vertically
  },
  inputCell: {
    fontSize: 11,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  checkboxCell: {
    fontSize: 18,
    textAlign: 'center',
    color: '#185a9d',
    borderRightWidth: 1,
    borderColor: '#eee',
    // Remove minWidth and let timeCell styles handle it
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  // --- COLUMN WIDTHS (Revised to match image proportions) ---
  snCell: { width: 40 }, 
  nameCell: { width: 150 }, 
  jobCell: { width: 100 }, 
  signCell: { width: 80 }, 
  supCell: { width: 100 }, 
  timeCell: { width: 45 }, // **CRITICAL ADJUSTMENT for the narrow columns**
  
  // Global Styles (Unchanged)
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
});
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// --- Configuration ---
const TIME_SLOTS = [
  '06:00AM', '07:00AM', '08:00AM', '09:00AM', '10:00AM',
  '11:00AM', '12:00PM', '13:00PM', '14:00PM', '15:00PM',
];
const NUM_ROWS = 8; // Number of initial handlers

// Helper function to create initial empty checks for all time slots
const createInitialChecks = () =>
  TIME_SLOTS.reduce((acc, time) => ({ ...acc, [time]: false }), {});

// Initial handler data array
const initialHandlers = Array.from({ length: NUM_ROWS }, (_, index) => ({
  id: index + 1,
  fullName: '',
  jobTitle: '',
  checks: createInitialChecks(),
  staffSign: '',
  supName: '',
  supSign: '',
}));

// Main App Component
const App = () => {
  const [logDetails, setLogDetails] = useState({
    date: '10/02/2025',
    location: '',
    shift: 'AM',
    verifiedBy: '',
    complexManagerSign: '',
  });

  const [handlerData, setHandlerData] = useState(initialHandlers);

  // Function to update a checkbox status
  const toggleCheck = (id, timeSlot) => {
    setHandlerData(prevData =>
      prevData.map(handler => {
        if (handler.id === id) {
          return {
            ...handler,
            checks: {
              ...handler.checks,
              [timeSlot]: !handler.checks[timeSlot],
            },
          };
        }
        return handler;
      })
    );
  };

  // Function to update a text input field in a handler row
  const updateHandlerField = (id, fieldName, value) => {
    setHandlerData(prevData =>
      prevData.map(handler =>
        handler.id === id ? { ...handler, [fieldName]: value } : handler
      )
    );
  };

  // --- Header Section Component ---
  const HeaderSection = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Food Handlers Daily Handwashing Tracking Log Sheet</Text>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Date:</Text>
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={styles.input}
              value={logDetails.date}
              onChangeText={(text) => setLogDetails({ ...logDetails, date: text })}
              placeholder="DD/MM/YYYY"
            />
            {/* Display a calendar icon for aesthetics */}
            <Text style={styles.dateIcon}>📅</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Location:</Text>
          <TextInput
            style={styles.input}
            value={logDetails.location}
            onChangeText={(text) => setLogDetails({ ...logDetails, location: text })}
            placeholder="Enter Location"
          />
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Shift:</Text>
          {/* Simulated Dropdown/Picker */}
          <TextInput
            style={styles.input}
            value={logDetails.shift}
            onChangeText={(text) => setLogDetails({ ...logDetails, shift: text })}
          />
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Verified By:</Text>
          <TextInput
            style={styles.input}
            value={logDetails.verifiedBy}
            onChangeText={(text) => setLogDetails({ ...logDetails, verifiedBy: text })}
            placeholder="Enter Verifier Name"
          />
        </View>
      </View>

      <View style={[styles.detailRow, styles.signatureSection]}>
        <View style={styles.detailItemFull}>
          <Text style={styles.label}>Complex Manager Sign:</Text>
          <TextInput
            style={styles.input}
            value={logDetails.complexManagerSign}
            onChangeText={(text) => setLogDetails({ ...logDetails, complexManagerSign: text })}
            placeholder="Signature/Initials"
          />
        </View>
      </View>
    </View>
  );

  // --- Table Header Component ---
  const TableHeader = () => (
    <View style={styles.row}>
      <Text style={[styles.headerCell, styles.snCell]}>S/N</Text>
      <Text style={[styles.headerCell, styles.nameCell]}>Full Name</Text>
      <Text style={[styles.headerCell, styles.jobCell]}>Job Title</Text>

      {/* HORIZONTAL SCROLL AREA for Time Slots */}
      <ScrollView horizontal contentContainerStyle={styles.scrollHeader}>
        {TIME_SLOTS.map(time => (
          <Text key={time} style={styles.timeCell}>{time}</Text>
        ))}
      </ScrollView>
      {/* END HORIZONTAL SCROLL AREA */}

      <Text style={[styles.headerCell, styles.signCell]}>Staff Sign</Text>
      <Text style={[styles.headerCell, styles.supCell]}>Sup Name</Text>
      <Text style={[styles.headerCell, styles.signCell]}>Sup Sign</Text>
    </View>
  );

  // --- Handler Row Component ---
  const HandlerRow = ({ handler }) => {
    const { id, fullName, jobTitle, checks, staffSign, supName, supSign } = handler;

    // A custom checkbox view
    const Checkbox = ({ isChecked, onPress }) => (
      <TouchableOpacity
        style={[styles.checkbox, isChecked && styles.checkboxChecked]}
        onPress={onPress}
      >
        {isChecked && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    );

    return (
      <View style={styles.row}>
        <Text style={[styles.dataCell, styles.snCell]}>{id}</Text>

        <TextInput
          style={[styles.inputCell, styles.nameCell]}
          value={fullName}
          onChangeText={(text) => updateHandlerField(id, 'fullName', text)}
        />

        <TextInput
          style={[styles.inputCell, styles.jobCell]}
          value={jobTitle}
          onChangeText={(text) => updateHandlerField(id, 'jobTitle', text)}
        />

        {/* HORIZONTAL SCROLL AREA for Checkboxes */}
        <ScrollView horizontal contentContainerStyle={styles.scrollRow}>
          {TIME_SLOTS.map(time => (
            <View key={time} style={styles.timeCheckCell}>
              <Checkbox
                isChecked={checks[time]}
                onPress={() => toggleCheck(id, time)}
              />
            </View>
          ))}
        </ScrollView>
        {/* END HORIZONTAL SCROLL AREA */}

        <TextInput
          style={[styles.inputCell, styles.signCell]}
          value={staffSign}
          onChangeText={(text) => updateHandlerField(id, 'staffSign', text)}
        />
        <TextInput
          style={[styles.inputCell, styles.supCell]}
          value={supName}
          onChangeText={(text) => updateHandlerField(id, 'supName', text)}
        />
        <TextInput
          style={[styles.inputCell, styles.signCell]}
          value={supSign}
          onChangeText={(text) => updateHandlerField(id, 'supSign', text)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <HeaderSection />

        <View style={styles.tableContainer}>
          <TableHeader />
          {handlerData.map(handler => (
            <HandlerRow key={handler.id} handler={handler} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styling ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  // --- Header Details Styles ---
  headerContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
    paddingRight: 10,
  },
  dateInputWrapper: { // Added wrapper for date input to position icon
    position: 'relative',
    justifyContent: 'center',
  },
  detailItemFull: {
    flex: 1,
  },
  signatureSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 15,
    marginBottom: 15
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  dateIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -9, // Center vertically
    fontSize: 18,
    color: '#666',
  },
  // --- Table Styles ---
  tableContainer: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'stretch',
    backgroundColor: '#fff',
  },
  // Fixed Width Cells
  snCell: { width: 30 },
  nameCell: { width: 80 },
  jobCell: { width: 80 },
  signCell: { width: 80 },
  supCell: { width: 70 },

  // Header Cell Styling
  headerCell: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    padding: 5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e9e9e9',
    justifyContent: 'center', // Centers text vertically via flex
  },

  // Data Cell Styling
  dataCell: {
    fontSize: 12,
    padding: 5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  inputCell: {
    fontSize: 12,
    padding: 5,
    borderRightWidth: 1,
    borderColor: '#ccc',
    minHeight: 35,
    paddingTop: 8, // Adjusting padding to center text vertically better
  },

  // Scrollable Time Columns Styles
  scrollHeader: {
    flexDirection: 'row',
    minHeight: 35,
    alignItems: 'center',
  },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCell: {
    width: 50,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
  },
  timeCheckCell: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    minHeight: 35, // Ensure cell height matches other rows
  },
  // Checkbox Styling
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#10b981', // Green checkmark background
    borderColor: '#10b981',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
});

export default App;

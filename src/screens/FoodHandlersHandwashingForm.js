

import React, { useState, useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Device from 'expo-device';
import { Image } from 'react-native';
import NotificationModal from '../components/NotificationModal';
import SaveFormButton from '../components/SaveFormButton';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';


const TIME_SLOTS = [
  '06:00AM', '07:00AM', '08:00AM', '09:00AM', '10:00AM',
  '11:00AM', '12:00PM', '13:00PM', '14:00PM', '15:00PM',
];
const NUM_ROWS = 14;
function createInitialChecks() {
  return TIME_SLOTS.reduce((acc, time) => ({ ...acc, [time]: false }), {});
}
function getInitialHandlers() {
  return Array.from({ length: NUM_ROWS }, (_, index) => ({
    id: index + 1,
    fullName: '',
    jobTitle: '',
    checks: createInitialChecks(),
    staffSign: '',
    supName: '',
    supSign: '',
  }));
}

export default function FoodHandlersHandwashingForm({ navigation }) {
  useEffect(() => {
    const setLandscape = async () => {
      if (
        Device.deviceType === Device.DeviceType.TABLET ||
        Device.deviceType === Device.DeviceType.PHONE
      ) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    };
    setLandscape();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);
  // Set initial date and shift based on system
  const getCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const getCurrentShift = () => {
    const hour = new Date().getHours();
    // 0-11 is AM, 12-23 is PM
    return hour < 12 ? 'AM' : 'PM';
  };
  const [logDetails, setLogDetails] = useState({
    date: getCurrentDate(),
    location: '',
    shift: getCurrentShift(),
    verifiedBy: '',
    complexManagerSign: '',
  });
  const [showSaved, setShowSaved] = useState(false);
  // Update date and shift automatically if system time changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLogDetails(prev => ({
        ...prev,
        date: getCurrentDate(),
        shift: getCurrentShift(),
      }));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);
  const [handlerData, setHandlerData] = useState(getInitialHandlers());

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

  const updateHandlerField = (id, fieldName, value) => {
    setHandlerData(prevData =>
      prevData.map(handler =>
        handler.id === id ? { ...handler, [fieldName]: value } : handler
      )
    );
  };

  const addHandler = () => {
    setHandlerData(prev => ([
      ...prev,
      {
        id: prev.length + 1,
        fullName: '',
        jobTitle: '',
        checks: createInitialChecks(),
        staffSign: '',
        supName: '',
        supSign: '',
      },
    ]));
  };

  const removeHandler = (id) => {
    setHandlerData(prev => prev.filter(h => h.id !== id).map((h, i) => ({ ...h, id: i + 1 })));
  };

  const handleSubmit = () => {
    const formData = {
      ...logDetails,
      handlers: handlerData,
    };
    console.log('Form Data:', formData);
    // Add your submit logic here
  };

  // --- Header Section Component ---
  const HeaderSection = () => (
    <View style={styles.headerContainer}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => {
          if (navigation && navigation.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          } else if (navigation && navigation.navigate) {
            navigation.navigate('Home');
          }
        }}
        style={{ marginBottom: 10, alignSelf: 'flex-start', padding: 8, borderRadius: 8, backgroundColor: '#e9e9e9' }}
      >
        <Text style={{ fontSize: 16, color: '#185a9d', fontWeight: 'bold' }}>← Back</Text>
      </TouchableOpacity>
      {/* Bravo Logo and Title */}
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <Image source={require('../assets/logo.png')} style={{ width: 60, height: 60, borderRadius: 16, marginBottom: 4 }} resizeMode="contain" />
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#185a9d', letterSpacing: 2 }}>Bravo</Text>
      </View>
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
      <ScrollView horizontal contentContainerStyle={styles.scrollHeader} showsHorizontalScrollIndicator={false}>
        {TIME_SLOTS.map(time => (
          <Text key={time} style={styles.timeCell}>{time}</Text>
        ))}
      </ScrollView>
      <Text style={[styles.headerCell, styles.signCell]}>Staff Sign</Text>
      <Text style={[styles.headerCell, styles.supCell]}>Sup Name</Text>
      <Text style={[styles.headerCell, styles.signCell]}>Sup Sign</Text>
      <Text style={[styles.headerCell, { width: 36 }]}></Text>
    </View>
  );

  // --- Handler Row Component ---
  const HandlerRow = ({ handler }) => {
    const { id, fullName, jobTitle, checks, staffSign, supName, supSign } = handler;
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
          autoCorrect={false}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.inputCell, styles.jobCell]}
          value={jobTitle}
          onChangeText={(text) => updateHandlerField(id, 'jobTitle', text)}
          autoCorrect={false}
          autoCapitalize="words"
        />
        <ScrollView horizontal contentContainerStyle={styles.scrollRow} showsHorizontalScrollIndicator={false}>
          {TIME_SLOTS.map((time, idx) => (
            <View
              key={time}
              style={[
                styles.timeCheckCell,
                idx === TIME_SLOTS.length - 1 && { borderRightWidth: 6, borderColor: '#000' },
              ]}
            >
              <Checkbox
                isChecked={checks[time]}
                onPress={() => toggleCheck(id, time)}
              />
            </View>
          ))}
        </ScrollView>
        <TextInput
          style={[styles.inputCell, styles.signCell]}
          value={staffSign}
          onChangeText={(text) => updateHandlerField(id, 'staffSign', text)}
          autoCorrect={false}
          autoCapitalize="characters"
        />
        <TextInput
          style={[styles.inputCell, styles.supCell]}
          value={supName}
          onChangeText={(text) => updateHandlerField(id, 'supName', text)}
          autoCorrect={false}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.inputCell, styles.signCell]}
          value={supSign}
          onChangeText={(text) => updateHandlerField(id, 'supSign', text)}
          autoCorrect={false}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.removeBtn} onPress={() => removeHandler(id)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Save logic: store in localStorage (web) or AsyncStorage (native) in future
  const handleSave = (formData) => {
    try {
      // For demo: save to localStorage (works in web, not native)
      if (typeof window !== 'undefined' && window.localStorage) {
        const history = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
        history.push({ ...formData, savedAt: new Date().toISOString() });
        window.localStorage.setItem('formHistory', JSON.stringify(history));
        setShowSaved(true);
        // Clear form after save
        setLogDetails({
          date: getCurrentDate(),
          location: '',
          shift: getCurrentShift(),
          verifiedBy: '',
          complexManagerSign: '',
        });
  setHandlerData(getInitialHandlers());
      } else {
        setShowSaved(true);
        setLogDetails({
          date: getCurrentDate(),
          location: '',
          shift: getCurrentShift(),
          verifiedBy: '',
          complexManagerSign: '',
        });
  setHandlerData(getInitialHandlers());
      }
    } catch (e) {
      setShowSaved(true);
    }
  };

  // Function to get current form data
  const getFormData = () => ({
    ...logDetails,
    handlers: handlerData,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { flex: 1 }]}> 
      <ScrollView
        style={[styles.container, { flex: 1 }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={true}
      >
        <HeaderSection />
        <ScrollView
          horizontal
          contentContainerStyle={{ minWidth: 1200 }}
          showsHorizontalScrollIndicator={true}
          style={styles.tableContainer}
        >
          <View>
            <TableHeader />
            {handlerData.map(handler => (
              <HandlerRow key={handler.id} handler={handler} />
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.addBtn} onPress={addHandler}><Text style={styles.addBtnText}>+ Add Food Handler</Text></TouchableOpacity>
        <Text style={styles.footerNote}>All food handlers are required to wash and sanitize their hands after every 60 minutes.</Text>
        <SaveFormButton
          onSave={handleSave}
          getFormData={getFormData}
          label="Save Form"
        />
        <NotificationModal
          visible={showSaved}
          message="Form saved!"
          onClose={() => setShowSaved(false)}
        />
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
    flex: 1,
    padding: 15,
    borderRadius: 16,
    margin: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#185a9d',
    textAlign: 'left',
  },
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
  dateInputWrapper: {
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
  },
  dateIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -9,
    fontSize: 18,
    color: '#666',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'stretch',
    backgroundColor: '#fff',
  },
  snCell: { width: 40 },
  nameCell: { width: 160 },
  jobCell: { width: 120 },
  signCell: { width: 100 },
  supCell: { width: 100 },
  headerCell: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    padding: 5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
  },
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
    paddingTop: 8,
  },
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
    width: 70,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
  },
  timeCheckCell: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    minHeight: 35,
  },
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  removeBtn: {
    marginLeft: 6,
    backgroundColor: '#ff5e62',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#43cea2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerNote: {
    fontStyle: 'italic',
    color: '#185a9d',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#185a9d',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});

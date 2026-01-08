import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SignatureField from '../components/SignatureField';
import EditableFormContainer from '../components/EditableFormContainer';
import NotificationModal from '../components/NotificationModal';
import useFormSave from '../hooks/useFormSave';

const TIME_SLOTS = [
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function FoodHandlersHandwashingForm_PM({ route }) {
  const navigation = useNavigation();
  const { draftData } = route.params || {};

  // Logic Preserved from original
  const [week, setWeek] = useState(draftData?.week || '');
  const [month, setMonth] = useState(draftData?.month || '');
  const [year, setYear] = useState(draftData?.year || new Date().getFullYear().toString());
  const [logEntries, setLogEntries] = useState(draftData?.logEntries || Array.from({ length: 15 }, () => ['', '', ...Array(8).fill(false), '']));

  const { saving, notification, saveForm, hideNotification } = useFormSave('food_handlers_handwashing_pm');

  const updateEntry = (rowIdx, colIdx, val) => {
    const newEntries = [...logEntries];
    newEntries[rowIdx][colIdx] = val;
    setLogEntries(newEntries);
  };

  const toggleCheck = (rowIdx, slotIdx) => {
    const newEntries = [...logEntries];
    newEntries[rowIdx][slotIdx + 2] = !newEntries[rowIdx][slotIdx + 2];
    setLogEntries(newEntries);
  };

  const handleSave = async () => {
    const payload = { week, month, year, logEntries, title: 'FOOD HANDLERS DAILY HANDWASHING LOG (PM)' };
    await saveForm(payload);
  };

  return (
    <EditableFormContainer title="Handwashing Log (PM)" onSave={handleSave} saving={saving}>
      <View style={styles.card}>
        {/* Modern Header Section */}
        <View style={styles.headerRow}>
          <Image source={require('../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>FOOD HANDLERS DAILY HANDWASHING LOG (PM)</Text>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Week</Text>
            <TextInput style={styles.metaInput} value={week} onChangeText={setWeek} placeholder="01" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Month</Text>
            <TextInput style={styles.metaInput} value={month} onChangeText={setMonth} placeholder="January" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year</Text>
            <TextInput style={styles.metaInput} value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
        </View>

        {/* Modernized Table with High Visibility */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.headerCell, { width: 45 }]}><Text style={styles.headerText}>S/N</Text></View>
              <View style={[styles.headerCell, { width: 160 }]}><Text style={styles.headerText}>Full Name</Text></View>
              <View style={[styles.headerCell, { width: 110 }]}><Text style={styles.headerText}>Job Title</Text></View>
              {TIME_SLOTS.map((slot, i) => (
                <View key={i} style={[styles.headerCell, { width: 80 }]}>
                  <Text style={styles.headerText}>{slot}</Text>
                </View>
              ))}
              <View style={[styles.headerCell, { width: 130, borderRightWidth: 0 }]}><Text style={styles.headerText}>Sup Sign</Text></View>
            </View>

            {/* Table Body */}
            {logEntries.map((row, rIdx) => (
              <View key={rIdx} style={[styles.row, rIdx % 2 === 1 && styles.rowAlternate]}>
                <View style={[styles.cell, { width: 45 }]}><Text style={styles.snText}>{rIdx + 1}</Text></View>
                <TextInput 
                  style={[styles.cellInput, { width: 160 }]} 
                  value={row[0]} 
                  onChangeText={(v) => updateEntry(rIdx, 0, v)}
                  placeholder="Name"
                />
                <TextInput 
                  style={[styles.cellInput, { width: 110 }]} 
                  value={row[1]} 
                  onChangeText={(v) => updateEntry(rIdx, 1, v)}
                  placeholder="Title"
                />
                {TIME_SLOTS.map((_, sIdx) => (
                  <TouchableOpacity 
                    key={sIdx} 
                    style={[styles.checkCell, { width: 80 }]} 
                    onPress={() => toggleCheck(rIdx, sIdx)}
                  >
                    <View style={[styles.checkbox, row[sIdx + 2] && styles.checkboxActive]}>
                      {row[sIdx + 2] && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={[styles.cell, { width: 130, borderRightWidth: 0 }]}>
                   <SignatureField
                    value={row[10]}
                    onSave={(sig) => updateEntry(rIdx, 10, sig)}
                    compact
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <NotificationModal 
        visible={notification.visible} 
        type={notification.type} 
        message={notification.message} 
        onClose={hideNotification} 
      />
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logo: { width: 70, height: 45, marginRight: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', flex: 1, textTransform: 'uppercase' },
  
  metaSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  inputGroup: { flex: 1, marginHorizontal: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, textTransform: 'uppercase' },
  metaInput: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#cbd5e1', 
    paddingVertical: 6, 
    fontSize: 15, 
    color: '#000',
    fontWeight: '500'
  },

  table: { borderRadius: 8, overflow: 'hidden', borderWidth: 1.5, borderColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 2, borderBottomColor: '#000' },
  headerCell: { paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 11, fontWeight: '900', color: '#000', textAlign: 'center' },

  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 65 },
  rowAlternate: { backgroundColor: '#f8fafc' },
  cell: { borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' },
  cellInput: { paddingHorizontal: 10, fontSize: 13, borderRightWidth: 1, borderRightColor: '#000', color: '#000' },
  snText: { textAlign: 'center', fontSize: 12, color: '#000', fontWeight: 'bold' },

  checkCell: { 
    borderRightWidth: 1, 
    borderRightColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkbox: { 
    width: 34, 
    height: 34, 
    borderRadius: 6, 
    borderWidth: 2.5, 
    borderColor: '#94a3b8', 
    backgroundColor: '#fff',
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  checkboxActive: { 
    backgroundColor: '#1e3a8a', 
    borderColor: '#1e3a8a' 
  },
  checkMark: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold' 
  }
});
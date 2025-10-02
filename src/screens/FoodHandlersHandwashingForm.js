import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';

const initialHandlers = [
  { sn: 1, fullName: '', jobTitle: '', times: Array(8).fill(false), staffSignature: '', supervisorSignature: '', managerSignature: '' }
];

const timeLabels = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'
];

export default function FoodHandlersHandwashingForm() {
  const [compiledBy, setCompiledBy] = useState('Michael Zulu K.');
  const [approvedBy, setApprovedBy] = useState('Hassan Ali');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [shift, setShift] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');
  const [handlers, setHandlers] = useState(initialHandlers);

  const addHandler = () => {
    setHandlers([...handlers, { sn: handlers.length + 1, fullName: '', jobTitle: '', times: Array(8).fill(false), staffSignature: '', supervisorSignature: '', managerSignature: '' }]);
  };

  const updateHandler = (idx, field, value) => {
    const updated = handlers.map((h, i) => i === idx ? { ...h, [field]: value } : h);
    setHandlers(updated);
  };

  const updateTime = (idx, timeIdx, value) => {
    const updated = handlers.map((h, i) => {
      if (i === idx) {
        const times = [...h.times];
        times[timeIdx] = value;
        return { ...h, times };
      }
      return h;
    });
    setHandlers(updated);
  };

  const handleSubmit = () => {
    const formData = {
      compiledBy, approvedBy, date, location, shift, verifiedBy, handlers
    };
    console.log('Form Data:', formData);
    // Add your submit logic here
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Food Handlers Daily Handwashing Tracking Log Sheet</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Compiled By</Text>
        <TextInput style={styles.input} value={compiledBy} onChangeText={setCompiledBy} />
        <Text style={styles.label}>Approved By</Text>
        <TextInput style={styles.input} value={approvedBy} onChangeText={setApprovedBy} />
        <Text style={styles.label}>Date *</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Location *</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />
        <Text style={styles.label}>Shift *</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity style={[styles.radio, shift === 'AM' && styles.radioSelected]} onPress={() => setShift('AM')}>
            <Text style={styles.radioText}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.radio, shift === 'PM' && styles.radioSelected]} onPress={() => setShift('PM')}>
            <Text style={styles.radioText}>PM</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Verified By</Text>
        <TextInput style={styles.input} value={verifiedBy} onChangeText={setVerifiedBy} />
        <View style={styles.staticRow}><Text>Page: 1 of 1</Text><Text>Revision Date: N/A</Text></View>
        <View style={styles.staticRow}><Text>Doc No: BBL/FSMS/16-14</Text><Text>Issue Date: 15/06/2023</Text></View>
        <View style={styles.staticRow}><Text>Doc Ref No: FSMS/026/23</Text></View>
      </View>
      <Text style={styles.subTitle}>Food Handlers</Text>
      {handlers.map((handler, idx) => (
        <View key={idx} style={styles.handlerRow}>
          <Text style={styles.sn}>{handler.sn}</Text>
          <TextInput style={styles.input} placeholder="Full Name" value={handler.fullName} onChangeText={v => updateHandler(idx, 'fullName', v)} />
          <TextInput style={styles.input} placeholder="Job Title" value={handler.jobTitle} onChangeText={v => updateHandler(idx, 'jobTitle', v)} />
          <View style={styles.timesRow}>
            {timeLabels.map((label, tIdx) => (
              <TouchableOpacity key={label} style={styles.checkbox} onPress={() => updateTime(idx, tIdx, !handler.times[tIdx])}>
                <Text style={handler.times[tIdx] ? styles.checkboxChecked : styles.checkboxUnchecked}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Staff Signature" value={handler.staffSignature} onChangeText={v => updateHandler(idx, 'staffSignature', v)} />
          <TextInput style={styles.input} placeholder="Supervisor Signature" value={handler.supervisorSignature} onChangeText={v => updateHandler(idx, 'supervisorSignature', v)} />
          <TextInput style={styles.input} placeholder="Complex Manager Signature" value={handler.managerSignature} onChangeText={v => updateHandler(idx, 'managerSignature', v)} />
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addHandler}><Text style={styles.addBtnText}>+ Add Food Handler</Text></TouchableOpacity>
      <Text style={styles.footerNote}>All food handlers are required to wash and sanitize their hands after every 60 minutes.</Text>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}><Text style={styles.submitBtnText}>Submit</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fdff',
    padding: Platform.OS === 'web' ? 32 : 16,
    borderRadius: 16,
    margin: Platform.OS === 'web' ? 32 : 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#185a9d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2,
    color: '#185a9d',
  },
  input: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#43cea2',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  radio: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#43cea2',
  },
  radioSelected: {
    backgroundColor: '#43cea2',
    borderColor: '#185a9d',
  },
  radioText: {
    color: '#185a9d',
    fontWeight: 'bold',
  },
  staticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#43cea2',
    textAlign: 'center',
  },
  handlerRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  sn: {
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 4,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  checkbox: {
    backgroundColor: '#f0f4f8',
    borderRadius: 6,
    padding: 6,
    margin: 2,
    borderWidth: 1,
    borderColor: '#43cea2',
  },
  checkboxChecked: {
    color: '#43cea2',
    fontWeight: 'bold',
  },
  checkboxUnchecked: {
    color: '#aaa',
  },
  addBtn: {
    backgroundColor: '#43cea2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
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

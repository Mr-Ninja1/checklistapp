import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';

export default function BinLinersChangingLog() {
  // Initial 7 rows
  const initialLog = Array.from({ length: 7 }, () => ({
    date: '',
    changedBy: '',
    area: '',
    staffSign: '',
    supervisorSign: ''
  }));

  const [logEntries, setLogEntries] = useState(initialLog);
  const [verifiedBy, setVerifiedBy] = useState('');
  const [hseqManager, setHseqManager] = useState('');

  // Issue date set to system date (dd/mm/yyyy)
  const issueDate = (() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  })();

  const updateLogEntry = (index, field, value) => {
    setLogEntries(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const logo = () => (
    <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}>

        {/* Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            {logo()}
            <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.systemName}>Food Safety Management System</Text>
            <Text style={styles.subject}>Subject: BIN LINERS CHANGING LOG</Text>
          </View>

          <View style={styles.headerCenter}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Doc No:</Text>
              <Text style={styles.docValue}>BBN-SHEQ-F-BL-2</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Issue Date:</Text>
              <Text style={styles.docValue}>{issueDate}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Revision Date:</Text>
              <Text style={styles.docValue}>N/A</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.pageInfo}>Page 1 of 1</Text>
          </View>
        </View>

        {/* Compiled / Approved row */}
        <View style={styles.secondHeaderRow}>
          <View style={styles.compiledBlock}>
            <Text style={styles.compiledLabel}>Compiled By:</Text>
            <Text style={styles.compiledValue}>MICHAEL C. ZULU</Text>
          </View>
          <View style={styles.approvalBlock}>
            <View style={styles.approvalItem}><Text style={styles.compiledLabel}>Approved By:</Text><Text style={styles.compiledValue}>Hassani Ali</Text></View>
            <View style={styles.approvalItem}><Text style={styles.compiledLabel}>Version No.</Text><Text style={styles.compiledValue}>01</Text></View>
            <View style={styles.approvalItem}><Text style={styles.compiledLabel}>Rev no:</Text><Text style={styles.compiledValue}>00</Text></View>
          </View>
        </View>

        {/* Frequency instruction */}
        <View style={styles.frequencyBox}>
          <Text style={styles.frequencyText}>FREQUENCY = DAILY (AFTER THE END OF DAY & NIGHT SHIFT)</Text>
        </View>

        {/* Table */}
        <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>

            {/* Header row */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.colDate}><Text style={styles.colHeader}>DATE</Text></View>
              <View style={styles.colChangedBy}><Text style={styles.colHeader}>CHANGED BY</Text></View>
              <View style={styles.colArea}><Text style={styles.colHeader}>AREA</Text></View>
              <View style={styles.colStaffSign}><Text style={styles.colHeader}>STAFF SIGN</Text></View>
              <View style={styles.colSupervisorSign}><Text style={styles.colHeader}>SUPERVISOR SIGN</Text></View>
            </View>

            {/* Data rows */}
            {logEntries.map((entry, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colDate}>
                  <TextInput style={styles.cellInput} value={entry.date} onChangeText={(t) => updateLogEntry(idx, 'date', t)} placeholder="DD/MM/YYYY" />
                </View>

                <View style={styles.colChangedBy}>
                  <TextInput style={styles.cellInput} value={entry.changedBy} onChangeText={(t) => updateLogEntry(idx, 'changedBy', t)} placeholder="" />
                </View>

                <View style={styles.colArea}>
                  <TextInput style={styles.cellInput} value={entry.area} onChangeText={(t) => updateLogEntry(idx, 'area', t)} placeholder="" />
                </View>

                <View style={styles.colStaffSign}>
                  <TextInput style={styles.cellInput} value={entry.staffSign} onChangeText={(t) => updateLogEntry(idx, 'staffSign', t)} placeholder="" />
                </View>

                <View style={styles.colSupervisorSign}>
                  <TextInput style={styles.cellInput} value={entry.supervisorSign} onChangeText={(t) => updateLogEntry(idx, 'supervisorSign', t)} placeholder="" />
                </View>
              </View>
            ))}

          </View>
        </View>

        {/* Verification block */}
        <View style={styles.verificationBlock}>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>VERIFIED BY:</Text>
            <TextInput style={[styles.verifyInput]} value={verifiedBy} onChangeText={setVerifiedBy} placeholder="" />
          </View>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>HSEQ Manager:</Text>
            <TextInput style={[styles.verifyInput]} value={hseqManager} onChangeText={setHseqManager} placeholder="" />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },

  topHeader: { flexDirection: 'row', borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8 },
  headerLeft: { width: 260, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#000' },
  headerCenter: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  headerRight: { width: 120, justifyContent: 'center', alignItems: 'flex-end' },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
  systemName: { fontSize: 9, lineHeight: 10, marginBottom: 6 },
  subject: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  docLabel: { fontSize: 10, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 10 },
  pageInfo: { fontSize: 10, fontWeight: '700' },

  secondHeaderRow: { flexDirection: 'row', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000' , marginBottom: 8 },
  compiledBlock: { flex: 1, padding: 8 },
  compiledLabel: { fontSize: 10, fontWeight: '700' },
  compiledValue: { fontSize: 10 },
  approvalBlock: { flex: 1, flexDirection: 'row' , padding: 8 },
  approvalItem: { flex: 1, paddingRight: 6 },

  frequencyBox: { padding: 8, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#fff8e1', marginBottom: 8 },
  frequencyText: { fontSize: 12, fontWeight: '700' },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', minHeight: 40, alignItems: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 40, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },

  // Column flex ratios mirroring the percentages in cat.md
  colDate: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colChangedBy: { flex: 0.25, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colArea: { flex: 0.2, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colStaffSign: { flex: 0.2, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colSupervisorSign: { flex: 0.2, paddingHorizontal: 6 },

  cellInput: { height: 36, paddingHorizontal: 6, fontSize: 12 },

  verificationBlock: { marginTop: 12, paddingHorizontal: 4 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  verifyLabel: { width: 120, fontSize: 12, fontWeight: '700' },
  verifyInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4, fontSize: 12 }
});

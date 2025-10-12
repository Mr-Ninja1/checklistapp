import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Switch, Image } from 'react-native';

export default function VisitorsLogBook() {
  const initialVisitorLog = Array.from({ length: 5 }, () => ({ name: '', address: '', contact: '', purpose: '', timeIn: '', timeOut: '', authority: '' }));
  const [visitorEntries, setVisitorEntries] = useState(initialVisitorLog);
  const [site, setSite] = useState('');
  const [section, setSection] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [siteManager, setSiteManager] = useState('');
  const [verifiedManager, setVerifiedManager] = useState('');
  const [shiftManager, setShiftManager] = useState('');

  const initialHealthChecks = {
    unwell: false,
    medicine: false,
    bannedSubstances: false,
    symptoms: false,
    contactWithDisease: false,
    cutsCovered: true,
    jewellery: true,
    hairnet: true,
    safetyShoes: true,
    neatlyDressed: true,
  };
  const [healthChecks, setHealthChecks] = useState(initialHealthChecks);

  const logo = () => (
    <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
  );

  const updateVisitorEntry = (index, field, value) => {
    setVisitorEntries(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}>
        <View style={styles.headerWrap}>
          <View style={styles.headerLeft}>{logo()}<Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text></View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>BRAVO BRANDS VISITORS LOG BOOK</Text>
            <View style={styles.docRow}><Text style={styles.docLabel}>Doc Ref:</Text><Text style={styles.docValue}>BBN-SHEQ-R 23a</Text></View>
            <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docValue}>{(() => { const t=new Date(); return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}` })()}</Text></View>
          </View>
        </View>

        <View style={styles.siteRow}>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>SITE</Text><TextInput style={styles.siteInput} value={site} onChangeText={setSite} /></View>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>SECTION/DEPT</Text><TextInput style={styles.siteInput} value={section} onChangeText={setSection} /></View>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>MONTH</Text><TextInput style={styles.siteInput} value={month} onChangeText={setMonth} /></View>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>YEAR</Text><TextInput style={styles.siteInput} value={year} onChangeText={setYear} /></View>
        </View>

        {/* Health & Safety compact area */}
        <View style={styles.healthBox}>
          <Text style={styles.sectionTitle}>HEALTH & SAFETY SCREENING</Text>
          <View style={styles.healthRow}><Text style={styles.healthLabel}>Unwell?</Text><Switch value={healthChecks.unwell} onValueChange={v => setHealthChecks(prev => ({ ...prev, unwell: v }))} /></View>
          <View style={styles.healthRow}><Text style={styles.healthLabel}>Taking medicine?</Text><Switch value={healthChecks.medicine} onValueChange={v => setHealthChecks(prev => ({ ...prev, medicine: v }))} /></View>
          <View style={styles.healthRow}><Text style={styles.healthLabel}>Cuts covered?</Text><Switch value={healthChecks.cutsCovered} onValueChange={v => setHealthChecks(prev => ({ ...prev, cutsCovered: v }))} /></View>
          <View style={styles.healthRow}><Text style={styles.healthLabel}>Neatly dressed?</Text><Switch value={healthChecks.neatlyDressed} onValueChange={v => setHealthChecks(prev => ({ ...prev, neatlyDressed: v }))} /></View>
        </View>

        <View style={styles.shiftManagerRow}><Text style={styles.smallLabel}>Manager for shift (name & sign):</Text><TextInput style={styles.siteInput} value={shiftManager} onChangeText={setShiftManager} /></View>

        {/* Visitors Table */}
        <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>
            <View style={styles.tableHeaderRow}>
              <View style={styles.colName}><Text style={styles.colHeader}>NAME OF VISITOR</Text></View>
              <View style={styles.colAddress}><Text style={styles.colHeader}>ADDRESS</Text></View>
              <View style={styles.colContact}><Text style={styles.colHeader}>CONTACT NO.</Text></View>
              <View style={styles.colPurpose}><Text style={styles.colHeader}>PURPOSE OF VISIT</Text></View>
              <View style={styles.colTime}><Text style={styles.colHeader}>TIME IN</Text></View>
              <View style={styles.colTime}><Text style={styles.colHeader}>TIME OUT</Text></View>
              <View style={styles.colAuth}><Text style={styles.colHeader}>AUTHORISED BY</Text></View>
            </View>

            {visitorEntries.map((entry, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={entry.name} onChangeText={t => updateVisitorEntry(idx, 'name', t)} /></View>
                <View style={styles.colAddress}><TextInput style={styles.cellInput} value={entry.address} onChangeText={t => updateVisitorEntry(idx, 'address', t)} /></View>
                <View style={styles.colContact}><TextInput style={styles.cellInput} value={entry.contact} onChangeText={t => updateVisitorEntry(idx, 'contact', t)} /></View>
                <View style={styles.colPurpose}><TextInput style={styles.cellInput} value={entry.purpose} onChangeText={t => updateVisitorEntry(idx, 'purpose', t)} /></View>
                <View style={styles.colTime}><TextInput style={styles.cellInput} value={entry.timeIn} onChangeText={t => updateVisitorEntry(idx, 'timeIn', t)} placeholder="HH:MM" /></View>
                <View style={styles.colTime}><TextInput style={styles.cellInput} value={entry.timeOut} onChangeText={t => updateVisitorEntry(idx, 'timeOut', t)} placeholder="HH:MM" /></View>
                <View style={styles.colAuth}><TextInput style={styles.cellInput} value={entry.authority} onChangeText={t => updateVisitorEntry(idx, 'authority', t)} /></View>
              </View>
            ))}
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureBlock}>
          <View style={styles.sigRow}><Text style={styles.verifyLabel}>SITE MANAGER NAME & SIGNATURE</Text><TextInput style={styles.verifyInput} value={siteManager} onChangeText={setSiteManager} /></View>
          <View style={styles.sigRow}><Text style={styles.verifyLabel}>VERIFIED BY HSEQ MANAGER</Text><TextInput style={styles.verifyInput} value={verifiedManager} onChangeText={setVerifiedManager} /></View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  headerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerLeft: { width: 200, alignItems: 'flex-start' },
  headerCenter: { flex: 1, paddingLeft: 12 },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  docLabel: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 12 },

  siteRow: { flexDirection: 'row', marginBottom: 8 },
  siteItem: { flex: 1, paddingRight: 8 },
  smallLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  siteInput: { borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 },

  healthBox: { borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  healthLabel: { fontSize: 12 },

  shiftManagerRow: { marginBottom: 12 },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', minHeight: 40, alignItems: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 40, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },

  colName: { flex: 0.2, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colAddress: { flex: 0.25, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colContact: { flex: 0.12, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colPurpose: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colTime: { flex: 0.08, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colAuth: { flex: 0.12, paddingHorizontal: 6 },

  cellInput: { height: 36, paddingHorizontal: 6, fontSize: 12 },

  signatureBlock: { marginTop: 12 },
  sigRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  verifyLabel: { width: 220, fontSize: 12, fontWeight: '700' },
  verifyInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 }
});

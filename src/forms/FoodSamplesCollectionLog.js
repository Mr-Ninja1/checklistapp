import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';

export default function FoodSamplesCollectionLog() {
  const initialLog = Array.from({ length: 14 }, () => ({ name: '', dateCollected: '', timeCollected: '', dateDisposal: '' }));
  const [logEntries, setLogEntries] = useState(initialLog);
  const [site, setSite] = useState('');
  const [location, setLocation] = useState('');
  const [supervisor, setSupervisor] = useState('');

  const updateLogEntry = (index, field, value) => {
    setLogEntries(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const logo = () => (
    <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}>
        <View style={styles.headerWrap}>
          <View style={styles.headerLeft}>{logo()}<Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text></View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>FOOD SAMPLES COLLECTION LOG</Text>
            <View style={styles.docRow}><Text style={styles.docLabel}>Doc No:</Text><Text style={styles.docValue}>BBN-SHEQ-F-B.1</Text></View>
            <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docValue}>{(() => { const t=new Date(); return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}` })()}</Text></View>
          </View>
          <View style={styles.headerRight}><Text style={styles.pageInfo}>Page 1 of 1</Text></View>
        </View>

        <View style={styles.specBox}>
          <Text style={styles.specTitle}>Specification:</Text>
          <Text style={styles.specText}>Take samples of foods served including carbohydrate, protein, fruits and vegetables, sauces and baked products. Keep in chiller at 4°C or below until 3 days after batch consumed.</Text>
        </View>

        <View style={styles.siteRow}>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>Site:</Text><TextInput style={styles.siteInput} value={site} onChangeText={setSite} /></View>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>Location:</Text><TextInput style={styles.siteInput} value={location} onChangeText={setLocation} /></View>
        </View>

        <View style={styles.supervisorRow}><Text style={styles.smallLabel}>Name & Sign of Supervisor:</Text><TextInput style={styles.siteInput} value={supervisor} onChangeText={setSupervisor} /></View>

        <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}>
            <View style={styles.tableHeaderRow}>
              <View style={styles.colName}><Text style={styles.colHeader}>Name of Food Sample</Text></View>
              <View style={styles.colDateCollected}><Text style={styles.colHeader}>Date Collected</Text></View>
              <View style={styles.colTimeCollected}><Text style={styles.colHeader}>Time Collected</Text></View>
              <View style={styles.colDateDisposal}><Text style={styles.colHeader}>Date of Disposal</Text></View>
            </View>

            {logEntries.map((entry, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={entry.name} onChangeText={t => updateLogEntry(idx, 'name', t)} /></View>
                <View style={styles.colDateCollected}><TextInput style={styles.cellInput} value={entry.dateCollected} onChangeText={t => updateLogEntry(idx, 'dateCollected', t)} placeholder="DD/MM/YYYY" /></View>
                <View style={styles.colTimeCollected}><TextInput style={styles.cellInput} value={entry.timeCollected} onChangeText={t => updateLogEntry(idx, 'timeCollected', t)} placeholder="HH:MM" /></View>
                <View style={styles.colDateDisposal}><TextInput style={styles.cellInput} value={entry.dateDisposal} onChangeText={t => updateLogEntry(idx, 'dateDisposal', t)} placeholder="DD/MM/YYYY" /></View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  headerWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerLeft: { width: 240 },
  headerCenter: { flex: 1, paddingLeft: 12 },
  headerRight: { width: 120, alignItems: 'flex-end' },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '700' },
  docRow: { flexDirection: 'row', marginTop: 4 },
  docLabel: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 12 },
  pageInfo: { fontSize: 10, fontWeight: '700' },

  specBox: { borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8 },
  specTitle: { fontWeight: '700', marginBottom: 6 },
  specText: { fontSize: 12, lineHeight: 18 },

  siteRow: { flexDirection: 'row', marginBottom: 8 },
  siteItem: { flex: 1, paddingRight: 8 },
  smallLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  siteInput: { borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 },
  supervisorRow: { marginBottom: 12 },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', minHeight: 40, alignItems: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 40, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },
  colName: { flex: 0.3, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colDateCollected: { flex: 0.25, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colTimeCollected: { flex: 0.25, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colDateDisposal: { flex: 0.2, paddingHorizontal: 6 },
  cellInput: { height: 36, paddingHorizontal: 6, fontSize: 12 }
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Image } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import FormActionBar from '../components/FormActionBar';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export default function FoodSamplesCollectionLog() {
  // Added 'preparationMethod' to the initial log state — memoized and given stable ids
  const initialLog = React.useMemo(() => Array.from({ length: 14 }, (_, i) => ({ 
    id: i + 1,
    name: '', 
    preparationMethod: '', // New field
    dateCollected: '', 
    timeCollected: '', 
    dateDisposal: '' 
  })), []);
  const [logEntries, setLogEntries] = useState(() => initialLog);
  const [site, setSite] = useState('');
  const [location, setLocation] = useState('');
  const [supervisor, setSupervisor] = useState('');

  // useFormSave integration
  const draftId = 'FoodSamplesCollectionLog_draft';
  const [logoDataUri, setLogoDataUri] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const asset = Asset.fromModule(require('../assets/logo.jpeg'));
        if (!asset.localUri) await asset.downloadAsync();
        const uri = asset.localUri || asset.uri;
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        if (b64 && mounted) setLogoDataUri(`data:image/jpeg;base64,${b64}`);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const buildPayload = () => ({
    formType: 'FoodSamplesCollectionLog',
    templateVersion: 'v1.0',
    title: 'Food Samples Collection Log',
    // Header information to allow presentational to reproduce the original document header
    companyName: 'BRAVO BRANDS LIMITED',
    docNo: 'BBN-SHEQ-F-B.1',
    issueDate: (() => { const t=new Date(); return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}` })(),
    pageInfo: 'Page 1 of 1',
    site,
    location,
    supervisor,
    // canonical shape uses formData.logEntries
    formData: { logEntries },
    // include the specification text so saved presentational can reproduce the doc
    specification: 'Take samples of foods served including carbohydrate, protein, fruits and vegetables, sauces and baked products. Keep in chiller at 4°C or below until 3 days after batch consumed.',
    layoutHints: {
      NAME: 220,
      PREP: 240,
      DATE: 120,
      TIME: 100,
      DISPOSE: 120
    },
    _tableWidth: 220 + 240 + 120 + 100 + 120,
    assets: logoDataUri ? { logoDataUri } : undefined,
    savedAt: Date.now()
  });

  const { isSaving, showNotification, notificationMessage, setShowNotification, scheduleAutoSave, handleSaveDraft, handleSubmit } = useFormSave({ buildPayload, draftId, clearOnSubmit: () => {
    setLogEntries(initialLog);
    setSite(''); setLocation(''); setSupervisor('');
  } });

  const updateLogEntry = (index, field, value) => {
    setLogEntries(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    // debounce autosave via the shared hook
    if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
  };

  const logo = () => (
    <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}>
        
        {/* Header Block */}
        <View style={styles.headerWrap}>
          <View style={styles.headerLeft}>
            {logo()}
            <Text style={[styles.companyName, { fontSize: 14, marginTop: 6 }]}>BRAVO BRANDS LIMITED</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>FOOD SAMPLES COLLECTION LOG</Text>
            <View style={styles.docRow}><Text style={styles.docLabel}>Doc No:</Text><Text style={styles.docValue}>BBN-SHEQ-F-B.1</Text></View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Issue Date:</Text>
              <Text style={styles.docValue}>{(() => { const t=new Date(); return `${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}` })()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}><Text style={styles.pageInfo}>Page 1 of 1</Text></View>
        </View>

        {/* Specification Box */}
        <View style={styles.specBox}>
          <Text style={styles.specTitle}>Specification:</Text>
          <Text style={styles.specText}>Take samples of foods served including carbohydrate, protein, fruits and vegetables, sauces and baked products. Keep in chiller at $4^\circ$C or below until 3 days after batch consumed.</Text>
        </View>

        {/* Site & Location */}
        <View style={styles.siteRow}>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>Site:</Text><TextInput style={styles.siteInput} value={site} onChangeText={setSite} /></View>
          <View style={styles.siteItem}><Text style={styles.smallLabel}>Location:</Text><TextInput style={styles.siteInput} value={location} onChangeText={setLocation} /></View>
        </View>

        {/* Supervisor Signature */}
        <View style={styles.supervisorRow}><Text style={styles.smallLabel}>Name \& Sign of Supervisor:</Text><TextInput style={styles.siteInput} value={supervisor} onChangeText={setSupervisor} /></View>

        {/* Food Samples Table */}
        <View style={{ width: '100%' }}>
          <View style={styles.tableOuter}>
            {/* Table Header Row (5 columns) */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.colName}><Text style={styles.colHeader}>Name of Food Sample</Text></View>
              {/* NEW COLUMN: Preparation Method */}
              <View style={styles.colPrepMethod}><Text style={styles.colHeader}>Preparation Method (Baking, Boiling, Frying, Grilling, Salad Making)</Text></View>
              <View style={styles.colDateCollected}><Text style={styles.colHeader}>Date Collected</Text></View>
              <View style={styles.colTimeCollected}><Text style={styles.colHeader}>Time Collected</Text></View>
              <View style={styles.colDateDisposal}><Text style={styles.colHeader}>Date of Disposal</Text></View>
            </View>

            {/* Table Rows */}
            {logEntries.map((entry, idx) => (
              <View key={entry.id} style={styles.tableRow}>
                <View style={styles.colName}><TextInput style={styles.cellInput} value={entry.name} onChangeText={t => updateLogEntry(idx, 'name', t)} /></View>
                {/* NEW COLUMN INPUT */}
                <View style={styles.colPrepMethod}><TextInput style={styles.cellInput} value={entry.preparationMethod} onChangeText={t => updateLogEntry(idx, 'preparationMethod', t)} /></View>
                <View style={styles.colDateCollected}><TextInput style={styles.cellInput} value={entry.dateCollected} onChangeText={t => updateLogEntry(idx, 'dateCollected', t)} placeholder="DD/MM/YYYY" /></View>
                <View style={styles.colTimeCollected}><TextInput style={styles.cellInput} value={entry.timeCollected} onChangeText={t => updateLogEntry(idx, 'timeCollected', t)} placeholder="HH:MM" /></View>
                <View style={styles.colDateDisposal}><TextInput style={styles.cellInput} value={entry.dateDisposal} onChangeText={t => updateLogEntry(idx, 'dateDisposal', t)} placeholder="DD/MM/YYYY" /></View>
              </View>
            ))}
          </View>
        </View>
        <FormActionBar onBack={() => {}} onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} showSavePdf={false} />

        <LoadingOverlay visible={isSaving} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  
  // --- Header Styles ---
  headerWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8 },
  headerLeft: { width: 140, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, paddingLeft: 12 },
  headerRight: { width: 80, alignItems: 'flex-end', marginTop: 10 },
  logoImage: { width: 84, height: 44, marginBottom: 4 },
  companyName: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  docRow: { flexDirection: 'row', marginTop: 4 },
  docLabel: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 12 },
  pageInfo: { fontSize: 10, fontWeight: '700' },

  // --- Specification Box ---
  specBox: { borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 8, borderRadius: 4 },
  specTitle: { fontWeight: '900', marginBottom: 6, color: '#333' },
  specText: { fontSize: 12, lineHeight: 18 },

  // --- Site/Supervisor Inputs ---
  siteRow: { flexDirection: 'row', marginBottom: 8 },
  siteItem: { flex: 1, paddingRight: 8 },
  smallLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4, color: '#444' },
  siteInput: { borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4, fontSize: 12 },
  supervisorRow: { marginBottom: 12 },

  // --- Table Styles (Adjusted for 5 columns) ---
  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000', minHeight: 40, alignItems: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 40, borderBottomWidth: 1, borderColor: '#000', alignItems: 'center' },
  colHeader: { fontWeight: '700', fontSize: 10, textAlign: 'center', paddingHorizontal: 2 },
  
 
  
  colName: { flex: 0.22, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colPrepMethod: { flex: 0.28, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colDateCollected: { flex: 0.17, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colTimeCollected: { flex: 0.16, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colDateDisposal: { flex: 0.17, paddingHorizontal: 4 }, // Last column has no right border

  cellInput: { height: 36, paddingHorizontal: 4, fontSize: 12, textAlign: 'center' }
});

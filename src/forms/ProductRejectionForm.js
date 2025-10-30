import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formStorage from '../utils/formStorage';
import { addFormHistory } from '../utils/formHistory';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { TouchableOpacity } from 'react-native-gesture-handler';
import EditableFormContainer from '../components/EditableFormContainer';

export default function ProductRejectionForm() {
  const draftKey = 'product_rejection_form';
  const initialRejectionLog = Array.from({ length: 5 }, () => ({ name: '', supplier: '', invoice: '', batch: '', expiry: '', reason: '' }));
  const [rejectionEntries, setRejectionEntries] = useState(initialRejectionLog);
  const [storeOfficer, setStoreOfficer] = useState('');
  const [complexManager, setComplexManager] = useState('');
  const [financeStockController, setFinanceStockController] = useState('');
  const [rejectedProductCollector, setRejectedProductCollector] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Load draft on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(draftKey);
        if (d && mounted) {
          if (d.rejectionEntries) setRejectionEntries(d.rejectionEntries);
          if (d.storeOfficer) setStoreOfficer(d.storeOfficer);
          if (d.complexManager) setComplexManager(d.complexManager);
          if (d.financeStockController) setFinanceStockController(d.financeStockController);
          if (d.rejectedProductCollector) setRejectedProductCollector(d.rejectedProductCollector);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-save draft on change
  React.useEffect(() => {
    const t = setTimeout(() => setDraft(draftKey, { rejectionEntries, storeOfficer, complexManager, financeStockController, rejectedProductCollector }), 700);
    return () => clearTimeout(t);
  }, [rejectionEntries, storeOfficer, complexManager, financeStockController, rejectedProductCollector]);

  // Save canonical payload
  const handleSubmit = async () => {
    try {
      // Try to embed logo as base64
      let logoDataUri = null;
      try {
        const asset = Asset.fromModule(require('../assets/logo.jpeg'));
        await asset.downloadAsync();
        if (asset.localUri) {
          const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
          if (b64) logoDataUri = `data:image/jpeg;base64,${b64}`;
        }
      } catch (e) { logoDataUri = null; }

      const payload = {
        formType: 'ProductRejectionForm',
        templateVersion: 'v1.0',
        title: 'PRODUCT REJECTION FORM',
        rejectionEntries,
        storeOfficer,
        complexManager,
        financeStockController,
        rejectedProductCollector,
        layoutHints: {
          SN: 40, NAME: 160, SUPPLIER: 120, INVOICE: 120, BATCH: 120, EXPIRY: 100, REASON: 180
        },
        _tableWidth: 40+160+120+120+120+100+180,
        assets: logoDataUri ? { logoDataUri } : undefined,
        savedAt: Date.now(),
      };
  const formId = `ProductRejectionForm_${Date.now()}`;
  await formStorage.saveForm(formId, payload);
      try { await removeDraft(draftKey); } catch (e) {}
      setRejectionEntries(initialRejectionLog);
      setStoreOfficer('');
      setComplexManager('');
      setFinanceStockController('');
      setRejectedProductCollector('');
      Alert.alert('Saved', 'Form saved to history');
    } catch (e) {
      Alert.alert('Error', 'Failed to save form');
    }
  };

  const handleSaveDraft = async () => {
    try {
      await setDraft(draftKey, { rejectionEntries, storeOfficer, complexManager, financeStockController, rejectedProductCollector });
      Alert.alert('Draft saved');
    } catch (e) { Alert.alert('Error', 'Failed to save draft'); }
  };

  const rejectionCriteria = [
    { product: 'Chilled products', criteria: 'Products above 4°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Frozen products', criteria: 'Product above -18°C; damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Dry Goods', criteria: 'Damaged packaging; broken seals; incorrect/missing label; missing expiry.' },
    { product: 'Cleaning Chemicals', criteria: 'Not in original containers; damaged packaging; missing MSDS; broken seals; missing expiry.' },
    { product: 'Eggs', criteria: 'Dirty, bad smell, broken, pests; 10/10 float test; missing/incorrect label.' },
    { product: 'Vegetables', criteria: 'Dirty, visible foreign matter, pest damage.' },
  ];

  const updateRejectionEntry = (index, field, value) => {
    setRejectionEntries(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const logo = () => (
    <Image source={require('../assets/logo.jpeg')} style={styles.logoImage} resizeMode="contain" />
  );

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.mainScrollContent, { paddingBottom: 200 }]}> 
        {/* ...existing code... */}
        <View style={styles.headerBlock}>
          <View style={styles.headerLeft}>{logo()}<Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text></View>
          <View style={styles.headerRight}>
            <Text style={styles.subject}>PRODUCT REJECTION FORM</Text>
            <View style={styles.docRow}><Text style={styles.docLabel}>Version No:</Text><Text style={styles.docValue}>01</Text></View>
            <View style={styles.docRow}><Text style={styles.docLabel}>Rev No:</Text><Text style={styles.docValue}>00</Text></View>
          </View>
        </View>
        <View style={styles.compiledRow}>
          <View style={styles.compiledItem}><Text style={styles.compiledLabel}>Compiled By:</Text><Text style={styles.compiledValue}>Michael Zulu C.</Text></View>
          <View style={styles.compiledItem}><Text style={styles.compiledLabel}>Approved By:</Text><Text style={styles.compiledValue}>Hassani Ali</Text></View>
        </View>
        <View style={styles.criteriaBox}>
          <Text style={styles.criteriaTitle}>Criteria for Rejecting the product</Text>
          {rejectionCriteria.map((c, i) => (
            <View key={i} style={styles.criteriaRow}>
              <Text style={styles.criteriaProduct}>{c.product}</Text>
              <Text style={styles.criteriaText}>{c.criteria}</Text>
            </View>
          ))}
        </View>
        <View style={{ width: '100%' }}>
          <View style={[styles.tableOuter, { alignSelf: 'stretch', paddingHorizontal: 0 }]}> 
            <View style={styles.tableHeaderRow}>
              <View style={styles.colSn}><Text style={styles.colHeader}>S/N</Text></View>
              <View style={styles.colName}><Text style={styles.colHeader}>Name of product Rejected</Text></View>
              <View style={styles.colSupplier}><Text style={styles.colHeader}>Suppliers Name</Text></View>
              <View style={styles.colInvoice}><Text style={styles.colHeader}>Invoice/Delivery No.</Text></View>
              <View style={styles.colBatch}><Text style={styles.colHeader}>Product Batch No.</Text></View>
              <View style={styles.colExpiry}><Text style={styles.colHeader}>Expiry Date</Text></View>
              <View style={styles.colReason}><Text style={styles.colHeader}>Reason for rejecting the product</Text></View>
            </View>
                {rejectionEntries.map((entry, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colSn}><Text style={styles.cellText}>{idx + 1}.</Text></View>
                <View style={styles.colName}>{editMode ? (
                    <TextInput style={styles.cellInput} value={entry.name} editable={true} onChangeText={t => updateRejectionEntry(idx, 'name', t)} />
                  ) : (
                    <Text style={styles.cellText}>{entry.name}</Text>
                  )}</View>
                <View style={styles.colSupplier}>{editMode ? (
                    <TextInput style={styles.cellInput} value={entry.supplier} editable={true} onChangeText={t => updateRejectionEntry(idx, 'supplier', t)} />
                  ) : (
                    <Text style={styles.cellText}>{entry.supplier}</Text>
                  )}</View>
                <View style={styles.colInvoice}>{editMode ? (
                    <TextInput style={styles.cellInput} value={entry.invoice} editable={true} onChangeText={t => updateRejectionEntry(idx, 'invoice', t)} />
                  ) : (
                    <Text style={styles.cellText}>{entry.invoice}</Text>
                  )}</View>
                <View style={styles.colBatch}>{editMode ? (
                    <TextInput style={styles.cellInput} value={entry.batch} editable={true} onChangeText={t => updateRejectionEntry(idx, 'batch', t)} />
                  ) : (
                    <Text style={styles.cellText}>{entry.batch}</Text>
                  )}</View>
                <View style={styles.colExpiry}>{editMode ? (
                    <TextInput style={styles.cellInput} value={entry.expiry} editable={true} onChangeText={t => updateRejectionEntry(idx, 'expiry', t)} placeholder="DD/MM/YYYY" />
                  ) : (
                    <Text style={styles.cellText}>{entry.expiry}</Text>
                  )}</View>
                <View style={styles.colReason}>{editMode ? (
                    <TextInput style={styles.cellInput} value={entry.reason} editable={true} onChangeText={t => updateRejectionEntry(idx, 'reason', t)} />
                  ) : (
                    <Text style={styles.cellText}>{entry.reason}</Text>
                  )}</View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.signatures}> 
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Name & signature of stores Officer:</Text>{editMode ? <TextInput style={styles.sigInput} value={storeOfficer} onChangeText={setStoreOfficer} /> : <Text style={styles.sigInput}>{storeOfficer}</Text>}</View>
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Verified by complex manager (Name & signature):</Text>{editMode ? <TextInput style={styles.sigInput} value={complexManager} onChangeText={setComplexManager} /> : <Text style={styles.sigInput}>{complexManager}</Text>}</View>
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Approved by (Finance and stock controller):</Text>{editMode ? <TextInput style={styles.sigInput} value={financeStockController} onChangeText={setFinanceStockController} /> : <Text style={styles.sigInput}>{financeStockController}</Text>}</View>
          <View style={styles.sigRow}><Text style={styles.sigLabel}>Rejected product collected by (Name & signature):</Text>{editMode ? <TextInput style={styles.sigInput} value={rejectedProductCollector} onChangeText={setRejectedProductCollector} /> : <Text style={styles.sigInput}>{rejectedProductCollector}</Text>}</View>
        </View>
        {/* Action buttons - placed inside ScrollView so they can be scrolled into view */}
        <View style={{ height: 18 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
          <TouchableOpacity onPress={handleSaveDraft} style={{ backgroundColor: '#f0ad4e', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: '#185a9d', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 16, paddingBottom: 120 },
  headerBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerLeft: { width: 240 },
  headerRight: { flex: 1, paddingLeft: 12 },
  logoImage: { width: 96, height: 36, marginBottom: 6 },
  companyName: { fontSize: 12, fontWeight: '700' },
  subject: { fontSize: 14, fontWeight: '700' },
  docRow: { flexDirection: 'row', marginTop: 4 },
  docLabel: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  docValue: { fontSize: 12 },

  compiledRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 8, marginBottom: 8 },
  compiledItem: { flex: 1, paddingHorizontal: 8 },
  compiledLabel: { fontSize: 12, fontWeight: '700' },
  compiledValue: { fontSize: 12 },

  criteriaBox: { borderWidth: 1, borderColor: '#000', padding: 8, marginBottom: 12 },
  criteriaTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  criteriaRow: { flexDirection: 'row', marginBottom: 6 },
  criteriaProduct: { flex: 0.25, fontWeight: '700' },
  criteriaText: { flex: 0.75 },

  tableOuter: { borderWidth: 1, borderColor: '#000', width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', minHeight: 40, alignItems: 'center', borderBottomWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', minHeight: 40, alignItems: 'center', borderBottomWidth: 1, borderColor: '#000' },
  colHeader: { fontWeight: '700', fontSize: 11, textAlign: 'center' },

  colSn: { flex: 0.05, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000', justifyContent: 'center' },
  colName: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colSupplier: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colInvoice: { flex: 0.1, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colBatch: { flex: 0.15, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colExpiry: { flex: 0.1, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  colReason: { flex: 0.3, paddingHorizontal: 6 },

  cellInput: { height: 36, paddingHorizontal: 6, fontSize: 12 },
  cellText: { textAlign: 'center' },

  signatures: { marginTop: 12 },
  sigRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sigLabel: { width: 260, fontSize: 12, fontWeight: '700' },
  sigInput: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 }
});

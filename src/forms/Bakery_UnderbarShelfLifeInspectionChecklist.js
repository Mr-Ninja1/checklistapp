import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import formStorage from '../utils/formStorage';
import useFormSave from '../hooks/useFormSave';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';
import { addFormHistory } from '../utils/formHistory';
import { removeDraft } from '../utils/formDrafts';

const DRAFT_KEY = 'bakery_underbar_shelf_life_draft';

// Start with the full product list from the scanned Underbar Chiller checklist
const initialProducts = [
  { name: 'RUMP STEAK' },
  { name: 'QTR CHICKEN' },
  { name: 'CHICKEN WINGS' },
  { name: 'T-BONE' },
  { name: 'BEEF RIBS' },
  { name: 'SALMON FISH' },
  { name: 'HAKE FISH' },
  { name: 'MINCE' },
  { name: 'PERI PERI CHICKEN' },
  { name: 'SOUP OF THE DAY (MUSHROOM)' },
  { name: 'SOUP OF THE DAY (BUTTERNUT)' },
  { name: 'LEMONGRASS BEEF MARINADE' },
  { name: 'BBQ BEEF RIB MARINADE' },
  { name: 'CORIANDER LIME RICE' },
  { name: 'PREGO SAUCE' },
  { name: 'MANGO MARINADE' },
  { name: 'MOROCCAN MARINADE' },
  { name: 'EMMENTAL SLICES' },
  { name: 'CHEDDAR CHEESE SLICE' },
  { name: 'MUSHROOM' },
  { name: 'PRE-COOKED PASTA' },
  { name: 'PRE-COOKED RICE' },
  { name: 'NOODLE' },
  { name: 'FETA CHEESE' },
  { name: 'LEMON BUTTER' },
  { name: 'RAINBOW SLAW' },
  { name: 'CHICKEN BREASTS' },
  { name: 'MATURE CHEDDAR' },
  { name: 'COUSCOUS' },
  { name: 'BASIL PESTO' },
  { name: 'PLAIN YOGHURT' },
  { name: 'GRANA PADANO' },
  { name: 'CHIA PUDDING' },
  { name: 'BERRY COMPOTE' },
  { name: 'CORN' },
  { name: 'BAKED BEANS' },
  { name: 'PICKLE RELISH' },
  { name: 'HOUSE SAUCE' },
  { name: 'CAESAR DRESSING' },
  { name: 'HONEY MUSTARD DRESSING' },
  { name: 'SOY & SESAME DRESSING' },
  { name: 'HEAVY CREAM' },
  { name: "JIMMY'S BBQ SAUCE" },
  { name: 'CHICKEN MAYO' },
  { name: 'TUNA MAYO' },
  { name: 'FRESH LEMON' },
  { name: 'FRESH TOMATO' },
  { name: 'SPINACH' },
  { name: 'CABBAGE' },
  { name: 'LETTUCE' },
  { name: 'CUCUMBER' },
  { name: 'BOILED EGGS' },
  { name: 'WHIPPED CREAM' },
  { name: 'ROASTED VEGETABLES' },
  { name: 'AVOCADO' },
  { name: 'GHERKINS' },
  // Five blank rows for additional entries (kept at bottom)
  { name: '' },
  { name: '' },
  { name: '' },
  { name: '' },
  { name: '' },
];

const initialEntry = {
  dateIn: '',
  timeIn: '',
  timeOut: '',
  usedBy: '',
  chefName: '',
  quantity: '',
  chefSign: '',
};

const initialLogState = initialProducts.map(p => ({ ...p, ...initialEntry }));

const initialMetadata = {
  subject: 'UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST',
  date: '',
  compiledBy: '',
  location: 'Underbar Chiller',
};

const initialVerification = {
  bakerSign: '',
  verifiedBySign: '',
};

export default function Bakery_UnderbarShelfLifeInspectionChecklist() {
  const [formData, setFormData] = useState(initialLogState);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [verification, setVerification] = useState(initialVerification);
  const [busy, setBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await formStorage.loadForm(DRAFT_KEY).catch(() => null);
        const payload = d?.payload || null;
        if (payload && mounted) {
          if (payload.formData) setFormData(payload.formData);
          if (payload.metadata) setMetadata(payload.metadata);
          if (payload.verification) setVerification(payload.verification);
        } else if (mounted) {
          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const yyyy = today.getFullYear();
          setMetadata(prev => ({ ...prev, date: `${dd}/${mm}/${yyyy}` }));
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, []);

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    try { scheduleAutoSave(); } catch (e) { /* ignore */ }
  }, []);

  const handleVerificationChange = (key, value) => {
    setVerification(prev => ({ ...prev, [key]: value }));
    try { scheduleAutoSave(); } catch (e) { /* ignore */ }
  };

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
    try { scheduleAutoSave(); } catch (e) { /* ignore */ }
  };

  const buildPayload = (status = 'draft') => ({
    formType: 'Bakery_UnderbarShelfLifeInspectionChecklist',
    templateVersion: '01',
    title: 'UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST',
    date: new Date().toLocaleDateString(),
    metadata,
    formData,
    verification,
    layoutHints: {},
    savedAt: Date.now(),
    status,
  });

  const { scheduleAutoSave, handleSaveDraft: hookSaveDraft, isSaving, showNotification, notificationMessage, setShowNotification } = useFormSave({ buildPayload, draftId: DRAFT_KEY, waitForSave: false });

  const handleSaveDraft = async () => {
    setBusy(true);
    try { await hookSaveDraft(); } catch (e) { console.warn('save draft failed', e); }
    setBusy(false);
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const payload = buildPayload('submitted');
      await addFormHistory({ title: payload.title, date: payload.metadata?.date || payload.date || Date.now(), savedAt: Date.now(), payload });
      Alert.alert('Saved', 'Checklist submitted. Your draft has been preserved.');
    } catch (e) { console.warn('submit failed', e); Alert.alert('Error', 'Submission failed'); }
    setBusy(false);
  };

  const handleClearDraft = async () => {
    const ok = await new Promise(resolve => {
      Alert.alert('Clear draft', 'This action will clear the draft and all your progress. Are you sure you want to continue?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Yes, Clear', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!ok) return;
    try { await removeDraft(DRAFT_KEY); } catch (e) { console.warn('removeDraft failed', e); }
    setFormData(initialLogState);
    setVerification(initialVerification);
    setMetadata(initialMetadata);
    setEditMode(false);
  };

  const actionButtons = (
    <View style={styles.buttonRow}>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#e53e3e' }]} onPress={handleClearDraft} disabled={busy}><Text style={styles.btnText}>Clear Draft</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraft} disabled={busy}><Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Checklist'}</Text></TouchableOpacity>
    </View>
  );

  const columnHeaders = useMemo(() => [
    { key: 'name', label: 'ITEMS', flex: 3, isStatic: false },
    { key: 'dateIn', label: 'DATE IN', flex: 1 },
    { key: 'timeIn', label: 'TIME IN', flex: 1 },
    { key: 'timeOut', label: 'TIME OUT', flex: 1 },
    { key: 'usedBy', label: 'USED BY', flex: 2 },
    { key: 'chefName', label: "CHEF'S NAME", flex: 3 },
    { key: 'quantity', label: 'QUANTITY', flex: 1 },
    { key: 'chefSign', label: 'CHEF SIGN', flex: 1 },
  ], []);

  const totalFlex = columnHeaders.reduce((s, c) => s + (c.flex || 1), 0);
  const tableAvailableWidth = Math.max(windowWidth - 32, 700);
  const colPixel = (flex) => Math.floor((flex / totalFlex) * tableAvailableWidth);

  const normalizeSignatureToDataUri = (sig) => {
    if (!sig && sig !== '') return null;
    if (sig && typeof sig === 'object') {
      const maybe = sig.uri || sig.data || sig.base64 || sig.signature || sig.dataUri;
      if (!maybe || typeof maybe !== 'string') return null;
      const s = maybe.trim();
      if (!s) return null;
      if (s.indexOf('data:') >= 0) return s;
      const compact = s.replace(/\s+/g, '');
      if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
      return null;
    }
    if (typeof sig === 'string') {
      const s = sig.trim();
      if (!s) return null;
      if (s.indexOf('data:') >= 0) return s;
      const compact = s.replace(/\s+/g, '');
      if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
      return null;
    }
    return null;
  };

  const renderRow = (item, index) => (
    <View key={index} style={styles.row}>
      {columnHeaders.map(col => {
        const w = colPixel(col.flex || 1);
        if (col.key === 'chefSign') {
          return (
            <View key={col.key} style={[styles.cell, { width: w }]}> 
              {editMode ? (
                <SignatureField value={item.chefSign} onChange={v => handleEntryChange(index, 'chefSign', v)} editable={editMode} width={Math.max(w - 8, 120)} height={60} />
              ) : (() => {
                const v = item.chefSign;
                const uri = normalizeSignatureToDataUri(v);
                if (uri) return <SignatureThumb uri={uri} width={Math.max(w - 8, 120)} height={60} layers={6} spread={1.0} />;
                const asText = v == null ? '' : (typeof v === 'string' ? v : JSON.stringify(v));
                return <Text style={styles.readOnlyText}>{asText || ''}</Text>;
              })()}
            </View>
          );
        }

        return (
          <View key={col.key} style={[styles.cell, { width: w }]}> 
            <TextInput
              value={item[col.key]}
              onChangeText={v => handleEntryChange(index, col.key, v)}
              style={styles.input}
              multiline={true}
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <EditableFormContainer editMode={editMode} setEditMode={setEditMode} onSaveDraft={handleSaveDraft} actionButtons={actionButtons}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerBox}>
            <View style={styles.logoWrap}><Image source={require('../assets/logo.jpeg')} style={styles.logo} /><Text style={styles.brand}>Bravo Brands Limited</Text></View>
            <Text style={styles.title}>UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST</Text>
            <Text style={styles.frequency}>Location: {metadata.location}</Text>
          </View>

          <ScrollView horizontal contentContainerStyle={{ minWidth: tableAvailableWidth }}>
            <View style={[styles.tableWrap, { width: tableAvailableWidth }]}> 
              <View style={styles.tableHeader}>
                {columnHeaders.map(col => (
                  <View key={col.key} style={[styles.headerCell, { width: colPixel(col.flex || 1) }]}>
                    <Text style={styles.headerText}>{col.label}</Text>
                  </View>
                ))}
              </View>
              {formData.map(renderRow)}
            </View>
          </ScrollView>

          <View style={styles.verificationBox}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.verLabel}>Baker / Chef Signature</Text>
              {editMode ? (
                <SignatureField value={verification.bakerSign} onChange={v => handleVerificationChange('bakerSign', v)} editable={editMode} width={240} height={80} />
              ) : (() => {
                const v = verification.bakerSign || '';
                const asString = v ? String(v) : '';
                const uri = asString.startsWith('data:') ? asString : (asString.replace(/\s+/g, '') && /^[A-Za-z0-9+/=]+$/.test(asString.replace(/\s+/g, '')) && asString.replace(/\s+/g, '').length > 100 ? `data:image/png;base64,${asString.replace(/\s+/g, '')}` : null);
                return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={8} spread={1.2} /> : <Text style={styles.metaText}>{v || ''}</Text>;
              })()}
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.verLabel}>Verified By</Text>
              {editMode ? (
                <SignatureField value={verification.verifiedBySign} onChange={v => handleVerificationChange('verifiedBySign', v)} editable={editMode} width={240} height={80} />
              ) : (() => {
                const v = verification.verifiedBySign || '';
                const asString = v ? String(v) : '';
                const uri = asString.startsWith('data:') ? asString : (asString.replace(/\s+/g, '') && /^[A-Za-z0-9+/=]+$/.test(asString.replace(/\s+/g, '')) && asString.replace(/\s+/g, '').length > 100 ? `data:image/png;base64,${asString.replace(/\s+/g, '')}` : null);
                return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={8} spread={1.2} /> : <Text style={styles.metaText}>{v || ''}</Text>;
              })()}
            </View>
          </View>

          <LoadingOverlay visible={isSaving || busy} />
          <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => {
            setShowNotification(false);
          }} />
        </ScrollView>
      </View>
    </EditableFormContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f7f9' },
  content: { padding: 12, paddingBottom: 160 },
  headerBox: { alignItems: 'center', marginBottom: 12 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 40, height: 40, marginRight: 8 },
  brand: { fontWeight: '700', fontSize: 16, color: '#185a9d' },
  title: { fontWeight: '800', fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 4 },
  frequency: { fontSize: 13, color: '#d32f2f', fontWeight: 'bold', marginBottom: 8 },
  tableWrap: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1.2, borderColor: '#333', overflow: 'hidden', paddingHorizontal: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1.2, borderColor: '#333' },
  headerCell: { paddingVertical: 12, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333', minHeight: 56 },
  cell: { paddingVertical: 8, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  input: { padding: 8, fontSize: 12, textAlign: 'left', minHeight: 48, lineHeight: 18 },
  metaText: { fontSize: 12, color: '#333', marginBottom: 2 },
  verLabel: { fontWeight: '700', marginBottom: 6 },
  verificationBox: { marginTop: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  readOnlyText: { fontSize: 12, color: '#374151' },
});

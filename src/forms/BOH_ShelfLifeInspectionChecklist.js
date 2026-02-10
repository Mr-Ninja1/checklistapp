import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from 'react-native';
import formStorage from '../utils/formStorage';
import useFormSave from '../hooks/useFormSave';
import { addFormHistory } from '../utils/formHistory';
import { removeDraft } from '../utils/formDrafts';
import LoadingOverlay from '../components/LoadingOverlay';
import NotificationModal from '../components/NotificationModal';
import EditableFormContainer from '../components/EditableFormContainer';
import SignatureField from '../components/SignatureField';
import SignatureThumb from '../components/SignatureThumb';
// history registration is handled by the save hook via formStorage.saveForm

const DRAFT_KEY = 'boh_shelf_life_inspection_draft';

const initialProducts = [
  { name: 'BURGER ROLLS' },
  { name: 'BAGELS' },
  { name: 'MALVA PUDDING' },
  { name: 'PORTUGUESE ROLLS' },
  { name: 'BAGUETTE' },
  { name: 'ALMOND BROWNIES' },
  { name: 'CHEESE CAKE' },
  { name: 'PIZZA DOUGH' },
  { name: 'WHITE BREAD' },
  { name: 'CROISSANTS' },
  { name: 'BROWN BREAD' },
  { name: 'DATE CAKE' },
  { name: 'CARROT CAKE' },
  { name: 'ALMOND CHOCOLATE CAKE' },
];

const initialEntry = {
  dateIn: '',
  timeIn: '',
  timeOut: '',
  usedBy: '',
  bakerChefName: '',
  quantity: '',
  sign: '',
};

// Base table rows (only the predefined product rows). New rows are added
// by user via the `Add Row` control (limit 5 extra rows).
const initialLogState = initialProducts.map(p => ({ ...p, ...initialEntry }));
const MAX_EXTRA_ROWS = 5;

const initialMetadata = {
  docNo: 'BBN-SHEQ-BOH-F-02-01c',
  frequency: 'Daily',
  date: '',
  compiledBy: 'Michael Zulu C.',
  dateOfIssue: '',
};

const initialVerification = {
  hseqManagerSign: '',
  complexManagerSign: '',
  bakerSign: '',
  verifiedBySign: '',
};

export default function BOH_ShelfLifeInspectionChecklist() {
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
            if (payload.formData) {
              // Restore what was saved but filter out legacy implicit blank rows.
              // Preserve user-added rows (they are marked with __userAdded).
              const loaded = Array.isArray(payload.formData) ? payload.formData.slice() : [];
              const cleaned = loaded.filter(r => {
                if (!r) return false;
                if (r.__userAdded) return true;
                if (r.name && String(r.name).trim()) return true;
                const keys = Object.keys(initialEntry);
                for (let k of keys) {
                  if (r[k] && String(r[k]).trim()) return true;
                }
                return false;
              });
              setFormData(cleaned.length ? cleaned : initialLogState);
            }
            if (payload.metadata) setMetadata(payload.metadata);
            if (payload.verification) setVerification(payload.verification);
          } else if (mounted) {
          // auto-populate date fields
          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const yyyy = today.getFullYear();
          setMetadata(prev => ({ ...prev, date: `${dd}/${mm}/${yyyy}`, dateOfIssue: `${dd}/${mm}/${yyyy}` }));
        }
      } catch (e) { console.warn('load draft failed', e); }
    })();
    return () => { mounted = false; };
  }, []);

  // autosave is scheduled via the save hook when fields change
  // build canonical payload for storage
  const buildPayload = (status = 'draft') => ({
    formType: 'BOH_ShelfLifeInspectionChecklist',
    templateVersion: '01',
    title: 'BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST',
    date: new Date().toLocaleDateString(),
    metadata,
    // Persist the current table rows but filter out legacy implicit blank rows.
    // Preserve rows that were explicitly added by the user (marked with __userAdded).
    formData: (Array.isArray(formData) ? formData.slice() : []).filter(r => {
      if (!r) return false;
      if (r.__userAdded) return true; // keep user-added rows even if empty
      // keep rows that have a name or any non-empty field
      if (r.name && String(r.name).trim()) return true;
      const keys = Object.keys(initialEntry);
      for (let k of keys) {
        if (r[k] && String(r[k]).trim()) return true;
      }
      return false;
    }),
    verification,
    layoutHints: {},
    savedAt: Date.now(),
    status,
  });

  const { scheduleAutoSave, handleSaveDraft: hookSaveDraft, isSaving, showNotification, notificationMessage, setShowNotification } = useFormSave({ buildPayload, draftId: DRAFT_KEY, waitForSave: false });

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const payload = buildPayload('submitted');
      await addFormHistory({ title: payload.title, date: payload.date || payload.metadata?.date || Date.now(), savedAt: Date.now(), payload });
      Alert.alert('Saved', 'Checklist submitted. Your draft has been preserved.');
    } catch (e) { console.warn('submit failed', e); throw e; } finally { setBusy(false); }
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

  const handleEntryChange = useCallback((index, field, value) => {
    setFormData(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    try { if (typeof scheduleAutoSave === 'function') scheduleAutoSave(); } catch (e) { /* ignore */ }
  }, [scheduleAutoSave]);

  const handleVerificationChange = (key, value) => {
    setVerification(prev => ({ ...prev, [key]: value }));
    try { if (typeof scheduleAutoSave === 'function') scheduleAutoSave(); } catch (e) { /* ignore */ }
  };

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
    try { if (typeof scheduleAutoSave === 'function') scheduleAutoSave(); } catch (e) { /* ignore */ }
  };


  const handleSaveDraft = async () => {
    setBusy(true);
    try { await hookSaveDraft(); } catch (e) { console.warn('save draft failed', e); }
    setBusy(false);
  };

  // Expose the draft-save result to callers for easier debugging/testing
  const handleSaveDraftAndReturn = async () => {
    setBusy(true);
    try {
      const res = await hookSaveDraft();
      return res;
    } catch (e) {
      console.warn('save draft failed', e);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  // Add a new blank row after the predefined items (limit MAX_EXTRA_ROWS)
  const addRow = useCallback(() => {
    const baseCount = initialLogState.length;
    const extraCount = Math.max(0, (Array.isArray(formData) ? formData.length : 0) - baseCount);
    if (extraCount >= MAX_EXTRA_ROWS) return false;
    setFormData(prev => {
      const next = Array.isArray(prev) ? prev.slice() : [];
      next.push({ name: '', ...initialEntry, __userAdded: true });
      return next;
    });
    try { if (typeof scheduleAutoSave === 'function') scheduleAutoSave(); } catch (e) { /* ignore */ }
    return true;
  }, [formData, scheduleAutoSave]);

  // Render action buttons outside the pointer-events-blocking children so they
  // remain tappable when editMode is false.
  const actionButtons = (
    <View style={styles.buttonRow}>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#10b981' }]} onPress={() => addRow()} disabled={(formData.length - initialLogState.length) >= MAX_EXTRA_ROWS}>
        <Text style={styles.btnText}>{((formData.length - initialLogState.length) >= MAX_EXTRA_ROWS) ? 'Max rows' : 'Add Row'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#f6c342' }]} onPress={handleSaveDraftAndReturn} disabled={busy}><Text style={styles.btnText}>{busy ? 'Saving...' : 'Save Draft'}</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#e53e3e' }]} onPress={handleClearDraft} disabled={busy}><Text style={styles.btnText}>Clear Draft</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#3b82f6' }]} onPress={handleSubmit} disabled={busy}><Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit Checklist'}</Text></TouchableOpacity>
    </View>
  );

  // use flex weights so columns scale and can expand for A4-like width
  const columnHeaders = useMemo(() => [
    { key: 'name', label: 'ITEMS', flex: 3, isStatic: false },
    { key: 'dateIn', label: 'DATE IN', flex: 1 },
    { key: 'timeIn', label: 'TIME IN', flex: 1 },
    { key: 'timeOut', label: 'TIME OUT', flex: 1 },
    { key: 'usedBy', label: 'USED BY', flex: 2 },
    { key: 'bakerChefName', label: "BAKER/CHEF'S NAME", flex: 3 },
    { key: 'quantity', label: 'QUANTITY', flex: 1 },
    { key: 'sign', label: 'SIGN', flex: 1 },
  ], []);


  // compute widths so columns fill the available view width
  const totalFlex = columnHeaders.reduce((s, c) => s + (c.flex || 1), 0);
  const tableAvailableWidth = Math.max(windowWidth - 32, 600); // leave some margin; ensure minimum width
  const colPixel = (flex) => Math.floor((flex / totalFlex) * tableAvailableWidth);

  // Normalize various signature shapes to a data:image URI when possible.
  // Accepts:
  // - data URIs (already usable)
  // - compact base64 strings (no data: prefix)
  // - object shapes like { uri }, { data }, { base64 } where the value may
  //   be a data URI or compact base64
  const normalizeSignatureToDataUri = (sig) => {
    if (!sig && sig !== '') return null;
    // If it's an object, prefer .uri, .data, .base64, .signature, or .dataUri
    if (sig && typeof sig === 'object') {
      const maybe = sig.uri || sig.data || sig.base64 || sig.signature || sig.dataUri;
      if (!maybe || typeof maybe !== 'string') return null;
      const s = maybe.trim();
      if (!s) return null;
      if (s.indexOf('data:') >= 0) return s; // allow data: anywhere (robust against whitespace/newlines)
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
        if (col.isStatic) {
          return (
            <View key={col.key} style={[styles.cell, { width: w, backgroundColor: '#f7f7fa' }]}>
              <Text style={styles.staticText}>{item.name}</Text>
            </View>
          );
        }
        if (col.key === 'sign') {
          return (
            <View key={col.key} style={[styles.cell, { width: w }]}> 
              {editMode ? (
                <SignatureField value={item.sign} onChange={v => handleEntryChange(index, 'sign', v)} editable={editMode} width={Math.max(w - 8, 120)} height={60} />
              ) : (() => {
                const v = item.sign;
                const uri = normalizeSignatureToDataUri(v);
                if (uri) {
                  return <SignatureThumb uri={uri} width={Math.max(w - 8, 120)} height={60} layers={6} spread={1.0} />;
                }
                // Fallback: show a readable string (for plain text or object shapes)
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
              editable={editMode}
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
          <Text style={styles.title}>BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST</Text>
          <Text style={styles.frequency}>FREQUENCY: {metadata.frequency}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.issueDate}>Issue Date: {metadata.dateOfIssue || metadata.date}</Text>
          </View>
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

        {/* Verification footer removed per UI update; Issue Date moved to header */}

        {/* Signature inputs / read-only thumbs */}
        <View style={styles.verificationBox}>
          {/* HSEQ Manager */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.verLabel}>HSEQ Manager</Text>
            {editMode ? (
              <SignatureField value={verification.hseqManagerSign} onChange={v => handleVerificationChange('hseqManagerSign', v)} editable={editMode} width={240} height={80} />
            ) : (() => {
              const v = verification.hseqManagerSign || verification.hseqManager || verification.hseqManagerSignature || '';
              const asString = v ? String(v) : '';
              const uri = asString.startsWith('data:') ? asString : (asString.replace(/\s+/g, '') && /^[A-Za-z0-9+/=]+$/.test(asString.replace(/\s+/g, '')) && asString.replace(/\s+/g, '').length > 100 ? `data:image/png;base64,${asString.replace(/\s+/g, '')}` : null);
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={8} spread={1.2} /> : <Text style={styles.metaText}>{v || ''}</Text>;
            })()}
          </View>

          {/* Complex Manager */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.verLabel}>Complex Manager</Text>
            {editMode ? (
              <SignatureField value={verification.complexManagerSign} onChange={v => handleVerificationChange('complexManagerSign', v)} editable={editMode} width={240} height={80} />
            ) : (() => {
              const v = verification.complexManagerSign || verification.complexManager || verification.complexManagerSignature || '';
              const asString = v ? String(v) : '';
              const uri = asString.startsWith('data:') ? asString : (asString.replace(/\s+/g, '') && /^[A-Za-z0-9+/=]+$/.test(asString.replace(/\s+/g, '')) && asString.replace(/\s+/g, '').length > 100 ? `data:image/png;base64,${asString.replace(/\s+/g, '')}` : null);
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={8} spread={1.2} /> : <Text style={styles.metaText}>{v || ''}</Text>;
            })()}
          </View>

          {/* Baker / Chef Signature */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.verLabel}>Baker / Chef Signature</Text>
            {editMode ? (
              <SignatureField value={verification.bakerSign} onChange={v => handleVerificationChange('bakerSign', v)} editable={editMode} width={240} height={80} />
            ) : (() => {
              const v = verification.bakerSign || verification.baker || verification.bakerSignature || '';
              const asString = v ? String(v) : '';
              const uri = asString.startsWith('data:') ? asString : (asString.replace(/\s+/g, '') && /^[A-Za-z0-9+/=]+$/.test(asString.replace(/\s+/g, '')) && asString.replace(/\s+/g, '').length > 100 ? `data:image/png;base64,${asString.replace(/\s+/g, '')}` : null);
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={8} spread={1.2} /> : <Text style={styles.metaText}>{v || ''}</Text>;
            })()}
          </View>

          {/* Verified By (other verification) */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.verLabel}>Verified By</Text>
            {editMode ? (
              <SignatureField value={verification.verifiedBySign} onChange={v => handleVerificationChange('verifiedBySign', v)} editable={editMode} width={240} height={80} />
            ) : (() => {
              const v = verification.verifiedBySign || verification.verifiedBy || verification.verifiedBySignature || '';
              const asString = v ? String(v) : '';
              const uri = asString.startsWith('data:') ? asString : (asString.replace(/\s+/g, '') && /^[A-Za-z0-9+/=]+$/.test(asString.replace(/\s+/g, '')) && asString.replace(/\s+/g, '').length > 100 ? `data:image/png;base64,${asString.replace(/\s+/g, '')}` : null);
              return uri ? <SignatureThumb uri={uri} width={240} height={80} layers={8} spread={1.2} /> : <Text style={styles.metaText}>{v || ''}</Text>;
            })()}
          </View>
        </View>

        {/* Buttons are provided via the `actionButtons` prop to EditableFormContainer so
            they remain tappable even when the form is read-only. Removed inline
            duplicate buttons to avoid duplicate controls. */}
        <LoadingOverlay visible={isSaving || busy} />
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => {
          // Only dismiss the notification. Do NOT clear the form here —
          // clearing is handled by the save/submit flow (clearOnSubmit) when appropriate.
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
  headerRight: { position: 'absolute', right: 12, top: 12 },
  issueDate: { fontSize: 12, color: '#374151', fontWeight: '700' },
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
  staticText: { fontWeight: '600', fontSize: 12, color: '#444' },
  input: { padding: 8, fontSize: 12, textAlign: 'left', minHeight: 48, lineHeight: 18 },
  metaText: { fontSize: 12, color: '#333', marginBottom: 2 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});
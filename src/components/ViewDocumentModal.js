import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import SavedFormRenderer from './SavedFormRenderer';
import Spinner from 'react-native-loading-spinner-overlay';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import useExportFormAsPDF from '../utils/useExportFormAsPDF';
import { mapping, routeMapping, getGeneratorForPayload } from '../utils/htmlGenerators/mapping';
import { Platform, Linking } from 'react-native';

// `expo-clipboard` is optional in some environments (Node scripts, CI).
// Require it safely so top-level module resolution doesn't throw when running
// Node-only tools that import components for analysis.
let Clipboard;
try { Clipboard = require('expo-clipboard'); } catch (e) { Clipboard = null; }

async function setClipboardString(text) {
  const t = String(text || '');
  // 1) expo-clipboard (common in Expo apps)
  try {
    if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
      await Clipboard.setStringAsync(t);
      return true;
    }
    if (Clipboard && Clipboard.default && typeof Clipboard.default.setStringAsync === 'function') {
      await Clipboard.default.setStringAsync(t);
      return true;
    }
  } catch (e) {
    console.warn('expo-clipboard set failed', e && e.message);
  }

  // 2) web navigator clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch (e) {
    console.warn('navigator.clipboard write failed', e && e.message);
  }

  // 3) try react-native community clipboard if available
  try {
    const RNClipboard = require('@react-native-clipboard/clipboard');
    if (RNClipboard && typeof RNClipboard.setString === 'function') {
      RNClipboard.setString(t);
      return true;
    }
    if (RNClipboard && typeof RNClipboard.setStringAsync === 'function') {
      await RNClipboard.setStringAsync(t);
      return true;
    }
  } catch (e) {
    // not available - ignore
  }

  return false;
}

export default function ViewDocumentModal({ visible, form, onClose, onDownload }) {
  // Modal shows a saved form; use onDownload to open the saved PDF rather than re-exporting
  const formRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportingWide, setExportingWide] = useState(false);
  const [payloadDialogVisible, setPayloadDialogVisible] = useState(false);
  const [payloadMinimalStr, setPayloadMinimalStr] = useState('');
  const [payloadFullStr, setPayloadFullStr] = useState('');
  const { exportAsPDF } = useExportFormAsPDF();

  const handleExportPress = async () => {
    if (!form) return;
    setExporting(true);
    try {
      const res = await exportAsPDF({ title: form.title, date: form.date, shift: form.shift, formData: form, exportOptions: { filename: form.title, captureRef: formRef, captureScale: 2, fallbackToScreenshot: true } });
      if (!res) {
        Alert.alert('Export failed', 'No response from exporter');
        return;
      }
      if (res.error) {
        Alert.alert('Export failed', res.error.toString());
        return;
      }

      if (res.pdfPath) {
        try {
          await Sharing.shareAsync(res.pdfPath);
        } catch (e) {
          Alert.alert('Export saved', `PDF saved to ${res.pdfPath}`);
        }
        return;
      }

      if (res.pdfDataUri) {
        // web: open in new window; native: write file then share
        if (Platform.OS === 'web') {
          try {
            const w = window.open();
            if (w) w.document.write(`<iframe src="${res.pdfDataUri}" style="width:100%;height:100%"></iframe>`);
          } catch (e) { Alert.alert('Export', 'Unable to open PDF in new window.'); }
        } else {
          try {
            const base64 = String(res.pdfDataUri).split(',')[1] || '';
            const dir = FileSystem.documentDirectory + 'forms/';
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
            const safe = (s) => String(s || '').replace(/[^a-z0-9\.-_]/gi, '_').replace(/_+/g, '_').slice(0, 120);
            const suggested = safe(form && (form.title || form.formType) || `form_${Date.now()}`);
            const out = `${dir}${suggested.replace(/\.pdf$/i, '')}.pdf`;
            await FileSystem.writeAsStringAsync(out, base64, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(out);
          } catch (e) {
            Alert.alert('Export failed', String(e));
          }
        }
        return;
      }

      Alert.alert('Export', 'Export completed.');
    } catch (e) {
      console.warn('export error', e);
      Alert.alert('Export failed', String(e));
    } finally {
      setExporting(false);
    }
  };

  // Debug helper: force HTML-only export (do not rely on captureRef/screenshot)
  const handleDebugHtmlExport = async () => {
    if (!form) return;
    setExporting(true);
    try {
      const res = await exportAsPDF({ title: form.title, date: form.date, shift: form.shift, formData: form, exportOptions: { filename: form.title, forceHtml: true } });
      console.log('debug html export result', res);
      if (res && res.error) {
        console.warn('Debug Export failed', String(res.error));
      }
    } catch (e) {
      console.warn('debug export error', e);
    } finally {
      setExporting(false);
    }
  };

  const handleShowFormType = async () => {
    if (!form) return;
    const ft = form.formType || (form.payload && form.payload.formType) || form.template || form.title || '';
    // determine mapped generator (if any) and include fuzzy-matcher score
    let genLabel = '<none>';
    let exactMatchKey = null;
    let exactMatchScore = null;
    let fallbackInfo = null;
    try {
      const exact = routeMapping && routeMapping[ft];
      if (exact) {
        const found = Object.keys(mapping).find(k => mapping[k] === exact);
        exactMatchKey = found || '<routeMapping generator (unknown key)>';
        exactMatchScore = Infinity;
        genLabel = exactMatchKey + ` (score: ${exactMatchScore})`;
      }

      // try normalized direct lookup as well
      const k1 = String(ft).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
      const k2 = String(ft).toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidate = (mapping && (mapping[k1] || mapping[k2]));
      if (candidate && !exact) {
        const found = Object.keys(mapping).find(k => mapping[k] === candidate);
        genLabel = (found || '<mapping generator (unknown key)>') + ' (score: exact-normalized)';
        exactMatchKey = found;
        exactMatchScore = 'normalized';
      }

      // always attempt fuzzy fallback to report best-scoring candidate
      try {
        const fallback = getGeneratorForPayload({ formType: ft, title: ft, name: ft }, { allowFallback: true });
        if (fallback && fallback.matchedKey) {
          fallbackInfo = fallback;
          if (!exactMatchKey) {
            genLabel = `${fallback.matchedKey} (score: ${fallback.score})`;
          } else {
            genLabel = `${exactMatchKey} (score: ${exactMatchScore}) — fuzzy: ${fallback.matchedKey} (score: ${fallback.score})`;
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      genLabel = `<error: ${String(e)}>`;
    }

    const message = `formType: ${String(ft || '<empty>')}\nresolved: ${String(genLabel)}`;
    const copyToClipboard = async (txt) => {
      try {
        const ok = await setClipboardString(String(txt || ''));
        if (ok) { Alert.alert('Copied', 'Copied to clipboard'); return; }
        Alert.alert('Copy not supported', 'Clipboard API is unavailable in this environment');
      } catch (e) {
        Alert.alert('Copy failed', String(e));
      }
    };

    Alert.alert('Form type', message, [
      { text: 'Copy formType', onPress: async () => { await copyToClipboard(String(ft || '')); } },
      { text: 'Copy generator', onPress: async () => { await copyToClipboard(String(genLabel || '')); } },
      { text: 'Close', style: 'cancel' }
    ]);
  };

  const handleShowPayload = async () => {
    if (!form) return;
    const p = form.payload || form || {};
    const minimal = {
      formType: p.formType || p.template || p.title || '',
      title: p.title || '',
      date: p.date || p.savedAt || '',
      shift: p.shift || (p.formData && p.formData.shift) || '',
      sampleRow: (p.handlers && p.handlers[0]) || (p.logEntries && p.logEntries[0]) || null,
    };

    const full = (() => {
      try { return JSON.stringify(p, null, 2); } catch (e) { return String(p); }
    })();

    setPayloadMinimalStr(JSON.stringify(minimal, null, 2));
    setPayloadFullStr(full);
    setPayloadDialogVisible(true);
  };

  const handleSharePayloadFile = async (text) => {
    if (!text) {
      Alert.alert('No payload', 'Nothing to share');
      return;
    }
    try {
      const safe = (s) => String(s || '').replace(/[^a-z0-9\.-_]/gi, '_').replace(/_+/g, '_').slice(0, 120);
      const base = safe((form && (form.title || form.formType)) || 'payload');
      const fileName = `${base.replace(/\.txt$/i, '')}_${Date.now()}.txt`;
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const path = `${dir}${fileName}`;
      await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });
      try {
        const avail = await Sharing.isAvailableAsync();
        if (avail) {
          await Sharing.shareAsync(path);
          return;
        }
      } catch (e) {
        console.warn('share failed', e && e.message);
      }
      Alert.alert('Saved', `Payload written to ${path}`);
    } catch (e) {
      Alert.alert('Share failed', String(e));
    }
  };

  useEffect(() => {
    // no debug logging in production view
  }, [form, visible]);

  if (!form) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={exportingWide ? [styles.modalContent, { width: '100%', maxWidth: '100%', borderRadius: 0, padding: 0, maxHeight: '100%' }] : styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.topCloseButton} onPress={onClose}>
              <Text style={styles.topCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={exportingWide ? { maxHeight: '100%' } : { maxHeight: '92%' }} contentContainerStyle={{ paddingBottom: 12 }} nestedScrollEnabled={true}>
            <View
              ref={formRef}
              collapsable={false}
            >
              <SavedFormRenderer savedPayload={form} embedded={true} exportingWide={exportingWide} />
            </View>
          </ScrollView>

          <Spinner visible={exporting} textContent={'Exporting...'} textStyle={{ color: '#fff' }} />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleExportPress}
                  disabled={exporting}
                >
                    <Text style={styles.buttonText}>{exporting ? 'Exporting...' : 'Share'}</Text>
                </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.debugButton]}
                    onPress={handleShowFormType}
                  >
                    <Text style={styles.buttonText}>Show Type</Text>
                  </TouchableOpacity>
              </View>
          <Modal visible={payloadDialogVisible} transparent animationType="fade">
            <View style={styles.payloadOverlay}>
              <View style={[styles.payloadBox, { height: '90%' }]}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
                  <Text style={{ fontWeight: '700', marginBottom: 8 }}>Minimal payload preview</Text>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 }}>{payloadMinimalStr}</Text>
                  <View style={{ height: 12 }} />
                  <Text style={{ fontWeight: '700', marginBottom: 8 }}>Full payload</Text>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11 }}>{payloadFullStr}</Text>
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 }}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#0a8a0a', flex: 1 }]} onPress={async () => {
                    try {
                      const ok = await setClipboardString(payloadMinimalStr);
                      if (ok) Alert.alert('Copied', 'Minimal payload copied to clipboard');
                      else Alert.alert('Copy not supported', 'Clipboard API is unavailable');
                    } catch (e) { Alert.alert('Copy failed', String(e)); }
                  }}>
                    <Text style={styles.buttonText}>Copy minimal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#0a8a0a', flex: 1 }]} onPress={async () => {
                    try {
                      const ok = await setClipboardString(payloadFullStr);
                      if (ok) Alert.alert('Copied', 'Full payload copied to clipboard');
                      else Alert.alert('Copy not supported', 'Clipboard API is unavailable');
                    } catch (e) { Alert.alert('Copy failed', String(e)); }
                  }}>
                    <Text style={styles.buttonText}>Copy full</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#0a8a0a', flex: 1 }]} onPress={async () => { await handleSharePayloadFile(payloadFullStr); }}>
                    <Text style={styles.buttonText}>Share .txt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#777', flex: 1 }]} onPress={() => setPayloadDialogVisible(false)}>
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  topCloseButton: {
    backgroundColor: '#888',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  topCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#185a9d',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  debugButton: {
    backgroundColor: '#6b7280'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  payloadOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  payloadBox: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12
  }
});

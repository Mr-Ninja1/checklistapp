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

export default function ViewDocumentModal({ visible, form, onClose, onDownload }) {
  // Modal shows a saved form; use onDownload to open the saved PDF rather than re-exporting
  const formRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportingWide, setExportingWide] = useState(false);
  const { exportAsPDF } = useExportFormAsPDF();

  const handleExportPress = async () => {
    if (!form) return;
    setExporting(true);
    try {
      const res = await exportAsPDF({ title: form.title, date: form.date, shift: form.shift, formData: form, exportOptions: { captureRef: formRef, captureScale: 2, fallbackToScreenshot: true } });
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
            const out = `${dir}export_${Date.now()}.pdf`;
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
      const res = await exportAsPDF({ title: form.title, date: form.date, shift: form.shift, formData: form, exportOptions: { forceHtml: true } });
      console.log('debug html export result', res);
      if (res && res.pdfPath) {
        Alert.alert('Debug Export', `PDF written to ${res.pdfPath}`);
        return;
      }
      if (res && res.error) {
        Alert.alert('Debug Export failed', String(res.error));
        return;
      }
      Alert.alert('Debug Export', 'Completed (no pdfPath returned)');
    } catch (e) {
      console.warn('debug export error', e);
      Alert.alert('Debug Export error', String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleShowFormType = async () => {
    if (!form) return;
    const ft = form.formType || (form.payload && form.payload.formType) || form.template || form.title || '';
    // determine mapped generator (if any)
    let genLabel = '<none>';
    try {
      const exact = routeMapping && routeMapping[ft];
      if (exact) {
        const found = Object.keys(mapping).find(k => mapping[k] === exact);
        genLabel = found || '<routeMapping generator (unknown key)>';
      } else {
        // Try normalized direct lookup
        const k1 = String(ft).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
        const k2 = String(ft).toLowerCase().replace(/[^a-z0-9]/g, '');
        const candidate = (mapping && (mapping[k1] || mapping[k2]));
        if (candidate) {
          const found = Object.keys(mapping).find(k => mapping[k] === candidate);
          genLabel = found || '<mapping generator (unknown key)>';
        } else {
          // As a last resort for debugging, run the static fuzzy matcher
          try {
            const fallback = getGeneratorForPayload({ formType: ft, title: ft, name: ft }, { allowFallback: true });
            if (fallback && fallback.matchedKey) genLabel = fallback.matchedKey + ` (score:${fallback.score})`;
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      genLabel = `<error: ${String(e)}>`;
    }

    const message = `formType: ${String(ft || '<empty>')}\ngenerator: ${genLabel}`;
    const copyToClipboard = async (txt) => {
      try {
        if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
          await Clipboard.setStringAsync(String(txt || ''));
          Alert.alert('Copied', 'Copied to clipboard');
          return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(String(txt || ''));
          Alert.alert('Copied', 'Copied to clipboard');
          return;
        }
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
              style={[styles.button, { backgroundColor: '#0066cc' }]}
              onPress={handleExportPress}
              disabled={exporting}
            >
              <Text style={styles.buttonText}>{exporting ? 'Exporting...' : 'Export PDF'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#0a8a0a' }]}
              onPress={handleDebugHtmlExport}
              disabled={exporting}
            >
              <Text style={styles.buttonText}>{exporting ? 'Exporting...' : 'Debug HTML Export'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#444' }]}
              onPress={handleShowFormType}
            >
              <Text style={styles.buttonText}>Show formType</Text>
            </TouchableOpacity>

            {/* Save to folder removed — share/print from Share/Export covers user needs */}
          </View>
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

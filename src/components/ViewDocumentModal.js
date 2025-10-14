
import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import SavedFormRenderer from './SavedFormRenderer';
import Spinner from 'react-native-loading-spinner-overlay';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import generateFoodHandlersHtml from '../utils/generateFoodHandlersHtml';
import captureAndExport from '../utils/captureAndExport';
import { Platform } from 'react-native';
// We'll try to require react-native-view-shot at runtime so the app doesn't crash when it's not installed.
let captureRefSafe = null;
try {
  // eslint-disable-next-line global-require
  const { captureRef } = require('react-native-view-shot');
  captureRefSafe = captureRef;
} catch (e) {
  // view-shot not available — we'll fallback to vector HTML generation below
  captureRefSafe = null;
}

export default function ViewDocumentModal({ visible, form, onClose, onDownload }) {
  // Modal shows a saved form; use onDownload to open the saved PDF rather than re-exporting
  const formRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // no debug logging in production view
  }, [form, visible]);

  if (!form) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Vertical scroll for modal content; enable nested scrolling so inner horizontal scrolls work */}
          <ScrollView style={{ maxHeight: '92%' }} contentContainerStyle={{ paddingBottom: 12 }} nestedScrollEnabled={true}>
            <View ref={formRef} collapsable={false}>
              {/* Allow horizontal scrolling inside the modal for wide tables */}
              <ScrollView horizontal={true} nestedScrollEnabled={true} contentContainerStyle={{ flexGrow: 1 }}>
                {/* Render saved form via SavedFormRenderer (new unified renderer) */}
                <SavedFormRenderer savedPayload={form} />
              </ScrollView>
            </View>
          </ScrollView>

          <Spinner visible={exporting} textContent={'Exporting...'} textStyle={{ color: '#fff' }} />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#0066cc' }]}
              onPress={async () => {
                if (!form) return;
                try {
                  setExporting(true);
                  const payload = form.meta || form;
                  const fallbackHtml = generateFoodHandlersHtml(payload);
                  await captureAndExport({ ref: formRef, payloadHtmlFallback: fallbackHtml, onProgress: () => {} });
                } catch (e) {
                  console.warn('export failed', e);
                  Alert.alert('Export failed', 'Unable to export PDF from saved form data.');
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Text style={styles.buttonText}>Export PDF</Text>
            </TouchableOpacity>

            {/* Save to folder removed — share/print from Share/Export covers user needs */}

            <TouchableOpacity style={[styles.button, { backgroundColor: '#888' }]} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
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

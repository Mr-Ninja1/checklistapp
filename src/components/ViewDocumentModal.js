import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import SavedFormRenderer from './SavedFormRenderer';
import Spinner from 'react-native-loading-spinner-overlay';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { exportFormWithViewShot } from '../utils/generatePdfHtml';
import { Platform } from 'react-native';

export default function ViewDocumentModal({ visible, form, onClose, onDownload }) {
  // Modal shows a saved form; use onDownload to open the saved PDF rather than re-exporting
  const formRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportingWide, setExportingWide] = useState(false);

  useEffect(() => {
    // no debug logging in production view
  }, [form, visible]);

  if (!form) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={exportingWide ? [styles.modalContent, { width: '100%', maxWidth: '100%', borderRadius: 0, padding: 0, maxHeight: '100%' }] : styles.modalContent}>
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
              onPress={async () => {
                // Use a dedicated handler so state/awaits are clearer in logs
                if (!form) return;
                const handleExportPDF = async () => {
                  try {
                    setExportingWide(true);
                    setExporting(true);
                    const payload = form.meta || form;
                    const result = await exportFormWithViewShot({ ref: formRef, formData: payload, filenameBase: 'exported-form', onProgress: (stage) => {} });
                    if (result && result.uri) {
                      if (Platform.OS === 'ios' || Platform.OS === 'android') {
                        if (await Sharing.isAvailableAsync()) {
                          await Sharing.shareAsync(result.uri);
                        } else {
                          Alert.alert('Export ready', `PDF saved to: ${result.uri}`);
                        }
                      } else {
                        Alert.alert('Export ready', `PDF saved to: ${result.uri}`);
                      }
                    } else {
                      Alert.alert('Export failed', 'Unable to export PDF from view shot.');
                    }
                  } catch (e) {
                    console.warn('export failed', e);
                    Alert.alert('Export failed', 'Unable to export PDF from view shot.');
                  } finally {
                    setExportingWide(false);
                    setExporting(false);
                  }
                };

                await handleExportPDF();
              }}
              disabled={exporting}
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

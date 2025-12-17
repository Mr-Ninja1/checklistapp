import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import SavedFormRenderer from './SavedFormRenderer';
import Spinner from 'react-native-loading-spinner-overlay';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import useExportFormAsPDF from '../utils/useExportFormAsPDF';
import { Platform, Linking } from 'react-native';

export default function ViewDocumentModal({ visible, form, onClose, onDownload }) {
  // Modal shows a saved form; use onDownload to open the saved PDF rather than re-exporting
  const formRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportingWide, setExportingWide] = useState(false);
  const { exportAsPDF } = useExportFormAsPDF();

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
                if (!form) return;
                setExportingWide(true);
                setExporting(true);
                try {
                  // Normalize saved payload shapes (match SavedFormRenderer behavior)
                  const meta = form?.meta || null;
                  const payload = form.payload || meta?.payload || meta || form;

                  const result = await exportAsPDF({ title: payload.title, date: payload.date, formData: payload, exportOptions: { paperSize: 'A4', orientation: 'landscape', fallbackToScreenshot: true, captureRef: formRef } });

                  if (result && result.pdfPath) {
                    if (Platform.OS === 'android') {
                      const fileUri = result.pdfPath.startsWith('file://') ? result.pdfPath : `file://${result.pdfPath}`;
                      try {
                        // First try Linking.openURL (no extra native deps). This often opens the file
                        // with the default viewer or shows a chooser when multiple apps are available.
                        await Linking.openURL(fileUri);
                      } catch (linkErr) {
                        try {
                          // If Linking fails, try the intent launcher if available (optional native).
                          const IntentLauncher = require('expo-intent-launcher');
                          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                            data: fileUri,
                            flags: 1,
                            type: 'application/pdf',
                          });
                        } catch (intentErr) {
                          // Finally fall back to the share sheet so users can still get the file out.
                          if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(result.pdfPath);
                          } else {
                            Alert.alert('Export ready', `PDF saved to: ${result.pdfPath}`);
                          }
                        }
                      }
                    } else if (Platform.OS === 'ios') {
                      if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(result.pdfPath);
                      } else {
                        Alert.alert('Export ready', `PDF saved to: ${result.pdfPath}`);
                      }
                    } else {
                      Alert.alert('Export ready', `PDF saved to: ${result.pdfPath}`);
                    }
                  } else if (result && result.pdfDataUri) {
                    Alert.alert('Export ready', 'PDF generated (web).');
                  } else {
                    Alert.alert('Export failed', result && result.error ? result.error : 'Unable to export PDF');
                  }
                } catch (e) {
                  console.warn('export failed', e);
                  Alert.alert('Export failed', 'Unable to export PDF');
                } finally {
                  setExportingWide(false);
                  setExporting(false);
                }
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

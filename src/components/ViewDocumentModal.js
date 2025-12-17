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
              onPress={() => {
                Alert.alert(
                  'Use Desktop App for Export',
                  'Use the Bravo app on your computer to download / print the file (use desktop app for export feature)'
                );
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

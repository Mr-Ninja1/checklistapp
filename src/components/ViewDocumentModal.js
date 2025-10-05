
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ReadOnlyForm from './ReadOnlyForm';
import { useExportFormAsPDF } from '../utils/useExportFormAsPDF';

export default function ViewDocumentModal({ visible, form, onClose, onDownload }) {
  const { ref: formRef, exportAsPDF } = useExportFormAsPDF();
  if (!form) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View ref={formRef} collapsable={false}>
            <ReadOnlyForm form={form} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onDownload}>
              <Text style={styles.buttonText}>Download JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => exportAsPDF(`form_${form.date || 'unknown'}.pdf`)}>
              <Text style={styles.buttonText}>Download PDF</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 24,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

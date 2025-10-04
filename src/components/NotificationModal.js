import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Reusable NotificationModal
 * Props:
 * - visible: boolean (show/hide)
 * - message: string (notification text)
 * - onClose: function to call when closing
 */
export default function NotificationModal({ visible, message, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.text}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 220,
  },
  text: {
    fontSize: 18,
    color: '#185a9d',
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#185a9d',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

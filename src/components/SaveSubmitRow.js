import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SaveSubmitRow({ onSaveDraft, onSubmit, disabled = false }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onSaveDraft}
        disabled={disabled}
        style={[styles.button, styles.saveButton, disabled && styles.disabled]}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, styles.saveText]}>Save Draft</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSubmit}
        disabled={disabled}
        style={[styles.button, styles.submitButton, disabled && styles.disabled]}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, styles.submitText]}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#007A33', borderWidth: 1, borderColor: '#006428' },
  submitButton: { backgroundColor: '#b00', borderWidth: 1, borderColor: '#900' },
  buttonText: { fontWeight: '700', fontSize: 16 },
  saveText: { color: '#fff' },
  submitText: { color: '#fff' },
  disabled: { opacity: 0.6 },
});

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function FormActionBar({ onBack, onSaveDraft, onSubmit, showSavePdf = false, onSavePdf }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onBack} style={[styles.button, styles.aux]}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSaveDraft} style={[styles.button, styles.draft]}>
        <Text style={styles.buttonText}>Save Draft</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSubmit} style={[styles.button, styles.primary]}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      {showSavePdf && (
        <TouchableOpacity onPress={onSavePdf} style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonText}>submit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginHorizontal: 6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  aux: { backgroundColor: '#777' },
  draft: { backgroundColor: '#f0ad4e' },
  primary: { backgroundColor: '#185a9d' },
  secondary: { backgroundColor: '#0066cc' },
});

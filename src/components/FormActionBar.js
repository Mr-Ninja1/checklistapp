import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

function FormActionBarComponent({ onBack, onClear, onSaveDraft, onSubmit, showSavePdf = false, onSavePdf, isSaving = false }) {
  // local guard for double clicks in case a form does not pass an isSaving prop
  const [localSaving, setLocalSaving] = useState(false);

  const busy = Boolean(isSaving) || localSaving;

  const wrap = useCallback(async (fn) => {
    if (!fn) return;
    if (busy) return;
    try {
      setLocalSaving(true);
      // Ensure we await even if fn is not async
      await Promise.resolve(fn());
    } finally {
      setLocalSaving(false);
    }
  }, [busy]);

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => { if (busy) return; if (onClear) return onClear(); if (onBack) return onBack(); }} style={[styles.button, onClear ? styles.clear : styles.aux]} disabled={busy}>
        <Text style={styles.buttonText}>{onClear ? 'Clear' : 'Back'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => wrap(onSaveDraft)} style={[styles.button, styles.draft]} disabled={busy || !onSaveDraft}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => wrap(onSubmit)} style={[styles.button, styles.primary]} disabled={busy || !onSubmit}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
      </TouchableOpacity>

      {showSavePdf && (
        <TouchableOpacity onPress={() => wrap(onSavePdf)} style={[styles.button, styles.secondary]} disabled={busy || !onSavePdf}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save PDF</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

// Export both default and named to support different import/require patterns
export default FormActionBarComponent;
export { FormActionBarComponent as FormActionBar };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginHorizontal: 6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  aux: { backgroundColor: '#777' },
  clear: { backgroundColor: '#EF4444' },
  draft: { backgroundColor: '#f0ad4e' },
  primary: { backgroundColor: '#185a9d' },
  secondary: { backgroundColor: '#0066cc' },
});

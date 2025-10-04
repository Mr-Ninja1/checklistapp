import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

/**
 * Reusable SaveFormButton
 * Props:
 * - onSave: function to call with form data when saving
 * - getFormData: function that returns the current form data (object)
 * - label: button label (optional, default: 'Save')
 * - style: extra style for the button (optional)
 */
export default function SaveFormButton({ onSave, getFormData, label = 'Save', style }) {
  const handlePress = () => {
    if (typeof getFormData === 'function' && typeof onSave === 'function') {
      const data = getFormData();
      onSave(data);
    }
  };
  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.text}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#185a9d',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});

import React from 'react';
import FoodHandlersPresentational from '../forms/components/FoodHandlersPresentational';
import { View, Text, StyleSheet } from 'react-native';
// Add other form imports as needed

// SavedFormRenderer renders a saved payload using the same form component (read-only)
export default function SavedFormRenderer({ savedPayload }) {
  if (!savedPayload) return null;
  // Always treat as FoodHandlers if handlers+timeSlots or title matches
  const payload = savedPayload;
  const looksLikeFoodHandlers = Array.isArray(payload?.handlers) && Array.isArray(payload?.timeSlots);
  const type = payload?.formType || payload?.formTypeName || payload?.title || '';
  if (looksLikeFoodHandlers || /handwash/i.test(String(type))) {
    return (
      <View>
        <FoodHandlersPresentational payload={payload} />
      </View>
    );
  }
  // For all other forms, show a minimal message
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ color: '#b00', fontWeight: 'bold', fontSize: 16 }}>Unsupported saved form type.</Text>
      <Text style={{ marginTop: 8, color: '#444' }}>This saved form does not match the Food Handlers layout. Please update the app to support this form type.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#e8f5ff', padding: 6, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: '#185a9d', fontWeight: '700' },
});

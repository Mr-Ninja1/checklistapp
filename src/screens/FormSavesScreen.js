import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function FormSavesScreen() {
  const [savedForms, setSavedForms] = useState([]);

  useEffect(() => {
    // Load from localStorage (web only)
    if (typeof window !== 'undefined' && window.localStorage) {
      const history = JSON.parse(window.localStorage.getItem('formHistory') || '[]');
      setSavedForms(history.reverse()); // newest first
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Forms (History)</Text>
      {savedForms.length === 0 ? (
        <Text style={styles.placeholder}>No saved forms yet.</Text>
      ) : (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
          {savedForms.map((form, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{form.title || 'Food Handlers Handwashing Log'}</Text>
              <Text style={styles.cardMeta}>Date: {form.date} | Shift: {form.shift} | Location: {form.location}</Text>
              <Text style={styles.cardMeta}>Saved: {form.savedAt ? new Date(form.savedAt).toLocaleString() : ''}</Text>
              <Text style={styles.cardMeta}>Handlers: {form.handlers ? form.handlers.length : 0}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
});

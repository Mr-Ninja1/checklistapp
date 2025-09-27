import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Example kitchen forms
const kitchenForms = [
  { subject: 'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH', status: 'Pending' },
  { subject: 'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET KITCHEN', status: 'Done' },
  { subject: 'FOOD HANDLERS DAILY SHOWERING LOG', status: 'Pending' },
  // Add more subjects as needed
];

export default function KitchenCategory() {
  return (
    <LinearGradient colors={["#43cea2", "#185a9d"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Kitchen Forms</Text>
        {kitchenForms.map((form, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.subject}>{form.subject}</Text>
            <View style={[styles.status, form.status === 'Done' ? styles.done : styles.pending]}>
              <Text style={styles.statusText}>{form.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  subject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#185a9d',
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  pending: {
    backgroundColor: '#ffe082',
  },
  done: {
    backgroundColor: '#b2ff59',
  },
  statusText: {
    fontWeight: 'bold',
    color: '#185a9d',
    fontSize: 16,
    textAlign: 'center',
  },
});

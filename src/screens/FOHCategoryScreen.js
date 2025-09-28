import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const fohForms = [
  'Daily cleaning and sanitizing logs-AM/PM',
  'Weekly cleaning log AM/PM',
  'Monthly temp logs for “grab and go chiller, upright display chiller, underbar chiller and gelato freezer.',
  'Fruit washing and sanitizing log',
  'Customer survey logs',
  'Product release log',
  'Shelf life inspection log',
];

export default function FOHCategoryScreen({ navigation }) {
  return (
    <LinearGradient colors={["#43cea2", "#185a9d"]} style={styles.container}>
      <Text style={styles.title}>FOH Records</Text>
      <ScrollView style={{width: '100%'}} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridList}>
          {fohForms.map((form, idx) => (
            <TouchableOpacity key={form} style={styles.formCard}>
              <Text style={styles.formText}>{form}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    letterSpacing: 2,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
    justifyContent: 'flex-start',
  },
  gridList: {
    width: '100%',
    alignItems: 'center',
  },
  formCard: {
    width: 320,
    minHeight: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    marginVertical: 10,
    padding: 18,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  formText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

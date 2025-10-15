import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

export default function ProcessQualityOutOfControlPresentational({ payload }) {
  if (!payload) return null;
  const data = payload.formData || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><Image source={require('../../assets/logo.png')} style={styles.logo} /><Text style={styles.title}>Process & Quality Out of Control Report</Text></View>
      <View style={styles.metaRow}><Text>Number: {data.number}</Text><Text>Date: {data.date}</Text></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Out of control description</Text><Text>{data.outOfControlDescription}</Text></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Root cause</Text><Text>{data.rootCause}</Text></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Corrective Action</Text><Text>{data.correctiveAction}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 48, height: 48, marginRight: 8 },
  title: { fontWeight: '700', fontSize: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  section: { marginBottom: 10 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 }
});

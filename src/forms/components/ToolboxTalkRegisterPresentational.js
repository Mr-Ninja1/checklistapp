import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function ToolboxTalkRegisterPresentational({ payload }) {
  if (!payload) return null;
  const meta = payload.metadata || {};
  const issues = (payload.formData && payload.formData.issues) || [];
  const cells = (payload.formData && payload.formData.cells) || { left: {}, right: {} };

  const rows = [];
  for (let i = 1; i <= 10; i++) rows.push([cells.left[i] || {}, cells.right[i + 10] || {}]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.title}>Tool Box Talk Register</Text>
          <Text style={styles.subtitle}>{meta.date || ''}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Agenda: {meta.agenda || ''}</Text>
        <Text style={styles.infoLabel}>Presenter: {meta.presenter || ''}</Text>
      </View>

      <View style={styles.issuesBlock}>
        <Text style={styles.issuesTitle}>Key Points:</Text>
        {issues.map((it, i) => <Text key={i} style={styles.issueLine}>{i + 1}. {it}</Text>)}
      </View>

      <View style={styles.tableHeader}><Text style={styles.colHeader}>Attendees</Text></View>
      {rows.map((pair, idx) => (
        <View key={idx} style={styles.rowPair}>
          <View style={styles.attCol}><Text style={styles.attText}>{idx + 1}. {pair[0].name}</Text></View>
          <View style={styles.attCol}><Text style={styles.attText}>{idx + 11}. {pair[1].name}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  title: { fontWeight: '700', fontSize: 16 },
  subtitle: { fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 12 },
  issuesBlock: { marginBottom: 8 },
  issuesTitle: { fontWeight: '700' },
  issueLine: { marginLeft: 8 },
  tableHeader: { backgroundColor: '#eee', padding: 6, marginTop: 6 },
  rowPair: { flexDirection: 'row', paddingVertical: 6 },
  attCol: { flex: 1 },
  attText: { fontSize: 12 },
});

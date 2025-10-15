import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TrainingAttendanceRegisterPresentational({ payload }) {
  const meta = payload?.metadata || {};
  const data = payload?.formData || {};
  const topics = data.topics || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{payload.title || 'Training Attendance Register'}</Text>
      <Text style={styles.field}>Subject: {meta.subject || ''}</Text>
      <Text style={styles.field}>Presenter: {meta.presenter || ''}</Text>
      <Text style={styles.field}>Date: {meta.date || ''}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topics</Text>
        {topics.map((t, i) => <Text key={i} style={styles.topic}>{i+1}. {t}</Text>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  field: { marginBottom: 4 },
  section: { marginTop: 8 },
  sectionTitle: { fontWeight: '700' },
  topic: { marginLeft: 8, marginTop: 4 },
});

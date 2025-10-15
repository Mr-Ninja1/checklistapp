import React from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';

export default function CustomerSatisfactionQuestionnairePresentational({ payload }) {
  const p = payload || {};
  const data = p.formData || {};
  const sections = data.sections || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.company}>{data.companyName || 'Bravo'}</Text>
        <Text style={styles.subject}>{data.subject || 'Customer Satisfaction Questionnaire'}</Text>
        <Text style={styles.meta}>{data.issueDate || ''} {data.formTime ? `· ${data.formTime}` : ''}</Text>
      </View>

      <View style={styles.questions}>
        {sections.map((s, si) => (
          <View key={si} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.questions.map((q) => (
              <View key={q.id} style={styles.questionRow}>
                <Text style={styles.questionText}>{q.text}</Text>
                <Text style={styles.answerText}>{q.rating || ''}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.label}>Customer:</Text>
        <Text style={styles.value}>{data.customerName || ''}</Text>
        <Text style={styles.label}>Comments:</Text>
        <Text style={styles.value}>{data.otherComment || ''}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  header: { marginBottom: 12 },
  company: { fontSize: 20, fontWeight: '700', color: '#185a9d' },
  subject: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  meta: { color: '#666', marginTop: 4 },
  questions: { marginTop: 8 },
  sectionBlock: { marginBottom: 10 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  questionText: { flex: 1, marginRight: 12 },
  answerText: { width: 80, textAlign: 'center', fontWeight: '700' },
  footer: { marginTop: 12 },
  label: { fontWeight: '700', marginTop: 8 },
  value: { marginTop: 4 },
});

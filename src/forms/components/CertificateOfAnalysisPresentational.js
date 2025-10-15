import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function CertificateOfAnalysisPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const data = p.formData || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRowTop}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.title}>CERTIFICATE OF ANALYSIS</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>Issue date: {meta.issueDate || data.issueDate || ''}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.inputRow, { width: '48%' }]}>
            <Text style={styles.inputLabel}>Ingredient / Product:</Text>
            <Text style={styles.inputValue}>{data.ingredientProduct || ''}</Text>
          </View>
          <View style={[styles.inputRow, { width: '48%' }]}>
            <Text style={styles.inputLabel}>TIME:</Text>
            <Text style={styles.inputValue}>{data.time || ''}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.inputRow, { width: '48%' }]}>
            <Text style={styles.inputLabel}>NO:</Text>
            <Text style={styles.inputValue}>{data.no || ''}</Text>
          </View>
          <View style={[styles.inputRow, { width: '48%' }]}>
            <Text style={styles.inputLabel}>DATE RECEIVED:</Text>
            <Text style={styles.inputValue}>{data.dateReceived || ''}</Text>
          </View>
        </View>

        <View style={styles.testArea}>
          <Text style={styles.sectionTitle}>Organoleptic & Morphologistic Tests</Text>
          <View style={styles.inputRow}><Text style={styles.inputLabel}>APPEARANCE:</Text><Text style={styles.inputValue}>{data.appearance || ''}</Text></View>
          <View style={styles.inputRow}><Text style={styles.inputLabel}>WEIGHT:</Text><Text style={styles.inputValue}>{data.weight || ''}</Text></View>
          <View style={styles.inputRow}><Text style={styles.inputLabel}>TEXTURE:</Text><Text style={styles.inputValue}>{data.texture || ''}</Text></View>
          <View style={styles.inputRow}><Text style={styles.inputLabel}>ORGANIC TASTE:</Text><Text style={styles.inputValue}>{data.organicTaste || ''}</Text></View>
        </View>

        <View style={styles.signatureArea}>
          <View style={[styles.inputRow, { width: '32%' }]}><Text style={styles.inputLabel}>SAMPLED BY:</Text><Text style={styles.inputValue}>{data.sampledBy || ''}</Text></View>
          <View style={[styles.inputRow, { width: '32%' }]}><Text style={styles.inputLabel}>HSEQ Manager:</Text><Text style={styles.inputValue}>{data.hseqManager || ''}</Text></View>
          <View style={[styles.inputRow, { width: '32%' }]}><Text style={styles.inputLabel}>COMPLEX MANAGER:</Text><Text style={styles.inputValue}>{data.complexManager || ''}</Text></View>
        </View>

        <View style={styles.resultArea}>
          <Text style={styles.inputLabel}>Result:</Text>
          <Text style={styles.resultValue}>{data.result || ''}</Text>
          <Text style={[styles.inputLabel, { marginTop: 8 }]}>Comment:</Text>
          <Text style={styles.inputValue}>{data.comment || ''}</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, backgroundColor: '#F3F4F6' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#1F2937', borderWidth: 1 },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 64, height: 64, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 14, fontWeight: '800', color: '#185a9d' },
  title: { fontSize: 16, fontWeight: '900', color: '#111827' },
  metaBox: { alignItems: 'flex-end' },
  metaText: { fontSize: 11, color: '#4B5563' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' },
  inputRow: { marginBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  inputValue: { fontSize: 14, color: '#111' },
  testArea: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  signatureArea: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 },
  resultArea: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  resultValue: { fontSize: 16, fontWeight: '700', color: '#0f5132' },
});

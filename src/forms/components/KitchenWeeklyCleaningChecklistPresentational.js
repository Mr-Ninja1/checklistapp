import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function KitchenWeeklyCleaningChecklistPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;
  const COL = layoutHints || {};
  const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // normalize signature values into a previewable uri (data:..., http(s)://, file:, blob:, or {uri}/{data})
  const resolveSignatureUri = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      if (val.uri && typeof val.uri === 'string') {
        const u = val.uri.trim(); if (u) return u;
      }
      if (val.data && typeof val.data === 'string') {
        const compact = val.data.replace(/\s+/g, '');
        if (compact.length) return `data:image/png;base64,${compact}`;
      }
      return null;
    }
    if (typeof val !== 'string') return null;
    const s = val.trim(); if (!s) return null;
    if (s.startsWith('data:') || s.startsWith('http:') || s.startsWith('https:') || s.startsWith('file:') || s.startsWith('blob:')) return s;
    const base64ish = /^[A-Za-z0-9+/=\r\n]+$/;
    const compact = s.replace(/\s+/g, '');
    if (compact.length > 100 && base64ish.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logoWrap}>
              {p.assets?.logoDataUri ? (
                <Image source={{ uri: p.assets.logoDataUri }} style={styles.logo} />
              ) : (
                <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              )}
            </View>
            <Text style={styles.companyText}>{metadata.companyName || 'Bravo'}</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{p.title || 'Kitchen Weekly Cleaning Checklist'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Location: {metadata.location || ''}</Text>
              <Text style={styles.metaText}>Week: {metadata.week || ''}</Text>
              <Text style={styles.metaText}>Month: {metadata.month || ''}</Text>
              <Text style={styles.metaText}>Year: {metadata.year || ''}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal contentContainerStyle={{ minWidth: _tableWidth || 800 }}>
          <View style={styles.table}>
            <View style={[styles.headerRow, { backgroundColor: '#f3f5f7' }]}>
              <View style={[styles.headerCell, { width: COL.AREA || 300 }]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
              <View style={[styles.headerCell, { width: COL.FREQ || 150 }]}><Text style={styles.headerText}>Frequency</Text></View>
              {WEEK_DAYS.map(d => (
                <View key={d} style={[styles.headerGroup, { width: COL.DAY_GROUP || 150 }]}>
                  <View style={[styles.headerCell, { width: COL.CHECK || 60 }]}><Text style={styles.headerText}>{d}</Text></View>
                  <View style={[styles.headerCell, { width: COL.CLEANED_BY || 90 }]}><Text style={styles.headerText}>Cleaned By</Text></View>
                </View>
              ))}
            </View>

            {formData.map(item => (
              <View key={item.id} style={styles.row}>
                <View style={[styles.cell, { width: COL.AREA || 300 }]}><Text style={styles.areaText}>{item.name}</Text></View>
                <View style={[styles.cell, { width: COL.FREQ || 150 }]}><Text style={styles.freqText}>{item.frequency}</Text></View>
                {WEEK_DAYS.map(d => (
                  <View key={d} style={[styles.dayGroup, { width: COL.DAY_GROUP || 150 }]}>
                    <View style={[styles.cell, { width: COL.CHECK || 60 }]}>
                      <Text>{item.checks?.[d]?.checked ? '✓' : ''}</Text>
                    </View>
                    <View style={[styles.cell, { width: COL.CLEANED_BY || 90 }]}>
                      <Text>{item.checks?.[d]?.cleanedBy || ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footerRow}>
          <View>
            <Text style={[styles.footerText, { fontWeight: '700' }]}>Verified By: HSEQ Manager</Text>
            {(() => {
              // Try a variety of metadata keys used across forms for HSEQ signatures
              const raw = p.hseqSign || p.hseqManagerSignature || p.hseqSignature || p.hseq_sign || p.hseq_sign_data || p.hseqSignData || p.hseqSignBase64 || p.hseq_mgr_sign || p.hseqMgrSign || p.hseqManagerSign || p.verifiedBy || p.verified_by || p.hseqSignatureData || p.hseq_signature || p.hseq || metadata.hseqSign || metadata.hseqManagerSignature || metadata.hseqSignature || metadata.hseq_sign || metadata.hseq_sign_data || metadata.hseqSignData || metadata.hseqSignBase64 || metadata.hseq_mgr_sign || metadata.hseqMgrSign || metadata.hseqManagerSign || metadata.verifiedBy || metadata.verified_by || metadata.hseqSignatureData || metadata.hseq_signature || metadata.hseq;
              const uri = resolveSignatureUri(raw);
              return uri ? <SignatureThumb uri={uri} width={240} height={96} layers={12} spread={1.2} /> : <Text style={styles.footerText}>{metadata.hseqManager || metadata.hseqManagerName || ''}</Text>;
            })()}
          </View>
          <View>
            <Text style={[styles.footerText, { fontWeight: '700' }]}>Complex Manager</Text>
            {(() => {
              // Try multiple possible keys for the Complex Manager signature
              const rawC = p.complexManagerSign || p.complexManagerSignature || p.complexSign || p.complex_manager_signature || p.complexSignData || p.complexSignBase64 || p.complexSignature || p.complex_mgr_sign || p.complexMgrSign || p.complex_manager_sign || p.complex_manager || p.complexManager || p.complex_mgr_signature || p.complexSignatureData || p.complex_sig || metadata.complexManagerSign || metadata.complexManagerSignature || metadata.complexSign || metadata.complex_manager_signature || metadata.complexSignData || metadata.complexSignBase64 || metadata.complexSignature || metadata.complex_mgr_sign || metadata.complexMgrSign || metadata.complex_manager_sign || metadata.complex_manager || metadata.complexManager || metadata.complex_mgr_signature || metadata.complexSignatureData || metadata.complex_sig;
              const uri = resolveSignatureUri(rawC);
              return uri ? <SignatureThumb uri={uri} width={240} height={96} layers={12} spread={1.2} /> : <Text style={styles.footerText}>{metadata.complexManager || metadata.complexManagerName || ''}</Text>;
            })()}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoWrap: { width: 80, height: 80, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 72, height: 72, resizeMode: 'contain' },
  logoPlaceholder: { width: 72, height: 72, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  companyText: { fontSize: 16, fontWeight: '800', color: '#374151', marginLeft: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
  metaText: { fontSize: 12, color: '#444' },
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  headerRow: { flexDirection: 'row' },
  headerCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', alignItems: 'center', justifyContent: 'center' },
  headerGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  headerText: { color: '#111827', fontWeight: '700' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e6e6e6', minHeight: 40, backgroundColor: '#fff' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6e6e6', justifyContent: 'center' },
  areaText: { fontSize: 12, color: '#374151' },
  freqText: { fontSize: 12, color: '#6B7280' },
  dayGroup: { flexDirection: 'row', borderRightWidth: 1, borderRightColor: '#e6e6e6' },
  footerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, fontWeight: '700' }
});

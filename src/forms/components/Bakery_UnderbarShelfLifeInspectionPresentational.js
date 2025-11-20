import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function Bakery_UnderbarShelfLifeInspectionPresentational({ payload = {}, exportingWide = false }) {
  const data = payload.formData || [];
  const metadata = payload.metadata || payload.meta || {};

  const TABLE_WIDTH = 1000;
  const COLS = [
    { key: 'name', label: 'ITEMS', width: Math.floor(TABLE_WIDTH * 0.30) },
    { key: 'dateIn', label: 'DATE IN', width: Math.floor(TABLE_WIDTH * 0.09) },
    { key: 'timeIn', label: 'TIME IN', width: Math.floor(TABLE_WIDTH * 0.09) },
    { key: 'timeOut', label: 'TIME OUT', width: Math.floor(TABLE_WIDTH * 0.09) },
    { key: 'usedBy', label: 'USED BY', width: Math.floor(TABLE_WIDTH * 0.12) },
    { key: 'chefName', label: "CHEF'S NAME", width: Math.floor(TABLE_WIDTH * 0.16) },
    { key: 'quantity', label: 'QUANTITY', width: Math.floor(TABLE_WIDTH * 0.06) },
    { key: 'chefSign', label: 'CHEF SIGN', width: Math.floor(TABLE_WIDTH * 0.09) },
  ];

  const normalizeSig = (s) => {
    if (!s) return null;
    if (typeof s === 'string') {
      if (s.indexOf('data:') >= 0) return s;
      const compact = s.replace(/\s+/g, '');
      if (/^[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 100) return `data:image/png;base64,${compact}`;
      return null;
    }
    if (typeof s === 'object') {
      const maybe = s.uri || s.data || s.base64 || s.signature || s.dataUri;
      return maybe && typeof maybe === 'string' ? (maybe.indexOf('data:') >= 0 ? maybe : `data:image/png;base64,${maybe.replace(/\s+/g, '')}`) : null;
    }
    return null;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }} horizontal>
      <View style={[styles.table, { width: TABLE_WIDTH }]}>
        <View style={styles.header}>
          <Text style={styles.title}>UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST</Text>
          <Text style={styles.meta}>{metadata.location || ''}  —  {metadata.date || ''}</Text>
        </View>

        <View style={styles.thead}>
          {COLS.map(c => (
            <View key={c.key} style={[styles.th, { width: c.width }]}>
              <Text style={styles.thText}>{c.label}</Text>
            </View>
          ))}
        </View>

        {data.map((row, i) => (
          <View key={i} style={styles.tr}>
            {COLS.map(c => (
              <View key={c.key} style={[styles.td, { width: c.width }]}>{
                c.key === 'chefSign' ? (() => {
                  const uri = normalizeSig(row[c.key]);
                  return uri ? <SignatureThumb uri={uri} width={c.width - 8} height={60} layers={6} spread={1.0} /> : <Text style={styles.tdText}>{row[c.key] || ''}</Text>;
                })() : <Text style={styles.tdText}>{row[c.key] || ''}</Text>
              }</View>
            ))}
          </View>
        ))}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#333' },
  header: { padding: 8, borderBottomWidth: 1, borderColor: '#333', alignItems: 'center' },
  title: { fontWeight: '800', fontSize: 14 },
  meta: { fontSize: 12, color: '#444', marginTop: 4 },
  thead: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  th: { padding: 8, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center', alignItems: 'center' },
  thText: { fontWeight: '700', fontSize: 12, textAlign: 'center' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd' },
  td: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', justifyContent: 'center' },
  tdText: { fontSize: 12, color: '#333' },
});

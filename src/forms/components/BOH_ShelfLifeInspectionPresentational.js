import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function BOH_ShelfLifeInspectionPresentational({ payload }) {
  if (!payload) return null;
  const { title = 'BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST', frequency = payload?.metadata?.frequency || 'DAILY', formData = [], verification = {}, layoutHints = {}, assets = {} } = payload;

  const tableW = payload._tableWidth || 1000;

  return (
    <ScrollView style={styles.container} horizontal={false} contentContainerStyle={{ padding: 12 }}>
      <View style={styles.headerRow}>
        {assets?.logoDataUri ? (
          <Image source={{ uri: assets.logoDataUri }} style={styles.logo} />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>Bravo</Text>
        </View>
        <View style={styles.issueWrap}><Text style={styles.issueText}>Issue Date: {payload?.metadata?.dateOfIssue || payload?.metadata?.date || ''}</Text></View>
      </View>
      <View style={styles.titleRow}><Text style={styles.title}>{title}</Text><Text style={styles.frequency}>FREQUENCY: {frequency}</Text></View>

      <ScrollView horizontal contentContainerStyle={{ minWidth: tableW }}>
        <View style={[styles.tableContainer, { minWidth: tableW }]}>
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 420 }]}>ITEMS</Text>
            <Text style={[styles.th, { width: 100 }]}>DATE IN</Text>
            <Text style={[styles.th, { width: 100 }]}>TIME IN</Text>
            <Text style={[styles.th, { width: 120 }]}>USED BY</Text>
            <Text style={[styles.th, { width: 220 }]}>BAKER/CHEFS NAME</Text>
            <Text style={[styles.th, { width: 80 }]}>QUANTITY</Text>
            <Text style={[styles.th, { width: 80 }]}>SIGN</Text>
          </View>

          {formData.map((r, idx) => (
            <View key={r.name || idx} style={styles.trow}>
              <Text style={[styles.td, { width: 420 }]}>{r.name}</Text>
              <Text style={[styles.td, { width: 100 }]}>{r.dateIn}</Text>
              <Text style={[styles.td, { width: 100 }]}>{r.timeIn}</Text>
              <Text style={[styles.td, { width: 120 }]}>{r.usedBy}</Text>
              <Text style={[styles.td, { width: 220 }]}>{r.bakerChefName}</Text>
              <Text style={[styles.td, { width: 80 }]}>{r.quantity}</Text>
              <Text style={[styles.td, { width: 80 }]}>{r.sign}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ height: 12 }} />
      <View style={styles.footerRowMultiple}>
        <View style={styles.footerCol}><Text style={styles.footerLabel}>DATE: {payload?.metadata?.date || ''}</Text></View>
        <View style={styles.footerCol}><Text style={styles.footerLabel}>VERIFIED BY: {verification?.hseqManagerSign || ''}</Text></View>
        <View style={styles.footerCol}><Text style={styles.footerLabel}>COMPLEX MANAGER: {verification?.complexManagerSign || ''}</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  companyName: { fontSize: 18, fontWeight: '900', color: '#185a9d' },
  titleRow: { alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#111' },
  frequency: { fontSize: 12, color: '#444', marginTop: 4 },
  tableContainer: { borderWidth: 1, borderColor: '#000', marginTop: 8 },
  thead: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' },
  th: { padding: 6, fontWeight: '700', fontSize: 12, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  trow: { flexDirection: 'row', minHeight: 56, borderBottomWidth: 1, borderBottomColor: '#000' },
  td: { paddingHorizontal: 6, paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  footerRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 12, color: '#333' },
  footerRowMultiple: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  footerCol: { flex: 1, minWidth: 140, paddingRight: 8 },
  issueWrap: { position: 'absolute', right: 12, top: 8 },
  issueText: { fontSize: 12, fontWeight: '700', color: '#374151' },
});

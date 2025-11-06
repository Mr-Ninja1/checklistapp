import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

export default function DisplayChillerShelfLifeInspectionPresentational({ payload }) {
  if (!payload) return null;
  const { title = 'DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST', frequency = 'DAILY', formData = [], layoutHints = {}, assets = {}, date = '', verifiedBy = '', verifiedBySign = '', baristaSign = '' } = payload;

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
      </View>
      <View style={styles.titleRow}><Text style={styles.title}>{title}</Text><Text style={styles.frequency}>FREQUENCY: {frequency}</Text></View>

      <ScrollView horizontal={true} nestedScrollEnabled={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ minWidth: tableW }}>
        <View style={[styles.tableContainer, { minWidth: tableW }]}> 
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 420 }]}>ITEMS</Text>
            <Text style={[styles.th, { width: 100 }]}>DATE IN</Text>
            <Text style={[styles.th, { width: 100 }]}>TIME IN</Text>
            <Text style={[styles.th, { width: 120 }]}>USED BY</Text>
            <Text style={[styles.th, { width: 220 }]}>BAKER/CHEFS /BARISTAS NAME</Text>
            <Text style={[styles.th, { width: 80 }]}>QUANTITY</Text>
            <Text style={[styles.th, { width: 180 }]}>SIGN</Text>
          </View>

          {formData.map((r, idx) => (
            <View key={r.id || idx} style={styles.trow}>
              <Text style={[styles.td, { width: 420 }]}>{r.item}</Text>
              <Text style={[styles.td, { width: 100 }]}>{r.dateIn}</Text>
              <Text style={[styles.td, { width: 100 }]}>{r.timeIn}</Text>
              <Text style={[styles.td, { width: 120 }]}>{r.usedBy}</Text>
              <Text style={[styles.td, { width: 220 }]}>{r.staffName}</Text>
              <Text style={[styles.td, { width: 80 }]}>{r.quantity}</Text>
              <View style={[styles.td, { width: 180, alignItems: 'center', justifyContent: 'center' }]}> 
                {(() => {
                  const val = r.sign;
                  const uri = val ? (String(val).startsWith('data:') ? val : `data:image/png;base64,${val}`) : null;
                  return uri ? (
                    <SignatureThumb uri={uri} width={160} height={120} layers={5} spread={0.8} />
                  ) : (
                    <Text style={{ color: '#333' }}>{val || ''}</Text>
                  );
                })()}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

    <View style={{ height: 12 }} />
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text style={styles.footer}>DATE: {date || '______________________'}    VERIFIED BY: {verifiedBy || '______________________'}</Text>
    <View style={{ marginLeft: 12 }}>
      {(() => {
        const v = verifiedBySign;
        const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
        return uri ? <SignatureThumb uri={uri} width={160} height={80} layers={5} spread={0.9} /> : null;
      })()}
    </View>
  </View>
  <View style={{ marginTop: 8 }}>
    <Text style={{ fontSize: 12, fontWeight: '700' }}>BARISTA SIGN:</Text>
    <View style={{ marginTop: 6 }}>
      {(() => {
        const v = baristaSign;
        const uri = v ? (String(v).startsWith('data:') ? v : `data:image/png;base64,${v}`) : null;
        return uri ? <SignatureThumb uri={uri} width={320} height={160} layers={6} spread={1.0} /> : <Text style={{ color: '#666' }}>______________________</Text>;
      })()}
    </View>
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
  footer: { fontSize: 12, color: '#333', marginTop: 8 },
});

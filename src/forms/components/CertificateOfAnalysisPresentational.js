import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';


export const EXPORT_KEY = 'certificate_of_analysis';
export default function CertificateOfAnalysisPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const data = p.formData || {};
  const products = data.products || [];

  // Helper to render signature thumbnails safely
  const renderSignature = (val, w = 130, h = 40) => {
    if (!val) return <Text style={styles.emptyValue}>-</Text>;
    const uri = String(val).startsWith('data:') 
      ? val 
      : (String(val).length > 100 ? `data:image/png;base64,${String(val).replace(/\s+/g, '')}` : null);
    
    return uri 
      ? <SignatureThumb uri={uri} width={w} height={h} layers={6} spread={1.0} /> 
      : <Text style={styles.cellText}>{String(val)}</Text>;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>

        {/* TOP HEADER: left product label area, right time/date */}
        <View style={styles.headerRowTop}>
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>BRAVO BRANDS LIMITED</Text>
            <Text style={styles.title}>CERTIFICATE OF ANALYSIS</Text>
          </View>
          <View style={styles.metaBoxRight}>
            <Text style={styles.metaTextSmall}>Issue date: {meta.issueDate || data.issueDate || ''}</Text>
          </View>
        </View>

        {/* DATA TABLE: horizontal scroll allowed for narrow screens but structured as a table */}
        <ScrollView horizontal style={styles.tableWrapper}>
          <View>
            {/* removed duplicate outside labels: Ingredient / Product and external tests title */}

            {/* Spanning header: reserve space for left columns, then group header above the three test columns */}
            <View style={styles.spanningHeaderRowExact}>
              <View style={{ width: 460 }} />
              <View style={styles.testsHeaderGroupExact}><Text style={styles.testsHeaderText}>Organoleptic & Morphologistic Tests</Text></View>
              <View style={{ width: 480 }} />
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { width: 140 }]}>Product</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>Batch No</Text>
              <Text style={[styles.columnHeader, { width: 90 }]}>Time</Text>
              <Text style={[styles.columnHeader, { width: 110 }]}>Date Rec.</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>Appearance</Text>
              <Text style={[styles.columnHeader, { width: 100 }]}>Weight</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>Texture</Text>
              <Text style={[styles.columnHeader, { width: 100, backgroundColor: '#fdfdfd' }]}>Organic Test</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>Result</Text>
              <Text style={[styles.columnHeader, { width: 180 }]}>Comment</Text>
              <Text style={[styles.columnHeader, { width: 160 }]}>Sampled By</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>SFC sign</Text>
            </View>

            {products && products.length ? products.map((item, idx) => (
              <View key={item.id || idx} style={styles.tableRow}>
                <Text style={[styles.cellText, { width: 140 }]}>{item.product || ''}</Text>
                <Text style={[styles.cellText, { width: 120 }]}>{item.batchNo || ''}</Text>
                <Text style={[styles.cellText, { width: 90 }]}>{item.time || ''}</Text>
                <Text style={[styles.cellText, { width: 110 }]}>{item.dateReceived || ''}</Text>
                <Text style={[styles.cellText, { width: 120 }]}>{item.appearance || ''}</Text>
                <Text style={[styles.cellText, { width: 100 }]}>{item.weight || ''}</Text>
                <Text style={[styles.cellText, { width: 120 }]}>{item.texture || ''}</Text>
                <Text style={[styles.cellText, { width: 100 }]}>{item.organicTest || ''}</Text>
                <Text style={[styles.cellText, { width: 140, fontWeight: '700', color: item.result ? '#065f46' : '#111' }]}>{item.result || ''}</Text>
                <Text style={[styles.cellText, { width: 180 }]}>{item.comment || ''}</Text>
                <View style={{ width: 160, padding: 4, alignItems: 'center' }}>
                  {renderSignature(item.sampledBy)}
                </View>
                <View style={{ width: 140, padding: 4, alignItems: 'center' }}>
                  {renderSignature(item.sfcSign)}
                </View>
              </View>
            )) : (
              <View style={styles.tableRow}><Text style={styles.cellText}>No products recorded</Text></View>
            )}
          </View>
        </ScrollView>

        {/* Sampled / Managers row */}
        <View style={[styles.sampledManagersRow, { justifyContent: 'space-between' }]}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.smallLabel}>HSEQ Manager:</Text>
            {renderSignature(data.hseqManager, 160, 50)}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallLabel}>COMPLEX MANAGER:</Text>
            {renderSignature(data.complexManager, 160, 50)}
          </View>
        </View>

        {/* Results and comments are rendered inside the table rows above; no separate summary here */}

        {data.footerDate ? (
          <View style={styles.dateBox}>
             <Text style={styles.inputLabel}>DATE: <Text style={styles.inputValue}>{data.footerDate}</Text></Text>
          </View>
        ) : null}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, backgroundColor: '#F3F4F6' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderColor: '#1F2937', borderWidth: 1 },
  headerRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  logo: { width: 55, height: 55, marginRight: 12 },
  brandName: { fontSize: 13, fontWeight: '800', color: '#185a9d' },
  title: { fontSize: 15, fontWeight: '900', color: '#111827' },
  metaBox: { alignItems: 'flex-end' },
  metaText: { fontSize: 10, color: '#4B5563' },

  tableWrapper: { marginTop: 10, borderWidth: 1, borderColor: '#ccc' },
  spanningHeaderRow: { flexDirection: 'row', backgroundColor: '#fff' },
  testsHeaderGroup: { width: 280, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ccc', backgroundColor: '#fcfcfc', alignItems: 'center', paddingVertical: 4 },
  testsHeaderText: { fontSize: 9, fontWeight: 'bold' },

  tableHeader: { flexDirection: 'row', backgroundColor: '#f2f2f2', borderBottomWidth: 1, borderColor: '#ccc' },
  columnHeader: { fontSize: 9, fontWeight: 'bold', padding: 8, textAlign: 'center', borderRightWidth: 1, borderColor: '#ccc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  cellText: { padding: 8, fontSize: 11, borderRightWidth: 1, borderColor: '#ccc', textAlign: 'center', color: '#333' },
  emptyValue: { color: '#999', fontSize: 11 },

  footerSignatureArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap' },
  footerSignBox: { width: '48%', marginBottom: 15 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#374151', marginBottom: 4 },
  inputValue: { fontSize: 13, color: '#111' },
  dateBox: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 }
  ,
  metaBoxRight: { alignItems: 'flex-end' },
  metaTextSmall: { fontSize: 10, color: '#6b7280' },
  testsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  leftLabelsTitle: { fontSize: 12, fontWeight: '700', padding: 6 },
  rightTestsTitle: { fontSize: 11, fontWeight: '700', padding: 6 },
  spanningHeaderRowExact: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  testsHeaderGroupExact: { width: 440, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ccc', backgroundColor: '#fafafa', alignItems: 'center', paddingVertical: 6 },
  sampledManagersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  smallLabel: { fontSize: 11, color: '#374151', fontWeight: '600' }
});
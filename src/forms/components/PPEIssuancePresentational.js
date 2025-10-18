import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const PPEIssuancePresentational = ({ payload }) => {
  const p = payload || {};
  const metadata = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];
  const assets = p.assets || {};

  const columnOrder = ['id','name','jobTitle','apron','cap','chefHat','trousers','safetyBoots','shirt','golfTShirt','workSuit','chefCoat','staffNrc','staffSign','supSign'];

  return (
    <ScrollView horizontal contentContainerStyle={{ padding: 12 }}>
      <View style={[styles.container]}>
        {/* Header: left logo+company block, right metadata. Title/subject centered below to match editable form */}
        <View style={styles.headerRow}>
          <View style={styles.logoAndTitle}>
            {assets.logoDataUri ? (
              <Image source={{ uri: assets.logoDataUri }} style={styles.logoLeft} />
            ) : (
              <Image source={require('../../assets/logo.jpeg')} style={styles.logoLeft} />
            )}
            <Text style={styles.logoText}>Bravo</Text>
            <View style={styles.titleBlock}>
              <Text style={styles.documentTitle}>BRAVO BRANDS LIMITED</Text>
              <Text style={styles.documentTitleSub}>Food Safety Management System</Text>
            </View>
          </View>

          <View style={styles.metaCol}><Text style={styles.metaText}>Issue Date: {metadata.issueDate || ''}</Text></View>
        </View>

        {/* Centered form title and subject (matches editable form layout) */}
        <View style={styles.centerTitleWrap}>
          <Text style={styles.centeredTitle}>{p.title || 'PPE Issuance'}</Text>
          <Text style={styles.subjectText}><Text style={styles.boldText}>Subject:</Text> {metadata.subject || 'Personal Protective Equipment'}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.hCell, styles.noCol]}>NO.</Text>
          <Text style={[styles.hCell, styles.nameCol]}>NAME</Text>
          <Text style={[styles.hCell, styles.jobCol]}>JOB TITLE</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>APRON</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>CAP</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>CHEF HAT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>TROUSERS</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>SAFETY BOOTS</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>SHIRT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>GOLF T-SHIRT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>WORK SUIT</Text>
          <Text style={[styles.hCell, styles.ppeCol]}>CHEF COAT</Text>
          <Text style={[styles.hCell, styles.signCol]}>STAFF NRC</Text>
          <Text style={[styles.hCell, styles.signCol]}>STAFF SIGN</Text>
          <Text style={[styles.hCell, styles.signCol]}>SUP SIGN</Text>
        </View>

        {rows.map((r, i) => (
          <View key={r.id || i} style={styles.row}>
            <Text style={[styles.cell, styles.noCol]}>{r.id || i+1}</Text>
            <Text style={[styles.cell, styles.nameCol]}>{r.name || ''}</Text>
            <Text style={[styles.cell, styles.jobCol]}>{r.jobTitle || ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.apron ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.cap ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.chefHat ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.trousers ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.safetyBoots ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.shirt ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.golfTShirt ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.workSuit ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.ppeCol]}>{r.chefCoat ? '✓' : ''}</Text>
            <Text style={[styles.cell, styles.signCol]}>{r.staffNrc || ''}</Text>
            <Text style={[styles.cell, styles.signCol]}>{r.staffSign || ''}</Text>
            <Text style={[styles.cell, styles.signCol]}>{r.supSign || ''}</Text>
          </View>
        ))}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>HSEQ MANAGER..................................</Text>
          <Text style={styles.footerText}>COMPLEX MANAGER..................................</Text>
          <Text style={styles.footerText}>FINANCIAL CONTROLLER..................................</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const columnWidths = {
  no: 40, name: 180, job: 140, ppe: 60, sign: 120
};
const totalWidth = columnWidths.no + columnWidths.name + columnWidths.job + (columnWidths.ppe * 9) + (columnWidths.sign * 3);

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', width: totalWidth },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, borderWidth: 1, borderColor: '#000', padding: 6 },
  logoAndTitle: { flexDirection: 'row', alignItems: 'center', flex: 2 },
  logoLeft: { width: 36, height: 36, resizeMode: 'contain', marginRight: 8 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#A00', marginRight: 10 },
  titleBlock: { borderLeftWidth: 1, borderLeftColor: '#000', paddingLeft: 10 },
  documentTitle: { fontWeight: 'bold', fontSize: 12 },
  documentTitleSub: { fontSize: 10 },
  metaCol: { flex: 1.5, alignItems: 'flex-start', marginLeft: 10 },
  metaText: { fontSize: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderWidth: 1, borderColor: '#000' },
  hCell: { padding: 6, fontSize: 10, fontWeight: '700', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 34 },
  cell: { padding: 6, fontSize: 10, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  noCol: { width: columnWidths.no },
  nameCol: { width: columnWidths.name, textAlign: 'left' },
  jobCol: { width: columnWidths.job },
  ppeCol: { width: columnWidths.ppe },
  signCol: { width: columnWidths.sign },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footerText: { fontWeight: '700', fontSize: 10, flex: 1 }
  ,
  centerTitleWrap: { alignItems: 'center', marginVertical: 6 },
  centeredTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subjectText: { fontSize: 12, marginTop: 4 },
  boldText: { fontWeight: '700' }
});

export default PPEIssuancePresentational;

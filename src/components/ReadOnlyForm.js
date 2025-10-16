import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function ReadOnlyForm({ form }) {
  if (!form) return null;
  const titleText = form.title || 'Food Handlers Handwashing Log';

  return (
    <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.topStamp}>
        <View style={styles.stampLeft}>
          {form.logoDataUri ? (
            <Image source={{ uri: form.logoDataUri }} style={styles.logoSmall} resizeMode="contain" />
          ) : (
            <Image source={require('../assets/logo.jpeg')} style={styles.logoSmall} resizeMode="contain" />
          )}
          <Text style={styles.brandName}>Bravo</Text>
        </View>
        <View style={styles.stampRight}>
          <Text style={styles.docSmall}>{form.docNo || ''}</Text>
          <Text style={styles.docSmall}> {form.issueDate || form.issue || ''}</Text>
        </View>
      </View>

      <Text style={styles.title}>{titleText}</Text>
      <View style={styles.headerDivider} />

      <View style={styles.metaBlock}>
        <Text style={styles.meta}>Date: {form.date} | Shift: {form.shift} | Location: {form.location}</Text>
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLabel}>Verified By:</Text>
          <View style={styles.signatureBox} />
          <Text style={styles.signatureLabel}>Complex Manager Sign:</Text>
          <View style={styles.signatureBox} />
        </View>
        <Text style={styles.meta}>Saved: {form.savedAt ? new Date(form.savedAt).toLocaleString() : ''}</Text>
      </View>
      <View style={styles.tableContainer}>
        <View style={styles.rowHeader}>
          <Text style={[styles.cell, styles.snCell, styles.headerCell]}>S/N</Text>
          <Text style={[styles.cell, styles.nameCell, styles.headerCell]}>Full Name</Text>
          <Text style={[styles.cell, styles.jobCell, styles.headerCell]}>Job Title</Text>
          {form.handlers && form.handlers[0] && form.handlers[0].checks && Object.keys(form.handlers[0].checks).map(time => (
            <Text key={time} style={[styles.cell, styles.timeCell, styles.headerCell]}>{time}</Text>
          ))}
          <Text style={[styles.cell, styles.signCell, styles.headerCell]}>Staff Sign</Text>
          <Text style={[styles.cell, styles.supCell, styles.headerCell]}>Sup Name</Text>
          <Text style={[styles.cell, styles.signCell, styles.headerCell]}>Sup Sign</Text>
        </View>
        {form.handlers && form.handlers.map((h, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={[styles.cell, styles.snCell]}>{h.id}</Text>
            <Text style={[styles.cell, styles.nameCell]}>{h.fullName}</Text>
            <Text style={[styles.cell, styles.jobCell]}>{h.jobTitle}</Text>
            {h.checks && Object.keys(h.checks).map(time => (
              <View key={time} style={[styles.cell, styles.timeCell, { alignItems: 'center', justifyContent: 'center' }]}> 
                <View style={[styles.checkbox, h.checks[time] && styles.checkboxChecked]}>
                  {h.checks[time] && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </View>
            ))}
            <Text style={[styles.cell, styles.signCell]}>{h.staffSign}</Text>
            <Text style={[styles.cell, styles.supCell]}>{h.supName}</Text>
            <Text style={[styles.cell, styles.signCell]}>{h.supSign}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.footerNote}>All food handlers are required to wash and sanitize their hands after every 60 minutes.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    width: '100%',
  },
  topStamp: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stampLeft: { flexDirection: 'row', alignItems: 'center' },
  stampRight: { alignItems: 'flex-end' },
  logoSmall: { width: 32, height: 32, marginRight: 8 },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d', marginLeft: 8 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#185a9d',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  metaBlock: { marginBottom: 10 },
  signatureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6 },
  signatureLabel: { fontSize: 12, marginRight: 8 },
  signatureBox: { flex: 1, height: 28, borderBottomWidth: 1, borderColor: '#444', marginRight: 16 },
  meta: {
    fontSize: 15,
    color: '#444',
    marginBottom: 2,
    textAlign: 'center',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    backgroundColor: '#e9e9e9',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  cell: {
    fontSize: 11,
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#ccc',
    minHeight: 28,
    minWidth: 40,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#185a9d',
    backgroundColor: '#e9e9e9',
  },
  snCell: { width: 32 },
  nameCell: { width: 110 },
  jobCell: { width: 80 },
  timeCell: { width: 48 },
  signCell: { width: 70 },
  supCell: { width: 70 },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  footerNote: {
    fontStyle: 'italic',
    color: '#185a9d',
    marginTop: 10,
    textAlign: 'center',
  },
});

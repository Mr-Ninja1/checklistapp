import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

// Presentational (read-only) renderer for Food Handlers Daily Handwashing form
// Accepts a `payload` prop that matches the shape produced by the editable form
export default function FoodHandlersPresentational({ payload }) {
  if (!payload) return null;

  const {
    title = 'Food Handlers Daily Handwashing Tracking Log Sheet',
    date = '',
    location = '',
    shift = '',
    verifiedBy = '',
    complexManagerSign = '',
    timeSlots = [],
    handlers = [],
    layoutHints = {},
    assets = {},
  } = payload;

  // Use layoutHints when provided to better match saved proportions
  const nameW = layoutHints.nameW || 140;
  const jobW = layoutHints.jobW || 100;
  const signW = layoutHints.signW || 80;

  return (
    <ScrollView style={styles.container} horizontal={false} contentContainerStyle={{ padding: 12 }}>
      <View style={styles.logoRow}>
        {/* If an embedded logo exists, use it; otherwise fallback to local asset */}
        {assets && assets.logoDataUri ? (
          <Image source={{ uri: assets.logoDataUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{location}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Shift:</Text>
          <Text style={styles.value}>{shift}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Verified By:</Text>
          <Text style={styles.value}>{verifiedBy}</Text>
        </View>
      </View>

      <View style={styles.tableScroll}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerCell, styles.snCell]}>S/N</Text>
          <Text style={[styles.headerCell, { minWidth: nameW, width: nameW }]}>Full Name</Text>
          <Text style={[styles.headerCell, { minWidth: jobW, width: jobW }]}>Job Title</Text>
          {timeSlots.map((t) => (
            <Text key={t} style={[styles.headerCell, styles.timeCell]}>{t}</Text>
          ))}
          <Text style={[styles.headerCell, { minWidth: signW, width: signW }]}>Staff Sign</Text>
          <Text style={[styles.headerCell, { minWidth: signW, width: signW }]}>Sup Name</Text>
          <Text style={[styles.headerCell, { minWidth: signW, width: signW }]}>Sup Sign</Text>
        </View>

        {handlers.map((row, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.dataCell, styles.snCell]}>{row.id || idx + 1}</Text>
            <Text style={[styles.dataCell, { minWidth: nameW, width: nameW }]}>{row.fullName}</Text>
            <Text style={[styles.dataCell, { minWidth: jobW, width: jobW }]}>{row.jobTitle}</Text>
            {timeSlots.map((time) => (
              <Text key={time} style={[styles.dataCell, styles.timeCell]}>{row.checks && row.checks[time] ? '\u2611' : '\u2610'}</Text>
            ))}
            <Text style={[styles.dataCell, { minWidth: signW, width: signW }]}>{row.staffSign}</Text>
            <Text style={[styles.dataCell, { minWidth: signW, width: signW }]}>{row.supName}</Text>
            <Text style={[styles.dataCell, { minWidth: signW, width: signW }]}>{row.supSign}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Complex Manager:</Text>
        <Text style={styles.footerValue}>{complexManagerSign}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logo: { width: 48, height: 48, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  logoPlaceholder: { width: 48, height: 48, marginRight: 12, borderRadius: 8, backgroundColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#185a9d', flex: 1 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailItem: { flex: 1, paddingRight: 8 },
  label: { fontWeight: '700', color: '#185a9d', marginBottom: 4 },
  value: { backgroundColor: '#f6f8fa', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
  tableScroll: { marginTop: 12 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eef3fb', paddingVertical: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e6e6e6', paddingVertical: 8, alignItems: 'center' },
  headerCell: { fontWeight: '700', fontSize: 12, paddingHorizontal: 6, textAlign: 'center' },
  dataCell: { fontSize: 12, paddingHorizontal: 6, textAlign: 'center' },
  snCell: { minWidth: 40, width: 40 },
  nameCell: { minWidth: 130, maxWidth: 260 },
  jobCell: { minWidth: 100, maxWidth: 160 },
  timeCell: { minWidth: 48, width: 48 },
  signCell: { minWidth: 80, width: 80 },
  supCell: { minWidth: 80, width: 80 },
  footerRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontWeight: '700', color: '#185a9d', marginRight: 8 },
  footerValue: { backgroundColor: '#f6f8fa', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0' },
});

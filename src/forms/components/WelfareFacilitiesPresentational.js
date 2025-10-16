import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'react-native';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

export default function WelfareFacilitiesPresentational({ payload }) {
  if (!payload) return null;
  const meta = payload.metadata || {};
  const items = Array.isArray(payload.formData) ? payload.formData : (payload.formData?.items || []);

  // Group items by area so we can render section headers like the editable form
  const grouped = items.reduce((acc, it) => {
    const area = it.area || 'General';
    if (!acc[area]) acc[area] = [];
    acc[area].push(it);
    return acc;
  }, {});

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        {/* Header: logo + brand + doc meta (match editable form) */}
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/logo.jpeg')} style={styles.brandLogo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandName}>Bravo! Food Safety Inspections</Text>
              <Text style={styles.brandSub}>Bravo Brands Central</Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.docText}>Doc No: BBN-SHEQ-P-XX | Issue Date: {meta.issueDate || ''}</Text>
            <Text style={styles.docText}>Page 1 of 1</Text>
          </View>
          <Text style={styles.mainTitle}>WELFARE FACILITIES CLEANING CHECKLIST</Text>

          <View style={styles.areaMetaRow}>
            <View style={[styles.metaField, { flex: 2 }]}>
              <Text style={styles.metaLabel}>LOCATION:</Text>
              <Text style={styles.metaValue}>{meta.location || ''}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>WEEK:</Text>
              <Text style={styles.metaValue}>{meta.week || ''}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>MONTH:</Text>
              <Text style={styles.metaValue}>{meta.month || ''}</Text>
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>YEAR:</Text>
              <Text style={styles.metaValue}>{meta.year || ''}</Text>
            </View>
          </View>

          <View style={styles.verificationRow}>
            <View style={styles.verificationCell}>
              <Text style={styles.verificationLabel}>Verified By: HSEQ Manager:</Text>
              <Text style={styles.metaValue}>{meta.hseqManager || ''}</Text>
            </View>
          </View>

        </View>

        <ScrollView horizontal style={styles.tableScroll}>
          <View>
            <View style={styles.tableHeader}>
              <View style={[styles.cell, styles.areaCol]}><Text style={styles.headerText}>Area to be cleaned</Text></View>
              <View style={[styles.cell, styles.freqCol]}><Text style={styles.headerText}>Frequency (Per Week)</Text></View>
              {WEEK_DAYS.map(d => (
                <View key={d} style={[styles.dayGroup]}>
                  <View style={[styles.cell, styles.checkCol]}><Text style={styles.headerText}>{d}</Text></View>
                  <View style={[styles.cell, styles.cleanedByCol]}><Text style={styles.headerText}>Cleaned BY</Text></View>
                </View>
              ))}
            </View>

            {/* render grouped areas */}
            {Object.keys(grouped).map(area => (
              <View key={`area-${area}`}>
                <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{area}</Text></View>
                {grouped[area].map(item => (
                  <View key={item.id || item.name} style={styles.row}>
                    <View style={[styles.cell, styles.areaCol]}><Text style={styles.cellText}>{item.name}</Text></View>
                    <View style={[styles.cell, styles.freqCol]}><Text style={styles.cellText}>{item.frequency || ''}</Text></View>
                    {WEEK_DAYS.map(day => (
                      <View key={`${item.id || item.name}-${day}`} style={styles.dayGroup}>
                        <View style={[styles.cell, styles.checkCol]}><Text style={styles.cellText}>{item.checks?.[day]?.checked ? '✓' : ''}</Text></View>
                        <View style={[styles.cell, styles.cleanedByCol]}><Text style={styles.cellText}>{item.checks?.[day]?.cleanedBy || ''}</Text></View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1F2937' },
  headerTop: { marginBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo: { width: 56, height: 56, marginRight: 12, borderRadius: 8, backgroundColor: '#fff' },
  brandName: { fontSize: 16, fontWeight: '700', color: '#185a9d' },
  brandSub: { fontSize: 12, color: '#43cea2' },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  docText: { fontSize: 10, color: '#6B7280' },
  mainTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, borderWidth: 1, borderColor: '#1F2937' },
  metaField: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 100, paddingVertical: 4, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#4B5563', marginRight: 4 },
  metaValue: { fontSize: 13, color: '#111827' },
  verificationRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#1F2937', marginBottom: 10, backgroundColor: '#E5E7EB' },
  verificationCell: { padding: 8, borderRightWidth: 1, borderRightColor: '#1F2937' },
  verificationLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#1F2937' },
  tableScroll: { borderWidth: 1, borderColor: '#1F2937', borderRadius: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#6B7280', paddingVertical: 6, alignItems: 'center' },
  headerText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 11 },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#1F2937', justifyContent: 'center' },
  areaCol: { width: 260 },
  freqCol: { width: 150 },
  dayGroup: { flexDirection: 'row' },
  checkCol: { width: 48, alignItems: 'center', justifyContent: 'center' },
  cleanedByCol: { width: 110, paddingLeft: 6 },
  sectionHeader: { backgroundColor: '#F3F4F6', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sectionHeaderText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'center' },
  cellText: { fontSize: 12, color: '#111827' },
});

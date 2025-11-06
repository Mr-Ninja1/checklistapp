import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function FOH_DailyCleaningPresentational({ payload }) {
  if (!payload) return null;
  const { metadata = {}, formData = [], layoutHints = {} } = payload;
  const timeSlots = payload.timeSlots || ['15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  const hints = layoutHints || {};
  // calculate a sensible table width based on column defaults so horizontal scroll
  // will always allow viewing the last columns (eg. SUP SIGN)
  const defaultWidths = {
    EQUIPMENT: 140,
    PPM: 60,
    TIME_SLOT: 48,
    STAFF_NAME: 120,
    SIGNATURE: 120,
    SUP_NAME: 90,
    SUP_SIGN: 80,
  };
  const slotCount = (payload.timeSlots || timeSlots).length;
  const computedTableW = (hints.EQUIPMENT || defaultWidths.EQUIPMENT)
    + (hints.PPM || defaultWidths.PPM)
    + slotCount * (hints.TIME_SLOT || defaultWidths.TIME_SLOT)
    + (hints.STAFF_NAME || defaultWidths.STAFF_NAME)
    + (hints.SIGNATURE || defaultWidths.SIGNATURE)
    + (hints.SUP_NAME || defaultWidths.SUP_NAME)
    + (hints.SUP_SIGN || defaultWidths.SUP_SIGN)
    + 40; // padding
  const tableW = payload._tableWidth || computedTableW;
  const col = (k, defaultW) => ({ width: hints[k] || defaultWidths[k] || defaultW });

  // Flexible metadata extraction with safe fallbacks
  const md = metadata || {};
  const date = md.date || md.Date || payload.date || payload.savedAt || '';
  const location = md.location || md.Location || md.site || '';
  const shift = md.shift || md.Shift || md.shiftName || '';
  const verifiedBy = md.verifiedBy || md.verified_by || md.VerifiedBy || md.verifier || '';
  const managerSign = md.complexManagerSign || md.managerSign || md.complex_manager_sign || '';
  const tickAfterCleaning = md.tickAfterCleaning || md.tick || md.ticked || false;

  const renderSignatureCell = (val, w = 120, h = 60) => {
    if (!val) return <Text style={styles.metaValue}> </Text>;
    const s = String(val);
    const uri = s.startsWith('data:') ? s : `data:image/png;base64,${s}`;
    return <Image source={{ uri }} style={{ width: w, height: h, resizeMode: 'contain' }} />;
  };

  return (
    // Page wrapper: vertical scrolling for the form. The table below is a
    // dedicated horizontal ScrollView so horizontal drags are handled there.
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ width: '100%' }}>
        {/* Header: logo left, centered title */}
        <View style={styles.headerTop}>
          {payload.assets?.logoDataUri ? (
            <Image source={{ uri: payload.assets.logoDataUri }} style={styles.logo} />
          ) : (
            <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={styles.companyNameLarge}>Bravo</Text>
          </View>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.formTitle}>FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH</Text>
        </View>

        {/* Metadata box to match editable layout */}
        <View style={styles.metaBoxInline}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
          <View style={styles.metaLeft}>
            <Text style={styles.metaLabel}>Location:</Text>
            <Text style={styles.metaValue}>{location}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Shift:</Text>
            <Text style={styles.metaValue}>{shift}</Text>
          </View>

          {/* Verified By: render the signature inline next to the label/value */}
          <View style={[styles.metaRight, styles.inlineSignatureRow]}>
            <View style={{ flexDirection: 'column', flex: 1 }}>
              <Text style={styles.metaLabel}>Verified By:</Text>
              <Text style={styles.metaValue}>{verifiedBy}</Text>
            </View>
            {md.verifiedBySign ? (
              <View style={{ marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
                {renderSignatureCell(md.verifiedBySign, 140, 60)}
              </View>
            ) : null}
          </View>

          {/* Complex manager sign: show label and manager signature inline to the right */}
          <View style={[styles.metaManagerInline]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>COMPLEX MANAGER SIGN:</Text>
            </View>
            <View style={{ marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
              {managerSign ? renderSignatureCell(managerSign, 220, 80) : <Text style={[styles.metaValue, styles.managerSign]}>{managerSign}</Text>}
            </View>
          </View>
          {tickAfterCleaning ? (
            <View style={styles.tickBadgeInline}>
              <Text style={styles.tickText}>✓ TICK AFTER CLEANING</Text>
            </View>
          ) : null}
        </View>

        {/* Table area: horizontally scrollable table (draggable header and rows) */}
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={true}
          directionalLockEnabled={true}
          // capture start touches so dragging anywhere inside the table area
          // (not only on the header) will begin horizontal scrolling
          onStartShouldSetResponderCapture={() => true}
          contentContainerStyle={{ width: tableW, alignItems: 'flex-start' }}
          style={[styles.tableWrapper, { width: '100%' }]}
        >
          <View style={[styles.table, { width: tableW, alignSelf: 'flex-start' }]} pointerEvents="box-none">
            <View style={[styles.headerRow, { width: tableW }]}>
              <View style={[styles.hCell, { width: col('EQUIPMENT', 140).width }]}><Text style={styles.hText}>EQUIPMENT</Text></View>
              <View style={[styles.hCell, { width: col('PPM', 60).width }]}><Text style={styles.hText}>SANITIZER (PPM)</Text></View>
              <View style={{ width: (timeSlots.length || 0) * col('TIME_SLOT', 48).width }}>
                <View style={[styles.hCellMainTime]}>
                  <Text style={styles.hText}>TIME INTERVAL</Text>
                </View>
                <View style={[styles.timeSubRow, { flexDirection: 'row' }]}> 
                  {timeSlots.map((t, i) => (
                    <View key={i} style={[styles.hCell, { width: col('TIME_SLOT', 48).width }]}>
                      <Text style={styles.hTextSmall}>{t.replace(/(AM|PM)/,'')}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[styles.hCell, { width: col('STAFF_NAME', 120).width }]}><Text style={styles.hText}>STAFF NAME</Text></View>
              <View style={[styles.hCell, { width: col('SIGNATURE', 120).width }]}><Text style={styles.hText}>STAFF SIGN</Text></View>
              <View style={[styles.hCell, { width: col('SUP_NAME', 90).width }]}><Text style={styles.hText}>SUP NAME</Text></View>
              <View style={[styles.hCell, { width: col('SUP_SIGN', 80).width }]}><Text style={styles.hText}>SUP SIGN</Text></View>
            </View>

            {(formData.length ? formData : Array.from({ length: 8 }).map((_,i)=>({ name: '', ppm: '', times: {}, staffName: '', staffSign: '', supName: '', supSign: '' }))).map((row, rIdx) => (
              <View key={rIdx} style={[styles.row, { width: tableW }]}>
                <View style={[styles.cell, { width: col('EQUIPMENT', 140).width }]}><Text style={styles.cellText}>{row.name}</Text></View>
                <View style={[styles.cell, { width: col('PPM', 60).width }]}><Text style={styles.cellText}>{row.ppm ?? ''}</Text></View>
                <View style={{ flexDirection: 'row', width: (timeSlots.length || 0) * col('TIME_SLOT', 48).width }}>{timeSlots.map((t, ti) => (
                  <View key={ti} style={[styles.cell, { width: col('TIME_SLOT', 48).width }]}>
                    <View style={[styles.checkbox, row.times && row.times[t] ? styles.checkboxChecked : null]}>
                      {row.times && row.times[t] ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  </View>
                ))}</View>
                <View style={[styles.cell, { width: col('STAFF_NAME', 120).width }]}><Text style={styles.cellText}>{row.staffName || ''}</Text></View>
                <View style={[styles.cell, { width: col('SIGNATURE', 120).width, alignItems: 'center' }]}>{row.staffSign ? renderSignatureCell(row.staffSign, col('SIGNATURE', 120).width - 8, 60) : <Text style={styles.underline}>______</Text>}</View>
                <View style={[styles.cell, { width: col('SUP_NAME', 90).width }]}><Text style={styles.cellText}>{row.SUPName || row.slipName || row.supName || ''}</Text></View>
                <View style={[styles.cell, { width: col('SUP_SIGN', 80).width, alignItems: 'center' }]}>{row.supSign ? renderSignatureCell(row.supSign, col('SUP_SIGN', 80).width - 8, 60) : <Text style={styles.underline}>______</Text>}</View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', backgroundColor: '#eee', padding: 8, borderBottomWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  headerCell: { minWidth: 80, paddingHorizontal: 6, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', minHeight: 40, alignItems: 'center' },
  // center content so checkboxes align with header subcells; add right border to match header
  cell: { padding: 6, borderRightWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  left: { textAlign: 'left', paddingLeft: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#eee' },
  logo: { width: 64, height: 48, marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  companyName: { fontSize: 16, fontWeight: '800', color: '#185a9d' },
  companyNameLarge: { fontSize: 20, fontWeight: '900', color: '#185a9d' },
  title: { fontSize: 14, fontWeight: '700', color: '#333' },
  titleRow: { alignItems: 'center', marginTop: 6 },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
  metaBoxInline: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 10, borderRadius: 6, backgroundColor: '#fafafa' },
  metaLeft: { width: '35%', paddingRight: 8 },
  metaRight: { width: '25%', paddingRight: 8 },
  metaFull: { width: '100%', marginTop: 8 },
  metaLabel: { fontSize: 12, color: '#666', fontWeight: '700' },
  metaValue: { fontSize: 13, color: '#222', marginTop: 4 },
  managerSign: { minHeight: 24, borderWidth: 1, borderColor: '#eee', padding: 6, borderRadius: 4 },
  tickBadgeInline: { marginLeft: 8, backgroundColor: '#e6f9ed', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, alignSelf: 'center' },
  tickText: { color: '#1b8a3e', fontWeight: '700' },
  tableBorder: { borderWidth: 1, borderColor: '#ccc' },
  tableBorderRow: { borderBottomWidth: 1, borderColor: '#e6e6e6' },
  inlineSignatureRow: { flexDirection: 'row', alignItems: 'center' },
  metaManagerInline: { flexDirection: 'row', alignItems: 'center', width: '40%', paddingRight: 8 },
  /* Additional table/header styles used by the horizontal table renderer */
  tableWrapper: { marginTop: 12 },
  table: { backgroundColor: '#fff' },
  hCell: { padding: 6, borderRightWidth: 1, borderColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
  hText: { fontSize: 12, fontWeight: '800', color: '#111827', textAlign: 'center' },
  hTextSmall: { fontSize: 11, fontWeight: '700', color: '#111827', textAlign: 'center' },
  hCellMainTime: { height: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f7', borderRightWidth: 1, borderColor: '#eee' },
  timeSubRow: { height: 36 },
  cellText: { textAlign: 'left', paddingLeft: 6, color: '#111827' },
  underline: { color: '#9CA3AF', fontWeight: '700' },
  checkbox: { width: 28, height: 28, borderWidth: 1.5, borderColor: '#4B5563', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6fff6' },
  checkboxChecked: { backgroundColor: '#1f8f1f', borderColor: '#1f8f1f' },
  checkMark: { color: '#fff', fontWeight: '800' },
});


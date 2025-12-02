import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, useWindowDimensions } from 'react-native';
import SignatureThumb from '../../components/SignatureThumb';

const A4_WIDTH = 794;

export default function MouldingProofingBakingLogPresentational({ payload = {}, exportingWide = false }) {
  const { width: windowWidth } = useWindowDimensions();
  // Normalize payload shapes: callers may pass wrapped objects like
  // { payload: { ... } } or history entries where payload is under meta.payload.
  const normalizeIncoming = (incoming) => {
    if (!incoming) return {};
    let v = incoming;
    // unwrap once or twice if nested
    if (v.payload) v = v.payload;
    if (v.meta && v.meta.payload) v = v.meta.payload;
    if (v.payload) v = v.payload;
    return v || {};
  };
  const p = normalizeIncoming(payload);
  // Debug logs removed.
  // Some payloads nest metadata in an extra `metadata` object or under `meta`.
  // Normalize so consumers can reliably read fields like issueDate/location.
  let metaCandidate = p.metadata || p.meta || {};
  if (metaCandidate && metaCandidate.metadata) metaCandidate = metaCandidate.metadata;
  const metadata = metaCandidate || {};
  // Ensure we read corrective action from normalized metadata first, then fall back
  // to legacy keys that some saved payloads may contain.
  const correctiveText = metadata.correctiveAction ?? metadata.corrective ?? p.correctiveAction ?? payload.correctiveAction ?? '';
  const { formData = [], layoutHints = {}, _tableWidth } = p;

  const logo = p.assets && p.assets.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg');

  // columns default fallbacks
  const COL = {
    num: layoutHints.num || 40,
    food: layoutHints.food || 220,
    mouldingTime: layoutHints.mouldingTime || 90,
    mouldingSign: layoutHints.mouldingSign || 110,
    proofTimeIn: layoutHints.proofTimeIn || 90,
    proofTimeOut: layoutHints.proofTimeOut || 90,
    proofSign: layoutHints.proofSign || 110,
    bakeTimeIn: layoutHints.bakeTimeIn || 90,
    bakeTemp: layoutHints.bakeTemp || 70,
    bakeTimeOut: layoutHints.bakeTimeOut || 90,
    staff: layoutHints.staff || 140,
  };

  const TABLE_WIDTH = _tableWidth || (Object.values(COL).reduce((s, v) => s + v, 0));

  let scale = 1;
  if (exportingWide && TABLE_WIDTH > A4_WIDTH) scale = A4_WIDTH / TABLE_WIDTH;

  // Start with scaled column widths based on export scaling
  const scaledCols = {};
  Object.keys(COL).forEach(k => { scaledCols[k] = Math.round(COL[k] * scale); });
  let adjustedTableWidth = Object.values(scaledCols).reduce((s, v) => s + v, 0);

  // Ensure the table fills the remaining viewport width by distributing extra space
  const pagePadding = 24; // align with container padding
  const minContainerWidth = Math.max(600, Math.round(windowWidth - pagePadding));
  if (!exportingWide && adjustedTableWidth < minContainerWidth) {
    const extra = minContainerWidth - adjustedTableWidth;
    const variableKeys = ['food','mouldingTime','mouldingSign','proofTimeIn','proofTimeOut','proofSign','bakeTimeIn','bakeTemp','bakeTimeOut','staff'];
    const varTotal = variableKeys.reduce((s, k) => s + (scaledCols[k] || 0), 0) || 1;
    let distributed = 0;
    variableKeys.forEach((k, i) => {
      const add = (i === variableKeys.length - 1) ? (extra - distributed) : Math.round(extra * ((scaledCols[k] || 0) / varTotal));
      scaledCols[k] = (scaledCols[k] || 0) + add;
      distributed += add;
    });
    adjustedTableWidth = Object.values(scaledCols).reduce((s, v) => s + v, 0);
  }

  const adj = key => Math.round(scaledCols[key] || 0);

  const normalizeSignature = (v) => {
    if (!v) return null;
    // If it's an object try to extract common fields
    if (typeof v !== 'string') {
      const maybe = v && (v.uri || v.data || v.base64 || v);
      if (typeof maybe === 'string') v = maybe;
      else return null;
    }
    if (v.startsWith('data:')) return v;
    const compact = v.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/=]+$/.test(compact)) return `data:image/png;base64,${compact}`;
    return null;
  };

  const renderSig = (val, width = 160, height = 48) => {
    const uri = normalizeSignature(val);
    if (uri) return <SignatureThumb uri={uri} width={width} height={height} />;
    return <Text>{val || ''}</Text>;
  };

  // Determine whether the table should fit the viewport or allow horizontal scroll.
  const viewportWidth = exportingWide ? A4_WIDTH : Math.round(windowWidth - pagePadding);
  const tableContainerContentStyle = adjustedTableWidth <= viewportWidth ? { width: viewportWidth } : { minWidth: adjustedTableWidth };

  return (
    <ScrollView contentContainerStyle={exportingWide ? { padding: 0 } : styles.container}>
      <View style={[styles.headerDocBox, exportingWide ? { width: A4_WIDTH } : null]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={{ flex: 1, paddingLeft: 8 }}>
          <Text style={styles.companyName}>BRAVO BRANDS LIMITED</Text>
          <Text style={styles.headerSubject}>MOULDING PROOFING AND BAKING LOG SHEET</Text>
          <Text style={styles.smallNote}>Subject: MOULDING PROOFING AND BAKING LOG SHEET</Text>
        </View>
        <View style={styles.docBox}>
          <View style={styles.docRow}><Text style={styles.docLabel}>Issue Date:</Text><Text style={styles.docVal}>{p.issueDate || metadata.issueDate || ''}</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Revision Date:</Text><Text style={styles.docVal}>{p.revisionDate || metadata.revisionDate || ''}</Text></View>
          <View style={styles.docRow}><Text style={styles.docLabel}>Location:</Text><Text style={styles.docVal}>{metadata.location || p.location || ''}</Text></View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 6 }}>
        <View>
          <Text style={styles.metaLabel}>Compiled By:</Text>
          <Text style={styles.metaVal}>{metadata.compiledBy || 'Michael zulu'}</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Approved By:</Text>
          <Text style={styles.metaVal}>{metadata.approvedBy || 'Hassani Ali'}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={[tableContainerContentStyle, { flexGrow: 0 }]}
        style={[styles.tableScroll]}
      >
        <View style={tableContainerContentStyle}>
          <View style={[styles.headerRow, { width: adjustedTableWidth }]}> 
            <View style={[styles.headerCell, { width: adj('num') }]}><Text style={styles.headerText}>#</Text></View>
            <View style={[styles.headerCell, { width: adj('food') }]}><Text style={styles.headerText}>FOOD ITEM</Text></View>
            <View style={[styles.headerCell, { width: adj('mouldingTime') + adj('mouldingSign') }]}><Text style={styles.headerText}>MOULDING</Text></View>
            <View style={[styles.headerCell, { width: adj('proofTimeIn') + adj('proofTimeOut') + adj('proofSign') }]}><Text style={styles.headerText}>PROOFING</Text></View>
            <View style={[styles.headerCell, { width: adj('bakeTimeIn') + adj('bakeTemp') + adj('bakeTimeOut') }]}><Text style={styles.headerText}>BAKING TEMP (180°C - 300°C)</Text></View>
            <View style={[styles.headerCell, { width: adj('staff') }]}><Text style={styles.headerText}>STAFF'S NAME</Text></View>
          </View>

          <View style={[styles.subHeaderRow, { width: adjustedTableWidth }]}> 
            <View style={[styles.subCell, { width: adj('num') }]}><Text style={styles.subText}>#</Text></View>
            <View style={[styles.subCell, { width: adj('food') }]}><Text style={styles.subText}></Text></View>
            <View style={[styles.subCell, { width: adj('mouldingTime') }]}><Text style={styles.subText}>TIME</Text></View>
            <View style={[styles.subCell, { width: adj('mouldingSign') }]}><Text style={styles.subText}>SIGN</Text></View>
            <View style={[styles.subCell, { width: adj('proofTimeIn') }]}><Text style={styles.subText}>TIME IN</Text></View>
            <View style={[styles.subCell, { width: adj('proofTimeOut') }]}><Text style={styles.subText}>TIME OUT</Text></View>
            <View style={[styles.subCell, { width: adj('proofSign') }]}><Text style={styles.subText}>SIGN</Text></View>
            <View style={[styles.subCell, { width: adj('bakeTimeIn') }]}><Text style={styles.subText}>TIME IN</Text></View>
            <View style={[styles.subCell, { width: adj('bakeTemp') }]}><Text style={styles.subText}>TEMP</Text></View>
            <View style={[styles.subCell, { width: adj('bakeTimeOut') }]}><Text style={styles.subText}>TIME OUT</Text></View>
            <View style={[styles.subCell, { width: adj('staff') }]}><Text style={styles.subText}></Text></View>
          </View>

          { (formData || []).map((r, idx) => (
            <View key={idx} style={[styles.row, { width: adjustedTableWidth }]}> 
              <View style={[styles.cell, { width: adj('num') }]}><Text>{idx+1}</Text></View>
              <View style={[styles.cell, { width: adj('food') }]}><Text>{r.product || ''}</Text></View>
              <View style={[styles.cell, { width: adj('mouldingTime') }]}><Text>{r.mouldingTime || ''}</Text></View>
              <View style={[styles.cell, { width: adj('mouldingSign'), alignItems: 'center' }]}>{renderSig(r.mouldingSign, Math.max(40, adj('mouldingSign')-12), 36)}</View>
              <View style={[styles.cell, { width: adj('proofTimeIn') }]}><Text>{r.proofTimeIn || ''}</Text></View>
              <View style={[styles.cell, { width: adj('proofTimeOut') }]}><Text>{r.proofTimeOut || ''}</Text></View>
              <View style={[styles.cell, { width: adj('proofSign'), alignItems: 'center' }]}>{renderSig(r.proofSign, Math.max(40, adj('proofSign')-12), 36)}</View>
              <View style={[styles.cell, { width: adj('bakeTimeIn') }]}><Text>{r.bakeTimeIn || ''}</Text></View>
              <View style={[styles.cell, { width: adj('bakeTemp') }]}>
                {(() => {
                  const raw = r.bakeTemp || '';
                  const s = String(raw).trim();
                  if (!s) return <Text>{''}</Text>;
                  if (s.includes('°') || /c$/i.test(s)) return <Text>{s}</Text>;
                  return <Text>{`${s} °C`}</Text>;
                })()}
              </View>
              <View style={[styles.cell, { width: adj('bakeTimeOut') }]}><Text>{r.bakeTimeOut || ''}</Text></View>
              <View style={[styles.cell, { width: adj('staff') }]}><Text>{r.staffName || ''}</Text></View>
            </View>
          ))}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>Head Chef/Baker Signature:</Text>
            {renderSig(p.headChefSign, 240, 80)}
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.footerLabel}>Corrective Action:</Text>
          <Text style={styles.corrective}>{correctiveText}</Text>
        </View>

        <View style={[styles.footerRow, { marginTop: 8 }]}> 
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>Verified By:</Text>
            {renderSig(p.verifiedBySign, 220, 64)}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[styles.footerLabel, { textAlign: 'right' }]}>Complex Manager Signature</Text>
            {renderSig(p.complexManagerSign, 220, 64)}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  headerDocBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, backgroundColor: '#fff' },
  logo: { width: 64, height: 64, marginRight: 8 },
  companyName: { fontWeight: '800', color: '#185a9d' },
  headerSubject: { fontWeight: '800', fontSize: 14 },
  smallNote: { fontSize: 11, color: '#374151', marginTop: 4 },
  docBox: { width: 260, borderLeftWidth: 1, borderColor: '#eee', paddingLeft: 8 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  docLabel: { fontWeight: '700', fontSize: 11, color: '#374151', width: 100 },
  docVal: { flex: 1, textAlign: 'right', color: '#111827' },
  metaLabel: { fontWeight: '700', color: '#374151' },
  metaVal: { color: '#111827' },

  tableScroll: { borderWidth: 1, borderColor: '#e6eef2', borderRadius: 6, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', backgroundColor: '#eef2ff', borderBottomWidth: 1, borderColor: '#dbeafe', minHeight: 44, alignItems: 'center' },
  headerCell: { padding: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#dbeafe' },
  headerText: { fontWeight: '800' },
  subHeaderRow: { flexDirection: 'row', backgroundColor: '#eef7ff', borderBottomWidth: 1, borderColor: '#dbeafe', alignItems: 'center' },
  subCell: { padding: 6, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#dbeafe' },
  subText: { fontWeight: '700', fontSize: 12 },

  row: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e6eef2', minHeight: 44, alignItems: 'center' },
  cell: { padding: 6, borderRightWidth: 1, borderRightColor: '#e6eef2', justifyContent: 'center' },

  footer: { marginTop: 12, backgroundColor: '#fff' },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontWeight: '700', marginBottom: 6 },
  corrective: { borderWidth: 1, borderColor: '#e6eef2', padding: 8, minHeight: 60, backgroundColor: '#fafafa' },
});

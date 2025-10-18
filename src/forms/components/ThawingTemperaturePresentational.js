import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

export default function ThawingTemperaturePresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const { metadata = {}, formData = [], layoutHints = {}, _tableWidth } = p;

  const rowsToRender = (formData && formData.length) ? formData : Array.from({ length: 20 }, (_, i) => ({ index: i + 1 }));

  // Accept either the explicit TIME/TEMP/SIGN widths, or a legacy TIME_TEMP_SIGN value
  const rawWidths = (layoutHints && layoutHints.WIDTHS) || {};
  // Fallback widths tuned for A4 landscape printing: narrower index & food item
  let WIDTHS = {
    INDEX: rawWidths.INDEX || 36,
    FOOD_ITEM: rawWidths.FOOD_ITEM || 220,
    TIME: rawWidths.TIME || rawWidths.TIME_TEMP_SIGN || 70,
    TEMP: rawWidths.TEMP || rawWidths.TIME_TEMP_SIGN || 70,
    SIGN: rawWidths.SIGN || rawWidths.TIME_TEMP_SIGN || 90,
    STAFF_NAME: rawWidths.STAFF_NAME || 140,
  };

  // Scale widths proportionally to target table width to ensure saved payloads fit the printable area.
  const targetTableWidth = Number(_tableWidth) || 900;
  // sum: INDEX + FOOD_ITEM + 3*(TIME+TEMP+SIGN) + STAFF_NAME
  const sumWidths = WIDTHS.INDEX + WIDTHS.FOOD_ITEM + 3 * (WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN) + WIDTHS.STAFF_NAME;
  if (sumWidths > 0 && sumWidths !== targetTableWidth) {
    const scale = targetTableWidth / sumWidths;
    let scaled = Object.fromEntries(Object.entries(WIDTHS).map(([k, v]) => [k, Math.max(1, Math.round(v * scale))]));
    // Fix rounding delta: ensure sum(scaled) equals targetTableWidth by adding leftover to STAFF_NAME
    const scaledSum = Object.values(scaled).reduce((s, v) => s + v, 0);
    const delta = targetTableWidth - scaledSum;
    if (delta !== 0) {
      scaled.STAFF_NAME = Math.max(1, (scaled.STAFF_NAME || 1) + delta);
    }
    WIDTHS = scaled;
  }

  // Enforce a minimum width for STAFF_NAME so full names fit and re-balance widths.
  const MIN_STAFF_WIDTH = 180; // px target to fit long names like "wwewwewewewwrwew"
  if (WIDTHS.STAFF_NAME < MIN_STAFF_WIDTH) {
    const shortage = MIN_STAFF_WIDTH - WIDTHS.STAFF_NAME;
    // Try to take from FOOD_ITEM first
    const takeFromFood = Math.min(shortage, Math.max(40, WIDTHS.FOOD_ITEM - 40));
    WIDTHS.FOOD_ITEM = Math.max(40, WIDTHS.FOOD_ITEM - takeFromFood);
    WIDTHS.STAFF_NAME = WIDTHS.STAFF_NAME + takeFromFood;
    const remainingShortage = MIN_STAFF_WIDTH - WIDTHS.STAFF_NAME;
    if (remainingShortage > 0) {
      // If still short, take evenly from TIME/TEMP/SIGN groups
      const perCol = Math.ceil(remainingShortage / 3);
      WIDTHS.TIME = Math.max(40, WIDTHS.TIME - perCol);
      WIDTHS.TEMP = Math.max(40, WIDTHS.TEMP - perCol);
      WIDTHS.SIGN = Math.max(40, WIDTHS.SIGN - perCol);
      WIDTHS.STAFF_NAME = Math.min(MIN_STAFF_WIDTH, WIDTHS.STAFF_NAME + perCol * 3);
    }
  }

  // User requested: make STAFF_NAME column same width as FOOD_ITEM.
  // We'll set STAFF_NAME = FOOD_ITEM and then remove the difference from TIME/TEMP/SIGN (evenly)
  // to keep total width equal to targetTableWidth.
  const oldStaff = WIDTHS.STAFF_NAME;
  const targetStaff = WIDTHS.FOOD_ITEM || oldStaff;
  if (targetStaff !== oldStaff) {
    const diff = targetStaff - oldStaff; // positive => need to reduce others
    WIDTHS.STAFF_NAME = targetStaff;
    if (diff > 0) {
      // Remove diff from TIME/TEMP/SIGN evenly, respecting minimums
      let remaining = diff;
      const mins = { TIME: 40, TEMP: 40, SIGN: 40 };
      const cols = ['TIME', 'TEMP', 'SIGN'];
      // attempt even removal in rounds
      for (let pass = 0; pass < 3 && remaining > 0; pass++) {
        const per = Math.ceil(remaining / (3 - pass));
        for (const c of cols) {
          const take = Math.min(per, Math.max(0, WIDTHS[c] - mins[c]));
          WIDTHS[c] = WIDTHS[c] - take;
          remaining -= take;
          if (remaining <= 0) break;
        }
      }
      // If still remaining (very unlikely), shave off from FOOD_ITEM too (but keep it >=40)
      if (remaining > 0) {
        const takeFood = Math.min(remaining, Math.max(0, WIDTHS.FOOD_ITEM - 40));
        WIDTHS.FOOD_ITEM -= takeFood;
        remaining -= takeFood;
      }
      // If still remaining after all attempts, accept that sum may be slightly > target; rounding handled earlier
    }
    // If diff < 0 (old staff bigger), then we have extra space; give it to FOOD_ITEM
    if (diff < 0) {
      WIDTHS.FOOD_ITEM += Math.abs(diff);
    }
  }

  // Reduce FOOD_ITEM a bit (user requested) while keeping STAFF_NAME unchanged.
  // We'll reduce FOOD_ITEM by up to 30px (but not below 40px) and add that amount evenly to TIME/TEMP/SIGN.
  const desiredFoodReduction = 30;
  const actualReduction = Math.min(desiredFoodReduction, Math.max(0, WIDTHS.FOOD_ITEM - 40));
  if (actualReduction > 0) {
    WIDTHS.FOOD_ITEM = WIDTHS.FOOD_ITEM - actualReduction;
    const per = Math.floor(actualReduction / 3);
    WIDTHS.TIME = (WIDTHS.TIME || 40) + per;
    WIDTHS.TEMP = (WIDTHS.TEMP || 40) + per;
    WIDTHS.SIGN = (WIDTHS.SIGN || 40) + (actualReduction - per * 2);
  }

  // User requested a further reduction: apply one more reduction up to 30px
  const furtherReduction = Math.min(30, Math.max(0, WIDTHS.FOOD_ITEM - 40));
  if (furtherReduction > 0) {
    WIDTHS.FOOD_ITEM = WIDTHS.FOOD_ITEM - furtherReduction;
    const per2 = Math.floor(furtherReduction / 3);
    WIDTHS.TIME = (WIDTHS.TIME || 40) + per2;
    WIDTHS.TEMP = (WIDTHS.TEMP || 40) + per2;
    WIDTHS.SIGN = (WIDTHS.SIGN || 40) + (furtherReduction - per2 * 2);
  }

  // Now: reduce FOOD_ITEM by the current TIME column width (transfer that width to TIME/TEMP/SIGN).
  // Clamp so FOOD_ITEM >= 40.
  const transfer = Math.min(WIDTHS.TIME || 0, Math.max(0, WIDTHS.FOOD_ITEM - 40));
  if (transfer > 0) {
    WIDTHS.FOOD_ITEM = WIDTHS.FOOD_ITEM - transfer;
    const perT = Math.floor(transfer / 3);
    WIDTHS.TIME = (WIDTHS.TIME || 40) + perT;
    WIDTHS.TEMP = (WIDTHS.TEMP || 40) + perT;
    WIDTHS.SIGN = (WIDTHS.SIGN || 40) + (transfer - perT * 2);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.logoArea}>
              <Image source={p.assets?.logoDataUri ? { uri: p.assets.logoDataUri } : require('../../assets/logo.jpeg')} style={styles.logo} />
              <Text style={styles.companyText}>{metadata.companyName || 'BRAVO BRANDS LIMITED'}</Text>
          </View>
          <View style={styles.issueBox}>
            <Text style={styles.issueLabel}>Issue Date:</Text>
            <Text style={styles.issueValue}>{metadata.issueDate || metadata.date || ''}</Text>
          </View>
        </View>

        <View style={styles.subjectBandRow}>
          <View style={styles.subjectLeft}><Text style={styles.subjectSmall}>SUBJECT: THAWING TEMPERATURE LOG</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>COMPILED BY: {metadata.compiledBy || ''}</Text></View>
          <View style={styles.compiledBoxThin}><Text style={styles.compiledLabelSmall}>APPROVED BY: {metadata.approvedBy || ''}</Text></View>
        </View>

        <View style={styles.probeRowTight}>
          <Text style={styles.probeTextSmall}>PROBE THERMOMETER TEMPERATURE LOG FOR THAWED FOOD</Text>
          {/* Date removed: issue date already displayed in the header block */}
        </View>

        <View style={[styles.table, { minWidth: _tableWidth || 1000 }]}> 
          <Text style={styles.tableTitle}>THAWING TEMPERATURE LOG</Text>

          <View style={[styles.tableGroupHeader]}>
            <View style={[styles.hCellFixed, { width: WIDTHS.INDEX }]}><Text style={styles.hText}>#</Text></View>
            <View style={[styles.hCellFixed, { width: WIDTHS.FOOD_ITEM }]}><Text style={styles.hText}>FOOD ITEM</Text></View>
            <View style={[styles.hGroupCell, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>1ST RECORD</Text></View>
            <View style={[styles.hGroupCell, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>2ND RECORD</Text></View>
            <View style={[styles.hGroupCell, { width: WIDTHS.TIME + WIDTHS.TEMP + WIDTHS.SIGN }]}><Text style={styles.hText}>3RD RECORD</Text></View>
            <View style={[styles.hCellFixed, { width: WIDTHS.STAFF_NAME }]}><Text style={styles.hText}>STAFF'S NAME</Text></View>
          </View>

          <View style={[styles.tableHeaderRow, styles.detailHeader]}>
            <View style={[styles.hCellFixed, { width: WIDTHS.INDEX }]} />
            <View style={[styles.hCellFixed, { width: WIDTHS.FOOD_ITEM }]} />
            {[...Array(3)].map((_, i) => (
              <React.Fragment key={i}>
                <View style={[styles.hCellFixed, { width: WIDTHS.TIME }]}><Text style={styles.hText}>TIME</Text></View>
                <View style={[styles.hCellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.hText}>TEMP</Text></View>
                <View style={[styles.hCellFixed, { width: WIDTHS.SIGN }]}><Text style={styles.hText}>SIGN</Text></View>
              </React.Fragment>
            ))}
            <View style={[styles.hCellFixed, { width: WIDTHS.STAFF_NAME }]} />
          </View>

          {rowsToRender.map((r, ri) => (
            <View key={ri} style={styles.row}>
              <View style={[styles.cellFixed, { width: WIDTHS.INDEX }]}><Text style={styles.cellText}>{r.index || ri + 1}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.FOOD_ITEM }]}>
                <Text style={styles.cellText}>{r.foodItem || ''}</Text>
              </View>

              <View style={[styles.cellFixed, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time1 || ''}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp1 ? `${r.temp1} °C` : ''}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.SIGN }]}><Text style={styles.cellText}>{r.sign1 || ''}</Text></View>

              <View style={[styles.cellFixed, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time2 || ''}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp2 ? `${r.temp2} °C` : ''}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.SIGN }]}><Text style={styles.cellText}>{r.sign2 || ''}</Text></View>

              <View style={[styles.cellFixed, { width: WIDTHS.TIME }]}><Text style={styles.cellText}>{r.time3 || ''}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.TEMP }]}><Text style={styles.cellText}>{r.temp3 ? `${r.temp3} °C` : ''}</Text></View>
              <View style={[styles.cellFixed, { width: WIDTHS.SIGN }]}><Text style={styles.cellText}>{r.sign3 || ''}</Text></View>

              <View style={[styles.cellFixed, { width: WIDTHS.STAFF_NAME }]}><Text style={styles.cellText}>{r.staffName || ''}</Text></View>
            </View>
          ))}

        </View>

        {/* Footer: Chef signature, corrective action and verified-by lines */}
        <View style={styles.footerSection}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>CHEF Signature:</Text>
            <Text style={styles.signatureLine}>{metadata.chefSignature || '______________________________'}</Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Corrective Action:</Text>
            <Text style={styles.textarea}>{metadata.correctiveAction || ''}</Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, fontSize: 12 }}>Verified by:</Text>
            <Text style={{ marginTop: 8, fontSize: 12 }}>HSEQ Manager: {metadata.hseqManagerSignature || '______________________________'}</Text>
            <Text style={{ marginTop: 8, fontSize: 12 }}>Complex Manager: {metadata.complexManagerSignature || '______________________________'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 6, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  logoArea: { flexDirection: 'row', alignItems: 'center' },
  issueBox: { alignItems: 'flex-end', minWidth: 140, borderWidth: 1, borderColor: '#333', padding: 6 },
  issueLabel: { fontSize: 10 },
  issueValue: { fontSize: 12, fontWeight: '700' },
  logo: { width: 38, height: 28, resizeMode: 'contain' },
  companyText: { fontWeight: '900', fontSize: 14, marginLeft: 6 },
  subjectBandRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333', paddingVertical: 4 },
  subjectLeft: { flex: 1 },
  subjectSmall: { fontWeight: '700', fontSize: 11 },
  compiledBoxThin: { paddingHorizontal: 8 },
  compiledLabelSmall: { fontSize: 10, fontWeight: '700' },
  probeRowTight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 },
  probeTextSmall: { fontSize: 11, fontWeight: '700' },
  probeDateSmall: { fontSize: 11 },
  table: { borderWidth: 1, borderColor: '#333', marginTop: 4, overflow: 'hidden' },
  tableTitle: { textAlign: 'center', fontWeight: '800', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#333' },
  tableGroupHeader: { flexDirection: 'row', backgroundColor: '#f3f5f7', borderBottomWidth: 1, borderColor: '#333' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  detailHeader: { backgroundColor: '#f3f5f7' },
  hCellFixed: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', alignItems: 'center', justifyContent: 'center' },
  hGroupCell: { padding: 6, borderRightWidth: 1, borderRightColor: '#333', alignItems: 'center', justifyContent: 'center' },
  hText: { fontWeight: '800', fontSize: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', minHeight: 36, alignItems: 'center' },
  cellFixed: { padding: 6, borderRightWidth: 1, borderRightColor: '#ccc', justifyContent: 'center' },
  cellText: { fontSize: 12 },
  footerSection: { marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },
  signatureLine: { borderBottomWidth: 1, borderColor: '#333', paddingVertical: 8, fontSize: 14 },
  textarea: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4, minHeight: 48 }
});

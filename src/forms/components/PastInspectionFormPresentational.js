import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Animated, Easing } from 'react-native';

export default function PastInspectionFormPresentational({ payload }) {
  if (!payload) return null;
  const p = payload.payload || payload;
  const meta = p.metadata || {};
  const rows = Array.isArray(p.formData) ? p.formData : [];
  const logoDataUri = p.assets && p.assets.logoDataUri;

  // prefer explicit widths from payload.layoutHints so saved presentational matches editor
  const hints = p.layoutHints || {};
  const widths = [
    hints.DATE || 48,
    hints.AREA || 140,
    hints.TYPE || 80,
    hints.QTY || 48,
    hints.COMMENT || 215,
    hints.INSPECTOR || 100,
    hints.SIGN || 128,
  ];

  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // small horizontal oscillation: -3..+3 px
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [wiggle]);

  const translateX = wiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: [-3, 0, 3] });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {logoDataUri ? (
          <Image source={{ uri: logoDataUri }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
        )}
        <View>
          <Text style={styles.title}>Pest Inspection Form</Text>
          <Text style={styles.subtitle}>{meta.companySubtitle || ''}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Compiled By: {meta.compiledBy || ''}</Text>
        <Text style={styles.metaLabel}>Approved By: {meta.approvedBy || ''}</Text>
      </View>

      <Animated.View style={[styles.table, { transform: [{ translateX }] }] }>
        <View style={styles.tableHeader}>
          {['Date','Area Inspected','Type','Qty','Comment/Corrective Action Taken','Name of Inspector','Complex Manager\'s Sign'].map((h, i) => (
            <View key={h} style={[styles.headerCell, { width: widths[i], borderRightWidth: i === widths.length -1 ? 0 : 1 }]}> 
              <Text style={styles.colHeader}>{h}</Text>
            </View>
          ))}
        </View>

        {rows.map(r => (
          <View key={r.id} style={styles.row}>
              <View style={[styles.dataCell, { width: widths[0], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.dateLabel}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[1], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.area}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[2], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.type}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[3], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.qty}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[4], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.comment}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[5], borderRightWidth: 1 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.inspector}</Text>
              </View>
              <View style={[styles.dataCell, { width: widths[6], borderRightWidth: 0 }]}> 
                <Text style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">{r.sign}</Text>
              </View>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logo: { width: 56, height: 56, marginRight: 12 },
  title: { fontWeight: '700', fontSize: 16 },
  subtitle: { fontSize: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaLabel: { fontSize: 12 },

  // table container: solid border around the table for print
  table: { borderWidth: 1, borderColor: '#000', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#000' },
  headerCell: { justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8, paddingVertical: 10, borderRightColor: '#000' },
  colHeader: { fontWeight: '700', fontSize: 12, textAlign: 'left' },

  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', alignItems: 'center', minHeight: 36 },
  dataCell: { justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRightColor: '#000' },
  cellText: { textAlign: 'left', fontSize: 12 },
});

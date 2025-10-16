import React, { forwardRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Image } from 'react-native';

const TIME_SLOTS = [
  '06:00AM', '07:00AM', '08:00AM', '09:00AM', '10:00AM',
  '11:00AM', '12:00PM', '13:00PM', '14:00PM', '15:00PM',
];

const ReadOnlyFormCapture = forwardRef(({ logDetails, handlerData }, ref) => (
  <View ref={ref} style={styles.captureContainer} collapsable={false}>
    <View style={{ alignItems: 'center', marginBottom: 10 }}>
      <Image source={require('../assets/logo.jpeg')} style={{ width: 60, height: 60, borderRadius: 16, marginBottom: 4 }} resizeMode="contain" />
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#185a9d', letterSpacing: 2 }}>Bravo</Text>
    </View>
    <Text style={styles.title}>Food Handlers Daily Handwashing Tracking Log Sheet</Text>
    <View style={styles.detailRow}>
      <View style={styles.detailItem}><Text style={styles.label}>Date:</Text><Text style={styles.input}>{logDetails.date}</Text></View>
      <View style={styles.detailItem}><Text style={styles.label}>Location:</Text><Text style={styles.input}>{logDetails.location}</Text></View>
    </View>
    <View style={styles.detailRow}>
      <View style={styles.detailItem}><Text style={styles.label}>Shift:</Text><Text style={styles.input}>{logDetails.shift}</Text></View>
      <View style={styles.detailItem}><Text style={styles.label}>Verified By:</Text><Text style={styles.input}>{logDetails.verifiedBy}</Text></View>
    </View>
    <View style={[styles.detailRow, styles.signatureSection]}>
      <View style={styles.detailItemFull}><Text style={styles.label}>Complex Manager Sign:</Text><Text style={styles.input}>{logDetails.complexManagerSign}</Text></View>
    </View>
    <ScrollView horizontal contentContainerStyle={{ minWidth: 1200 }} style={styles.tableContainer} showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.row}>
          <Text style={[styles.headerCell, styles.snCell]}>S/N</Text>
          <Text style={[styles.headerCell, styles.nameCell]}>Full Name</Text>
          <Text style={[styles.headerCell, styles.jobCell]}>Job Title</Text>
          {TIME_SLOTS.map(time => (
            <Text key={time} style={styles.timeCell}>{time}</Text>
          ))}
          <Text style={[styles.headerCell, styles.signCell]}>Staff Sign</Text>
          <Text style={[styles.headerCell, styles.supCell]}>Sup Name</Text>
          <Text style={[styles.headerCell, styles.signCell]}>Sup Sign</Text>
        </View>
        {handlerData.map((handler, idx) => (
          <View key={handler.id} style={styles.row}>
            <Text style={[styles.dataCell, styles.snCell]}>{handler.id}</Text>
            <Text style={[styles.inputCell, styles.nameCell]}>{handler.fullName}</Text>
            <Text style={[styles.inputCell, styles.jobCell]}>{handler.jobTitle}</Text>
            {TIME_SLOTS.map((time, tIdx) => (
              <View key={time} style={[styles.timeCheckCell, tIdx === TIME_SLOTS.length - 1 && { borderRightWidth: 6, borderColor: '#000' }]}> 
                <View style={[styles.checkbox, handler.checks[time] && styles.checkboxChecked]}>
                  {handler.checks[time] && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </View>
            ))}
            <Text style={[styles.inputCell, styles.signCell]}>{handler.staffSign}</Text>
            <Text style={[styles.inputCell, styles.supCell]}>{handler.supName}</Text>
            <Text style={[styles.inputCell, styles.signCell]}>{handler.supSign}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    <Text style={styles.footerNote}>All food handlers are required to wash and sanitize their hands after every 60 minutes.</Text>
  </View>
));

const styles = StyleSheet.create({
  captureContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    width: '100%',
  },
  // ...reuse styles from FoodHandlersHandwashingForm.js as needed...
  // (for brevity, not repeating all styles here)
});

export default ReadOnlyFormCapture;

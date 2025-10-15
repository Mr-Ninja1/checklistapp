import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

export default function ProductReleasePresentational({ payload }) {
  if (!payload) return null;
  const rows = payload.formData || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><Image source={require('../../assets/logo.png')} style={styles.logo} /><Text style={styles.title}>Product Release Form</Text></View>
      {rows.map(r => (
        <View key={r.id} style={styles.row}><Text style={styles.cell}>{r.productName} ({r.batchNumber})</Text><Text style={styles.cell}>{r.productionDate}</Text><Text style={styles.cell}>{r.expiryDate}</Text></View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container:{padding:12}, header:{flexDirection:'row',alignItems:'center'}, logo:{width:48,height:48,marginRight:8}, title:{fontWeight:'700'}, row:{flexDirection:'row',paddingVertical:8,borderBottomWidth:1,borderColor:'#eee'}, cell:{flex:1} });

import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { addFormHistory } from '../utils/formHistory';
import useExportFormAsPDF from '../utils/useExportFormAsPDF';
import useResponsive from '../utils/responsive';

// Days for the weekly shower log
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const NUM_ROWS = 10;

function getWeekInfo(date = new Date()){
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d.setDate(diff));
  const days = [];
  for(let i=0;i<7;i++){ const nd = new Date(sunday); nd.setDate(sunday.getDate()+i); days.push(nd); }
  return { days, weekStart: days[0].toLocaleDateString('en-US',{month:'2-digit',day:'2-digit'}).replace('/','.'), monthName: days[0].toLocaleString('default',{month:'long'}), year: days[0].getFullYear().toString() };
}

function getFormattedIssueDate(date = new Date()){
  return date.toLocaleDateString('en-US',{month:'2-digit',year:'numeric'});
}

function createEmptyRow(){
  const daily = {};
  DAY_NAMES.forEach(d => { daily[d.toLowerCase()] = { time:'', sign:'' }; });
  return { fullName:'', jobTitle:'', dailyLog: daily, supSign: '' };
}

export default function FoodHandlersDailyShoweringForm(){
  const { ref } = useExportFormAsPDF();
  const resp = useResponsive();
  const [exporting, setExporting] = useState(false);
  const [weekInfo, setWeekInfo] = useState(getWeekInfo());
  const [docNo, setDocNo] = useState('');
  const [issueDate, setIssueDate] = useState(getFormattedIssueDate());
  const [reviewDate, setReviewDate] = useState('');
  const [compilerName, setCompilerName] = useState('');
  const [approverName, setApproverName] = useState('');
  const [versionNo, setVersionNo] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('');

  const [rows, setRows] = useState(Array.from({length:NUM_ROWS}, ()=>createEmptyRow()));

  useEffect(()=>{
    const id = setInterval(()=> setWeekInfo(getWeekInfo()), 60000);
    return ()=> clearInterval(id);
  },[]);

  const updateCell = (rowIdx, field, value) => {
    setRows(prev => prev.map((r,i)=> i===rowIdx ? {...r, [field]: value} : r));
  };

  const updateDaily = (rowIdx, dayKey, field, value) => {
    setRows(prev => prev.map((r,i)=>{
      if(i!==rowIdx) return r;
      return { ...r, dailyLog: { ...r.dailyLog, [dayKey]: { ...r.dailyLog[dayKey], [field]: value } } };
    }));
  };

  const addRow = ()=> setRows(prev=>[...prev, createEmptyRow()]);

  const handleSave = async ()=>{
    const filled = rows.filter(r=> r.fullName || r.jobTitle || Object.values(r.dailyLog).some(d=> d.time || d.sign) );
    if(filled.length===0){ Alert.alert('Empty','Please fill some entries before saving'); return; }
    setExporting(true);
    try{
      const meta = { title: 'Food Handlers Daily Showering Log', date: weekInfo.weekStart, month: weekInfo.monthName, year: weekInfo.year, docNo, issueDate, reviewDate };
      await addFormHistory({ title: meta.title, date: meta.date, shift: '', savedAt: Date.now(), meta: { ...meta, rows: filled } });
      setExporting(false);
      Alert.alert('Saved','Form saved to history. You can export it from Saved Forms.');
    }catch(e){
      setExporting(false);
      console.warn('save failed',e);
      Alert.alert('Error','Failed to save form.');
    }
  };

  const dyn = {
    padding: resp.s(18),
    logo: resp.s(44),
    titleFont: resp.ms(18),
    inputH: resp.s(36),
    nameW: resp.s(160),
    jobW: resp.s(120),
    dayW: resp.s(72),
    signW: resp.s(90),
    btnPH: resp.s(28),
    btnPV: resp.s(12),
  };

  return (
    <>
      <Spinner visible={exporting} textContent={'Saving...'} textStyle={{color:'#fff'}} />
      <ScrollView contentContainerStyle={[styles.container, { padding: dyn.padding }]} ref={ref} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
        <View style={styles.headerRow}>
          <Image source={require('../assets/logo.png')} style={{ width: dyn.logo, height: dyn.logo, marginRight: 12, borderRadius: 8 }} resizeMode="contain" />
          <Text style={[styles.title, { fontSize: dyn.titleFont }]}>FOOD HANDLERS DAILY SHOWERING LOG</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}><Text style={styles.label}>Doc No:</Text>
            <TextInput style={[styles.input,{height:dyn.inputH}]} value={docNo} onChangeText={setDocNo} placeholder="BBN-SHEQ..." />
          </View>
          <View style={styles.metaItem}><Text style={styles.label}>Issue Date:</Text>
            <TextInput style={[styles.input,{height:dyn.inputH}]} value={issueDate} onChangeText={setIssueDate} /></View>
          <View style={styles.metaItem}><Text style={styles.label}>Review Date:</Text>
            <TextInput style={[styles.input,{height:dyn.inputH}]} value={reviewDate} onChangeText={setReviewDate} /></View>
        </View>

        <View style={styles.metaRow}>
          <View style={{flex:1}}><Text style={styles.label}>Compiled By:</Text>
            <TextInput style={[styles.input,{height:dyn.inputH}]} value={compilerName} onChangeText={setCompilerName} /></View>
          <View style={{flex:1, marginLeft:8}}><Text style={styles.label}>Approved By:</Text>
            <TextInput style={[styles.input,{height:dyn.inputH}]} value={approverName} onChangeText={setApproverName} /></View>
          <View style={{width:90, marginLeft:8}}><Text style={styles.label}>Ver:</Text>
            <TextInput style={[styles.input,{height:dyn.inputH}]} value={versionNo} onChangeText={setVersionNo} /></View>
        </View>

        {/* Week header */}
        <View style={{marginTop:12, marginBottom:6}}>
          <Text style={{fontWeight:'600'}}>Week Start: {weekInfo.weekStart}  •  Month: {weekInfo.monthName}  •  Year: {weekInfo.year}</Text>
        </View>

  <ScrollView horizontal style={{marginTop:12}} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
          <View>
            <View style={[styles.tableHeader,{minHeight:36}]}> 
              <Text style={[styles.th,{width:40}]}>S/N</Text>
              <Text style={[styles.th,{minWidth:dyn.nameW,width:dyn.nameW}]}>Full Name</Text>
              <Text style={[styles.th,{minWidth:dyn.jobW,width:dyn.jobW}]}>Job Title</Text>
              {DAY_NAMES.map(d=> (
                <View key={d} style={{flexDirection:'row'}}>
                  <Text style={[styles.th,{minWidth:dyn.dayW,width:dyn.dayW}]}>Time</Text>
                  <Text style={[styles.th,{minWidth:dyn.signW,width:dyn.signW}]}>Sign</Text>
                </View>
              ))}
              <Text style={[styles.th,{minWidth:dyn.signW,width:dyn.signW}]}>Sup Sign</Text>
            </View>

            {rows.map((r,ri)=> (
              <View key={ri} style={styles.tableRow}>
                <Text style={[styles.td,{width:40,textAlign:'center'}]}>{ri+1}</Text>
                <TextInput value={r.fullName} onChangeText={t=>updateCell(ri,'fullName',t)} placeholder="Full Name" style={[styles.tdInput,{minWidth:dyn.nameW,width:dyn.nameW}]} />
                <TextInput value={r.jobTitle} onChangeText={t=>updateCell(ri,'jobTitle',t)} placeholder="Job Title" style={[styles.tdInput,{minWidth:dyn.jobW,width:dyn.jobW}]} />
                {DAY_NAMES.map(d=> (
                  <View key={d} style={{flexDirection:'row'}}>
                    <TextInput value={r.dailyLog[d.toLowerCase()].time} onChangeText={t=>updateDaily(ri,d.toLowerCase(),'time',t)} placeholder="--:--" style={[styles.tdInput,{minWidth:dyn.dayW,width:dyn.dayW}]} />
                    <TextInput value={r.dailyLog[d.toLowerCase()].sign} onChangeText={t=>updateDaily(ri,d.toLowerCase(),'sign',t)} placeholder="Init" style={[styles.tdInput,{minWidth:dyn.signW,width:dyn.signW}]} />
                  </View>
                ))}
                <TextInput value={r.supSign} onChangeText={t=>updateCell(ri,'supSign',t)} placeholder="Sup Sign" style={[styles.tdInput,{minWidth:dyn.signW,width:dyn.signW}]} />
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.addBtn} onPress={addRow}><Text style={styles.addBtnText}>+ Add Line</Text></TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex:1, backgroundColor:'#f6fdff' },
  container: { backgroundColor:'#fff' },
  headerRow: { flexDirection:'row', alignItems:'center', marginBottom:8 },
  title: { fontSize:18, fontWeight:'700', color:'#185a9d' },
  metaRow: { flexDirection:'row', alignItems:'center', marginTop:8, gap:8 },
  metaItem: { flex:1, marginRight:8 },
  label: { fontSize:12, fontWeight:'600', color:'#185a9d' },
  input: { borderWidth:1, borderColor:'#e5eef0', backgroundColor:'#f9fafb', borderRadius:8, paddingHorizontal:8, marginTop:6 },
  tableHeader: { flexDirection:'row', backgroundColor:'#eef6f8', borderTopWidth:1, borderBottomWidth:1, borderColor:'#ddd', padding:6 },
  th: { fontWeight:'700', fontSize:12, padding:6, textAlign:'center' },
  tableRow: { flexDirection:'row', borderBottomWidth:1, borderColor:'#f0f0f0', alignItems:'center' },
  td: { padding:6, fontSize:12, borderRightWidth:1, borderColor:'#f5f5f5' },
  tdInput: { padding:6, fontSize:12, borderRightWidth:1, borderColor:'#f5f5f5', backgroundColor:'#fff' },
  footerRow: { flexDirection:'row', justifyContent:'space-between', padding:16, backgroundColor:'#fff', borderTopWidth:1, borderColor:'#eee' },
  addBtn: { backgroundColor:'#eee', paddingVertical:10, paddingHorizontal:16, borderRadius:8 },
  addBtnText: { fontWeight:'700', color:'#333' },
  saveBtn: { backgroundColor:'#185a9d', paddingVertical:10, paddingHorizontal:20, borderRadius:8 },
  saveBtnText: { color:'#fff', fontWeight:'700' },
});

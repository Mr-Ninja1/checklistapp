import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { getDraft, setDraft, removeDraft } from '../utils/formDrafts';
import { addFormHistory } from '../utils/formHistory';

const DRAFT_KEY = 'customer_satisfaction_questionnaire_draft';

const SECTIONS = [
  { title: 'RELIABILITY', questions: [
    'Was our service delivered quickly and accurately?',
    'Was your meal correct as per your order?',
    'Was the food of good quality?'
  ]},
  { title: 'ASSURANCE', questions: [
    'Was our service personnel polite, friendly and helpful?'
  ]},
  { title: 'TANGIBLES', questions: [
    'Were the tables chairs and floors clean?',
    'Was the shop clean at the time of your visit?'
  ]},
  { title: 'EMPATHY', questions: [
    'Did the service by our personnel make you feel you were given individual attention?'
  ]},
  { title: 'RESPONSIVENESS', questions: [
    'How fast was the service? At the till?'
  ]},
];

const initialState = () => ({
  companyName: 'Bravo',
  companySubtitle: 'Customer Feedback',
  subject: 'Customer Satisfaction Questionnaire',
  issueDate: '',
  formDate: '',
  formTime: '',
  compiledBy: '',
  sections: SECTIONS.map((s, si) => ({
    title: s.title,
    questions: s.questions.map((q, qi) => ({ id: `${si}-${qi}`, text: q, rating: '' }))
  })),
  mealWithin15: '',
  mealDelay: '',
  mealOrdered: '',
  customerName: '',
  contactInfo: '',
  otherComment: '',
  waiterName: '',
  cashierName: '',
  chefName: '',
});

export default function CustomerSatisfactionQuestionnaire() {
  const [state, setState] = useState(initialState());
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getDraft(DRAFT_KEY);
        const base = initialState();
        if (d && mounted) {
          // Merge with base to ensure required structure (sections etc.) exists
          const merged = { ...base, ...d, sections: d.sections || base.sections };
          setState(merged);
        } else if (mounted) {
          // No draft found: set initial state with today's date
          const dNow = new Date();
          const dd = String(dNow.getDate()).padStart(2, '0');
          const mm = String(dNow.getMonth() + 1).padStart(2, '0');
          const yyyy = dNow.getFullYear();
          const hh = String(dNow.getHours()).padStart(2, '0');
          const min = String(dNow.getMinutes()).padStart(2, '0');
          setState(prev => ({ ...base, issueDate: `${dd}/${mm}/${yyyy}`, formDate: `${dd}/${mm}/${yyyy}`, formTime: `${hh}:${min}` }));
        }
      } catch (e) { console.warn('load draft', e); }
    })();
    return () => { mounted = false; };
  }, []);

  // Keep the displayed time up-to-date (update every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setState(prev => ({ ...prev, formTime: `${hh}:${min}` }));
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setDraft(DRAFT_KEY, state), 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state]);

  const setField = (k, v) => setState(prev => ({ ...prev, [k]: v }));
  const setSectionQuestion = (sectionIndex, questionIndex, key, val) => setState(prev => ({
    ...prev,
    sections: prev.sections.map((s, si) => si === sectionIndex ? {
      ...s,
      questions: s.questions.map((q, qi) => qi === questionIndex ? { ...q, [key]: val } : q)
    } : s)
  }));

  const handleSubmit = async () => {
    const anyRated = Array.isArray(state.sections) && state.sections.some(s => s.questions && s.questions.some(q => q.rating && String(q.rating).trim() !== ''));
    if (!anyRated) { Alert.alert('Empty', 'Please rate at least one question before submitting.'); return; }
    setBusy(true);
    try {
      await addFormHistory({ title: state.subject, savedAt: Date.now(), data: state });
      await removeDraft(DRAFT_KEY);
      Alert.alert('Saved', 'Thank you for your feedback');
      setState(initialState());
    } catch (e) { console.warn(e); Alert.alert('Error', 'Failed to submit'); }
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainContainer}>

          <View style={styles.header}>
            {(() => { try { const logo = require('../assets/logo.png'); return <Image source={logo} style={styles.logo} resizeMode="contain"/>; } catch (e) { return <Text style={styles.logoPlaceholder}>Bravo</Text>; } })()}
            <View style={styles.headerMeta}>
              <TextInput style={styles.companyInput} value={state.companyName} onChangeText={v=>setField('companyName',v)} />
              <Text style={styles.subject}>{state.subject}</Text>
              <View style={styles.headerRow}>
                <Text style={styles.metaLabel}>Date:</Text>
                <TextInput
                  style={[styles.metaValue, styles.dateInput]}
                  value={state.formDate}
                  onChangeText={v => setField('formDate', v)}
                  placeholder="dd/mm/yyyy"
                />
                <Text style={[styles.metaLabel,{marginLeft:12}]}>Time:</Text>
                <Text style={styles.metaValue}>{state.formTime}</Text>
              </View>
              <View style={styles.headerFields}>
                <TextInput style={[styles.smallInput, styles.headerField]} value={state.customerName} onChangeText={v=>setField('customerName',v)} placeholder="Customer name" />
                <TextInput style={[styles.smallInput, styles.headerField]} value={state.contactInfo} onChangeText={v=>setField('contactInfo',v)} placeholder="Contact number / email" />
                <TextInput style={[styles.smallInput, styles.headerField]} value={state.mealOrdered} onChangeText={v=>setField('mealOrdered',v)} placeholder="Meal ordered" />
                <TextInput style={[styles.smallInput, styles.headerField]} value={state.compiledBy} onChangeText={v=>setField('compiledBy',v)} placeholder="Compiled by" />
              </View>
            </View>
          </View>

          <View style={styles.questionsList}>
            {state.sections.map((sec, si) => (
              <View key={`sec-${si}`} style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                {sec.questions.map((q, qi) => (
                  <View key={`q-${q.id}`} style={styles.questionRowInline}>
                    <Text style={styles.questionText}>{q.text}</Text>
                    <TextInput
                      style={styles.ratingInputBottom}
                      value={q.rating}
                      onChangeText={v => setSectionQuestion(si, qi, 'rating', v)}
                      maxLength={10}
                      placeholder=""
                    />
                  </View>
                ))}
              </View>
            ))}

            {/* Additional meal timing and yes/no field as on the scanned form */}
            <View style={styles.mealRow}>
              <Text style={styles.mealLabel}>Did you get your meal within 15mins? YES/NO</Text>
              <TextInput style={styles.shortInput} value={state.mealWithin15 || ''} onChangeText={v => setField('mealWithin15', v)} placeholder="YES / NO" />
            </View>
            <View style={styles.mealRow}>
              <Text style={styles.mealLabel}>How long did your food take to come?</Text>
              <TextInput style={styles.shortInput} value={state.mealDelay || ''} onChangeText={v => setField('mealDelay', v)} placeholder="e.g. 10 minutes" />
            </View>

          </View>

          {/* Any other comment large box and staff name lines */}
          <View style={styles.otherCommentBox}>
            <Text style={styles.otherCommentLabel}>Any other comment:</Text>
            <TextInput style={styles.otherCommentInput} value={state.otherComment || ''} onChangeText={v => setField('otherComment', v)} multiline />
          </View>

          <View style={styles.staffRow}>
            <View style={styles.staffCol}>
              <Text style={styles.staffLabel}>Name of Waiter/Waitress:</Text>
              <TextInput style={styles.staffInput} value={state.waiterName || ''} onChangeText={v => setField('waiterName', v)} />
            </View>
            <View style={styles.staffCol}>
              <Text style={styles.staffLabel}>Name of Cashier:</Text>
              <TextInput style={styles.staffInput} value={state.cashierName || ''} onChangeText={v => setField('cashierName', v)} />
            </View>
            <View style={styles.staffCol}>
              <Text style={styles.staffLabel}>Name of Chef:</Text>
              <TextInput style={styles.staffInput} value={state.chefName || ''} onChangeText={v => setField('chefName', v)} />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.draftBtn]} onPress={() => setDraft(DRAFT_KEY, state)} disabled={busy}><Text style={styles.btnText}>Save Draft</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={handleSubmit} disabled={busy}><Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit'}</Text></TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#f9f9f9'},
  scrollContainer:{padding:12},
  mainContainer:{backgroundColor:'#fff', borderWidth:1, borderColor:'#ddd', padding:12},
  header:{flexDirection:'row', alignItems:'center', marginBottom:12},
  logo:{width:64, height:64, marginRight:12},
  logoPlaceholder:{width:64,height:64,marginRight:12,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#eee'},
  headerMeta:{flex:1},
  companyInput:{fontSize:18,fontWeight:'700',color:'#185a9d'},
  subject:{fontSize:16,fontWeight:'700',marginTop:4,marginBottom:6},
  smallInput:{borderBottomWidth:1,borderColor:'#ddd',paddingVertical:6},
  headerRow:{flexDirection:'row',alignItems:'center',marginBottom:6},
  metaLabel:{fontSize:12,fontWeight:'700',color:'#333',marginRight:6},
  metaValue:{fontSize:12,color:'#333'},
  headerFields:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:8},
  headerField:{flexBasis:'48%',marginBottom:6},
  dateInput:{borderWidth:1,borderColor:'#000',paddingVertical:6,paddingHorizontal:8,borderRadius:6,backgroundColor:'#fff',color:'#000',minWidth:120},

  questionsList:{},
  questionRow:{borderBottomWidth:1,borderColor:'#eee',paddingVertical:10},
  qLabel:{fontWeight:'700',marginBottom:6},
  ratingRow:{flexDirection:'row',alignItems:'center',marginBottom:6},
  ratingLabel:{marginRight:8},
  ratingInput:{width:44,borderWidth:1,borderColor:'#ccc',padding:6,textAlign:'center'},
  ratingInputBottom:{width:64,paddingVertical:6,paddingHorizontal:6,textAlign:'center',borderWidth:1,borderColor:'#000',borderRadius:6,backgroundColor:'#fff',color:'#000',fontSize:16,marginLeft:6,alignSelf:'center'},
  commentInput:{borderWidth:1,borderColor:'#eee',padding:8,minHeight:40,textAlignVertical:'top',backgroundColor:'#fff'},
  sectionBlock:{marginBottom:10},
  sectionTitle:{fontWeight:'800',marginBottom:8,letterSpacing:0.6},
  questionRowInline:{flexDirection:'row',alignItems:'center',paddingVertical:6,borderBottomWidth:0,flexWrap:'wrap'},
  questionText:{flexShrink:1,flexBasis:'auto',maxWidth:'72%',fontSize:15,color:'#222',marginRight:6,lineHeight:20},

  mealRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:6},
  mealLabel:{flex:1,fontSize:14,marginRight:12},
  shortInput:{width:160,borderWidth:1,borderColor:'#000',paddingVertical:8,paddingHorizontal:8,borderRadius:6,backgroundColor:'#fff',color:'#000'},

  otherCommentBox:{borderWidth:1,borderColor:'#ccc',padding:10,marginTop:12,backgroundColor:'#fff',borderRadius:6},
  otherCommentLabel:{fontWeight:'700',marginBottom:6},
  otherCommentInput:{minHeight:80,borderWidth:1,borderColor:'#000',padding:10,textAlignVertical:'top',backgroundColor:'#fff',color:'#000',borderRadius:6},

  staffRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12},
  staffCol:{flex:1,marginRight:8},
  staffLabel:{fontSize:12,marginBottom:6,color:'#333'},
  staffInput:{borderWidth:1,borderColor:'#000',paddingVertical:8,paddingHorizontal:8,borderRadius:6,backgroundColor:'#fff',color:'#000'},

  buttonRow:{flexDirection:'row',justifyContent:'flex-end',gap:8,marginTop:12},
  btn:{paddingVertical:10,paddingHorizontal:16,borderRadius:8},
  draftBtn:{backgroundColor:'#f6c342'},
  submitBtn:{backgroundColor:'#3b82f6'},
  btnText:{color:'#fff',fontWeight:'700'},
});

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import useFormSave from '../hooks/useFormSave';
import NotificationModal from '../components/NotificationModal';
import LoadingOverlay from '../components/LoadingOverlay';
import { addFormHistory } from '../utils/formHistory';

// --- Child Components ---

const Cell = ({ children, style, multiLine = false }) => (
  <View style={[styles.cell, style, multiLine && styles.multiLineCell]}>
    {typeof children === 'string' ? <Text style={styles.cellText}>{children}</Text> : children}
  </View>
);

const InputCell = ({ value, onChangeText, style, placeholder = '' }) => (
  <View style={[styles.cell, style]}>
    <TextInput
      style={styles.cellInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
    />
  </View>
);

const Header = React.memo(({ docRef, issueDate }) => (
    <View style={styles.headerContainer}>
      <Cell style={styles.headerTitleCell} multiLine>
        <Text style={styles.boldText}>FOOD PRODUCTION AND SERVICE VISITORS</Text>
      </Cell>
      <View style={styles.headerRefDateBlock}>
        <Cell style={styles.refCell}>
          <Text style={styles.boldText}>Doc. Ref: </Text>
          <Text>{docRef}</Text>
        </Cell>
        <Cell style={styles.issueDateCell}>
          <Text style={styles.boldText}>Issue Date: </Text>
          <Text>{issueDate}</Text>
        </Cell>
      </View>
    </View>
));

const SiteDateBlock = React.memo(({ site, setSite, section, setSection, month, setMonth, year, setYear }) => (
    <>
      <View style={styles.row}>
        <Cell style={styles.siteMonthHeader}><Text style={styles.boldText}>SITE</Text></Cell>
        <Cell style={styles.sectionYearHeader}><Text style={styles.boldText}>SECTION/DEPARTMENT</Text></Cell>
      </View>
      <View style={styles.row}>
        <InputCell style={styles.siteMonthInput} value={site} onChangeText={setSite} />
        <InputCell style={styles.sectionYearInput} value={section} onChangeText={setSection} />
      </View>
      <View style={styles.row}>
        <Cell style={styles.siteMonthHeader}><Text style={styles.boldText}>MONTH</Text></Cell>
        <Cell style={styles.sectionYearHeader}><Text style={styles.boldText}>YEAR</Text></Cell>
      </View>
      <View style={styles.row}>
        <InputCell style={styles.siteMonthInput} value={month} onChangeText={setMonth} />
        <InputCell style={styles.sectionYearInput} value={year} onChangeText={setYear} />
      </View>
    </>
));

const ManagerSignatureBlock = React.memo(({ siteManager, setSiteManager, verifiedManager, setVerifiedManager }) => (
    <>
      <View style={styles.row}>
        <Cell style={styles.sigManagerHeader}><Text style={styles.boldText}>SITE MANAGER NAME & SIGNATURE</Text></Cell>
        <Cell style={styles.sigVerifiedHeader}><Text style={styles.boldText}>VERIFIED BY HSEQ MANAGER</Text></Cell>
      </View>
      <View style={styles.row}>
        <InputCell style={styles.sigManagerInput} value={siteManager} onChangeText={setSiteManager} />
        <InputCell style={styles.sigVerifiedInput} value={verifiedManager} onChangeText={setVerifiedManager} />
      </View>
    </>
));

const HealthQuestion = React.memo(({ question, isParent = false, answerValue, onAnswerChange }) => (
    <View style={styles.row}>
      <Cell style={[styles.healthQCell, isParent && styles.healthQParentCell]} multiLine>
        {question}
      </Cell>
      <InputCell
        style={[styles.healthACell, isParent && styles.healthAParentCell]}
        value={answerValue}
        onChangeText={onAnswerChange}
        placeholder={isParent ? 'A/B' : 'Yes/No'}
      />
    </View>
));

const HealthSubQuestion = React.memo(({ question, answerValue, onAnswerChange }) => (
    <View style={styles.row}>
      <Cell style={styles.healthQSubCell} multiLine>
        {question}
      </Cell>
      <InputCell style={styles.healthASubCell} value={answerValue} onChangeText={onAnswerChange} />
    </View>
));

const HostCheck = React.memo(({ check, answerValue, onAnswerChange }) => (
    <View style={styles.row}>
      <Cell style={styles.hostCheckCell} multiLine>
        {check}
      </Cell>
      <InputCell
        style={styles.hostAnswerCell}
        value={answerValue}
        onChangeText={onAnswerChange}
        placeholder="Y/N"
      />
    </View>
));

const HealthCheckBlock = React.memo(({ healthAnswers, updateHealthAnswer }) => (
    <>
      <View style={styles.healthQuestionGroup}>
        <HealthQuestion
          question="Ask if visitor is unwell or if the visitor has been unwell at home?"
          answerValue={healthAnswers.unwell}
          onAnswerChange={v => updateHealthAnswer('unwell', v)}
        />
        <HealthQuestion
          question="Ask if visitor is taking/has taken any medicine - Medicine refers to ALL medications e.g. Company doctor prescriptions, local medicines from herbalists, any self-treatment etc."
          answerValue={healthAnswers.medicine}
          onAnswerChange={v => updateHealthAnswer('medicine', v)}
        />
        <HealthQuestion
          question="Ask if visitor has taken any banned substances e.g. marijuana, hashish etc"
          answerValue={healthAnswers.bannedSubstances}
          onAnswerChange={v => updateHealthAnswer('bannedSubstances', v)}
        />
        <HealthQuestion
          question="Ask if visitor has any symptoms or suffering from?"
          isParent
          answerValue={healthAnswers.symptoms}
          onAnswerChange={v => updateHealthAnswer('symptoms', v)}
        />
  <HealthSubQuestion question="Infection of the ears, nose, throat, eyes, teeth or chest" answerValue={healthAnswers.infectionEarsNoseThroat} onAnswerChange={v => updateHealthAnswer('infectionEarsNoseThroat', v)} />
  <HealthSubQuestion question="Flu - like infections" answerValue={healthAnswers.fluLike} onAnswerChange={v => updateHealthAnswer('fluLike', v)} />
  <HealthSubQuestion question="Skin infections" answerValue={healthAnswers.skinInfections} onAnswerChange={v => updateHealthAnswer('skinInfections', v)} />
  <HealthSubQuestion question="Vomiting" answerValue={healthAnswers.vomiting} onAnswerChange={v => updateHealthAnswer('vomiting', v)} />
  <HealthSubQuestion question="Diarrhoea" answerValue={healthAnswers.diarrhoea} onAnswerChange={v => updateHealthAnswer('diarrhoea', v)} />
  <HealthSubQuestion question="Jaundice" answerValue={healthAnswers.jaundice} onAnswerChange={v => updateHealthAnswer('jaundice', v)} />
        <HealthQuestion
          question="Ask the visitor if he has been in contact to their knowledge with any person with the following"
          isParent
          answerValue={healthAnswers.contactWithDisease}
          onAnswerChange={v => updateHealthAnswer('contactWithDisease', v)}
        />
  <HealthSubQuestion question="Typhoid" answerValue={healthAnswers.typhoid} onAnswerChange={v => updateHealthAnswer('typhoid', v)} />
  <HealthSubQuestion question="Paratyphoid" answerValue={healthAnswers.paratyphoid} onAnswerChange={v => updateHealthAnswer('paratyphoid', v)} />
  <HealthSubQuestion question="Dysentery" answerValue={healthAnswers.dysentery} onAnswerChange={v => updateHealthAnswer('dysentery', v)} />
  <HealthSubQuestion question="Hepatitis" answerValue={healthAnswers.hepatitis} onAnswerChange={v => updateHealthAnswer('hepatitis', v)} />
  <HealthSubQuestion question="Any other infectious disease" answerValue={healthAnswers.otherInfectious} onAnswerChange={v => updateHealthAnswer('otherInfectious', v)} />
      </View>

      <View style={styles.healthCheckGroup}>
        <Cell style={styles.hostCheckInstructionCell} multiLine>
          <Text style={styles.boldText}>The host must ensure to check the following for each visitor?</Text>
        </Cell>
        <HostCheck
          check="All cuts, pimples and boils are covered with a waterproof dressing"
          answerValue={healthAnswers.cutsCovered}
          onAnswerChange={v => updateHealthAnswer('cutsCovered', v)}
        />
        <HostCheck
          check="Jewellery is in line with company policy"
          answerValue={healthAnswers.jewellery}
          onAnswerChange={v => updateHealthAnswer('jewellery', v)}
        />
        <HostCheck
          check="Chefs have a hat or hair net"
          answerValue={healthAnswers.hairnet}
          onAnswerChange={v => updateHealthAnswer('hairnet', v)}
        />
        <HostCheck
          check="The visitor is wearing their safety shoes"
          answerValue={healthAnswers.safetyShoes}
          onAnswerChange={v => updateHealthAnswer('safetyShoes', v)}
        />
        <HostCheck
          check="The visitor is newly dressed"
          answerValue={healthAnswers.neatlyDressed}
          onAnswerChange={v => updateHealthAnswer('neatlyDressed', v)}
        />
      </View>
    </>
));

const InstructionAndNoteBlock = React.memo(() => (
    <>
      <Cell style={styles.instructionCell} multiLine>
        <Text style={styles.instructionText}>
          If any visitor answers to A & B positively then they must be referred to the <Text style={styles.boldText}>Complex Manager</Text>
        </Text>
      </Cell>
      <Cell style={styles.instructionCell} multiLine>
        <Text style={styles.instructionText}>
          If any visitor does not comply with company policy (Section C), this must be rectified before they are allowed into the Food Production Area
        </Text>
      </Cell>
      <Cell style={styles.noteCell} multiLine>
        <Text style={styles.noteText}>
          <Text style={styles.boldText}>Note -</Text> The supervisor and the manager will be liable for the health of visitors and subordinates once they sign
        </Text>
      </Cell>
      <Cell style={styles.managerNoteCell} multiLine>
        <Text style={styles.noteText}>
          The form must be completed for each shift by the <Text style={styles.boldText}>Manager</Text>
        </Text>
      </Cell>
    </>
));

const VisitorsTable = React.memo(({ visitorEntries, updateVisitorEntry }) => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeaderRow}>
        <Cell style={styles.colName}><Text style={styles.colHeaderText}>NAME OF VISITOR</Text></Cell>
        <Cell style={styles.colAddress}><Text style={styles.colHeaderText}>ADDRESS</Text></Cell>
        <Cell style={styles.colContact}><Text style={styles.colHeaderText}>CONTACT NO.</Text></Cell>
        <Cell style={styles.colPurpose}><Text style={styles.colHeaderText}>PURPOSE OF VISIT</Text></Cell>
        <Cell style={styles.colTime}><Text style={styles.colHeaderText}>TIME IN</Text></Cell>
        <Cell style={styles.colTime}><Text style={styles.colHeaderText}>TIME OUT</Text></Cell>
        <Cell style={styles.colAuth}><Text style={styles.colHeaderText}>AUTHORISE BY</Text></Cell>
      </View>

      {visitorEntries.map((entry, idx) => (
        <View key={idx} style={styles.tableRow}>
          <InputCell style={styles.colName} value={entry.name} onChangeText={t => updateVisitorEntry(idx, 'name', t)} />
          <InputCell style={styles.colAddress} value={entry.address} onChangeText={t => updateVisitorEntry(idx, 'address', t)} />
          <InputCell style={styles.colContact} value={entry.contact} onChangeText={t => updateVisitorEntry(idx, 'contact', t)} />
          <InputCell style={styles.colPurpose} value={entry.purpose} onChangeText={t => updateVisitorEntry(idx, 'purpose', t)} />
          <InputCell style={styles.colTime} value={entry.timeIn} onChangeText={t => updateVisitorEntry(idx, 'timeIn', t)} />
          <InputCell style={styles.colTime} value={entry.timeOut} onChangeText={t => updateVisitorEntry(idx, 'timeOut', t)} />
          <InputCell style={styles.colAuth} value={entry.authority} onChangeText={t => updateVisitorEntry(idx, 'authority', t)} />
        </View>
      ))}
    </View>
));

// --- Main Component ---

export default function VisitorsLogBook() {
  const initialVisitorLog = Array.from({ length: 5 }, () => ({ name: '', address: '', contact: '', purpose: '', timeIn: '', timeOut: '', authority: '' }));
  const [visitorEntries, setVisitorEntries] = useState(initialVisitorLog);
  const [site, setSite] = useState('');
  const [section, setSection] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [siteManager, setSiteManager] = useState('');
  const [verifiedManager, setVerifiedManager] = useState('');

  const initialHealthAnswers = {
    unwell: '',
    medicine: '',
    bannedSubstances: '',
    symptoms: '',
    contactWithDisease: '',
    cutsCovered: '',
    jewellery: '',
    hairnet: '',
    safetyShoes: '',
    neatlyDressed: '',
    infectionEarsNoseThroat: '',
    fluLike: '',
    skinInfections: '',
    vomiting: '',
    diarrhoea: '',
    jaundice: '',
    typhoid: '',
    paratyphoid: '',
    dysentery: '',
    hepatitis: '',
    otherInfectious: '',
  };
  const [healthAnswers, setHealthAnswers] = useState(initialHealthAnswers);

  // issue date will be generated at save time to ensure it always reflects current system date
  const formatIssueDate = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const updateVisitorEntry = useCallback((index, field, value) => {
    setVisitorEntries(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }, []);

  const updateHealthAnswer = useCallback((field, value) => {
    setHealthAnswers(prev => ({ ...prev, [field]: value }));
  }, []);

  const docRef = "BBN-SHEQ-R 23a";

  const buildPayload = (status = 'draft') => {
    const currentIssueDate = formatIssueDate();
    return {
      formType: 'VisitorsLogBook',
      title: 'Visitors Log Book',
      metadata: { docRef, issueDate: currentIssueDate, site, section, month, year, siteManager, verifiedManager },
      formData: visitorEntries,
      healthAnswers,
      layoutHints: {},
      savedAt: new Date().toISOString(),
      status,
    };
  };

  const { handleSaveDraft, handleSubmit, isSaving, showNotification, notificationMessage, setShowNotification } = useFormSave({ buildPayload, draftId: 'VisitorsLogBook_draft', clearOnSubmit: () => {
    setVisitorEntries(initialVisitorLog);
    setSite(''); setSection(''); setMonth(''); setYear(''); setSiteManager(''); setVerifiedManager('');
    setHealthAnswers(initialHealthAnswers);
  } });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainScrollContent}>
        <View style={styles.bravoTitle}><Text style={styles.bravoTitleText}>BRAVO BRANDS VISITORS LOG BOOK</Text></View>
        <Header docRef={docRef} issueDate={issueDate} />
        <SiteDateBlock site={site} setSite={setSite} section={section} setSection={setSection} month={month} setMonth={setMonth} year={year} setYear={setYear} />
        <ManagerSignatureBlock siteManager={siteManager} setSiteManager={setSiteManager} verifiedManager={verifiedManager} setVerifiedManager={setVerifiedManager} />
        {/* Health checks as a bordered table */}
        <View style={styles.healthTable}>
          <HealthCheckBlock healthAnswers={healthAnswers} updateHealthAnswer={updateHealthAnswer} />
        </View>
        <InstructionAndNoteBlock />
        <VisitorsTable visitorEntries={visitorEntries} updateVisitorEntry={updateVisitorEntry} />
        
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12, gap: 8 }}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#f6c342' }]}
            onPress={handleSaveDraft}
            disabled={isSaving}
          >
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{'Save Draft'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#3b82f6' }]}
            onPress={async () => {
              try {
                await handleSubmit();
                try {
                  const payloadSnapshot = buildPayload('submitted');
                  // Register a history snapshot that includes the full payload so the saved form
                  // can be rendered identically by SavedFormRenderer even before file load.
                  addFormHistory({ title: payloadSnapshot.title || 'Visitors Log Book', date: payloadSnapshot.metadata?.issueDate, savedAt: Date.now(), meta: { payload: payloadSnapshot } })
                    .catch(e => console.warn('addFormHistory failed', e));
                } catch (e) {
                  console.warn('Failed to build payload snapshot for history', e);
                }
              } catch (e) { console.warn('submit failed', e); }
            }}
            disabled={isSaving}
          >
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{isSaving ? 'Submitting...' : 'Submit Checklist'}</Text>
          </TouchableOpacity>
        </View>
        <NotificationModal visible={showNotification} message={notificationMessage} onClose={() => setShowNotification(false)} />
        <LoadingOverlay visible={isSaving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const commonBorder = {
  borderWidth: 1,
  borderColor: '#000',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  mainScrollContent: { padding: 8, paddingBottom: 100 },
  row: { flexDirection: 'row' },
  boldText: { fontWeight: '700' },
  bravoTitle: { ...commonBorder, borderBottomWidth: 0, padding: 4, backgroundColor: '#eee' },
  bravoTitleText: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  headerContainer: { flexDirection: 'row' },
  headerTitleCell: { ...commonBorder, flex: 1, paddingVertical: 8, backgroundColor: '#eee', borderRightWidth: 0, alignItems: 'center', justifyContent: 'center' },
  headerRefDateBlock: { width: 200 },
  refCell: { ...commonBorder, height: 25, borderBottomWidth: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  issueDateCell: { ...commonBorder, height: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  siteMonthHeader: { ...commonBorder, flex: 0.5, borderRightWidth: 0, backgroundColor: '#eee', height: 20, justifyContent: 'center' },
  sectionYearHeader: { ...commonBorder, flex: 0.5, backgroundColor: '#eee', height: 20, justifyContent: 'center' },
  siteMonthInput: { ...commonBorder, flex: 0.5, borderRightWidth: 0, borderTopWidth: 0, minHeight: 30 },
  sectionYearInput: { ...commonBorder, flex: 0.5, borderTopWidth: 0, minHeight: 30 },
  sigManagerHeader: { ...commonBorder, flex: 0.5, borderRightWidth: 0, backgroundColor: '#eee', height: 25, justifyContent: 'center' },
  sigVerifiedHeader: { ...commonBorder, flex: 0.5, backgroundColor: '#eee', height: 25, justifyContent: 'center' },
  sigManagerInput: { ...commonBorder, flex: 0.5, borderRightWidth: 0, borderTopWidth: 0, minHeight: 40 },
  sigVerifiedInput: { ...commonBorder, flex: 0.5, borderTopWidth: 0, minHeight: 40 },
  healthQuestionGroup: { marginTop: 8 },
  healthCheckGroup: { marginTop: 0 },
  healthQCell: { ...commonBorder, flex: 0.8, borderRightWidth: 0, paddingLeft: 4, minHeight: 25, borderTopWidth: 0, justifyContent: 'center' },
  healthQParentCell: { backgroundColor: '#eee' },
  healthACell: { ...commonBorder, flex: 0.2, borderTopWidth: 0, minHeight: 25 },
  healthAParentCell: { backgroundColor: '#eee' },
  healthQSubCell: { ...commonBorder, flex: 0.8, borderRightWidth: 0, paddingLeft: 20, minHeight: 20, borderTopWidth: 0, justifyContent: 'center' },
  healthASubCell: { ...commonBorder, flex: 0.2, minHeight: 20, borderTopWidth: 0 },
  hostCheckInstructionCell: { ...commonBorder, backgroundColor: '#eee', minHeight: 25, justifyContent: 'center' },
  hostCheckCell: { ...commonBorder, flex: 0.8, borderRightWidth: 0, paddingLeft: 4, minHeight: 25, borderTopWidth: 0, justifyContent: 'center' },
  hostAnswerCell: { ...commonBorder, flex: 0.2, minHeight: 25, borderTopWidth: 0 },
  instructionCell: { ...commonBorder, borderTopWidth: 0, backgroundColor: '#ffe8e8', minHeight: 25, justifyContent: 'center' },
  instructionText: { fontSize: 10, paddingHorizontal: 4 },
  noteCell: { ...commonBorder, borderTopWidth: 0, minHeight: 35, justifyContent: 'center' },
  noteText: { fontSize: 11, paddingHorizontal: 4 },
  managerNoteCell: { ...commonBorder, borderTopWidth: 0, minHeight: 25, justifyContent: 'center', marginBottom: 8 },
  tableContainer: { ...commonBorder, width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eee', minHeight: 35, alignItems: 'center', borderBottomWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', minHeight: 35, borderBottomWidth: 1, borderColor: '#000' },
  colHeaderText: { fontWeight: '700', fontSize: 9, textAlign: 'center' },
  colName: { flex: 0.20, borderRightWidth: 1, borderRightColor: '#000' },
  colAddress: { flex: 0.25, borderRightWidth: 1, borderRightColor: '#000' },
  colContact: { flex: 0.12, borderRightWidth: 1, borderRightColor: '#000' },
  colPurpose: { flex: 0.18, borderRightWidth: 1, borderRightColor: '#000' },
  colTime: { flex: 0.08, borderRightWidth: 1, borderRightColor: '#000' },
  colAuth: { flex: 0.17 },
  cell: { paddingHorizontal: 2, justifyContent: 'center' },
  cellText: { fontSize: 10, textAlign: 'center' },
  cellInput: { flex: 1, paddingHorizontal: 4, fontSize: 10, height: '100%', textAlign: 'center' },
  multiLineCell: { paddingVertical: 4 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
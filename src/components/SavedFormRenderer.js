import ProductRejectionPresentational from '../forms/components/ProductRejectionPresentational';
import ChilledFrozenReceivingPresentational from '../forms/components/ChilledFrozenReceivingPresentational';
import ChemicalsReceivingPresentational from '../forms/components/ChemicalsReceivingPresentational';
import DryGoodsReceivingPresentational from '../forms/components/DryGoodsReceivingPresentational';
import BinLinersChangingLogPresentational from '../forms/components/BinLinersChangingLogPresentational';
import BeverageReceivingPresentational from '../forms/components/BeverageReceivingPresentational';
import PackagingMaterialsReceivingPresentational from '../forms/components/PackagingMaterialsReceivingPresentational';
import VegetablesFruitsReceivingPresentational from '../forms/components/VegetablesFruitsReceivingPresentational';
import ToolboxTalkRegisterPresentational from '../forms/components/ToolboxTalkRegisterPresentational';
import PastInspectionFormPresentational from '../forms/components/PastInspectionFormPresentational';
import EggsReceivingPresentational from '../forms/components/EggsReceivingPresentational';
import CertificateOfAnalysisPresentational from '../forms/components/CertificateOfAnalysisPresentational';
import React from 'react';
import FoodHandlersPresentational from '../forms/components/FoodHandlersPresentational';
import FOH_DailyCleaningPresentational from '../forms/components/FOH_DailyCleaningPresentational';
import FOH_FrontOfHouseCleaningPresentational from '../forms/components/FOH_FrontOfHouseCleaningPresentational';
import DisplayChillerShelfLifeInspectionPresentational from '../forms/components/DisplayChillerShelfLifeInspectionPresentational';
import PreShiftMeetingAttendancePresentational from '../forms/components/PreShiftMeetingAttendancePresentational';
import TrainingAttendanceRegisterPresentational from '../forms/components/TrainingAttendanceRegisterPresentational';
import ProcessQualityOutOfControlPresentational from '../forms/components/ProcessQualityOutOfControlPresentational';
import ProductReleasePresentational from '../forms/components/ProductReleasePresentational';
import CustomerSatisfactionPresentational from '../forms/components/CustomerSatisfactionPresentational';
import CustomerSatisfactionQuestionnairePresentational from '../forms/components/CustomerSatisfactionQuestionnairePresentational';
import { View, Text, StyleSheet } from 'react-native';
// Add other form imports as needed

// SavedFormRenderer renders a saved payload using the same form component (read-only)
export default function SavedFormRenderer({ savedPayload }) {
  if (!savedPayload) return null;

  // The Saved Forms history entries sometimes wrap the payload in different shapes
  // - formStorage.saveForm writes { payload, savedAt }
  // - the history entry used by FormSavesScreen may pass an object with meta or filePath
  // Normalize a canonical payload variable that the presentational renderers expect.
  let payload = null;
  // If the caller passed a history entry with a meta pointer, try to load the stored payload
  try {
    // If the object is the wrapped file content
    if (savedPayload.payload) payload = savedPayload.payload;
    else if (savedPayload.meta && savedPayload.meta.filePath && savedPayload.meta.formId) {
      // savedPayload looks like a history entry — load the file synchronously is not possible here,
      // but the ViewDocumentModal passes the full wrapped file when available. For safety, prefer
      // payload in savedPayload.meta.payload, then savedPayload.meta.form, else try savedPayload.form.
      payload = savedPayload.payload || savedPayload.meta.payload || savedPayload.form || savedPayload;
    } else {
      payload = savedPayload;
    }
  } catch (e) {
    payload = savedPayload;
  }

  // Detect common form types and render the appropriate presentational component
  const type = (payload?.formType || payload?.formTypeName || payload?.title || '').toString();

  // Chilled & Frozen Receiving
  if (/ChilledFrozenReceivingForm|Chilled & Frozen Receiving|ChilledFrozenReceiving/i.test(type)) {
    return <ChilledFrozenReceivingPresentational payload={payload} />;
  }

  // Dry Goods Receiving
  if (/DryGoodsReceivingForm|Dry Goods Receiving|DryGoodsReceiving/i.test(type)) {
    return <DryGoodsReceivingPresentational payload={payload} />;
  }

  // Chemicals Receiving
  if (/ChemicalsReceivingForm|Chemicals Receiving|ChemicalsReceiving/i.test(type)) {
    return <ChemicalsReceivingPresentational payload={payload} />;
  }

  // Food Handlers
  const looksLikeFoodHandlers = Array.isArray(payload?.handlers) && Array.isArray(payload?.timeSlots);
  if (looksLikeFoodHandlers || /handwash/i.test(type)) {
    return (
      <View>
        <FoodHandlersPresentational payload={payload} />
      </View>
    );
  }

  // FOH Daily Cleaning
  if (/FOH_DailyCleaning|FOH Daily Cleaning|FOH_FrontOfHouseCleaning|FRONT OF HOUSE|FOH/i.test(type)) {
    return (
      <View>
        {/* Prefer the specific front-of-house renderer when type matches */}
        { /FOH_FrontOfHouseCleaning|FRONT OF HOUSE/i.test(type) ? (
          <FOH_FrontOfHouseCleaningPresentational payload={payload} />
        ) : (
          <FOH_DailyCleaningPresentational payload={payload} />
        )}
      </View>
    );
  }

  // Display Chiller Shelf-Life
  if (/DisplayChillerShelfLifeInspection|DISPLAY CHILLER|Display Chiller/i.test(type)) {
    return (
      <View>
        <DisplayChillerShelfLifeInspectionPresentational payload={payload} />
      </View>
    );
  }
  // Bin Liners Changing Log
  if (/BinLinersChangingLog|Bin Liners Changing Log/i.test(type)) {
    return <BinLinersChangingLogPresentational payload={payload} />;
  }
  // Beverage & Water Receiving
  if (/BeverageReceivingForm|Beverage & Water Receiving|Beverage and Water Receiving/i.test(type)) {
    return <BeverageReceivingPresentational payload={payload} />;
  }
  // Product Rejection Form
  if (/ProductRejectionForm/i.test(type)) {
    return <ProductRejectionPresentational payload={payload} />;
  }
  // Packaging Materials Receiving
  if (/PackagingMaterialsReceivingForm|Packaging Materials Receiving|PackagingMaterialsReceiving/i.test(type)) {
    return <PackagingMaterialsReceivingPresentational payload={payload} />;
  }
  // Process & Quality Out of Control Report
  if (/ProcessQualityOutOfControlReport|Process & Quality Out of Control|Out of Control/i.test(type)) {
    return <ProcessQualityOutOfControlPresentational payload={payload} />;
  }
  // Product Release Form
  if (/ProductReleaseForm|Product Release/i.test(type)) {
    return <ProductReleasePresentational payload={payload} />;
  }
  // Customer Satisfaction Questionnaire
  if (/CustomerSatisfactionQuestionnaire|Customer Satisfaction|CustomerSatisfaction/i.test(type)) {
    return <CustomerSatisfactionQuestionnairePresentational payload={payload} />;
  }
  // Vegetables & Fruits Receiving
  if (/VegetablesFruitsReceiving|Vegetables and Fruits Receiving|VegetablesFruitsReceivingForm/i.test(type)) {
    return <VegetablesFruitsReceivingPresentational payload={payload} />;
  }
  // Eggs Receiving
  if (/EggsReceiving|Eggs Receiving|EggsReceivingForm/i.test(type)) {
    return <EggsReceivingPresentational payload={payload} />;
  }
  // Certificate of Analysis
  if (/CertificateOfAnalysis|Certificate of Analysis|CertificateOfAnalysisForm/i.test(type)) {
    return <CertificateOfAnalysisPresentational payload={payload} />;
  }
  // Toolbox Talk Register
  if (/ToolboxTalkRegister|Tool Box Talk Register|TBT Register/i.test(type)) {
    return <ToolboxTalkRegisterPresentational payload={payload} />;
  }
  // Past Inspection / Pest Inspection Form
  if (/PastInspectionForm|Pest Inspection Form|PestInspection/i.test(type)) {
    return <PastInspectionFormPresentational payload={payload} />;
  }
  // Pre Shift Meeting Attendance
  if (/PreShiftMeetingAttendance/i.test(type)) {
    return <PreShiftMeetingAttendancePresentational payload={payload} />;
  }
  // Training Attendance Register
  if (/TrainingAttendanceRegister|Training Attendance Register/i.test(type)) {
    return <TrainingAttendanceRegisterPresentational payload={payload} />;
  }
  // For all other forms, show a minimal message
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ color: '#b00', fontWeight: 'bold', fontSize: 16 }}>Unsupported saved form type.</Text>
      <Text style={{ marginTop: 8, color: '#444' }}>This saved form does not match the Food Handlers layout. Please update the app to support this form type.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#e8f5ff', padding: 6, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: '#185a9d', fontWeight: '700' },
});

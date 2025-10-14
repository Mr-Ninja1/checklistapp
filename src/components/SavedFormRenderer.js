import React from 'react';
import FoodHandlersPresentational from '../forms/components/FoodHandlersPresentational';
import FOH_DailyCleaningPresentational from '../forms/components/FOH_DailyCleaningPresentational';
import FOH_FrontOfHouseCleaningPresentational from '../forms/components/FOH_FrontOfHouseCleaningPresentational';
import DisplayChillerShelfLifeInspectionPresentational from '../forms/components/DisplayChillerShelfLifeInspectionPresentational';
import PreShiftMeetingAttendancePresentational from '../forms/components/PreShiftMeetingAttendancePresentational';
import { View, Text, StyleSheet } from 'react-native';
// Add other form imports as needed

// SavedFormRenderer renders a saved payload using the same form component (read-only)
export default function SavedFormRenderer({ savedPayload }) {
  if (!savedPayload) return null;

  // Unwrap if the saved object is wrapped (formStorage.saveForm writes { payload, savedAt })
  // Keep the original object reference available for debugging or future use
  const payload = (savedPayload && savedPayload.payload) ? savedPayload.payload : savedPayload;

  // Detect common form types and render the appropriate presentational component
  const type = (payload?.formType || payload?.formTypeName || payload?.title || '').toString();

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
  // Pre Shift Meeting Attendance
  if (/PreShiftMeetingAttendance/i.test(type)) {
    return <PreShiftMeetingAttendancePresentational payload={payload} />;
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

import React from 'react';
import DeepFreezerTemperatureLog from './DeepFreezerTemperatureLog';

export default function DeepFreezerTemperatureLog_Production(props) {
  return (
    <DeepFreezerTemperatureLog
      {...props}
      defaultFreezerName="Production Freezer"
      formType="DeepFreezerTemperatureLog_Production"
      title="DEEP FREEZER TEMPERATURE LOG SHEET - Production Freezer"
      draftKey="deep_freezer_temperature_log_production_draft"
    />
  );
}

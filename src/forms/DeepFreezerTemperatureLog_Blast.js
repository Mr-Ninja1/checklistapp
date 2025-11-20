import React from 'react';
import DeepFreezerTemperatureLog from './DeepFreezerTemperatureLog';

export default function DeepFreezerTemperatureLog_Blast(props) {
  return (
    <DeepFreezerTemperatureLog
      {...props}
      defaultFreezerName="Blast Freezer"
      formType="DeepFreezerTemperatureLog_Blast"
      title="DEEP FREEZER TEMPERATURE LOG SHEET - Blast Freezer"
      draftKey="deep_freezer_temperature_log_blast_draft"
    />
  );
}

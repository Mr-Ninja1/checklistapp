import React from 'react';
import DeepFreezerTemperatureLog from './DeepFreezerTemperatureLog';

export default function DeepFreezerTemperatureLog_Storage(props) {
  return (
    <DeepFreezerTemperatureLog
      {...props}
      defaultFreezerName="Storage Freezer"
      formType="DeepFreezerTemperatureLog_Storage"
      title="DEEP FREEZER TEMPERATURE LOG SHEET - Storage Freezer"
      draftKey="deep_freezer_temperature_log_storage_draft"
    />
  );
}

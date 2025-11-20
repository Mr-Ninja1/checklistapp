import React from 'react';
import DisplayChillerTemperatureLog_Upright from './DisplayChillerTemperatureLog_Upright';

// Reuse the Upright implementation but provide defaults for Grab and Go
export default function DisplayChillerTemperatureLog_GrabAndGo(props) {
  return (
    <DisplayChillerTemperatureLog_Upright
      {...props}
      defaultDisplayChillerName="Grab and Go"
      formType="DisplayChillerTemperatureLog_GrabAndGo"
      title="DISPLAY CHILLER TEMPERATURE LOG SHEET - Grab and Go"
      draftKey="display_chiller_temperature_log_grabandgo_draft"
    />
  );
}

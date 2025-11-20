import React from 'react';
import DisplayChillerTemperatureLog_Upright from './DisplayChillerTemperatureLog_Upright';

// Reuse the Upright implementation but provide defaults for Underbar
export default function DisplayChillerTemperatureLog_Underbar(props) {
  return (
    <DisplayChillerTemperatureLog_Upright
      {...props}
      defaultDisplayChillerName="Underbar Chiller"
      formType="DisplayChillerTemperatureLog_Underbar"
      title="DISPLAY CHILLER TEMPERATURE LOG SHEET - Underbar"
      draftKey="display_chiller_temperature_log_underbar_draft"
    />
  );
}

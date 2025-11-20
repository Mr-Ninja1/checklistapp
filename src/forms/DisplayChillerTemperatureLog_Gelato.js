import React from 'react';
import DisplayChillerTemperatureLog_Upright from './DisplayChillerTemperatureLog_Upright';

// Reuse the Upright implementation but provide defaults for Gelato
export default function DisplayChillerTemperatureLog_Gelato(props) {
  return (
    <DisplayChillerTemperatureLog_Upright
      {...props}
      defaultDisplayChillerName="Gelato"
      formType="DisplayChillerTemperatureLog_Gelato"
      title="DISPLAY CHILLER TEMPERATURE LOG SHEET - Gelato"
      draftKey="display_chiller_temperature_log_gelato_draft"
    />
  );
}

// Static mapping of exporter bridges to generator functions
// Metro bundler does not allow dynamic `require()` with variable paths,
// so import each exporter here and expose a normalized lookup map.

import genBakeryCleaning from './generateBakeryCleaningChecklistHtml';
import genBakerySanitizing from './generateBakerySanitizingHtml';
import genBakingControlSheet from './generateBakingControlSheetHtml';
import genBeverageReceiving from './generateBeverageReceivingHtml';
import genBinLinersChangingLog from './generateBinLinersChangingLogHtml';
import genCookingTemperature from './generateCookingTemperatureHtml';
import genBOHShelfLifeInspection from './generateBOHShelfLifeInspectionHtml';
import genBravoHealthStatusCheck from './generateBravoHealthStatusCheckHtml';
import genCertificateOfAnalysis from './generateCertificateOfAnalysisHtml';
import genMouldingProofingBakingLog from './generateMouldingProofingBakingLogHtml';
import genWalkInChillerLog from './generateWalkInChillerLogHtml';
import genBakeryUnderbarShelfLife from './generateBakery_UnderbarShelfLifeInspectionHtml';
import genCleaningEquipment_CleaningChecklist from './generateCleaningEquipment_CleaningChecklistHtml';
import genChilledFrozenReceiving from './generateChilledFrozenReceivingHtml';
import genColdRoom_FreezerRoomCleaningChecklist from './generateColdRoom_FreezerRoomCleaningChecklistHtml';
import genDryGoodsReceiving from './generateDryGoodsReceivingHtml';
import genDryStorageArea_CleaningChecklist from './generateDryStorageArea_CleaningChecklistHtml';
import genEggsReceiving from './generateEggsReceivingHtml';
import sharedHeader from './sharedHeader';

const normalize = (s = '') => (s || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const map = {
  [normalize('Bakery_CleaningChecklist')]: genBakeryCleaning,
  [normalize('BakerySanitizing')]: genBakerySanitizing,
  [normalize('BakingControlSheet')]: genBakingControlSheet,
  [normalize('BeverageReceivingForm')]: genBeverageReceiving,
  [normalize('BinLinersChangingLog')]: genBinLinersChangingLog,
  [normalize('CookingTemperature')]: genCookingTemperature,
  [normalize('BOH_ShelfLifeInspectionChecklist')]: genBOHShelfLifeInspection,
  [normalize('BravoHealthStatusCheck')]: genBravoHealthStatusCheck,
  [normalize('CertificateOfAnalysis')]: genCertificateOfAnalysis,
  [normalize('MouldingProofingBakingLog')]: genMouldingProofingBakingLog,
  [normalize('WalkInChillerLog')]: genWalkInChillerLog,
  [normalize('Bakery_UnderbarShelfLifeInspectionChecklist')]: genBakeryUnderbarShelfLife,
  [normalize('CleaningEquipment_CleaningChecklist')]: genCleaningEquipment_CleaningChecklist,
  [normalize('ChilledFrozenReceivingForm')]: genChilledFrozenReceiving,
  [normalize('ColdRoom_FreezerRoomCleaningChecklist')]: genColdRoom_FreezerRoomCleaningChecklist,
  [normalize('DryGoodsReceivingForm')]: genDryGoodsReceiving,
  [normalize('DryStorageArea_CleaningChecklist')]: genDryStorageArea_CleaningChecklist,
  [normalize('EggsReceivingForm')]: genEggsReceiving,
};

export { map as exportersMap, normalize };

export default { exportersMap: map, normalize };

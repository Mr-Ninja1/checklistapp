// --- FOH Daily Cleaning forms mapped to bakery sanitizing generator as requested ---
// --- FOH Daily Cleaning forms mapped to bakery sanitizing generator (structure identical to bakery forms) ---
try {
    const mod = normalizeMod(require('./generate_bakerysanitizing_html'));
    if (mod) {
        // Map all FOH daily cleaning forms (AM/PM, all title/route variants) to bakery sanitizing generator
        [
            'FOH_DailyCleaningForm_PM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH -PM',
            'FOH_DailyCleaningForm_AM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH — AM',
            'FOH_DailyCleaningForm',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH',
            'FOH_DailyCleaning_PM',
            'FOH_DailyCleaning_AM'
        ].forEach(key => { routeMapping[key] = mod; });
    }
} catch (e) { console.error(e); }
// --- CATEGORY ROUTE/TITLE MAPPINGS: Must be after routeMapping is defined ---
// --- BOH CATEGORY: Explicit mappings for all forms (route and title) to their presentational-matching generators ---
try {
    const mod = normalizeMod(require('./generate_ppe_log_html'));
    if (mod) {
        routeMapping['PPEIssuanceForm'] = mod;
        routeMapping['Personal Protective Equipment'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_visitorslogbook_html'));
    if (mod) {
        routeMapping['VisitorsLogBook'] = mod;
        routeMapping['Visitors Log Book'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_personalhygienechecklist_html'));
    if (mod) {
        routeMapping['PersonalHygieneChecklist'] = mod;
        routeMapping['Personal Hygiene Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_bravohealthstatuscheck_html'));
    if (mod) {
        routeMapping['BravoHealthStatusCheck'] = mod;
        routeMapping['Health Status Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_drystoragearea_cleaningchecklist_html'));
    if (mod) {
        routeMapping['DryStorageArea_CleaningChecklist'] = mod;
        routeMapping['Dry Storage Area Cleaning'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_sculleryarea_cleaningchecklist_html'));
    if (mod) {
        routeMapping['SculleryArea_CleaningChecklist'] = mod;
        routeMapping['Weekly Scullery Area Cleaning'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_coldroom_freezerroomcleaningchecklist_html'));
    if (mod) {
        routeMapping['ColdRoom_FreezerRoomCleaningChecklist'] = mod;
        routeMapping['Cold Room & Freezer Room Cleaning Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_walkinchillerlog_html'));
    if (mod) {
        routeMapping['WalkInChillerLog'] = mod;
        routeMapping['WALK-IN CHILLER TEMPERATURE CHECKLIST'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_welfarefacilities_html'));
    if (mod) {
        routeMapping['WelfareFacilities_CleaningChecklist'] = mod;
        routeMapping['Welfare Facilities Cleaning Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_cleaningequipment_cleaningchecklist_html'));
    if (mod) {
        routeMapping['CleaningEquipment_CleaningChecklist'] = mod;
        routeMapping['Cleaning Equipment Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_walkinfreezerlog_html'));
    if (mod) {
        routeMapping['WalkInFreezerLog'] = mod;
        routeMapping['WALK-IN FREEZER TEMPERATURE CHECKLIST'] = mod;
    }
} catch (e) { console.error(e); }
// --- BAKERY CATEGORY: Explicit mappings for all forms (route and title) to their presentational-matching generators ---
try {
    const mod = normalizeMod(require('./generate_coolingtemperature_html'));
    if (mod) {
        routeMapping['CoolingTemperatureLog'] = mod;
        routeMapping['Cooling Temp Log'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_deepfreezertemperature_html'));
    if (mod) {
        routeMapping['DeepFreezerTemperatureLog_Storage'] = mod;
        routeMapping['DEEP FREEZER TEMPERATURE LOG SHEET - Storage'] = mod;
        routeMapping['DeepFreezerTemperatureLog_Blast'] = mod;
        routeMapping['DEEP FREEZER TEMPERATURE LOG SHEET - Blast'] = mod;
        routeMapping['DeepFreezerTemperatureLog_Production'] = mod;
        routeMapping['DEEP FREEZER TEMPERATURE LOG SHEET - Production'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_underbarchiller_temperature_html'));
    if (mod) {
        routeMapping['Bakery_UnderbarChillerTemperatureLog1'] = mod;
        routeMapping['Underbar Chiller Temperature Log — 1'] = mod;
        routeMapping['Bakery_UnderbarChillerTemperatureLog2'] = mod;
        routeMapping['Underbar Chiller Temperature Log — 2'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_bakerysanitizing_html'));
    if (mod) {
        routeMapping['Bakery_SanitizingLog_AM'] = mod;
        routeMapping['Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery — AM'] = mod;
        routeMapping['Bakery_SanitizingLog_PM'] = mod;
        routeMapping['Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery — PM'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_bakerycleaningchecklist_html'));
    if (mod) {
        routeMapping['Bakery_CleaningChecklist'] = mod;
        routeMapping['Bakery Area Cleaning Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_bakingcontrolsheet_html'));
    if (mod) {
        routeMapping['BakingControlSheet'] = mod;
        routeMapping['Baking Control Sheet'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_mixingcontrolsheet_html'));
    if (mod) {
        routeMapping['MixingControlSheet'] = mod;
        routeMapping['Mixing Control Sheet'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_productsnetcontentchecklist_html'));
    if (mod) {
        routeMapping['ProductsNetContentChecklist'] = mod;
        routeMapping['PRODUCTS NET CONTENT CHECKLIST'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_mouldingproofingbakinglog_html'));
    if (mod) {
        routeMapping['MouldingProofingBakingLog'] = mod;
        routeMapping['MOULDING PROOFING AND BAKING LOG SHEET'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_boh_shelflifeinspection_html'));
    if (mod) {
        routeMapping['BOH_ShelfLifeInspectionChecklist'] = mod;
        routeMapping['BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST'] = mod;
    }
} catch (e) { console.error(e); }
// --- KITCHEN CATEGORY: Explicit mappings for all forms (route and title) to their presentational-matching generators ---
try {
    const mod = normalizeMod(require('./generate_bakerysanitizing_html'));
    if (mod) {
        routeMapping['Kitchen_DailyCleaningForm'] = mod;
        routeMapping['Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — AM'] = mod;
        routeMapping['Kitchen_DailyCleaningForm_PM'] = mod;
        routeMapping['Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — PM'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_kitchenweeklycleaningchecklist_html'));
    if (mod) {
        routeMapping['Kitchen_WeeklyCleaningChecklist'] = mod;
        routeMapping['Kitchen Weekly Cleaning Checklist'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_underbarchiller_temperature_html'));
    if (mod) {
        routeMapping['UnderbarChillerTemperatureLog1'] = mod;
        routeMapping['Underbar Chiller Temperature Log — 1'] = mod;
        routeMapping['UnderbarChillerTemperatureLog2'] = mod;
        routeMapping['Underbar Chiller Temperature Log — 2'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_cookingtemperature_html'));
    if (mod) {
        routeMapping['CookingTemperatureLog'] = mod;
        routeMapping['Cooking Temp Log'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_thawingtemperature_html'));
    if (mod) {
        routeMapping['ThawingTemperatureLog'] = mod;
        routeMapping['Thawing Temperature Log'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_hotholdingtemperature_html'));
    if (mod) {
        routeMapping['HotHoldingTemperatureLog'] = mod;
        routeMapping['Hot Holding Temp Log'] = mod;
    }
} catch (e) { console.error(e); }
// --- PRODUCTION CATEGORY: Explicit mappings for all forms (route and title) to their presentational-matching generators ---
try {
    const mod = normalizeMod(require('./generate_preshiftmeetingattendance_html'));
    if (mod) {
        routeMapping['PreShiftMeetingAttendanceRegister'] = mod;
        routeMapping['Pre Shift Meeting Attendance Register'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_productrejection_html'));
    if (mod) {
        routeMapping['ProductRejectionForm'] = mod;
        routeMapping['Product Rejection Form'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_binlinerschanginglog_html'));
    if (mod) {
        routeMapping['BinLinersChangingLog'] = mod;
        routeMapping['Bin Liners Changing Log'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_beveragereceiving_html'));
    if (mod) {
        routeMapping['BeverageReceivingForm'] = mod;
        routeMapping['Beverage & Water Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_drygoodsreceiving_html'));
    if (mod) {
        routeMapping['DryGoodsReceivingForm'] = mod;
        routeMapping['Dry Goods Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_chilledfrozenreceiving_html'));
    if (mod) {
        routeMapping['ChilledFrozenReceivingForm'] = mod;
        routeMapping['Chilled & Frozen Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_chemicalsreceiving_html'));
    if (mod) {
        routeMapping['ChemicalsReceivingForm'] = mod;
        routeMapping['Chemicals Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_eggsreceiving_html'));
    if (mod) {
        routeMapping['EggsReceivingForm'] = mod;
        routeMapping['Eggs Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_certificateofanalysis_html'));
    if (mod) {
        routeMapping['CertificateOfAnalysis'] = mod;
        routeMapping['Certificates of Analysis'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_packagingmaterialsreceiving_html'));
    if (mod) {
        routeMapping['PackagingMaterialsReceivingForm'] = mod;
        routeMapping['Packaging Materials Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_vegetablesfruitsreceiving_html'));
    if (mod) {
        routeMapping['VegetablesFruitsReceivingForm'] = mod;
        routeMapping['Vegetables & Fruits Receiving'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_toolboxtalkregister_html'));
    if (mod) {
        routeMapping['ToolboxTalkRegister'] = mod;
        routeMapping['Toolbox Talk Attendance'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_pastinspectionform_html'));
    if (mod) {
        routeMapping['PastInspectionForm'] = mod;
        routeMapping['Pest Inspection Form'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_customersatisfaction_html'));
    if (mod) {
        routeMapping['CustomerSatisfactionQuestionnaire'] = mod;
        routeMapping['Customer Satisfaction Questionnaire'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_processqualityoutofcontrol_html'));
    if (mod) {
        routeMapping['ProcessQualityOutOfControlReport'] = mod;
        routeMapping['Process & Quality Out of Control Report'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_productrelease_html'));
    if (mod) {
        routeMapping['ProductReleaseForm'] = mod;
        routeMapping['Product Release'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_foodhandlers_log_html'));
    if (mod) {
        routeMapping['FoodHandlersHandwashingForm_AM'] = mod;
        routeMapping['Food Handlers Daily Handwashing — AM'] = mod;
        routeMapping['FoodHandlersHandwashingForm_PM'] = mod;
        routeMapping['Food Handlers Daily Handwashing — PM'] = mod;
        routeMapping['FoodHandlersDailyShoweringForm'] = mod;
        routeMapping['Food Handlers Daily Showering Log'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_foodsamplescollection_html'));
    if (mod) {
        routeMapping['FoodSamplesCollectionLog'] = mod;
        routeMapping['Food Sample Collection'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_fruit_washing_log_html'));
    if (mod) {
        routeMapping['FruitWashingLog'] = mod;
        routeMapping['Fruit, Vegetable Washing Log'] = mod;
    }
} catch (e) { console.error(e); }
try {
    const mod = normalizeMod(require('./generate_trainingattendanceregister_html'));
    if (mod) {
        routeMapping['TrainingAttendanceRegister'] = mod;
        routeMapping['Training Attendance Register'] = mod;
    }
} catch (e) { console.error(e); }
// Map all Display Chiller Shelf-Life Inspection and Temperature Log forms (all variants) to their correct generators
try {
    const shelfLifeMod = normalizeMod(require('./generate_displaychiller_shelflife_html.js'));
    if (shelfLifeMod) {
        [
            'Display Chiller Shelf-Life Inspection',
            'DisplayChillerShelfLifeInspectionChecklist',
            'DISPLAY CHILLER SHELF-LIFE INSPECTION',
            'DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST'
        ].forEach(title => { routeMapping[title] = shelfLifeMod; });
    }
} catch (e) { console.error(e); }
try {
    const tempMod = normalizeMod(require('./generate_displaychillertemperature_html.js'));
    if (tempMod) {
        [
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Upright',
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Grab and Go',
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Gelato',
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Underbar',
            'DisplayChillerTemperatureLog_Upright',
            'DisplayChillerTemperatureLog_GrabAndGo',
            'DisplayChillerTemperatureLog_Gelato',
            'DisplayChillerTemperatureLog_Underbar'
        ].forEach(title => { routeMapping[title] = tempMod; });
    }
} catch (e) { console.error(e); }
// Map all similar kitchen AM/PM forms to the kitchen daily cleaning generator
try {
    const mod = normalizeMod(require('./generate_kitchen_daily_cleaning_html.js'));
    if (mod) {
        [
            'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — AM',
            'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — PM',
            'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen)',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET (KITCHEN) — AM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET (KITCHEN) — PM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET (KITCHEN)'
        ].forEach(title => { routeMapping[title] = mod; });
    }
} catch (e) { console.error(e); }
// Map all similar bakery AM/PM forms to the bakery sanitizing generator
try {
    const mod = normalizeMod(require('./generate_bakerysanitizing_html.js'));
    if (mod) {
        [
            'Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery — AM',
            'Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery — PM',
            'Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET - BAKERY — AM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET - BAKERY — PM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET - BAKERY'
        ].forEach(title => { routeMapping[title] = mod; });
    }
} catch (e) { console.error(e); }
// Comprehensive static mapping for HTML generators on mobile.
// This file explicitly maps form components to their corresponding HTML generator.
// Each mapping is defined in its own try-catch block for robustness.

function normalizeMod(mod) {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod.default === 'function') return mod.default;
  return null;
}

function getKeysFromTitle(title) {
    const k1 = title.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    const k2 = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return [k1, k2];
}

const mapping = {};
const routeMapping = {};

try {
    const mod = normalizeMod(require('./generate_bakerycleaningchecklist_html'));
    if (mod) {
        const titles = ['Bakery Area Cleaning Checklist', 'Bakery Cleaning Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    // Use a new generator that matches FOH_DailyCleaningPresentational.js layout
    const mod = normalizeMod(require('./generate_foh_dailycleaningpresentational_html.js'));
    if (mod) {
        routeMapping['FOH_DailyCleaningForm_AM'] = mod;
        routeMapping['FOH_DailyCleaningForm_PM'] = mod;
        // Also keep normalized mapping for legacy compatibility
        const titles = [
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH — AM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH -PM'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
            // Add exact routeMapping for title-based formType (for broken wrappers)
            routeMapping[title] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_underbarchiller_temperature_html'));
    if (mod) {
        const titles = [
            'Bakery - Underbar Chiller Temperature Log 1',
            'Bakery - Underbar Chiller Temperature Log 2',
            'Kitchen - Underbar Chiller Temperature Log 1',
            'Kitchen - Underbar Chiller Temperature Log 2',
            'Underbar Chiller Temperature Log'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bakery_underbar_shelflife_html'));
    if (mod) {
        const titles = ['UNDERBAR CHILLER SHELF-LIFE INSPECTION CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bakingcontrolsheet_html'));
    if (mod) {
        const titles = ['Baking Control Sheet'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_beveragereceiving_html'));
    if (mod) {
        const titles = ['Beverage and Water Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_binlinerschanginglog_html'));
    if (mod) {
        const titles = ['BIN LINERS CHANGING LOG'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_boh_shelflifeinspection_html'));
    if (mod) {
        const titles = ['BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bravohealthstatuscheck_html'));
    if (mod) {
        const titles = ['BRAVO BRANDS HEALTH STATUS CHECK'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_certificateofanalysis_html'));
    if (mod) {
        const titles = ['CERTIFICATE OF ANALYSIS'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_chemicalsreceiving_html'));
    if (mod) {
        const titles = ['Chemicals Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_chilledfrozenreceiving_html'));
    if (mod) {
        const titles = ['Chilled & Frozen Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_cleaningequipment_cleaningchecklist_html'));
    if (mod) {
        const titles = ['CLEANING EQUIPMENT CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_coldroom_freezerroomcleaningchecklist_html'));
    if (mod) {
        const titles = ['COLD ROOM & FREEZER ROOM CLEANING CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_coolingtemperature_html'));
    if (mod) {
        const titles = ['Temperature Record for Cooling (Cooling Temperature Log)'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_cookingtemperature_html'));
    if (mod) {
        const titles = ['Cooking Temperature Log'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_customersatisfaction_html'));
    if (mod) {
        const titles = ['Customer Satisfaction Questionnaire', 'Customer Feedback'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_deepfreezertemperature_html'));
    if (mod) {
        const titles = [
            'DEEP FREEZER TEMPERATURE LOG SHEET - Blast Freezer',
            'DEEP FREEZER TEMPERATURE LOG SHEET - Production Freezer',
            'DEEP FREEZER TEMPERATURE LOG SHEET - Storage Freezer',
            'DEEP FREEZER TEMPERATURE LOG SHEET'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_displaychiller_shelflife_html'));
    if (mod) {
        const titles = ['DISPLAY CHILLER & FOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
        // Map formType/component identifiers to the same generator so
        // exporter lookups using payload.formType resolve correctly.
        const formTypes = ['DisplayChillerShelfLifeInspection', 'DisplayChillerShelfLifeInspectionChecklist'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
            routeMapping[ft] = mod;
        });
        // Also map the route name used in HomeScreen
        const routes = ['DisplayChillerShelfLifeInspectionChecklist'];
        routes.forEach(rt => {
            const keys = getKeysFromTitle(rt);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
            routeMapping[rt] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_displaychillertemperature_html'));
    if (mod) {
        const titles = [
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Gelato',
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Grab and Go',
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Underbar',
            'DISPLAY CHILLER TEMPERATURE LOG SHEET - Upright'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
        // Also map component/formType identifiers used by wrapper components
        const formTypes = [
            'DisplayChillerTemperatureLog_Gelato',
            'DisplayChillerTemperatureLog_GrabAndGo',
            'DisplayChillerTemperatureLog_Underbar',
            'DisplayChillerTemperatureLog_Upright'
        ];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_drygoodsreceiving_html'));
    if (mod) {
        const titles = ['Dry Goods Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_eggsreceiving_html'));
    if (mod) {
        const titles = ['Eggs Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foh_frontofhouse_html'));
    if (mod) {
        const titles = [
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH — AM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH - PM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH — PM',
            'FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH- PM',
            'Front of House Cleaning Checklist'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
        // Map common payload.formType identifiers used by FOH components
        const formTypes = [
            'FOH_DailyCleaningForm_PM',
            'FOH_DailyCleaningForm_AM',
            'FOH_DailyCleaningForm',
            'FOH_DailyCleaning_PM',
            'FOH_DailyCleaning_AM',
            'FOH_DailyCleaning',
            'FOH_FrontOfHouseCleaningChecklist',
            'FOH_FrontOfHouseCleaning'
        ];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
            // register exact route/formType -> generator
            try { routeMapping[ft] = mod; } catch (e) {}
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodhandlers_log_html'));
    if (mod) {
        const titles = [
            'Food Handlers Daily Showering Log',
            'Food Handlers Daily Handwashing Tracking Log Sheet — AM',
            'Food Handlers Daily Handwashing Tracking Log Sheet — PM',
            'Food Handlers Daily Handwashing Tracking Log Sheet'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodsamplescollection_html'));
    if (mod) {
        const titles = ['Food Samples Collection Log'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_fruit_washing_log_html'));
    if (mod) {
        const titles = ['FRUIT ,VEGETABLE & EGG WASHING + SANITIZING LOG'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_hotholdingtemperature_html'));
    if (mod) {
        const titles = ['Hot Holding Temperature Log'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_kitchen_daily_cleaning_html'));
    if (mod) {
        const titles = [
            'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — PM',
            'Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — AM'
        ];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_kitchenweeklycleaningchecklist_html'));
    if (mod) {
        const titles = ['Kitchen Weekly Cleaning Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_mixingcontrolsheet_html'));
    if (mod) {
        const titles = ['Mixing Control Sheet'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_mouldingproofingbakinglog_html'));
    if (mod) {
        const titles = ['MOULDING PROOFING AND BAKING LOG SHEET'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_packagingmaterialsreceiving_html'));
    if (mod) {
        const titles = ['Packaging Materials Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_pastinspectionform_html'));
    if (mod) {
        const titles = ['Pest Inspection Form'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_personalhygienechecklist_html'));
    if (mod) {
        const titles = ['Personal Hygiene Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_ppe_log_html'));
    if (mod) {
        const titles = ['Personal Protective Equipment Log', 'Personal  Protective Equipment Log'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_preshiftmeetingattendance_html'));
    if (mod) {
        const titles = ['PRE-SHIFT MEETING ATTENDANCE REGISTER'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_processqualityoutofcontrol_html'));
    if (mod) {
        const titles = ['Process & Quality Out of Control Report'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productrejection_html'));
    if (mod) {
        const titles = ['PRODUCT REJECTION FORM'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productrelease_html'));
    if (mod) {
        const titles = ['Product Release Form'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productsnetcontentchecklist_html'));
    if (mod) {
        const titles = ['Products Net Content Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_sculleryarea_cleaningchecklist_html'));
    if (mod) {
        const titles = ['SCULLERY AREA CLEANING CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_drystoragearea_cleaningchecklist_html'));
    if (mod) {
        const titles = ['DRY STORAGE AREA CLEANING CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
        mapping['DryStorageArea_CleaningChecklist'] = mod;
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_thawingtemperature_html'));
    if (mod) {
        const titles = ['Thawing Temperature Log'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_toolboxtalkregister_html'));
    if (mod) {
        const titles = ['Toolbox Talk Register'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_trainingattendanceregister_html'));
    if (mod) {
        const titles = ['Training Attendance Register'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_vegetablesfruitsreceiving_html'));
    if (mod) {
        const titles = ['Vegetables and Fruits Receiving Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_visitorslogbook_html'));
    if (mod) {
        const titles = ['Visitors Log Book'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_walkinchillerlog_html'));
    if (mod) {
        const titles = ['WALK-IN CHILLER TEMPERATURE CHECKLIST'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_walkinfreezerlog_html'));
    if (mod) {
        const titles = ['WALK-IN FREEZER TEMPERATURE LOG SHEET'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_welfarefacilities_html'));
    if (mod) {
        const titles = ['Welfare Facilities Cleaning Checklist'];
        titles.forEach(title => {
            const keys = getKeysFromTitle(title);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

// Additional explicit formType -> generator mappings for wrappers
try {
    const mod = normalizeMod(require('./generate_bakerycleaningchecklist_html'));
    if (mod) {
        const formTypes = ['BakeryCleaningChecklist', 'Bakery_CleaningChecklist'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_boh_shelflifeinspection_html'));
    if (mod) {
        const formTypes = ['BOH_ShelfLifeInspectionChecklist', 'BOH_ShelfLifeInspection'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_certificateofanalysis_html'));
    if (mod) {
        const formTypes = ['CertificateOfAnalysis'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_chemicalsreceiving_html'));
    if (mod) {
        const formTypes = ['ChemicalsReceiving', 'ChemicalsReceivingForm'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foh_frontofhouse_html'));
    if (mod) {
        const formTypes = ['FOH_DailyCleaning_AM', 'FOH_FrontOfHouseCleaning', 'FOH_FrontOfHouseCleaningChecklist'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
            try { routeMapping[ft] = mod; } catch (e) {}
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodhandlers_log_html'));
    if (mod) {
        const formTypes = ['FoodHandlersHandwashing', 'FoodHandlersHandwashing_AM', 'FoodHandlersHandwashing_PM', 'FoodHandlersDailyShowering', 'FoodHandlersDailyShoweringForm'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodsamplescollection_html'));
    if (mod) {
        const formTypes = ['FoodSamplesCollectionLog', 'FoodSamplesCollection'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_fruit_washing_log_html'));
    if (mod) {
        const formTypes = ['FruitWashingLog'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_kitchen_daily_cleaning_html'));
    if (mod) {
        const formTypes = ['Kitchen Daily Cleaning — AM', 'Kitchen Daily Cleaning — PM', 'Kitchen_DailyCleaningForm'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_hotholdingtemperature_html'));
    if (mod) {
        const formTypes = ['HotHoldingTemperatureLog'];
        formTypes.forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod;
            mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

module.exports = { mapping, routeMapping };

// NOTE: The blocks below intentionally mirror existing generator requires
// and register normalized `formType` identifiers so exporter lookups that
// pass `payload.formType` will resolve the correct generator.
try {
    const mod = normalizeMod(require('./generate_walkinfreezerlog_html'));
    if (mod) {
        ['WalkInFreezerLog'].forEach(ft => {
            const keys = getKeysFromTitle(ft);
            mapping[keys[0]] = mod; mapping[keys[1]] = mod;
        });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_vegetablesfruitsreceiving_html'));
    if (mod) {
        ['VegetablesFruitsReceiving'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_trainingattendanceregister_html'));
    if (mod) {
        ['TrainingAttendanceRegister'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_toolboxtalkregister_html'));
    if (mod) {
        ['ToolboxTalkRegister'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_thawingtemperature_html'));
    if (mod) {
        ['ThawingTemperatureLog'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_sculleryarea_cleaningchecklist_html'));
    if (mod) {
        ['SculleryArea_CleaningChecklist'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productsnetcontentchecklist_html'));
    if (mod) {
        ['ProductsNetContentChecklist'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productrelease_html'));
    if (mod) {
        ['ProductReleaseForm'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productrejection_html'));
    if (mod) {
        ['ProductRejectionForm'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_processqualityoutofcontrol_html'));
    if (mod) {
        ['ProcessQualityOutOfControlReport'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_preshiftmeetingattendance_html'));
    if (mod) {
        ['PreShiftMeetingAttendance'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_ppe_log_html'));
    if (mod) {
        ['PPEIssuanceForm', 'PPEIssuance'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_personalhygienechecklist_html'));
    if (mod) {
        ['PersonalHygieneChecklist'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_pastinspectionform_html'));
    if (mod) {
        ['PastInspectionForm'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_packagingmaterialsreceiving_html'));
    if (mod) {
        ['PackagingMaterialsReceiving', 'PackagingMaterialsReceivingForm'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_mouldingproofingbakinglog_html'));
    if (mod) {
        ['MouldingProofingBakingLog'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_mixingcontrolsheet_html'));
    if (mod) {
        ['MixingControlSheet'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_kitchenweeklycleaningchecklist_html'));
    if (mod) {
        ['KitchenWeeklyCleaningChecklist'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_fruit_washing_log_html'));
    if (mod) {
        ['FruitWashingLog'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodsamplescollection_html'));
    if (mod) {
        ['FoodSamplesCollectionLog'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodhandlers_log_html'));
    if (mod) {
        ['FoodHandlersHandwashing', 'FoodHandlersHandwashing_AM', 'FoodHandlersHandwashing_PM', 'FoodHandlersDailyShowering'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_eggsreceiving_html'));
    if (mod) {
        ['EggsReceiving'].forEach(ft => { const keys = getKeysFromTitle(ft); mapping[keys[0]] = mod; mapping[keys[1]] = mod; });
    }
} catch (e) { console.error(e); }

// Explicit exact route -> generator registrations for HomeScreen routes
try {
    const mod = normalizeMod(require('./generate_displaychillertemperature_html'));
    if (mod) {
        ['DisplayChillerTemperatureLog_Upright','DisplayChillerTemperatureLog_GrabAndGo','DisplayChillerTemperatureLog_Gelato','DisplayChillerTemperatureLog_Underbar'].forEach(rt => { try { routeMapping[rt] = mod; } catch(e){} });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_preshiftmeetingattendance_html'));
    if (mod) { try { routeMapping['PreShiftMeetingAttendanceRegister'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productrejection_html'));
    if (mod) { try { routeMapping['ProductRejectionForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_binlinerschanginglog_html'));
    if (mod) { try { routeMapping['BinLinersChangingLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_beveragereceiving_html'));
    if (mod) { try { routeMapping['BeverageReceivingForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_drygoodsreceiving_html'));
    if (mod) { try { routeMapping['DryGoodsReceivingForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_chilledfrozenreceiving_html'));
    if (mod) { try { routeMapping['ChilledFrozenReceivingForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_chemicalsreceiving_html'));
    if (mod) { try { routeMapping['ChemicalsReceivingForm'] = mod; routeMapping['ChemicalsReceiving'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_eggsreceiving_html'));
    if (mod) { try { routeMapping['EggsReceivingForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_certificateofanalysis_html'));
    if (mod) { try { routeMapping['CertificateOfAnalysis'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_packagingmaterialsreceiving_html'));
    if (mod) { try { routeMapping['PackagingMaterialsReceivingForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_vegetablesfruitsreceiving_html'));
    if (mod) { try { routeMapping['VegetablesFruitsReceivingForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_toolboxtalkregister_html'));
    if (mod) { try { routeMapping['ToolboxTalkRegister'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_pastinspectionform_html'));
    if (mod) { try { routeMapping['PastInspectionForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_customersatisfaction_html'));
    if (mod) { try { routeMapping['CustomerSatisfactionQuestionnaire'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_processqualityoutofcontrol_html'));
    if (mod) { try { routeMapping['ProcessQualityOutOfControlReport'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productrelease_html'));
    if (mod) { try { routeMapping['ProductReleaseForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

// Food handlers
try {
    const mod = normalizeMod(require('./generate_foodhandlers_log_html'));
    if (mod) {
        ['FoodHandlersHandwashingForm_AM','FoodHandlersHandwashingForm_PM','FoodHandlersDailyShoweringForm','FoodHandlersHandwashingForm'].forEach(rt => { try { routeMapping[rt] = mod; } catch(e){} });
    }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_foodsamplescollection_html'));
    if (mod) { try { routeMapping['FoodSamplesCollectionLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_fruit_washing_log_html'));
    if (mod) { try { routeMapping['FruitWashingLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_trainingattendanceregister_html'));
    if (mod) { try { routeMapping['TrainingAttendanceRegister'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

// Kitchen & underbar chiller
try {
    const mod = normalizeMod(require('./generate_kitchen_daily_cleaning_html'));
    if (mod) { ['Kitchen_DailyCleaningForm','Kitchen_DailyCleaningForm_PM','Kitchen_DailyCleaningForm_AM'].forEach(rt => { try { routeMapping[rt] = mod; } catch(e){} }); }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_kitchenweeklycleaningchecklist_html'));
    if (mod) { try { routeMapping['Kitchen_WeeklyCleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_underbarchiller_temperature_html'));
    if (mod) { ['UnderbarChillerTemperatureLog1','UnderbarChillerTemperatureLog2','Bakery_UnderbarChillerTemperatureLog1','Bakery_UnderbarChillerTemperatureLog2','UnderbarChillerTemperatureLog','UnderbarChillerTemperatureLog_2'].forEach(rt => { try { routeMapping[rt] = mod; } catch(e){} }); }
} catch (e) { console.error(e); }

// Bakery & deep freezer
try {
    const mod = normalizeMod(require('./generate_coolingtemperature_html'));
    if (mod) { try { routeMapping['CoolingTemperatureLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_deepfreezertemperature_html'));
    if (mod) { ['DeepFreezerTemperatureLog_Storage','DeepFreezerTemperatureLog_Blast','DeepFreezerTemperatureLog_Production'].forEach(rt => { try { routeMapping[rt] = mod; } catch(e){} }); }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bakerysanitizing_html'));
    if (mod) { ['Bakery_SanitizingLog_AM','Bakery_SanitizingLog_PM'].forEach(rt => { try { routeMapping[rt] = mod; } catch(e){} }); }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bakerycleaningchecklist_html'));
    if (mod) { try { routeMapping['Bakery_CleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bakingcontrolsheet_html'));
    if (mod) { try { routeMapping['BakingControlSheet'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_mixingcontrolsheet_html'));
    if (mod) { try { routeMapping['MixingControlSheet'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_productsnetcontentchecklist_html'));
    if (mod) { try { routeMapping['ProductsNetContentChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_mouldingproofingbakinglog_html'));
    if (mod) { try { routeMapping['MouldingProofingBakingLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_boh_shelflifeinspection_html'));
    if (mod) { try { routeMapping['BOH_ShelfLifeInspectionChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

// BOH
try {
    const mod = normalizeMod(require('./generate_ppe_log_html'));
    if (mod) { try { routeMapping['PPEIssuanceForm'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_visitorslogbook_html'));
    if (mod) { try { routeMapping['VisitorsLogBook'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_personalhygienechecklist_html'));
    if (mod) { try { routeMapping['PersonalHygieneChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_bravohealthstatuscheck_html'));
    if (mod) { try { routeMapping['BravoHealthStatusCheck'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_drystoragearea_cleaningchecklist_html'));
    if (mod) { try { routeMapping['DryStorageArea_CleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_sculleryarea_cleaningchecklist_html'));
    if (mod) { try { routeMapping['SculleryArea_CleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_coldroom_freezerroomcleaningchecklist_html'));
    if (mod) { try { routeMapping['ColdRoom_FreezerRoomCleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_walkinchillerlog_html'));
    if (mod) { try { routeMapping['WalkInChillerLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_welfarefacilities_html'));
    if (mod) { try { routeMapping['WelfareFacilities_CleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_cleaningequipment_cleaningchecklist_html'));
    if (mod) { try { routeMapping['CleaningEquipment_CleaningChecklist'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

try {
    const mod = normalizeMod(require('./generate_walkinfreezerlog_html'));
    if (mod) { try { routeMapping['WalkInFreezerLog'] = mod; } catch(e){} }
} catch (e) { console.error(e); }

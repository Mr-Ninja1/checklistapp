// Bundler-safe static mapping between EXPORT_KEYs (from presentational components)
// and HTML generator functions. This file avoids any dynamic require calls so
// Metro/RN bundling succeeds. It statically requires all known generator
// modules and all presentational components, then builds `mapping` and
// `routeMapping` (EXPORT_KEY -> generator function). Add manual overrides
// to `explicitOverrides` for any mismatches.

// --- Generators (static requires) ---
const gen_bakerycleaningchecklist = require('./generate_bakerycleaningchecklist_html');
const gen_bakerysanitizing = require('./generate_bakerysanitizing_html');
const gen_bakery_underbar_shelflife = require('./generate_bakery_underbar_shelflife_html');
const gen_bakingcontrolsheet = require('./generate_bakingcontrolsheet_html');
const gen_beveragereceiving = require('./generate_beveragereceiving_html');
const gen_binlinerschanginglog = require('./generate_binlinerschanginglog_html');
const gen_boh_shelflifeinspection = require('./generate_boh_shelflifeinspection_html');
const gen_bravohealthstatuscheck = require('./generate_bravohealthstatuscheck_html');
const gen_certificateofanalysis = require('./generate_certificateofanalysis_html');
const gen_chemicalsreceiving = require('./generate_chemicalsreceiving_html');
const gen_chilledfrozenreceiving = require('./generate_chilledfrozenreceiving_html');
const gen_cleaningequipment_cleaningchecklist = require('./generate_cleaningequipment_cleaningchecklist_html');
const gen_coldroom_freezerroomcleaningchecklist = require('./generate_coldroom_freezerroomcleaningchecklist_html');
const gen_cookingtemperature = require('./generate_cookingtemperature_html');
const gen_coolingtemperature = require('./generate_coolingtemperature_html');
const gen_customersatisfaction = require('./generate_customersatisfaction_html');
const gen_deepfreezertemperature = require('./generate_deepfreezertemperature_html');
const gen_displaychillertemperature = require('./generate_displaychillertemperature_html');
const gen_displaychiller_shelflife = require('./generate_displaychiller_shelflife_html');
const gen_drygoodsreceiving = require('./generate_drygoodsreceiving_html');
const gen_drystoragearea_cleaningchecklist = require('./generate_drystoragearea_cleaningchecklist_html');
const gen_eggsreceiving = require('./generate_eggsreceiving_html');
const gen_foh_dailycleaningpresentational = require('./generate_foh_dailycleaningpresentational_html');
const gen_foh_frontofhouse = require('./generate_foh_frontofhouse_html');
const gen_foodcontactsurfacecleaningandsanitizinglogsheet_kitchen = require('./generate_foodcontactsurfacecleaningandsanitizinglogsheet_kitchen_html');
const gen_foodcontactsurface_kitchen = require('./generate_foodcontactsurface_kitchen_html');
const gen_foodhandlers_log = require('./generate_foodhandlers_log_html');
const gen_foodhandlers_handwashing = require('./generate_foodhandlers_handwashing_html');
const gen_foodsamplescollection = require('./generate_foodsamplescollection_html');
const gen_fruit_washing_log = require('./generate_fruit_washing_log_html');
const gen_hotholdingtemperature = require('./generate_hotholdingtemperature_html');
const gen_kitchendailycleaning = require('./generate_kitchendailycleaning_html');
const gen_kitchenweeklycleaningchecklist = require('./generate_kitchenweeklycleaningchecklist_html');
const gen_kitchen_daily_cleaning = require('./generate_kitchen_daily_cleaning_html');
const gen_mixingcontrolsheet = require('./generate_mixingcontrolsheet_html');
const gen_mouldingproofingbakinglog = require('./generate_mouldingproofingbakinglog_html');
const gen_packagingmaterialsreceiving = require('./generate_packagingmaterialsreceiving_html');
const gen_pastinspectionform = require('./generate_pastinspectionform_html');
const gen_personalhygienechecklist = require('./generate_personalhygienechecklist_html');
const gen_personalprotectiveequipment = require('./generate_personalprotectiveequipment_html');
const gen_ppe_log = require('./generate_ppe_log_html');
const gen_preshiftmeetingattendance = require('./generate_preshiftmeetingattendance_html');
const gen_processqualityoutofcontrol = require('./generate_processqualityoutofcontrol_html');
const gen_productrejection = require('./generate_productrejection_html');
const gen_productrelease = require('./generate_productrelease_html');
const gen_productsnetcontentchecklist = require('./generate_productsnetcontentchecklist_html');
const gen_sculleryarea_cleaningchecklist = require('./generate_sculleryarea_cleaningchecklist_html');
const gen_thawingtemperature = require('./generate_thawingtemperature_html');
const gen_toolboxtalkregister = require('./generate_toolboxtalkregister_html');
const gen_trainingattendanceregister = require('./generate_trainingattendanceregister_html');
const gen_underbarchiller_temperature = require('./generate_underbarchiller_temperature_html');
const gen_vegetablesfruitsreceiving = require('./generate_vegetablesfruitsreceiving_html');
const gen_visitorslogbook = require('./generate_visitorslogbook_html');
const gen_walkinchillerlog = require('./generate_walkinchillerlog_html');
const gen_walkinfreezerlog = require('./generate_walkinfreezerlog_html');
const gen_welfarefacilities = require('./generate_welfarefacilities_html');
const gen_coolingtemperature_saved = require('./generate_coolingtemperature_html');

// mapping: generatorKey -> generator function
const mapping = {
	bakerycleaningchecklist: gen_bakerycleaningchecklist,
	bakerysanitizing: gen_bakerysanitizing,
	bakery_underbar_shelflife: gen_bakery_underbar_shelflife,
	bakingcontrolsheet: gen_bakingcontrolsheet,
	beveragereceiving: gen_beveragereceiving,
	binlinerschanginglog: gen_binlinerschanginglog,
	boh_shelflifeinspection: gen_boh_shelflifeinspection,
	bravohealthstatuscheck: gen_bravohealthstatuscheck,
	certificateofanalysis: gen_certificateofanalysis,
	chemicalsreceiving: gen_chemicalsreceiving,
	chilledfrozenreceiving: gen_chilledfrozenreceiving,
	cleaningequipment_cleaningchecklist: gen_cleaningequipment_cleaningchecklist,
	coldroom_freezerroomcleaningchecklist: gen_coldroom_freezerroomcleaningchecklist,
	cookingtemperature: gen_cookingtemperature,
	coolingtemperature: gen_coolingtemperature,
	customersatisfaction: gen_customersatisfaction,
	deepfreezertemperature: gen_deepfreezertemperature,
	displaychillertemperature: gen_displaychillertemperature,
	displaychiller_shelflife: gen_displaychiller_shelflife,
	drygoodsreceiving: gen_drygoodsreceiving,
	drystoragearea_cleaningchecklist: gen_drystoragearea_cleaningchecklist,
	eggsreceiving: gen_eggsreceiving,
	foh_dailycleaningpresentational: gen_foh_dailycleaningpresentational,
	foh_frontofhouse: gen_foh_frontofhouse,
	foodcontactsurfacecleaningandsanitizinglogsheet_kitchen: gen_foodcontactsurfacecleaningandsanitizinglogsheet_kitchen,
	foodcontactsurface_kitchen: gen_foodcontactsurface_kitchen,
	foodhandlers_log: gen_foodhandlers_log,
	foodhandlers_handwashing: gen_foodhandlers_handwashing,
	foodsamplescollection: gen_foodsamplescollection,
	fruit_washing_log: gen_fruit_washing_log,
	hotholdingtemperature: gen_hotholdingtemperature,
	kitchendailycleaning: gen_kitchendailycleaning,
	kitchenweeklycleaningchecklist: gen_kitchenweeklycleaningchecklist,
	kitchen_daily_cleaning: gen_kitchen_daily_cleaning,
	mixingcontrolsheet: gen_mixingcontrolsheet,
	mouldingproofingbakinglog: gen_mouldingproofingbakinglog,
	packagingmaterialsreceiving: gen_packagingmaterialsreceiving,
	pastinspectionform: gen_pastinspectionform,
	personalhygienechecklist: gen_personalhygienechecklist,
	personalprotectiveequipment: gen_personalprotectiveequipment,
	ppe_log: gen_ppe_log,
	preshiftmeetingattendance: gen_preshiftmeetingattendance,
	processqualityoutofcontrol: gen_processqualityoutofcontrol,
	productrejection: gen_productrejection,
	productrelease: gen_productrelease,
	productsnetcontentchecklist: gen_productsnetcontentchecklist,
	sculleryarea_cleaningchecklist: gen_sculleryarea_cleaningchecklist,
	thawingtemperature: gen_thawingtemperature,
	toolboxtalkregister: gen_toolboxtalkregister,
	trainingattendanceregister: gen_trainingattendanceregister,
	underbarchiller_temperature: gen_underbarchiller_temperature,
	vegetablesfruitsreceiving: gen_vegetablesfruitsreceiving,
	visitorslogbook: gen_visitorslogbook,
	walkinchillerlog: gen_walkinchillerlog,
	walkinfreezerlog: gen_walkinfreezerlog,
	welfarefacilities: gen_welfarefacilities,
	// alias for cooling temperature saved (keeps name stable)
	coolingtemperature_saved: gen_coolingtemperature_saved,
};

// --- Presentational components (static requires) ---
const BakeryCleaningChecklistPresentational = require('../../forms/components/BakeryCleaningChecklistPresentational');
const BakerySanitizingPresentational = require('../../forms/components/BakerySanitizingPresentational');
const Bakery_UnderbarShelfLifeInspectionPresentational = require('../../forms/components/Bakery_UnderbarShelfLifeInspectionPresentational');
const BakingControlSheetPresentational = require('../../forms/components/BakingControlSheetPresentational');
const BeverageReceivingPresentational = require('../../forms/components/BeverageReceivingPresentational');
const BinLinersChangingLogPresentational = require('../../forms/components/BinLinersChangingLogPresentational');
const BOH_ShelfLifeInspectionPresentational = require('../../forms/components/BOH_ShelfLifeInspectionPresentational');
const BravoHealthStatusCheckPresentational = require('../../forms/components/BravoHealthStatusCheckPresentational');
const CertificateOfAnalysisPresentational = require('../../forms/components/CertificateOfAnalysisPresentational');
const ChemicalsReceivingPresentational = require('../../forms/components/ChemicalsReceivingPresentational');
const ChilledFrozenReceivingPresentational = require('../../forms/components/ChilledFrozenReceivingPresentational');
const CleaningEquipment_CleaningChecklistPresentational = require('../../forms/components/CleaningEquipment_CleaningChecklistPresentational');
const ColdRoom_FreezerRoomCleaningChecklistPresentational = require('../../forms/components/ColdRoom_FreezerRoomCleaningChecklistPresentational');
const CookingTemperaturePresentational = require('../../forms/components/CookingTemperaturePresentational');
const CoolingTemperaturePresentational = require('../../forms/components/CoolingTemperaturePresentational');
const CoolingTemperatureSavedPresentational = require('../../forms/components/CoolingTemperatureSavedPresentational');
const CustomerSatisfactionPresentational = require('../../forms/components/CustomerSatisfactionPresentational');
const CustomerSatisfactionQuestionnairePresentational = require('../../forms/components/CustomerSatisfactionQuestionnairePresentational');
const DeepFreezerTemperaturePresentational = require('../../forms/components/DeepFreezerTemperaturePresentational');
const DisplayChillerShelfLifeInspectionPresentational = require('../../forms/components/DisplayChillerShelfLifeInspectionPresentational');
const DisplayChillerTemperaturePresentational = require('../../forms/components/DisplayChillerTemperaturePresentational');
const DryGoodsReceivingPresentational = require('../../forms/components/DryGoodsReceivingPresentational');
const DryStorageArea_CleaningChecklistPresentational = require('../../forms/components/DryStorageArea_CleaningChecklistPresentational');
const EggsReceivingPresentational = require('../../forms/components/EggsReceivingPresentational');
const FOH_DailyCleaningPresentational = require('../../forms/components/FOH_DailyCleaningPresentational');
const FOH_FrontOfHouseCleaningPresentational = require('../../forms/components/FOH_FrontOfHouseCleaningPresentational');
const FoodHandlersDailyShoweringPresentational = require('../../forms/components/FoodHandlersDailyShoweringPresentational');
const FoodHandlersPresentational = require('../../forms/components/FoodHandlersPresentational');
const FoodSamplesCollectionPresentational = require('../../forms/components/FoodSamplesCollectionPresentational');
const FruitWashingLogPresentational = require('../../forms/components/FruitWashingLogPresentational');
const HotHoldingTemperaturePresentational = require('../../forms/components/HotHoldingTemperaturePresentational');
const KitchenDailyCleaningPresentational = require('../../forms/components/KitchenDailyCleaningPresentational');
const KitchenWeeklyCleaningChecklistPresentational = require('../../forms/components/KitchenWeeklyCleaningChecklistPresentational');
const MixingControlSheetPresentational = require('../../forms/components/MixingControlSheetPresentational');
const MouldingProofingBakingLogPresentational = require('../../forms/components/MouldingProofingBakingLogPresentational');
const PackagingMaterialsReceivingPresentational = require('../../forms/components/PackagingMaterialsReceivingPresentational');
const PastInspectionFormPresentational = require('../../forms/components/PastInspectionFormPresentational');
const PersonalHygieneChecklistPresentational = require('../../forms/components/PersonalHygieneChecklistPresentational');
const PPEIssuancePresentational = require('../../forms/components/PPEIssuancePresentational');
const PreShiftMeetingAttendancePresentational = require('../../forms/components/PreShiftMeetingAttendancePresentational');
const ProcessQualityOutOfControlPresentational = require('../../forms/components/ProcessQualityOutOfControlPresentational');
const ProductRejectionPresentational = require('../../forms/components/ProductRejectionPresentational');
const ProductReleasePresentational = require('../../forms/components/ProductReleasePresentational');
const ProductsNetContentChecklistPresentational = require('../../forms/components/ProductsNetContentChecklistPresentational');
const SculleryArea_CleaningChecklistPresentational = require('../../forms/components/SculleryArea_CleaningChecklistPresentational');
const ThawingTemperaturePresentational = require('../../forms/components/ThawingTemperaturePresentational');
const ToolboxTalkRegisterPresentational = require('../../forms/components/ToolboxTalkRegisterPresentational');
const TrainingAttendanceRegisterPresentational = require('../../forms/components/TrainingAttendanceRegisterPresentational');
const UnderbarChillerTemperaturePresentational = require('../../forms/components/UnderbarChillerTemperaturePresentational');
const VegetablesFruitsReceivingPresentational = require('../../forms/components/VegetablesFruitsReceivingPresentational');
const VisitorsLogBookPresentational = require('../../forms/components/VisitorsLogBookPresentational');
const WalkInChillerLogPresentational = require('../../forms/components/WalkInChillerLogPresentational');
const WalkInFreezerLogPresentational = require('../../forms/components/WalkInFreezerLogPresentational');
const WelfareFacilitiesPresentational = require('../../forms/components/WelfareFacilitiesPresentational');

// Build routeMapping by reading each presentational module's EXPORT_KEY and
// looking up the corresponding generator in `mapping`.
const presentationalModules = {
	BakeryCleaningChecklistPresentational,
	BakerySanitizingPresentational,
	Bakery_UnderbarShelfLifeInspectionPresentational,
	BakingControlSheetPresentational,
	BeverageReceivingPresentational,
	BinLinersChangingLogPresentational,
	BOH_ShelfLifeInspectionPresentational,
	BravoHealthStatusCheckPresentational,
	CertificateOfAnalysisPresentational,
	ChemicalsReceivingPresentational,
	ChilledFrozenReceivingPresentational,
	CleaningEquipment_CleaningChecklistPresentational,
	ColdRoom_FreezerRoomCleaningChecklistPresentational,
	CookingTemperaturePresentational,
	CoolingTemperaturePresentational,
	CoolingTemperatureSavedPresentational,
	CustomerSatisfactionPresentational,
	CustomerSatisfactionQuestionnairePresentational,
	DeepFreezerTemperaturePresentational,
	DisplayChillerShelfLifeInspectionPresentational,
	DisplayChillerTemperaturePresentational,
	DryGoodsReceivingPresentational,
	DryStorageArea_CleaningChecklistPresentational,
	EggsReceivingPresentational,
	FOH_DailyCleaningPresentational,
	FOH_FrontOfHouseCleaningPresentational,
	FoodHandlersDailyShoweringPresentational,
	FoodHandlersPresentational,
	FoodSamplesCollectionPresentational,
	FruitWashingLogPresentational,
	HotHoldingTemperaturePresentational,
	KitchenDailyCleaningPresentational,
	KitchenWeeklyCleaningChecklistPresentational,
	MixingControlSheetPresentational,
	MouldingProofingBakingLogPresentational,
	PackagingMaterialsReceivingPresentational,
	PastInspectionFormPresentational,
	PersonalHygieneChecklistPresentational,
	PPEIssuancePresentational,
	PreShiftMeetingAttendancePresentational,
	ProcessQualityOutOfControlPresentational,
	ProductRejectionPresentational,
	ProductReleasePresentational,
	ProductsNetContentChecklistPresentational,
	SculleryArea_CleaningChecklistPresentational,
	ThawingTemperaturePresentational,
	ToolboxTalkRegisterPresentational,
	TrainingAttendanceRegisterPresentational,
	UnderbarChillerTemperaturePresentational,
	VegetablesFruitsReceivingPresentational,
	VisitorsLogBookPresentational,
	WalkInChillerLogPresentational,
	WalkInFreezerLogPresentational,
	WelfareFacilitiesPresentational,
};

// explicitOverrides: map EXPORT_KEY values that do not exactly match a
// generator key. Populate pairs: EXPORT_KEY -> mapping[generatorKey].
const explicitOverrides = {
	// Presentational EXPORT_KEY -> generator mapping
	bakery_underbar_shelf_life_inspection: mapping.bakery_underbar_shelflife,
	display_chiller_shelf_life_inspection: mapping.displaychiller_shelflife,
	food_handlers_daily_showering: mapping.foodhandlers_log,
	// Legacy / alternate keys for handwashing forms that sometimes appear as
	// different `formType` values in saved payloads. Map them explicitly to
	// the `foodhandlers_log` generator so handwashing sheets render correctly.
	FoodHandlersHandwashing: mapping.foodhandlers_handwashing,
	FoodHandlersHandwashing_AM: mapping.foodhandlers_handwashing,
	FoodHandlersHandwashing_PM: mapping.foodhandlers_handwashing,
	'Food Handlers Daily Handwashing Tracking Log Sheet': mapping.foodhandlers_handwashing,
	'Food Handlers Daily Handwashing Tracking Log Sheet — AM': mapping.foodhandlers_handwashing,
	'Food Handlers Daily Handwashing Tracking Log Sheet — PM': mapping.foodhandlers_handwashing,
	food_handlers_daily_handwashing_tracking_log_sheet: mapping.foodhandlers_handwashing,
	food_handlers_daily_handwashing_tracking_log_sheet_am: mapping.foodhandlers_handwashing,
	food_handlers_daily_handwashing_tracking_log_sheet_pm: mapping.foodhandlers_handwashing,
	FoodHandlersDailyHandwashingTrackingLogSheet: mapping.foodhandlers_handwashing,
	fruit_washing_log: mapping.fruit_washing_log,
	ppeissuance: mapping.ppe_log,
	underbar_chiller_temperature: mapping.underbarchiller_temperature,
	customer_satisfaction_questionnaire: mapping.customersatisfaction,
	foh_daily_cleaning: mapping.foh_dailycleaningpresentational,
	foh_front_of_house_cleaning: mapping.foh_frontofhouse,
	food_handlers: mapping.foodhandlers_log,
};


// Build a normalized lookup of mapping keys so we can match presentational
// EXPORT_KEY values to generator keys by normalization (no fallbacks beyond
// exact normalized match and explicitOverrides).
const normalizedMap = {};
Object.keys(mapping).forEach((mk) => {
	const nk = String(mk).toLowerCase().replace(/[^a-z0-9]+/g, '');
	normalizedMap[nk] = mk;
});

const routeMapping = {};
Object.values(presentationalModules).forEach((mod) => {
	const k = mod && (mod.EXPORT_KEY || mod.exportedKey || (mod.default && mod.default.EXPORT_KEY));
	if (!k) return;
	// normalized form of component EXPORT_KEY
	const nk = String(k).toLowerCase().replace(/[^a-z0-9]+/g, '');
	if (normalizedMap[nk]) {
		routeMapping[k] = mapping[normalizedMap[nk]];
	} else if (explicitOverrides[k]) {
		routeMapping[k] = explicitOverrides[k];
	}
});

// Also ensure explicitOverrides entries are present (explicit takes precedence)
Object.keys(explicitOverrides).forEach((ek) => { routeMapping[ek] = explicitOverrides[ek]; });

// Register common EXPORT_KEY variants so payloads that use route names
// or camelcased identifiers (legacy values stored as `formType`) still
// resolve to the correct generator. Do NOT override explicitOverrides.
function makeVariantsFromExportKey(k) {
	const s = String(k || '');
	const parts = s.split(/[^a-zA-Z0-9]+/).filter(Boolean);
	if (!parts.length) return [s];

	const pascal = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
	const pascalWithUnderscore = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('_');
	const joined = parts.join('');
	const underscored = parts.join('_');
	return Array.from(new Set([s, underscored, pascal, pascalWithUnderscore, joined]));
}

Object.keys(routeMapping).forEach((origKey) => {
    const variants = makeVariantsFromExportKey(origKey);
    variants.forEach((v) => {
        if (!v) return;
        if (explicitOverrides[v]) return; // explicit wins
        if (!routeMapping[v]) routeMapping[v] = routeMapping[origKey];
    });
});

// Extra defensive mappings: some saved payloads use a variety of route/formType
// strings (including camelCase, spaces, or suffixed AM/PM variants). Ensure
// common Food Handlers handwashing keys explicitly resolve to the
// `foodhandlers_log` generator so the correct template is always used.
[
	'FoodHandlersHandwashing',
	'FoodHandlersHandwashing_AM',
	'FoodHandlersHandwashing_PM',
	'FoodHandlersHandwashingForm_AM',
	'FoodHandlersHandwashingForm_PM',
	'FoodHandlersDailyHandwashing',
	'Food Handlers Daily Handwashing Tracking Log Sheet',
	'Food Handlers Daily Handwashing Tracking Log Sheet — AM',
	'Food Handlers Daily Handwashing Tracking Log Sheet — PM'
].forEach((k) => {
	if (!k) return;
	if (!routeMapping[k]) routeMapping[k] = mapping.foodhandlers_handwashing;
});

// Helper: derive candidate keys from a payload (mirrors desktop logic but
// works only against the static `mapping`/`routeMapping` keys — no dynamic
// requires). Returns the best match when `allowFallback` is true.
function getKeysFromPayload(payload) {
		const p = payload || {};
		const out = [];
		const pushNorm = (v) => {
				if (!v) return;
				try { const s = String(v).replace(/[^a-zA-Z0-9_]+/g, '_').toLowerCase(); if (s) out.push(s); } catch (e) {}
		};
		pushNorm(p.title);
		pushNorm(p.formType);
		pushNorm(p.formTypeName);
		pushNorm(p.name);
		pushNorm(p.template);
		pushNorm(p.metadata && p.metadata.subject);
		pushNorm(p.metadata && p.metadata.location);

		const rawTitle = (p.title || p.formType || p.name || '').toString().toLowerCase();
		if (rawTitle.includes('kitchen') && (rawTitle.includes('sanitiz') || rawTitle.includes('clean'))) out.push('kitchendailycleaning');
		if (rawTitle.includes('food contact') || rawTitle.includes('foodcontact')) out.push('kitchendailycleaning');
		if (rawTitle.includes('food handlers') || rawTitle.includes('foodhandlers') || rawTitle.includes('handwashing') || rawTitle.includes('hand wash')) {
			out.push('foodhandlers'); out.push('foodhandlersdailyhandwashing');
		}
		if (rawTitle.includes('ppe') || rawTitle.includes('personal') || rawTitle.includes('protect')) { out.push('ppe'); out.push('personalprotectiveequipment'); }

		return Array.from(new Set(out));
}

function longestCommonSubstring(a, b) {
		if (!a || !b) return 0;
		const m = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
		let longest = 0;
		for (let i = 0; i < a.length; i++) {
			for (let j = 0; j < b.length; j++) {
				if (a[i] === b[j]) {
					m[i + 1][j + 1] = m[i][j] + 1;
					if (m[i + 1][j + 1] > longest) longest = m[i + 1][j + 1];
				}
			}
		}
		return longest;
}

function getGeneratorForPayload(payload, opts = {}) {
		const allowFallback = !!opts.allowFallback || !!opts.forceFallback || !!opts.forceHtml;
		const p = payload || {};
		// 1) check exact routeMapping matches for common payload fields
		const candidatesToCheck = [p.formType, p.template, p.title, p.name].filter(Boolean);
		for (const c of candidatesToCheck) {
			if (!c) continue;
			if (routeMapping && routeMapping[c]) return { module: routeMapping[c], matchedKey: c, score: Infinity };
		}

		if (!allowFallback) return { module: null, matchedKey: null, score: 0 };

		// 2) build candidate normalized keys and score mapping keys
		const payloadKeys = getKeysFromPayload(p);
		const mapKeys = Object.keys(mapping || {});
		let best = { score: 0, key: null };
		for (const mk of mapKeys) {
			const base = String(mk).toLowerCase().replace(/[^a-z0-9]/g, '');
			let score = 0;
			for (const c of payloadKeys) {
				const cc = String(c).toLowerCase().replace(/[^a-z0-9]/g, '');
				if (cc === base) score += 10000;
				else if (cc.includes(base) || base.includes(cc)) score += 100 + Math.max(base.length, cc.length);
				else score += longestCommonSubstring(base, cc);
			}
			if (score > best.score) best = { score, key: mk };
		}

		if (best.key) return { module: mapping[best.key], matchedKey: best.key, score: best.score };
		return { module: null, matchedKey: null, score: 0 };
}

module.exports = { mapping, routeMapping, getGeneratorForPayload };


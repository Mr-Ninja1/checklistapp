import warnOnce from '../utils/warnOnce';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Platform, Dimensions, useWindowDimensions, StyleSheet, Modal, FlatList, Animated, PanResponder, KeyboardAvoidingView, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
let UpdatesModule = null;
try { UpdatesModule = require('expo-updates'); } catch (e) { UpdatesModule = null; }
import appConfig from '../app.json';
import { httpProbe, processQueue } from '../utils/uploadQueue';
import * as drive from '../utils/drive';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingOverlay from '../components/LoadingOverlay';

// Form data from Index.tsx (pruned to only include navigable cards)
const formCategories = {
  foh: {
    name: "FOH Records",
    color: ["#1EA7FF", "#04122a"],
    forms: [
      { id: 117, title: "Display Chiller Shelf-Life Inspection", status: "pending", priority: "high", dueTime: "Daily", location: "Display Chiller", route: 'DisplayChillerShelfLifeInspectionChecklist' },
      { id: 120, title: "DISPLAY CHILLER TEMPERATURE LOG SHEET - Upright", status: "pending", priority: "high", dueTime: "Daily", location: "Display Chiller - Upright", route: 'DisplayChillerTemperatureLog_Upright' },
      { id: 121, title: "DISPLAY CHILLER TEMPERATURE LOG SHEET - Grab and Go", status: "pending", priority: "high", dueTime: "Daily", location: "Display Chiller - Grab and Go", route: 'DisplayChillerTemperatureLog_GrabAndGo' },
      { id: 122, title: "DISPLAY CHILLER TEMPERATURE LOG SHEET - Gelato", status: "pending", priority: "high", dueTime: "Daily", location: "Display Chiller - Gelato", route: 'DisplayChillerTemperatureLog_Gelato' },
      { id: 123, title: "DISPLAY CHILLER TEMPERATURE LOG SHEET - Underbar", status: "pending", priority: "high", dueTime: "Daily", location: "Display Chiller - Underbar", route: 'DisplayChillerTemperatureLog_Underbar' },
  { id: 41, title: "FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH -PM", status: "pending", priority: "high", dueTime: "Each shift", location: "Front Counter", route: 'FOH_DailyCleaningForm_PM' },
      { id: 142, title: "FOOD CONTACT SURFACE CLEANING AND SANITIZING LOG SHEET FOH — AM", status: "pending", priority: "high", dueTime: "Each shift", location: "Front Counter", route: 'FOH_DailyCleaningForm_AM' },
      { id: 43, title: "Front of House Cleaning Checklist", status: "pending", priority: "high", dueTime: "Weekly", location: "Front of House", route: 'FOH_FrontOfHouseCleaningChecklist' }
    ]
  },
  production: {
    name: "Prod Records",
    color: ["#ff9966", "#ff5e62"],
    forms: [
      { id: 125, title: "Pre Shift Meeting Attendance Register", status: "pending", priority: "medium", dueTime: "As needed", location: "Training Room", route: 'PreShiftMeetingAttendanceRegister' },
  
      { id: 127, title: "Product Rejection Form", status: "pending", priority: "critical", dueTime: "As needed", location: "Quality", route: 'ProductRejectionForm' },
      { id: 126, title: "Bin Liners Changing Log", status: "pending", priority: "medium", dueTime: "Daily", location: "Production Floor", route: 'BinLinersChangingLog' },
      { id: 110, title: "Beverage & Water Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'BeverageReceivingForm' },
      { id: 114, title: "Dry Goods Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'DryGoodsReceivingForm' },
      { id: 113, title: "Chilled & Frozen Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'ChilledFrozenReceivingForm' },
      { id: 115, title: "Chemicals Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'ChemicalsReceivingForm' },
      { id: 116, title: "Eggs Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'EggsReceivingForm' },
      { id: 8, title: "Certificates of Analysis", status: "pending", priority: "critical", dueTime: "Daily", location: "Production Floor", route: 'CertificateOfAnalysis' },
      { id: 111, title: "Packaging Materials Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'PackagingMaterialsReceivingForm' },
      { id: 112, title: "Vegetables & Fruits Receiving", status: "pending", priority: "high", dueTime: "On delivery", location: "Receiving", route: 'VegetablesFruitsReceivingForm' },
      { id: 119, title: "Toolbox Talk Attendance", status: "pending", priority: "medium", dueTime: "As needed", location: "Training Room", route: 'ToolboxTalkRegister' },
      { id: 82, title: "Pest Inspection Form", status: "pending", priority: "medium", dueTime: "Weekly", location: "Facilities", route: 'PastInspectionForm' },
      { id: 83, title: "Customer Satisfaction Questionnaire", status: "pending", priority: "low", dueTime: "As needed", location: "Reception", route: 'CustomerSatisfactionQuestionnaire' },
      { id: 81, title: "Process & Quality Out of Control Report", status: "pending", priority: "critical", dueTime: "As needed", location: "Quality", route: 'ProcessQualityOutOfControlReport' },
      { id: 10, title: "Product Release", status: "pending", priority: "critical", dueTime: "Before dispatch", location: "Quality Lab", route: 'ProductReleaseForm' },
  { id: 11, title: "Food Handlers Daily Handwashing — AM", status: "pending", priority: "high", dueTime: "6:00 AM", location: "Production Entry", route: 'FoodHandlersHandwashingForm_AM' },
  { id: 12, title: "Food Handlers Daily Handwashing — PM", status: "pending", priority: "high", dueTime: "3:00 PM", location: "Production Entry", route: 'FoodHandlersHandwashingForm_PM' },
      { id: 13, title: "Food Handlers Daily Showering Log", status: "pending", priority: "medium", dueTime: "Weekly", location: "Locker Room", route: 'FoodHandlersDailyShoweringForm' },
      { id: 14, title: "Food Sample Collection", status: "overdue", priority: "critical", dueTime: "1 hour ago", location: "Production Line", route: 'FoodSamplesCollectionLog' },
      { id: 50, title: "Fruit, Vegetable Washing Log", status: "pending", priority: "high", dueTime: "Before use", location: "Wash Station", route: 'FruitWashingLog' },
      { id: 118, title: "Training Attendance Register", status: "pending", priority: "medium", dueTime: "As needed", location: "Training Room", route: 'TrainingAttendanceRegister' }
    ]
  },
  kitchen: {
    name: "Kitchen Records",
    color: ["#56ccf2", "#2f80ed"],
    forms: [
        { id: 75, title: "Underbar Chiller Shelf-Life Inspection Checklist", status: "pending", priority: "medium", dueTime: "Daily", location: "Underbar Chiller", route: 'Bakery_UnderbarShelfLifeInspectionChecklist' },
      { id: 43, title: "Kitchen Weekly Cleaning Checklist", status: "pending", priority: "high", dueTime: "Weekly", location: "Kitchen Area", route: 'Kitchen_WeeklyCleaningChecklist' },
  { id: 42, title: "Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — AM", status: "pending", priority: "high", dueTime: "Each shift", location: "Main Kitchen", route: 'Kitchen_DailyCleaningForm' },
  { id: 71, title: "Food Contact Surface Cleaning and Sanitizing Log Sheet (Kitchen) — PM", status: "pending", priority: "high", dueTime: "Each shift", location: "Main Kitchen", route: 'Kitchen_DailyCleaningForm_PM' },
  { id: 70, title: "Underbar Chiller Temperature Log — 1", status: "pending", priority: "high", dueTime: "Monthly", location: "Underbar Chiller 1", route: 'UnderbarChillerTemperatureLog1' },
  { id: 72, title: "Underbar Chiller Temperature Log — 2", status: "pending", priority: "high", dueTime: "Monthly", location: "Underbar Chiller 2", route: 'UnderbarChillerTemperatureLog2' },
      { id: 18, title: "Cooking Temp Log", status: "pending", priority: "critical", dueTime: "Every cooking", location: "Cooking Station", route: 'CookingTemperatureLog' },
      { id: 99, title: "Thawing Temperature Log", status: "pending", priority: "high", dueTime: "During thawing", location: "Prep Area", route: 'ThawingTemperatureLog' },
      { id: 21, title: "Hot Holding Temp Log", status: "completed", priority: "critical", dueTime: "Every 2 hours", location: "Service Line", route: 'HotHoldingTemperatureLog' }
    ]
  },
  bakery: {
    name: "Bakery Records",
    color: ["#fa709a", "#fee140"],
    forms: [
      { id: 19, title: "Cooling Temp Log", status: "overdue", priority: "critical", dueTime: "30 min ago", location: "Cooling Area", route: 'CoolingTemperatureLog' },
      { id: 74, title: "DEEP FREEZER TEMPERATURE LOG SHEET - Storage", status: "pending", priority: "high", dueTime: "Monthly", location: "Deep Freezer - Storage", route: 'DeepFreezerTemperatureLog_Storage' },
      { id: 76, title: "DEEP FREEZER TEMPERATURE LOG SHEET - Blast", status: "pending", priority: "high", dueTime: "Monthly", location: "Deep Freezer - Blast", route: 'DeepFreezerTemperatureLog_Blast' },
      { id: 77, title: "DEEP FREEZER TEMPERATURE LOG SHEET - Production", status: "pending", priority: "high", dueTime: "Monthly", location: "Deep Freezer - Production", route: 'DeepFreezerTemperatureLog_Production' },
      { id: 170, title: "Underbar Chiller Temperature Log — 1", status: "pending", priority: "high", dueTime: "Monthly", location: "Underbar Chiller 1", route: 'Bakery_UnderbarChillerTemperatureLog1' },
      { id: 172, title: "Underbar Chiller Temperature Log — 2", status: "pending", priority: "high", dueTime: "Monthly", location: "Underbar Chiller 2", route: 'Bakery_UnderbarChillerTemperatureLog2' },
      { id: 24, title: "Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery — AM", status: "pending", priority: "high", dueTime: "Each shift", location: "Bakery Floor", route: 'Bakery_SanitizingLog_AM' },
      { id: 25, title: "Food Contact Surface Cleaning and Sanitizing Log Sheet - Bakery — PM", status: "pending", priority: "high", dueTime: "Each shift", location: "Bakery Floor", route: 'Bakery_SanitizingLog_PM' },
      { id: 31, title: "Bakery Area Cleaning Checklist", status: "pending", priority: "high", dueTime: "Weekly", location: "Bakery Floor", route: 'Bakery_CleaningChecklist' },
      { id: 27, title: "Baking Control Sheet", status: "overdue", priority: "critical", dueTime: "45 min ago", location: "Oven Station", route: 'BakingControlSheet' },
      { id: 28, title: "Mixing Control Sheet", status: "pending", priority: "high", dueTime: "Each mix", location: "Mixing Station", route: 'MixingControlSheet' },
      { id: 48, title: "PRODUCTS NET CONTENT CHECKLIST", status: "pending", priority: "medium", dueTime: "Daily", location: "Bakery", route: 'ProductsNetContentChecklist' },
      { id: 171, title: "MOULDING PROOFING AND BAKING LOG SHEET", status: "pending", priority: "high", dueTime: "Each batch", location: "Bakery - Moulding", route: 'MouldingProofingBakingLog' },
      { id: 41, title: "BOH PRODUCTS SHELF-LIFE INSPECTION CHECKLIST", status: "pending", priority: "medium", dueTime: "Daily", location: "Storage Area", route: 'BOH_ShelfLifeInspectionChecklist' }
    ]
  },
  boh: {
    name: "BOH Records",
    color: ["#f7971e", "#ffd200"],
    forms: [
      { id: 100, title: "Personal Protective Equipment", status: "pending", priority: "high", dueTime: "As needed", location: "BOH", route: 'PPEIssuanceForm' },
      { id: 200, title: "Visitors Log Book", status: "pending", priority: "medium", dueTime: "Per shift", location: "Reception", route: 'VisitorsLogBook' },
      { id: 101, title: "Personal Hygiene Checklist", status: "pending", priority: "high", dueTime: "Daily", location: "BOH", route: 'PersonalHygieneChecklist' },
      { id: 102, title: "Health Status Checklist", status: "pending", priority: "critical", dueTime: "Daily", location: "BOH", route: 'BravoHealthStatusCheck' },
      { id: 31, title: "Dry Storage Area Cleaning", status: "pending", priority: "medium", dueTime: "Monday", location: "Storage Room", route: 'DryStorageArea_CleaningChecklist' },
      { id: 33, title: "Weekly Scullery Area Cleaning", status: "pending", priority: "medium", dueTime: "Sunday", location: "Scullery", route: 'SculleryArea_CleaningChecklist' },
      { id: 44, title: "Cold Room & Freezer Room Cleaning Checklist", status: "pending", priority: "high", dueTime: "Weekly", location: "Cold Storage", route: 'ColdRoom_FreezerRoomCleaningChecklist' },
      { id: 47, title: "WALK-IN CHILLER TEMPERATURE CHECKLIST", status: "pending", priority: "high", dueTime: "Monthly", location: "Walk-in Chiller", route: 'WalkInChillerLog' },
      { id: 45, title: "Welfare Facilities Cleaning Checklist", status: "pending", priority: "medium", dueTime: "Weekly", location: "Staff Area", route: 'WelfareFacilities_CleaningChecklist' },
      { id: 46, title: "Cleaning Equipment Checklist", status: "pending", priority: "medium", dueTime: "Weekly", location: "Cleaning Equipment", route: 'CleaningEquipment_CleaningChecklist' },
      { id: 37, title: "WALK-IN FREEZER TEMPERATURE CHECKLIST", status: "pending", priority: "critical", dueTime: "Daily", location: "Walk-in Freezer", route: 'WalkInFreezerLog' },
      
    ]
  }
};

// Clean up any entries that don't point to a real route (keep handwashing special-case)
Object.keys(formCategories).forEach(catKey => {
  const cat = formCategories[catKey];
  if (cat && Array.isArray(cat.forms)) {
    cat.forms = cat.forms.filter(f => f && (f.route || f.isHandwashingLog));
  }
});

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return { backgroundColor: '#1EA7FF', color: '#fff' };
    case 'pending': return { backgroundColor: '#ffd200', color: '#333' };
    case 'overdue': return { backgroundColor: '#ff5e62', color: '#fff' };
    default: return { backgroundColor: '#eee', color: '#333' };
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return { borderColor: '#ff5e62', color: '#ff5e62' };
    case 'high': return { borderColor: '#ffd200', color: '#ffd200' };
    case 'medium': return { borderColor: '#1EA7FF', color: '#1EA7FF' };
    case 'low': return { borderColor: '#aaa', color: '#aaa' };
    default: return { borderColor: '#eee', color: '#333' };
  }
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, setThemeMode } = useTheme();
  const [activeCategory, setActiveCategory] = useState('foh');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Please wait');
  // Date/time
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const yearString = now.getFullYear();
  // show banner only for first 3 days of January
  const isNewYearSeason = (now.getMonth() === 0 && now.getDate() <= 3);
  const [showNewYearBanner, setShowNewYearBanner] = useState(true);
  const confettiColors = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3', '#FF9800'];
  const confetti = React.useMemo(() => new Array(8).fill(0).map((_, i) => ({ id: i, left: `${5 + Math.round(Math.random() * 90)}%`, color: confettiColors[i % confettiColors.length] })), []);
  const confettiAnims = React.useRef(confetti.map(() => new Animated.Value(0))).current;
  React.useEffect(() => {
    // animate confetti particles in a gentle loop
    try {
      confettiAnims.forEach((a, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 120),
            Animated.timing(a, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(a, { toValue: 0, duration: 900, useNativeDriver: true }),
          ])
        ).start();
      });
    } catch (e) {}
  }, []);
  // subtle pulse for the banner text
  const textPulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(textPulse, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(textPulse, { toValue: 0, duration: 900, useNativeDriver: true })])).start();
  }, []);

  // Full-screen seasonal decorations (header pulse + confetti)
  const headerPulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(Animated.sequence([Animated.timing(headerPulse, { toValue: 1, duration: 1200, useNativeDriver: true }), Animated.timing(headerPulse, { toValue: 0, duration: 1200, useNativeDriver: true })])).start();
  }, []);

  // global confetti particles for the whole screen
  const globalConfetti = React.useMemo(() => new Array(22).fill(0).map((_, i) => ({ id: i, left: Math.round(Math.random() * 100) + '%', size: 6 + (i % 4) * 2, color: confettiColors[i % confettiColors.length], delay: Math.round(Math.random() * 800) })), []);
  const globalAnims = React.useRef(globalConfetti.map(() => new Animated.Value(0))).current;
  React.useEffect(() => {
    try {
      globalAnims.forEach((a, i) => {
        Animated.loop(Animated.sequence([
          Animated.delay(globalConfetti[i].delay),
          Animated.timing(a, { toValue: 1, duration: 2400 + (i % 5) * 300, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.delay(400 + (i % 3) * 200),
        ])).start();
      });
    } catch (e) {}
  }, []);

  // gentle floating motion for the Bravo AI icon
  const aiFloat = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(aiFloat, { toValue: -6, duration: 1400, useNativeDriver: true }),
        Animated.timing(aiFloat, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [aiFloat]);

  // pulsing glow for the Bravo AI CTA button
  const aiCtaPulse = React.useRef(new Animated.Value(0)).current;
  const aiCtaScale = aiCtaPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(aiCtaPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(aiCtaPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [aiCtaPulse]);

  // futuristic glow ring around the Bravo AI icon
  const aiGlow = React.useRef(new Animated.Value(0)).current;
  const aiGlowScale = aiGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const aiGlowOpacity = aiGlow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(aiGlow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(aiGlow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [aiGlow]);

  // drag position and pan responder for the Bravo AI icon
  const aiPan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const aiPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        try {
          const curX = (typeof aiPan.x._value === 'number') ? aiPan.x._value : (aiPan.x.__getValue ? aiPan.x.__getValue() : 0);
          const curY = (typeof aiPan.y._value === 'number') ? aiPan.y._value : (aiPan.y.__getValue ? aiPan.y.__getValue() : 0);
          aiPan.setOffset({ x: curX, y: curY });
          aiPan.setValue({ x: 0, y: 0 });
        } catch (e) {}
      },
      onPanResponderMove: (_, gesture) => {
        try { aiPan.setValue({ x: gesture.dx, y: gesture.dy }); } catch (e) {}
      },
      onPanResponderRelease: (_, gesture) => {
        try { aiPan.flattenOffset(); } catch (e) {}
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
          setAiInfoVisible(true);
        }
      },
    })
  ).current;

  // Filter forms by category and search; exclude cards that don't link to a form
  function getFilteredForms(category) {
    const forms = formCategories[category].forms
      .filter(f => f.route || f.isHandwashingLog); // only show cards that navigate somewhere
    if (!searchTerm) return forms;
    return forms.filter(f =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.location && f.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Status color helpers
  function getStatusColor(status) {
    switch (status) {
      case 'completed': return { backgroundColor: '#43cea2', color: '#fff' };
      case 'pending': return { backgroundColor: '#ffd200', color: '#222' };
      case 'overdue': return { backgroundColor: '#ff5e62', color: '#fff' };
      default: return { backgroundColor: '#eee', color: '#222' };
    }
  }
  function getPriorityColor(priority) {
    switch (priority) {
      case 'high': return { borderColor: '#ffd200', color: '#ffd200' };
      case 'medium': return { borderColor: '#43cea2', color: '#43cea2' };
      case 'critical': return { borderColor: '#ff5e62', color: '#ff5e62' };
      case 'low': return { borderColor: '#aaa', color: '#aaa' };
      default: return { borderColor: '#eee', color: '#222' };
    }
  }

  const { width, height } = useWindowDimensions();
  const isWide = width > 700;
  const isMobile = width < 700;
  const watermarkSize = Math.round(Math.min(640, Math.max(200, width * 0.55)));

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Updates modal state — show once per app version (persist seen version)
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  // Determine app version at runtime. Prefer the runtime manifest / expoConfig when available
  const runtimeVersionFromConstants = (Constants && (Constants.manifest && Constants.manifest.version)) || (Constants && Constants.expoConfig && Constants.expoConfig.version) || (Constants && Constants.manifest2 && Constants.manifest2.version);
  const currentAppVersion = runtimeVersionFromConstants || (appConfig && appConfig.expo && appConfig.expo.version) || (appConfig.version || '1.0.0');

  // Detect an OTA/bundle update id when available (Expo Updates / manifest fields)
  const currentUpdateId = (UpdatesModule && UpdatesModule.updateId) ||
    (Constants && Constants.manifest && (Constants.manifest.releaseId || Constants.manifest.id || Constants.manifest.revisionId)) ||
    (Constants && Constants.manifest2 && (Constants.manifest2.revisionId || Constants.manifest2.id)) ||
    (Constants && Constants.expoConfig && Constants.expoConfig.updates && Constants.expoConfig.updates.updateId) ||
    null;

  // Manual whats-new identifier.
  // Increment or update this string whenever you publish a JS-only update that should show the "What's New" modal.
  // This ensures JS-only deployments (which don't bump native version) can still trigger the modal.
  const CURRENT_WHATS_NEW_ID = 'whats_new_2026-03-21_foh_exports_v1';

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const seenVersion = await AsyncStorage.getItem('@updates_modal_seen_version');
        const lastSeenUpdateId = await AsyncStorage.getItem('@updates_last_seen_id');
        const lastSeenWhats = await AsyncStorage.getItem('@whats_new_seen_id');

        // Show modal if app version changed OR if an OTA update id changed
        let shouldShow = false;
        if (!seenVersion || seenVersion !== currentAppVersion) shouldShow = true;
        if (currentUpdateId && (!lastSeenUpdateId || lastSeenUpdateId !== currentUpdateId)) shouldShow = true;
        // Also show if the developer-updated What's New id changed (useful for JS-only updates)
        if (CURRENT_WHATS_NEW_ID && (!lastSeenWhats || lastSeenWhats !== CURRENT_WHATS_NEW_ID)) shouldShow = true;

        if (mounted) setShowUpdatesModal(Boolean(shouldShow));
      } catch (e) {
        if (mounted) setShowUpdatesModal(true);
      }
    })();
    return () => { mounted = false; };
  }, [currentAppVersion, currentUpdateId]);

  const handleUpdatesSeen = async () => {
    try {
      await AsyncStorage.setItem('@updates_modal_seen_version', String(currentAppVersion));
      if (typeof currentUpdateId === 'string' && currentUpdateId) {
        try { await AsyncStorage.setItem('@updates_last_seen_id', String(currentUpdateId)); } catch (e) {}
      }
      // Persist that the user has seen the current What's New id
      try { if (CURRENT_WHATS_NEW_ID) await AsyncStorage.setItem('@whats_new_seen_id', String(CURRENT_WHATS_NEW_ID)); } catch (e) {}
    } catch (e) {}
    setShowUpdatesModal(false);
  };
  // (Abdu verification modal removed)

  // Flatten all forms for quick search
  const allForms = Object.keys(formCategories).reduce((acc, key) => {
    const cat = formCategories[key];
    if (cat && Array.isArray(cat.forms)) {
      cat.forms.forEach(f => {
        if (f && (f.route || f.isHandwashingLog)) acc.push({ ...f, category: cat.name });
      });
    }
    return acc;
  }, []);

  // Draggable floating buttons: compute initial positions (use left/top for Animated layout)
  const searchSize = isMobile ? 56 : 68;
  const historySize = isMobile ? 64 : 80;
  const searchRight = isMobile ? 18 : 32;
  const historyRight = isMobile ? 18 : 32;
  const initialSearchLeft = Math.max(12, width - searchRight - searchSize);
  const initialHistoryLeft = Math.max(12, width - historyRight - historySize);
  const initialSearchTop = isMobile ? 380 : 480; // moved further up so they don't touch
  const initialHistoryTop = isMobile ? 520 : 620;

  const searchPos = React.useRef(new Animated.ValueXY({ x: initialSearchLeft, y: initialSearchTop })).current;
  const historyPos = React.useRef(new Animated.ValueXY({ x: initialHistoryLeft, y: initialHistoryTop })).current;
  const searchDragEnabled = React.useRef(false);
  const historyDragEnabled = React.useRef(false);
  const searchDragTimer = React.useRef(null);
  const historyDragTimer = React.useRef(null);
  const searchLastSave = React.useRef(0);
  const historyLastSave = React.useRef(0);

  // keep previous dimensions so we can map positions on orientation change
  const prevWindow = React.useRef({ width, height });

  const searchPan = React.useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // prepare offset for dragging, start a short timer to require long-press to enable movement
      try {
        const curX = (typeof searchPos.x._value === 'number') ? searchPos.x._value : (searchPos.x.__getValue ? searchPos.x.__getValue() : 0);
        const curY = (typeof searchPos.y._value === 'number') ? searchPos.y._value : (searchPos.y.__getValue ? searchPos.y.__getValue() : 0);
        searchPos.setOffset({ x: curX, y: curY });
        searchPos.setValue({ x: 0, y: 0 });
      } catch (e) {}
      searchDragEnabled.current = false;
      if (searchDragTimer.current) clearTimeout(searchDragTimer.current);
      searchDragTimer.current = setTimeout(() => { searchDragEnabled.current = true; }, 220);
    },
    onPanResponderMove: (_, gesture) => {
      // only move when long-press timer has fired
      if (searchDragEnabled.current) {
        try {
          searchPos.setValue({ x: gesture.dx, y: gesture.dy });
        } catch (e) {}
        // throttle save during drag
        try {
          const now = Date.now();
          if (now - searchLastSave.current > 500) {
            searchLastSave.current = now;
            // compute current absolute coords
            const curX = (typeof searchPos.x._value === 'number') ? searchPos.x._value : (searchPos.x.__getValue ? searchPos.x.__getValue() : 0);
            const curY = (typeof searchPos.y._value === 'number') ? searchPos.y._value : (searchPos.y.__getValue ? searchPos.y.__getValue() : 0);
            const xp = Math.max(0, Math.min(1, (curX - 8) / Math.max(1, width - searchSize - 16)));
            const yp = Math.max(0, Math.min(1, (curY - 8) / Math.max(1, height - searchSize - 16)));
            AsyncStorage.setItem('@floating_search_pos', JSON.stringify({ x: curX, y: curY, xp, yp })).catch(() => {});
          }
        } catch (e) {}
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (searchDragTimer.current) { clearTimeout(searchDragTimer.current); searchDragTimer.current = null; }
      // if long-press not reached treat as tap
      if (!searchDragEnabled.current && Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
        // reset any offset
        try { searchPos.flattenOffset(); } catch (e) {}
        setSearchModalVisible(true);
        setSearchQuery('');
        return;
      }
      // finalize drag
      try { searchPos.flattenOffset(); } catch (e) {}
      const curX = (typeof searchPos.x._value === 'number') ? searchPos.x._value : (searchPos.x.__getValue ? searchPos.x.__getValue() : 0);
      const curY = (typeof searchPos.y._value === 'number') ? searchPos.y._value : (searchPos.y.__getValue ? searchPos.y.__getValue() : 0);
      const nx = Math.max(8, Math.min(curX, width - searchSize - 8));
      const ny = Math.max(8, Math.min(curY, Math.max(8, (height || 800) - searchSize - 8)));
      Animated.spring(searchPos, { toValue: { x: nx, y: ny }, useNativeDriver: false }).start(async () => {
        try { await AsyncStorage.setItem('@floating_search_pos', JSON.stringify({ x: nx, y: ny })); } catch (e) {}
      });
      searchDragEnabled.current = false;
    }
  })).current;

  const historyPan = React.useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      try {
        const curX = (typeof historyPos.x._value === 'number') ? historyPos.x._value : (historyPos.x.__getValue ? historyPos.x.__getValue() : 0);
        const curY = (typeof historyPos.y._value === 'number') ? historyPos.y._value : (historyPos.y.__getValue ? historyPos.y.__getValue() : 0);
        historyPos.setOffset({ x: curX, y: curY });
        historyPos.setValue({ x: 0, y: 0 });
      } catch (e) {}
      historyDragEnabled.current = false;
      if (historyDragTimer.current) clearTimeout(historyDragTimer.current);
      historyDragTimer.current = setTimeout(() => { historyDragEnabled.current = true; }, 220);
    },
    onPanResponderMove: (_, gesture) => {
      if (historyDragEnabled.current) {
        try { historyPos.setValue({ x: gesture.dx, y: gesture.dy }); } catch (e) {}
        try {
          const now = Date.now();
          if (now - historyLastSave.current > 500) {
            historyLastSave.current = now;
            const curX = (typeof historyPos.x._value === 'number') ? historyPos.x._value : (historyPos.x.__getValue ? historyPos.x.__getValue() : 0);
            const curY = (typeof historyPos.y._value === 'number') ? historyPos.y._value : (historyPos.y.__getValue ? historyPos.y.__getValue() : 0);
            const xp = Math.max(0, Math.min(1, (curX - 8) / Math.max(1, width - historySize - 16)));
            const yp = Math.max(0, Math.min(1, (curY - 8) / Math.max(1, height - historySize - 16)));
            AsyncStorage.setItem('@floating_history_pos', JSON.stringify({ x: curX, y: curY, xp, yp })).catch(() => {});
          }
        } catch (e) {}
      }
    },
    onPanResponderRelease: (_, gesture) => { 
      if (historyDragTimer.current) { clearTimeout(historyDragTimer.current); historyDragTimer.current = null; }
      if (!historyDragEnabled.current && Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
        try { navigation.navigate('FormSaves'); } catch (e) { console.warn('navigate failed', e); }
        try { historyPos.flattenOffset(); } catch (e) {}
        return;
      }
      try { historyPos.flattenOffset(); } catch (e) {}
      const curX = (typeof historyPos.x._value === 'number') ? historyPos.x._value : (historyPos.x.__getValue ? historyPos.x.__getValue() : 0);
      const curY = (typeof historyPos.y._value === 'number') ? historyPos.y._value : (historyPos.y.__getValue ? historyPos.y.__getValue() : 0);
      const nx = Math.max(8, Math.min(curX, width - historySize - 8));
      const ny = Math.max(8, Math.min(curY, Math.max(8, (height || 800) - historySize - 8)));
      Animated.spring(historyPos, { toValue: { x: nx, y: ny }, useNativeDriver: false }).start(async () => {
        try { await AsyncStorage.setItem('@floating_history_pos', JSON.stringify({ x: nx, y: ny })); } catch (e) {}
      });
      historyDragEnabled.current = false;
    }
  })).current;

  // When dimensions change (orientation/resize), reposition floating buttons
  React.useEffect(() => {
    const prev = prevWindow.current || { width, height };
    // Only run if size actually changed
    if (prev.width === width && prev.height === height) return;

    const animateToWithinBounds = (posRef, size) => {
      try {
        const curX = posRef.x && (typeof posRef.x._value === 'number' ? posRef.x._value : posRef.x.__getValue && posRef.x.__getValue());
        const curY = posRef.y && (typeof posRef.y._value === 'number' ? posRef.y._value : posRef.y.__getValue && posRef.y.__getValue());
        if (typeof curX !== 'number' || typeof curY !== 'number') return;

        // percentage-based mapping: compute percentage in previous viewport and map to new
        const prevAvailW = Math.max(1, prev.width - size - 16); // minus padding margins used (8+8)
        const prevAvailH = Math.max(1, prev.height - size - 16);
        const pctX = Math.max(0, Math.min(1, (curX - 8) / prevAvailW));
        const pctY = Math.max(0, Math.min(1, (curY - 8) / prevAvailH));

        const newAvailW = Math.max(0, width - size - 16);
        const newAvailH = Math.max(0, height - size - 16);
        const nextX = Math.round(8 + pctX * newAvailW);
        const nextY = Math.round(8 + pctY * newAvailH);

        Animated.spring(posRef, { toValue: { x: nextX, y: nextY }, useNativeDriver: false }).start();
      } catch (e) { /* ignore */ }
    };

    animateToWithinBounds(searchPos, searchSize);
    animateToWithinBounds(historyPos, historySize);

    prevWindow.current = { width, height };
  }, [width, height, searchPos, historyPos, searchSize, historySize]);

  // Load persisted positions on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await AsyncStorage.getItem('@floating_search_pos');
        const h = await AsyncStorage.getItem('@floating_history_pos');
        if (!mounted) return;
        if (s) {
          const p = JSON.parse(s);
          if (p) {
            // if percentage stored, use that to map to current size; otherwise use raw pixels
            if (typeof p.xp === 'number' && typeof p.yp === 'number') {
              const availW = Math.max(0, width - searchSize - 16);
              const availH = Math.max(0, height - searchSize - 16);
              const x = Math.round(8 + (p.xp * availW));
              const y = Math.round(8 + (p.yp * availH));
              searchPos.setValue({ x, y });
            } else if (typeof p.x === 'number' && typeof p.y === 'number') {
              searchPos.setValue({ x: p.x, y: p.y });
            }
          }
        }
        if (h) {
          const p = JSON.parse(h);
          if (p) {
            if (typeof p.xp === 'number' && typeof p.yp === 'number') {
              const availW = Math.max(0, width - historySize - 16);
              const availH = Math.max(0, height - historySize - 16);
              const x = Math.round(8 + (p.xp * availW));
              const y = Math.round(8 + (p.yp * availH));
              historyPos.setValue({ x, y });
            } else if (typeof p.x === 'number' && typeof p.y === 'number') {
              historyPos.setValue({ x: p.x, y: p.y });
            }
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; if (searchDragTimer.current) { clearTimeout(searchDragTimer.current); searchDragTimer.current = null; } if (historyDragTimer.current) { clearTimeout(historyDragTimer.current); historyDragTimer.current = null; } };
  }, [searchPos, historyPos]);

  // Internet reachability status for header icon (default to false so the
  // icon is visible immediately while the first probe runs).
  const [hasInternet, setHasInternet] = useState(false);
  // start as `null` so we don't flash the banner while we check token on mount
  // banner will be shown only when dropboxConnected === false
  const [dropboxConnected, setDropboxConnected] = useState(null);
  const [dropboxUser, setDropboxUser] = useState(null);
  const [dropboxStorage, setDropboxStorage] = useState(null);
  const [dropboxInfoLoading, setDropboxInfoLoading] = useState(false);
  const [dropboxDebugVisible, setDropboxDebugVisible] = useState(false);
  const [dropboxDebugLog, setDropboxDebugLog] = useState([]);
  const [dropboxAlmostFullDismissed, setDropboxAlmostFullDismissed] = useState(false);
  const [staffInfoVisible, setStaffInfoVisible] = useState(false);
  const [footerCreditVisible, setFooterCreditVisible] = useState(false);
  const [aiInfoVisible, setAiInfoVisible] = useState(false);

  const addDebugLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    setDropboxDebugLog(prev => [...prev.slice(-99), entry]); // keep last 100 messages
  };

  useEffect(() => {
    let mounted = true;
    let timer = null;
    let authUnsub = null;
    const probe = async () => {
      try {
        const ok = await httpProbe();
        if (mounted) setHasInternet(!!ok);
      } catch (e) {
        if (mounted) setHasInternet(false);
      }
    };
    // initial
    probe();
    // read dropbox auth state and subscribe for changes
    (async () => {
      try {
        const t = await drive.getAccessToken().catch(() => null);
        if (mounted) setDropboxConnected(Boolean(t));
      } catch (e) { if (mounted) setDropboxConnected(false); }
      try {
        const unsub = drive.addAuthListener && drive.addAuthListener((isSignedIn) => {
          try { if (mounted) setDropboxConnected(Boolean(isSignedIn)); } catch (e) {}
        });
        if (typeof unsub === 'function') authUnsub = unsub;
      } catch (e) {}
    })();
    // poll periodically; matches uploadQueue fallback interval
    timer = setInterval(probe, 10 * 1000);
    return () => { mounted = false; if (timer) clearInterval(timer); try { if (typeof authUnsub === 'function') authUnsub(); } catch (e) {} };
  }, []);

  // fetch dropbox user info and storage usage when signed in
  React.useEffect(() => {
    let mounted = true;
    const fetchInfo = async () => {
      try {
        setDropboxInfoLoading(true);
        console.log('[Dropbox] fetchInfo: starting user/storage fetch');
        let ui = await drive.getUserInfo().catch(() => null);
        console.log('[Dropbox] getUserInfo returned:', ui);
        // If no persisted userinfo exists, try fetching it from Dropbox API using token
        try {
          const token = await drive.getAccessToken().catch(() => null);
          console.log('[Dropbox] getAccessToken returned:', token ? 'token present' : 'no token');
          if (!ui && token) {
            try {
              console.log('[Dropbox] Fetching user account from API...');
              const ures = await fetch('https://api.dropboxapi.com/2/users/get_current_account', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
              console.log('[Dropbox] user account fetch response:', ures.status, ures.ok);
              if (ures && ures.ok) {
                ui = await ures.json();
                console.log('[Dropbox] user account data:', ui);
                // We do not persist here (drive.signInAsync persists on sign-in), but state will show the info immediately
              } else {
                const errText = await ures.text().catch(() => '');
                console.warn('[Dropbox] user account fetch failed:', ures.status, errText);
              }
            } catch (e) { console.warn('[Dropbox] user account fetch error:', e); }
          }
          if (mounted) setDropboxUser(ui || null);

          // fetch space usage via Dropbox API if token present
          if (token) {
            try {
              console.log('[Dropbox] Fetching space usage from API...');
              const res = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
              console.log('[Dropbox] space usage fetch response:', res.status, res.ok);
              if (res && res.ok) {
                const data = await res.json();
                console.log('[Dropbox] space usage data:', data);
                const used = (data && typeof data.used === 'number') ? data.used : null;
                let allocation = null;
                try {
                  if (data && data.allocation) {
                    // allocation shape varies: allocation.allocated (number) for individual
                    if (typeof data.allocation.allocated === 'number') allocation = data.allocation.allocated;
                    // some SDKs may nest under allocation.allocated.value
                    else if (data.allocation.allocated && typeof data.allocation.allocated === 'object' && typeof data.allocation.allocated.value === 'number') allocation = data.allocation.allocated.value;
                    // fallback: any numeric field inside allocation
                    else {
                      for (const k of Object.keys(data.allocation)) {
                        if (typeof data.allocation[k] === 'number') { allocation = data.allocation[k]; break; }
                      }
                    }
                  }
                } catch (e) { allocation = null; }
                console.log('[Dropbox] processed storage:', { used, allocation });
                if (mounted) setDropboxStorage({ used: used || null, allocation: allocation || null, raw: data });
              } else {
                const errText = await res.text().catch(() => '');
                console.warn('[Dropbox] space usage fetch failed:', res.status, errText);
                if (mounted) setDropboxStorage(null);
              }
            } catch (e) {
              console.warn('[Dropbox] space usage fetch error:', e);
              if (mounted) setDropboxStorage(null);
            }
          }
        } catch (e) {
          if (mounted) { setDropboxUser(null); setDropboxStorage(null); }
        }
      } catch (e) {
        if (mounted) { setDropboxUser(null); setDropboxStorage(null); }
      } finally {
        if (mounted) setDropboxInfoLoading(false);
      }
    };
    if (dropboxConnected) fetchInfo();
    if (!dropboxConnected) { setDropboxUser(null); setDropboxStorage(null); }
    return () => { mounted = false; };
  }, [dropboxConnected]);

  const formatBytes = (bytes) => {
    if (bytes === null || typeof bytes === 'undefined') return '—';
    const b = Number(bytes);
    if (Number.isNaN(b)) return '—';
    if (b === 0) return '0 B';
    const sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  const getDropboxUsagePct = (storage) => {
    if (!storage) return null;
    const used = (typeof storage.used === 'number') ? storage.used : (storage.raw && typeof storage.raw.used === 'number' ? Number(storage.raw.used) : null);
    let allocationVal = null;
    try {
      if (typeof storage.allocation === 'number') {
        allocationVal = storage.allocation;
      } else if (storage.raw && storage.raw.allocation) {
        const a = storage.raw.allocation;
        if (typeof a.allocated === 'number') allocationVal = a.allocated;
        else if (a.allocated && typeof a.allocated === 'object' && typeof a.allocated.value === 'number') allocationVal = a.allocated.value;
        else {
          for (const k of Object.keys(a || {})) {
            if (typeof a[k] === 'number') { allocationVal = a[k]; break; }
          }
        }
      }
    } catch (e) { allocationVal = null; }

    if (used == null || allocationVal == null || allocationVal <= 0) return null;
    return (used / allocationVal) * 100;
  };

  const formatSpaceText = (storage) => {
    if (!storage) return (dropboxInfoLoading ? 'Loading storage...' : 'Storage: not available');
    const used = (typeof storage.used === 'number') ? storage.used : (storage.raw && typeof storage.raw.used === 'number' ? Number(storage.raw.used) : null);
    let allocationVal = null;
    try {
      if (typeof storage.allocation === 'number') allocationVal = storage.allocation;
      else if (storage.raw && storage.raw.allocation) {
        const a = storage.raw.allocation;
        if (typeof a.allocated === 'number') allocationVal = a.allocated;
        else if (a.allocated && typeof a.allocated.value === 'number') allocationVal = a.allocated.value;
        else {
          for (const k of Object.keys(a || {})) {
            if (typeof a[k] === 'number') { allocationVal = a[k]; break; }
          }
        }
      }
    } catch (e) { allocationVal = null; }

    const total = allocationVal || null;
    if (used == null && total == null) return 'Storage: not available';
    if (used != null && total != null) {
      const pct = Math.round((used / Math.max(1, total)) * 100);
      return `Used ${formatBytes(used)} / ${formatBytes(total)} (${pct}%)`;
    }
    if (used != null) return `Used ${formatBytes(used)}`;
    if (total != null) return `Total ${formatBytes(total)}`;
    return 'Storage: not available';
  };

  const dropboxUsagePct = getDropboxUsagePct(dropboxStorage);
  const dropboxAlmostFull = dropboxConnected && dropboxUsagePct !== null && dropboxUsagePct >= 85 && !dropboxAlmostFullDismissed;


  // Main UI
  return (
    // ensure the root fills the viewport on web by setting a minHeight based on window height
    <View style={{ flex: 1, backgroundColor: theme.background, width: '100%', minHeight: height }}>
      <LoadingOverlay visible={loadingCard} message={loadingMsg} />
      {/* Floating Bravo AI teaser icon (draggable) */}
      <Animated.View
        style={[styles.aiFab, { transform: [{ translateX: aiPan.x }, { translateY: aiPan.y }] }]}
        {...aiPanResponder.panHandlers}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.aiGlowRing,
            {
              opacity: aiGlowOpacity,
              transform: [{ scale: aiGlowScale }],
            },
          ]}
        />
        <Animated.View style={[styles.aiFabInner, { transform: [{ translateY: aiFloat }] }]}> 
          <Image
            source={require('../assets/Ai.png')}
            style={styles.aiFabIcon}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
      {/* Updates modal: one-time, with sssuesnooze */}
      <Modal visible={showUpdatesModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.updatesModalOverlay}>
          <View style={styles.updatesModal}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>What's New</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a25bd', marginBottom: 4 }}>
                Today&apos;s updates:
              </Text>
              <Text style={{ fontSize: 13, color: '#333', marginBottom: 2 }}>• FOH Daily Cleaning exports now show SUP NAME and supervisor signatures correctly.</Text>

            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity style={[styles.updatesButtonPrimary, { maxWidth: 260 }]} onPress={handleUpdatesSeen}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Okay, got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Bravo AI teaser modal */}
      <Modal
        visible={aiInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAiInfoVisible(false)}
      >
        <View style={styles.updatesModalOverlay}>
          <View style={styles.updatesModal}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800' }}>Bravo AI (coming soon)</Text>
              <TouchableOpacity onPress={() => setAiInfoVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#999' }}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: '#333', marginBottom: 18 }}>
              Bravo AI will help this app build new forms on its own, fix common issues automatically, and assist your staff step-by-step with daily tasks and checklists.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Animated.View style={{ marginRight: 8, transform: [{ scale: aiCtaScale }] }}>
                <TouchableOpacity
                  style={[styles.updatesButtonSecondary, styles.aiCtaButton]}
                  onPress={async () => {
                    try {
                      const msg = encodeURIComponent('Hi Bravo team, we want Bravo AI enabled for our account as soon as it is ready.');
                      await Linking.openURL(`https://wa.me/260768834035?text=${msg}`);
                    } catch (e) {
                      Alert.alert('Unable to open WhatsApp', 'Please try again or contact us directly.');
                    }
                  }}
                >
                  <Text style={{ color: '#007AFF', fontWeight: '700' }}>We want this feature now</Text>
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity
                style={styles.updatesButtonPrimary}
                onPress={() => setAiInfoVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Dropbox almost-full storage warning modal */}
      <Modal visible={dropboxAlmostFull} transparent animationType="fade" onRequestClose={() => setDropboxAlmostFullDismissed(true)}>
        <View style={styles.updatesModalOverlay}>
          <View style={styles.updatesModal}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Dropbox storage almost full</Text>
            <Text style={{ fontSize: 14, color: '#333', marginBottom: 12 }}>
              {`Your Dropbox storage is almost full${dropboxUsagePct !== null ? ` (${Math.round(dropboxUsagePct)}% used)` : ''}. If it runs out of space, new checklist backups may stop uploading from this device.`}
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
              To keep your food safety records safe, please free up space or upgrade your Dropbox plan.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.updatesButtonSecondary, { marginRight: 8 }]}
                onPress={() => {
                  setDropboxAlmostFullDismissed(true);
                  try {
                    Alert.alert(
                      'Backups at risk',
                      'If Dropbox runs out of space, new checklist backups may stop uploading. This could mean recent inspections are lost if the device is damaged, lost, or reset. Please free up Dropbox space as soon as you can.'
                    );
                  } catch (e) {}
                }}
              >
                <Text style={{ color: '#185a9d', fontWeight: '700' }}>Ignore for now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.updatesButtonPrimary}
                onPress={() => {
                  setDropboxAlmostFullDismissed(true);
                  try {
                    Linking.openURL('https://www.dropbox.com/account/plan');
                  } catch (e) {}
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Get more Dropbox space</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Abdu verification modal removed */}
      {/* Seasonal overlay removed */}
      {/* Bottom navigation will host search & history actions instead of floating buttons */}

      {/* Search modal */}
      <Modal visible={searchModalVisible} animationType="fade" transparent onRequestClose={() => setSearchModalVisible(false)}>
        <View style={styles.searchModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
            style={[styles.searchModal, { width: isMobile ? '92%' : 640 }]}
          >
            <TextInput
              placeholder="Search forms by name or location"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              autoFocus
            />
            <FlatList
              data={allForms.filter(f => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (f.title && f.title.toLowerCase().includes(q)) || (f.location && f.location.toLowerCase().includes(q)) || (f.category && f.category.toLowerCase().includes(q));
              })}
              keyExtractor={(item) => String(item.id) + '_' + (item.route || '')}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => {
                  setSearchModalVisible(false);
                  setTimeout(() => {
                    try { if (item.route) navigation.navigate(item.route); } catch (e) { console.warn('navigate failed', e); }
                  }, 150);
                }}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionMeta}>{item.category} • {item.location || ''}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
              style={{ maxHeight: 420 }}
            />
            <TouchableOpacity style={styles.closeSearchBtn} onPress={() => setSearchModalVisible(false)}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Animated.View style={{ transform: [{ scale: headerPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }] }}>
      <View style={{
        width: '100%',
        paddingBottom: isMobile ? 4 : 18,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        alignSelf: 'stretch',
        backgroundColor: theme.primary
      }}>
        {/* Polished mobile app header */}
        {isMobile ? (
          <View style={{ padding: 0, margin: 0 }}>
            <View style={styles.headerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Image
                 

                  source={require('../assets/logo.jpeg')}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', marginRight: 12, shadowColor: '#185a9d', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 }}
                  resizeMode="contain"
                />
                {/* reachability icon removed from here — now shown on the right side of the time/date row */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, letterSpacing: 1, textAlign: 'left', marginBottom: 2 }}>Bravo!</Text>
                  <Text style={{ fontSize: 15, color: theme.accent, opacity: 0.95, textAlign: 'left', marginBottom: 0, fontWeight: '500' }}>Food Safety Inspections</Text>
                </View>
              </View>
              <View style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                backgroundColor: dropboxConnected ? '#0066cc15' : '#ff6b6b15',
                borderRadius: 12,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderLeftWidth: 4,
                borderLeftColor: dropboxConnected ? '#0066ff' : '#999',
              }}>
                <View style={{ 
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: dropboxConnected ? '#0066cc25' : '#99999925',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>☁️</Text>
                </View>
                {dropboxConnected ? (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: theme.text, fontWeight: '800', letterSpacing: 0.4 }}>{(dropboxUser && dropboxUser.name && dropboxUser.name.display_name) || (dropboxUser && dropboxUser.email) || 'Connected'}</Text>
                    {dropboxUser && dropboxUser.email ? <Text style={{ fontSize: 10, color: theme.accent, marginTop: 2, opacity: 0.8 }} numberOfLines={1}>{dropboxUser.email}</Text> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ flex: 1, height: 6, backgroundColor: theme.accent + '20', borderRadius: 3, marginRight: 8 }}>
                        <View style={{ height: '100%', backgroundColor: '#0066ff', borderRadius: 3, width: `${Math.min(100, dropboxUsagePct || 0)}%` }} />
                      </View>
                      <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700', minWidth: 80, textAlign: 'right' }}>{formatSpaceText(dropboxStorage)}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: theme.text, fontWeight: '800', letterSpacing: 0.5 }}>Dropbox</Text>
                    <Text style={{ fontSize: 12, color: theme.accent, marginTop: 3, opacity: 0.8 }}>⚠️ Not connected</Text>
                  </View>
                )}
                <TouchableOpacity onPress={async () => {
                  try {
                    if (dropboxConnected) {
                      await drive.revokeAccessToken().catch(() => null);
                    } else {
                      await drive.signInAsync().catch(() => null);
                    }
                  } catch (e) {}
                }} onLongPress={() => setDropboxDebugVisible(true)} delayLongPress={800} style={{ 
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: dropboxConnected ? '#ff4444' : '#0066ff',
                  borderRadius: 8,
                  marginLeft: 6
                }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>{dropboxConnected ? 'Logout' : 'Login'}</Text>
                </TouchableOpacity>
                
              </View>
            </View>
          </View>
        ) : (
            <View style={styles.headerRow}>
            <Image
              source={require('../assets/logo.jpeg')}
              style={{ width: 48, height: 48, borderRadius: 12, marginRight: 16, backgroundColor: '#fff' }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>Bravo!</Text>
              <Text style={{ fontSize: 15, color: '#fff', opacity: 0.85 }}>Food Safety Inspections</Text>
            </View>
              {/* reachability icon removed from here — now shown on the right side of the time/date row */}
            <View style={styles.headerCardAlt}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ 
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: dropboxConnected ? '#0066cc25' : '#99999925',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>☁️</Text>
                </View>
                {dropboxConnected ? (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: theme.text, fontWeight: '800', letterSpacing: 0.4 }}>{(dropboxUser && dropboxUser.name && dropboxUser.name.display_name) || (dropboxUser && dropboxUser.email) || 'Connected'}</Text>
                    {dropboxUser && dropboxUser.email ? <Text style={{ fontSize: 11, color: theme.accent, marginTop: 3, opacity: 0.8 }} numberOfLines={1}>{dropboxUser.email}</Text> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ flex: 1, height: 6, backgroundColor: theme.accent + '20', borderRadius: 3, marginRight: 8 }}>
                        <View style={{ height: '100%', backgroundColor: '#0066ff', borderRadius: 3, width: `${Math.min(100, dropboxUsagePct || 0)}%` }} />
                      </View>
                      <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700', minWidth: 80, textAlign: 'right' }}>{formatSpaceText(dropboxStorage)}</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={{ fontSize: 16, color: theme.text, fontWeight: '800', letterSpacing: 0.5 }}>Dropbox</Text>
                    <Text style={{ fontSize: 13, color: theme.accent, marginTop: 4, opacity: 0.8 }}>⚠️ Not connected</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={async () => {
                try {
                  if (dropboxConnected) {
                    await drive.revokeAccessToken().catch(() => null);
                  } else {
                    await drive.signInAsync().catch(() => null);
                  }
                } catch (e) {}
              }} onLongPress={() => setDropboxDebugVisible(true)} delayLongPress={800} style={{ 
                marginTop: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: dropboxConnected ? '#ff4444' : '#0066ff',
                borderRadius: 8,
                alignSelf: 'flex-start'
              }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>{dropboxConnected ? 'Logout' : 'Login'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: isMobile ? 12 : 24,
            paddingBottom: isMobile ? 8 : 16,
            marginTop: isMobile ? 4 : 8,
          }}
        >
          <Text style={{ fontSize: isMobile ? 15 : 20, color: '#fff', marginRight: 8 }}>🕒</Text>
          <Text style={{ fontSize: isMobile ? 16 : 22, fontWeight: 'bold', color: '#fff', marginRight: 16 }}>{timeString}</Text>
          <Text style={{ fontSize: isMobile ? 13 : 18, color: '#fff', marginRight: 8 }}>📅</Text>
          <Text style={{ fontSize: isMobile ? 13 : 16, color: '#fff', fontWeight: 'bold' }}>{dateString}, {yearString}</Text>
          {/* spacer pushes the icon to the far right of the header row */}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={async () => {
              // User-triggered manual connectivity check + reconnection attempt
              try {
                setLoadingMsg('Checking internet...');
                setLoadingCard(true);

                // First try the normal HTTP probe (fast-path)
                let ok = false;
                try {
                  ok = await httpProbe();
                } catch (e) { ok = false; }

                // If probe failed, try NetInfo as a best-effort fallback (may be more permissive)
                if (!ok) {
                  try {
                    // require dynamically so web builds without the library won't fail here
                    // eslint-disable-next-line global-require
                    const NetInfo = require('@react-native-community/netinfo').default;
                    if (NetInfo && typeof NetInfo.fetch === 'function') {
                      const state = await NetInfo.fetch();
                      ok = !!(state && (state.isConnected || state.isInternetReachable));
                    }
                  } catch (e) {
                    // NetInfo not available — ignore
                  }
                }

                setHasInternet(!!ok);

                // If we got connectivity, attempt to reconcile queued uploads and refresh auth state
                if (ok) {
                  try {
                    // refresh/store dropbox auth flag
                    const t = await drive.getAccessToken().catch(() => null);
                    setDropboxConnected(Boolean(t));
                  } catch (e) {
                    // ignore
                  }

                  try {
                    await processQueue();
                  } catch (e) {
                    // processing may fail, but we've signalled an attempt
                    console.warn('processQueue failed on manual retry', e);
                  }
                }
              } catch (e) {
                console.warn('manual connectivity check failed', e);
              } finally {
                // hide loader after a short grace so users see feedback
                setTimeout(() => setLoadingCard(false), 300);
              }
            }}
            activeOpacity={0.7}
          >
            <Image
              source={ hasInternet ? require('../assets/internetaccess.png') : require('../assets/nointernet.png') }
              style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, marginRight: isMobile ? 12 : 24 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {/* Theme toggle */}
          <TouchableOpacity
            onPress={() => {
              try {
                setThemeMode(theme.mode === 'dark' ? 'light' : 'dark');
              } catch (e) { console.warn('toggle theme failed', e); }
            }}
            activeOpacity={0.7}
            style={{ marginRight: isMobile ? 12 : 20 }}
          >
            <Text style={{ fontSize: isMobile ? 20 : 22 }}>{theme.mode === 'dark' ? '🌞' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={dropboxDebugVisible} animationType="slide" onRequestClose={() => setDropboxDebugVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.background, padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Dropbox Debug</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => {
                addDebugLog('=== Manual Refresh Started ===');
                setDropboxInfoLoading(true);
                const fetchInfo = async () => {
                  try {
                    addDebugLog('1. Checking token...');
                    let token = await drive.getAccessToken().catch(e => { addDebugLog(`ERROR getAccessToken: ${e.message}`); return null; });
                    addDebugLog(`   Token: ${token ? '✓ Present' : '✗ Missing'}`);
                    
                    if (!token) {
                      addDebugLog('✗ No token, cannot fetch');
                      setDropboxInfoLoading(false);
                      return;
                    }

                    addDebugLog('2. Fetching user info...');
                    let ui = await drive.getUserInfo().catch(() => null);
                    addDebugLog(`   Stored user: ${ui ? '✓ Found' : '✗ Not in SecureStore'}`);
                    
                    if (!ui) {
                      addDebugLog('3. Attempting API fetch for user account...');
                      try {
                        const ures = await fetch('https://api.dropboxapi.com/2/users/get_current_account', { 
                          method: 'POST', 
                          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, 
                          body: '{}' 
                        });
                        addDebugLog(`   API response: ${ures.status} ${ures.statusText}`);
                        if (ures.ok) {
                          ui = await ures.json();
                          addDebugLog(`   ✓ User data: ${JSON.stringify(ui).substring(0, 100)}`);
                        } else {
                          const errText = await ures.text().catch(() => '');
                          addDebugLog(`   ✗ API error: ${errText.substring(0, 150)}`);
                        }
                      } catch (e) { 
                        addDebugLog(`   ✗ API fetch error: ${e.message}`);
                      }
                    }
                    setDropboxUser(ui || null);

                    addDebugLog('4. Fetching storage usage...');
                    try {
                      const res = await fetch('https://api.dropboxapi.com/2/users/get_space_usage', { 
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` } 
                      });
                      addDebugLog(`   API response: ${res.status} ${res.statusText}`);
                      if (res.ok) {
                        const data = await res.json();
                        addDebugLog(`   ✓ Storage data: ${JSON.stringify(data).substring(0, 100)}`);
                        const used = (data && typeof data.used === 'number') ? data.used : null;
                        let allocation = null;
                        try {
                          if (data && data.allocation) {
                            if (typeof data.allocation.allocated === 'number') allocation = data.allocation.allocated;
                            else if (data.allocation.allocated && typeof data.allocation.allocated === 'object' && typeof data.allocation.allocated.value === 'number') allocation = data.allocation.allocated.value;
                            else {
                              for (const k of Object.keys(data.allocation)) {
                                if (typeof data.allocation[k] === 'number') { allocation = data.allocation[k]; break; }
                              }
                            }
                          }
                        } catch (e) { }
                        setDropboxStorage({ used: used || null, allocation: allocation || null, raw: data });
                        addDebugLog(`   ✓ Parsed: used=${used}, allocation=${allocation}`);
                      } else {
                        const errText = await res.text().catch(() => '');
                        addDebugLog(`   ✗ API error: ${errText.substring(0, 150)}`);
                        setDropboxStorage(null);
                      }
                    } catch (e) {
                      addDebugLog(`   ✗ API fetch error: ${e.message}`);
                      setDropboxStorage(null);
                    }
                    addDebugLog('=== Refresh Complete ===');
                  } finally {
                    setDropboxInfoLoading(false);
                  }
                };
                fetchInfo();
              }}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setDropboxDebugLog([]);
                addDebugLog('Log cleared');
              }}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDropboxDebugVisible(false)}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#185a9d', padding: 8, borderRadius: 6 }} onPress={async () => {
              addDebugLog('Testing: drive.getAccessToken()...');
              try {
                const t = await drive.getAccessToken();
                addDebugLog(`Result: ${t ? '✓ Token present (length: ' + t.length + ')' : '✗ null'}`);
              } catch (e) {
                addDebugLog(`Error: ${e.message}`);
              }
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Test Token</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#185a9d', padding: 8, borderRadius: 6 }} onPress={async () => {
              addDebugLog('Testing: drive.getUserInfo()...');
              try {
                const ui = await drive.getUserInfo();
                if (ui) addDebugLog(`Result: ✓ ${JSON.stringify(ui).substring(0, 80)}`);
                else addDebugLog('Result: ✗ null (not in SecureStore)');
              } catch (e) {
                addDebugLog(`Error: ${e.message}`);
              }
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Test UserInfo</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: '#0f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {dropboxDebugLog.length === 0 ? 'Press Refresh or test buttons to see logs...' : dropboxDebugLog.join('\n')}
            </Text>
          </ScrollView>
          <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#111', marginBottom: 6 }}>State:</Text>
            <Text style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>Connected: {dropboxConnected === null ? 'checking...' : dropboxConnected ? '✓ Yes' : '✗ No'}</Text>
            <Text style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>User: {dropboxUser ? (dropboxUser.name?.display_name || dropboxUser.email || 'stored') : '✗ null'}</Text>
            <Text style={{ fontSize: 11, color: '#333' }}>Storage: {dropboxStorage ? `${formatBytes(dropboxStorage.used)} / ${formatBytes(dropboxStorage.allocation)}` : '✗ null'}</Text>
          </View>
        </View>
      </Modal>

      </Animated.View>

      {/* New Year banner removed */}

      {/* Dev Dropbox test access removed — button intentionally hidden in Home screen */}



      {/* Category Tabs - now static, directly below header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme.background,
        borderRadius: 16,
        padding: 4,
        marginBottom: 0, // Remove space below category tab
        marginTop: 0,    // Remove space above category tab
        alignSelf: 'stretch',
        position: 'relative',
        zIndex: 2,
      }}>
        {Object.entries(formCategories).map(([key, category], idx) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryTab, activeCategory === key && styles.categoryTabActive]}
            onPress={() => setActiveCategory(key)}
          >
            <Text style={[styles.categoryTabText, activeCategory === key && styles.categoryTabTextActive]}>
              {idx === 0 ? '🍽️' : idx === 1 ? '🏭' : idx === 2 ? '🍳' : idx === 3 ? '🍞' : '🏢'} {category.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Removed kitchen quick access featured cards per request */}

      {/* Form Lists */}
      <View style={{ flex: 1, width: '100%', position: 'relative' }}>
        <Image source={require('../assets/logo.jpeg')} pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: 24, width: watermarkSize, height: watermarkSize, opacity: 0.18, resizeMode: 'contain', zIndex: 0 }} />
        <ScrollView
          style={{ flex: 1, width: '100%', backgroundColor: 'transparent' }}
          // allow content to grow so the ScrollView becomes scrollable on web
          contentContainerStyle={[styles.formListContent, { paddingBottom: 120, flexGrow: 1, backgroundColor: 'transparent' }]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          onScroll={e => {
            try {
              const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent || {};
              if (!contentOffset || !layoutMeasurement || !contentSize) return;
              const visibleBottom = contentOffset.y + layoutMeasurement.height;
              const atBottom = visibleBottom >= contentSize.height - 32;
              if (atBottom !== footerCreditVisible) {
                setFooterCreditVisible(atBottom);
              }
            } catch (err) {}
          }}
          scrollEventThrottle={16}
        >
          {getFilteredForms(activeCategory).map((form, idx) => (
          <View key={`form-card-${form.id}-${idx}-${form.title}` }>
              <TouchableOpacity
              key={`form-touchable-${form.id}-${idx}-${form.title}`}
              disabled={!(form.route || form.isHandwashingLog)}
              onPress={() => {
                // show spinner and navigate
                setLoadingMsg(`Opening ${form.title}...`);
                setLoadingCard(true);
                // navigate immediately (remove artificial delay that made opening feel slow)
                if (form.route) {
                  navigation.navigate(form.route);
                } else if (form.isHandwashingLog) {
                  navigation.navigate('FoodHandlersHandwashingForm');
                }
                // hide after short delay to let navigation settle
                setTimeout(() => setLoadingCard(false), 350);
              }}
              style={[styles.formCard, { borderLeftColor: getStatusColor(form.status).backgroundColor, backgroundColor: 'transparent', opacity: (form.route || form.isHandwashingLog) ? 1 : 0.6, zIndex: 3 } ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.10)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: 14, zIndex: 0 }}
              />
              <View style={{ zIndex: 1 }}>
                <View style={styles.formCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formTitle, { color: '#222' }]}>{form.title}</Text>
                    <Text style={[styles.formLocation, { color: '#555' }]}>{form.location}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(form.status).backgroundColor }]}> 
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(form.status).color }]}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { borderColor: getPriorityColor(form.priority).borderColor }]}> 
                      <Text style={[styles.priorityBadgeText, { color: getPriorityColor(form.priority).color }]}>{form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      </View>

      {/* Floating Action Button removed, replaced by top right button */}

      {/* Footer with WhatsApp-style bottom navigation */}
      <View style={styles.footer}>
        <View style={styles.footerNavRow}>
          <TouchableOpacity
            style={styles.footerNavItem}
            onPress={() => { setSearchModalVisible(true); setSearchQuery(''); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerNavIcon, { fontSize: isMobile ? 22 : 26 }]}>🔎</Text>
            <Text style={[styles.footerNavLabel, { fontSize: isMobile ? 11 : 12 }]}>Search forms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerNavItem}
            onPress={() => setStaffInfoVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerNavIcon, { fontSize: isMobile ? 22 : 26 }]}>👥</Text>
            <Text style={[styles.footerNavLabel, { fontSize: isMobile ? 11 : 12 }]}>Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerNavItem}
            onPress={() => { try { navigation.navigate('FormSaves'); } catch (e) {} }}
            activeOpacity={0.8}
          >
            <Text style={[styles.footerNavIcon, { fontSize: isMobile ? 22 : 26 }]}>📁</Text>
            <Text style={[styles.footerNavLabel, { fontSize: isMobile ? 11 : 12 }]}>Saved forms</Text>
          </TouchableOpacity>
        </View>
        {footerCreditVisible ? (
          <Text style={styles.footerText}>Built by RAJAB CULTURE  & STEPHANIE DIGITAL SOLUTIONS ZAMBIA  Bravo brands@ {new Date().getFullYear()}</Text>
        ) : null}
      </View>

      {/* Dropbox almost-full sticky banner (bottom-center). */}
      {dropboxAlmostFull ? (
        <View
          style={[
            styles.dropboxBanner,
            {
              bottom: isMobile ? 140 : 180,
              left: isMobile ? 18 : 20,
              right: isMobile ? 18 : 20,
              backgroundColor: '#ffb74d',
              borderColor: '#ff9800',
            },
          ]}
        >
          <Text style={[styles.dropboxBannerText, { color: '#4e2a00' }]}>
            {`Dropbox storage is almost full${dropboxUsagePct !== null ? ` (${Math.round(dropboxUsagePct)}% used)` : ''} — please free up space to keep backups running.`}
          </Text>
        </View>
      ) : null}

      {/* Staff feature info modal with WhatsApp request */}
      <Modal
        visible={staffInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStaffInfoVisible(false)}
      >
        <View style={styles.updatesModalOverlay}>
          <View style={styles.updatesModal}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Staff & shifts (coming soon)</Text>
            <Text style={{ fontSize: 14, color: '#333', marginBottom: 10 }}>
              This future feature will let you manage staff logins, shifts, and see exactly who completed each checklist and when.
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 18 }}>
              If you are interested in this kind of feature, you can request it and we will get in touch to discuss how it should work for your team.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.updatesButtonSecondary, { marginRight: 8 }]}
                onPress={() => setStaffInfoVisible(false)}
              >
                <Text style={{ color: '#185a9d', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.updatesButtonPrimary}
                onPress={() => {
                  setStaffInfoVisible(false);
                  try {
                    const phone = '260768834035';
                    const message = encodeURIComponent('Hi, I am interested in the staff/login/shifts and form audit feature for the Bravo Checklist app.');
                    const url = `https://wa.me/${phone}?text=${message}`;
                    Linking.openURL(url).catch(() => {});
                  } catch (e) {}
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Request via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Add missing styles object

const styles = StyleSheet.create({
  formCard: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    shadowColor: '#0a3a2f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    backdropFilter: 'blur(6px)'
  },
  formCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    color: '#f7fbf8'
  },
  formLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.06)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  formListContent: {
    padding: 12,
  },
  quickCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#0a3a2f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  historyBtn: {
    position: 'absolute',
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(30,167,255,0.9)',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a3a2f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 12,
  },
  historyBtnText: {
    fontSize: 28,
    color: '#185a9d',
    fontWeight: 'bold',
  },
  searchBtn: {
    position: 'absolute',
    zIndex: 101,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(30,167,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a3a2f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
  },
  searchBtnText: {
    color: '#185a9d',
    fontWeight: '700',
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  searchModal: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    maxHeight: '90%',
    alignItems: 'stretch',
    shadowColor: '#0a3a2f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.9)'
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  suggestionTitle: { fontWeight: '700', fontSize: 16 },
  suggestionMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  closeSearchBtn: { marginTop: 8, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#185a9d', borderRadius: 8 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  footerText: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
  },
  footerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNavIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  footerNavLabel: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
  dropboxBanner: {
    position: 'absolute',
    left: 20,
      // legacy floating history styles (no longer used)
  },
  dropboxBannerText: {
      fontSize: 28,
      color: '#185a9d',
      fontWeight: 'bold',
  },
  statusBadge: {
      // legacy floating search styles (no longer used)
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    marginRight: 6,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  /* Glassy header and category tab styles */
  headerCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 0,
    padding: 16,
    elevation: 6,
    shadowColor: '#0a3a2f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 0,
  },
  headerCardAlt: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 12,
    minWidth: 220,
    alignItems: 'flex-start',
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(30,167,255,0.12)'
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'transparent'
  },
  categoryTabActive: {
    backgroundColor: 'rgba(30,167,255,0.95)'
  },
  categoryTabText: {
    fontSize: 18,
    color: '#185a9d',
    fontWeight: '700'
  },
  categoryTabTextActive: {
    color: '#ffffff'
  }
  ,
  updatesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999
  },
  updatesModal: {
    width: '92%',
    maxWidth: 720,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 20,
  },
  updatesList: {
    marginTop: 6,
  },
  updateItem: {
    marginBottom: 6,
    color: '#333'
  },
  updatesButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  updatesButtonPrimary: {
    flex: 1,
    backgroundColor: '#185a9d',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8
  },
  updatesButtonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#185a9d'
  },
  aiCtaButton: {
    shadowColor: '#00B0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  aiFab: {
    position: 'absolute',
    zIndex: 110,
    right: 18,
    top: 460,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFabIcon: {
    width: 64,
    height: 64,
  },
  aiGlowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 191, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(129, 212, 250, 0.9)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 20,
    elevation: 18,
  },
  secretDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    opacity: 0.9
  },
  secretDotInner: {
    width: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: '#c62828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6
  }
});

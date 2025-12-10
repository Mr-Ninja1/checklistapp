import warnOnce from '../utils/warnOnce';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Platform, Dimensions, useWindowDimensions, StyleSheet, Modal, FlatList, Animated, PanResponder, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpProbe, processQueue } from '../utils/uploadQueue';
import * as drive from '../utils/drive';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingOverlay from '../components/LoadingOverlay';
import NoticeModal from '../components/NoticeModal';

// Form data from Index.tsx (pruned to only include navigable cards)
const formCategories = {
  foh: {
    name: "FOH Records",
    color: ["#43cea2", "#185a9d"],
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
    case 'completed': return { backgroundColor: '#43cea2', color: '#fff' };
    case 'pending': return { backgroundColor: '#ffd200', color: '#333' };
    case 'overdue': return { backgroundColor: '#ff5e62', color: '#fff' };
    default: return { backgroundColor: '#eee', color: '#333' };
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return { borderColor: '#ff5e62', color: '#ff5e62' };
    case 'high': return { borderColor: '#ffd200', color: '#ffd200' };
    case 'medium': return { borderColor: '#43cea2', color: '#43cea2' };
    case 'low': return { borderColor: '#aaa', color: '#aaa' };
    default: return { borderColor: '#eee', color: '#333' };
  }
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme, setThemeMode } = useTheme();
  const [activeCategory, setActiveCategory] = useState('foh');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCard, setLoadingCard] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Please wait');
  const isFocused = useIsFocused();
  const [noticeVisible, setNoticeVisible] = useState(false);
  // Deadline string shown in modal — adjust to match your agreement date
  const [noticeDeadlineString] = useState('2025-11-30');
  // Date/time
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const yearString = now.getFullYear();

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

  // Show the observation-period notice every 7s while Home is focused.
  useEffect(() => {
    let initialTimer = null;
    let intervalTimer = null;
    if (isFocused) {
      // initial show after 7s
      initialTimer = setTimeout(() => {
        try { setNoticeVisible(true); } catch (e) {}
      }, 7000);

      // repeat show every 7s so it keeps reappearing after dismissal
      intervalTimer = setInterval(() => {
        try { setNoticeVisible(true); } catch (e) {}
      }, 7000);
    }
    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (intervalTimer) clearInterval(intervalTimer);
      // hide notice when leaving the screen
      setNoticeVisible(false);
    };
  }, [isFocused]);

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


  // Main UI
  return (
    // ensure the root fills the viewport on web by setting a minHeight based on window height
    <View style={{ flex: 1, backgroundColor: theme.background, width: '100%', minHeight: height }}>
      <LoadingOverlay visible={loadingCard} message={loadingMsg} />
      <NoticeModal visible={noticeVisible} onClose={() => setNoticeVisible(false)} deadlineString={noticeDeadlineString} />
      {/* Floating Search Button - draggable */}
      <Animated.View
        {...searchPan.panHandlers}
        style={[styles.searchBtn, searchPos.getLayout(), { width: searchSize, height: searchSize, borderRadius: searchSize / 2 }]}
      >
        <TouchableOpacity onPress={() => { setSearchModalVisible(true); setSearchQuery(''); }} activeOpacity={0.9} hitSlop={{ top: 18, left: 18, right: 18, bottom: 18 }} delayLongPress={220}>
          <Text style={[styles.searchBtnText, { fontSize: isMobile ? 24 : 30 }]}>🔍</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Floating History Button - draggable */}
      <Animated.View
        {...historyPan.panHandlers}
        style={[styles.historyBtn, historyPos.getLayout(), { width: historySize, height: historySize, borderRadius: historySize / 2 }]}
      >
        <TouchableOpacity onPress={() => navigation.navigate('FormSaves')} activeOpacity={0.85} hitSlop={{ top: 18, left: 18, right: 18, bottom: 18 }} delayLongPress={220}>
          <Text style={[styles.historyBtnText, { fontSize: isMobile ? 36 : 44 }]}>📂</Text>
        </TouchableOpacity>
      </Animated.View>

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
      <LinearGradient
        colors={[theme.accent, theme.accent, theme.primary]}
        style={{
          width: '100%',
          paddingBottom: isMobile ? 0 : 24,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          alignSelf: 'stretch',
        }}
      >
        {/* Polished mobile app header */}
        {isMobile ? (
          <View style={{ padding: 0, margin: 0 }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 18,
                marginHorizontal: 14,
                marginTop: 14,
                marginBottom: 0,
                padding: 16,
                elevation: 5,
                shadowColor: '#185a9d',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.13,
                shadowRadius: 12,
                borderWidth: 1,
                borderColor: '#eaf7f7',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Image
                 

                  source={require('../assets/logo.jpeg')}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', marginRight: 12, shadowColor: '#185a9d', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 }}
                  resizeMode="contain"
                />
                {/* reachability icon removed from here — now shown on the right side of the time/date row */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: theme.primary, letterSpacing: 1, textAlign: 'left', marginBottom: 2 }}>Bravo!</Text>
                  <Text style={{ fontSize: 15, color: theme.accent, opacity: 0.95, textAlign: 'left', marginBottom: 0, fontWeight: '500' }}>Food Safety Inspections</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 15, color: '#22c1c3', fontWeight: 'bold', marginRight: 6 }}>📍</Text>
                <Text style={{ fontSize: 14, color: '#22c1c3', fontWeight: 'bold', marginRight: 8 }}>Ndola, Zambia</Text>
                <Text style={{ fontSize: 13, color: '#185a9d', fontWeight: '500' }}>Bravo Brands Central</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>5 Sites</Text>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>| 42 Staff</Text>
                <Text style={{ fontSize: 13, color: '#43cea2', fontWeight: 'bold' }}>● Active</Text>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 24,
              paddingBottom: 0,
            }}
          >
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
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, minWidth: 220, alignItems: 'flex-start', elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 16, color: '#22c1c3', fontWeight: 'bold', marginRight: 6 }}>📍</Text>
                <Text style={{ fontSize: 15, color: '#22c1c3', fontWeight: 'bold' }}>Ndola, Zambia</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#185a9d', marginBottom: 2 }}>Bravo Brands Central</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>5 Sites</Text>
                <Text style={{ fontSize: 13, color: '#185a9d', marginRight: 8 }}>| 42 Staff</Text>
                <Text style={{ fontSize: 13, color: '#43cea2', fontWeight: 'bold' }}>● Active</Text>
              </View>
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
      </LinearGradient>

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
            style={{ flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 12, backgroundColor: activeCategory === key ? '#43cea2' : 'transparent' }}
            onPress={() => setActiveCategory(key)}
          >
            <Text style={{ fontSize: 18, color: activeCategory === key ? '#fff' : '#185a9d', fontWeight: 'bold' }}>
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
                colors={['rgba(255,255,255,0.40)', 'rgba(255,255,255,0.995)', 'rgba(255,255,255,0.995)', 'rgba(255,255,255,0.40)']}
                locations={[0, 0.28, 0.72, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: 12, zIndex: 0 }}
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
                    <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, backgroundColor: getStatusColor(form.status).backgroundColor }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: getStatusColor(form.status).color }}>{form.status.charAt(0).toUpperCase() + form.status.slice(1)}</Text>
                    </View>
                    <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: getPriorityColor(form.priority).borderColor, marginRight: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: getPriorityColor(form.priority).color }}>{form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}</Text>
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

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Built by RAJAB CULTURE  & STEPHANIE DIGITAL SOLUTIONS ZAMBIA  Bravo brands@ {new Date().getFullYear()}</Text>
      </View>

      {/* Dropbox disconnected sticky banner (bottom-center).
          Show only when we explicitly know the user is NOT connected (dropboxConnected === false).
          Position slightly above footer and under the floating history button using responsive bottom offset. */}
      {dropboxConnected === false ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            try { navigation.navigate('FormSaves', { openDriveModal: true }); } catch (e) {}
          }}
          style={[
            styles.dropboxBanner,
            {
              // position the banner above the footer and roughly under the history button
              bottom: isMobile ? 120 : 160,
              left: isMobile ? 18 : 20,
              right: isMobile ? 18 : 20,
              backgroundColor: '#c62828', // red background
            }
          ]}
        >
          <Text style={[styles.dropboxBannerText, { color: '#fff' }]}>Dropbox not connected — tap to connect</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Add missing styles object

const styles = StyleSheet.create({
  formCard: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  formLocation: {
    fontSize: 14,
    color: '#888',
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  formListContent: {
    padding: 12,
  },
  quickCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6eef2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyBtn: {
    position: 'absolute',
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: 40, // matches the larger size
    borderWidth: 4,
    borderColor: '#185a9d', // bold colored border
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#185a9d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
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
    backgroundColor: '#fff',
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#43cea2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#43cea2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    maxHeight: '90%',
    alignItems: 'stretch',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e6eef2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  suggestionTitle: { fontWeight: '700', fontSize: 16 },
  suggestionMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  closeSearchBtn: { marginTop: 8, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#185a9d', borderRadius: 8 },
  footer: {
    alignItems: 'center',
    padding: 12,
    marginTop: 16,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  dropboxBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ffd966',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  dropboxBannerText: {
    color: '#856404',
    fontWeight: '700',
    fontSize: 14,
  },
});

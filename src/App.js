// No changes needed; the file is already valid JavaScript.
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './screens/SplashScreen';
import ResponsiveView from './components/ResponsiveView';
import HomeScreen from './screens/HomeScreen';
import KitchenCategory from './screens/KitchenCategory';
import FOHCategoryScreen from './screens/FOHCategoryScreen';
import FOHFormScreen from './screens/FOHFormScreen';
import FormSavesScreen from './screens/FormSavesScreen';
import FOH_FrontOfHouseCleaningChecklist from './forms/FOH_FrontOfHouseCleaningChecklist';
import BOH_ShelfLifeInspectionChecklist from './forms/BOH_ShelfLifeInspectionChecklist';
import ProductsNetContentChecklist from './forms/ProductsNetContentChecklist';
import FruitWashingLog from './forms/FruitWashingLog';
import CookingTemperatureLog from './forms/CookingTemperatureLog';
import ThawingTemperatureLog from './forms/ThawingTemperatureLog';
import HotHoldingTemperatureLog from './forms/HotHoldingTemperatureLog';
import UnderbarChillerTemperatureLog from './forms/UnderbarChillerTemperatureLog';
import CustomerSatisfactionQuestionnaire from './forms/CustomerSatisfactionQuestionnaire';
import PPEIssuanceForm from './forms/PPEIssuanceForm';
import PersonalHygieneChecklist from './forms/PersonalHygieneChecklist';
import BravoHealthStatusCheck from './forms/BravoHealthStatusCheck';
import ProductReleaseForm from './forms/ProductReleaseForm';
import BeverageReceivingForm from './forms/BeverageReceivingForm';
import PackagingMaterialsReceivingForm from './forms/PackagingMaterialsReceivingForm';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081'],
  config: {
    screens: {
  Home: '',
  CustomerSatisfactionQuestionnaire: 'customer-satisfaction-questionnaire',
  FormSaves: 'FormSaves',
      FOHFormScreen: 'FOHFormScreen',
      FOH_FrontOfHouseCleaningChecklist: 'FOH_FrontOfHouseCleaningChecklist',
      WelfareFacilities_CleaningChecklist: 'WelfareFacilities_CleaningChecklist',
  ColdRoom_FreezerRoomCleaningChecklist: 'ColdRoom_FreezerRoomCleaningChecklist',
  SculleryArea_CleaningChecklist: 'SculleryArea_CleaningChecklist',
  CleaningEquipment_CleaningChecklist: 'CleaningEquipment_CleaningChecklist',
  DryStorageArea_CleaningChecklist: 'DryStorageArea_CleaningChecklist',
  CertificateOfAnalysis: 'CertificateOfAnalysis',
  WalkInFreezerLog: 'WalkInFreezerLog',
  WalkInChillerLog: 'WalkInChillerLog',
  BakingControlSheet: 'BakingControlSheet',
  MixingControlSheet: 'MixingControlSheet',
      BOH_ShelfLifeInspectionChecklist: 'boh-shelf-life-inspection',
  FruitWashingLog: 'fruit-washing-log',
  CookingTemperatureLog: 'cooking-temperature-log',
  ThawingTemperatureLog: 'thawing-temperature-log',
  HotHoldingTemperatureLog: 'hot-holding-temperature-log',
  UnderbarChillerTemperatureLog: 'underbar-chiller-temperature-log',
      Splash: 'Splash',
      KitchenCategory: 'KitchenCategory',
      FOHCategory: 'FOHCategory',
        FoodHandlersHandwashingForm: 'FoodHandlersHandwashingForm',
        FOH_DailyCleaningForm: 'FOH_DailyCleaningForm',
        Kitchen_DailyCleaningForm: 'Kitchen_DailyCleaningForm',
    },
  },
};

export default function App() {
  return (
  <ResponsiveView lockLandscape={false}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* note: individual screens can accept a `responsive` prop injected by ResponsiveView when needed */}
        <Stack.Screen name="Splash" component={(props) => <SplashScreen {...props} />} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
  <Stack.Screen name="FormSaves" component={FormSavesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KitchenCategory" component={KitchenCategory} options={{ headerShown: false }} />
        <Stack.Screen name="FOHCategory" component={FOHCategoryScreen} options={{ headerShown: false }} />
  <Stack.Screen name="FOHFormScreen" component={FOHFormScreen} options={{ headerShown: false }} />
  <Stack.Screen name="FOH_FrontOfHouseCleaningChecklist" component={FOH_FrontOfHouseCleaningChecklist} />
  <Stack.Screen name="ColdRoom_FreezerRoomCleaningChecklist" component={require('./forms/ColdRoom_FreezerRoomCleaningChecklist').default} />
  <Stack.Screen name="FoodHandlersHandwashingForm" component={require('./forms/FoodHandlersHandwashingForm').default} />
    <Stack.Screen name="FOH_DailyCleaningForm" component={require('./forms/FOH_DailyCleaningForm').default} />
    <Stack.Screen name="Kitchen_DailyCleaningForm" component={require('./forms/Kitchen_DailyCleaningForm').default} />
    <Stack.Screen name="Kitchen_WeeklyCleaningChecklist" component={require('./forms/Kitchen_WeeklyCleaningChecklist').default} />
  <Stack.Screen name="Bakery_SanitizingLog" component={require('./forms/Bakery_SanitizingLog').default} />
  <Stack.Screen name="Bakery_CleaningChecklist" component={require('./forms/Bakery_CleaningChecklist').default} />
  <Stack.Screen name="WelfareFacilities_CleaningChecklist" component={require('./forms/WelfareFacilities_CleaningChecklist').default} />
  <Stack.Screen name="SculleryArea_CleaningChecklist" component={require('./forms/SculleryArea_CleaningChecklist').default} />
  <Stack.Screen name="CleaningEquipment_CleaningChecklist" component={require('./forms/CleaningEquipment_CleaningChecklist').default} />
  <Stack.Screen name="DryStorageArea_CleaningChecklist" component={require('./forms/DryStorageArea_CleaningChecklist').default} />
  <Stack.Screen name="CertificateOfAnalysis" component={require('./forms/CertificateOfAnalysis').default} />
  <Stack.Screen name="WalkInFreezerLog" component={require('./forms/WalkInFreezerLog').default} />
  <Stack.Screen name="WalkInChillerLog" component={require('./forms/WalkInChillerLog').default} />
  <Stack.Screen name="BakingControlSheet" component={require('./forms/BakingControlSheet').default} />
  <Stack.Screen name="MixingControlSheet" component={require('./forms/MixingControlSheet').default} />
  <Stack.Screen name="BOH_ShelfLifeInspectionChecklist" component={require('./forms/BOH_ShelfLifeInspectionChecklist').default} />
  <Stack.Screen name="ProductsNetContentChecklist" component={ProductsNetContentChecklist} />
  <Stack.Screen name="FruitWashingLog" component={FruitWashingLog} />
  <Stack.Screen name="CookingTemperatureLog" component={CookingTemperatureLog} />
  <Stack.Screen name="ThawingTemperatureLog" component={ThawingTemperatureLog} />
  <Stack.Screen name="HotHoldingTemperatureLog" component={HotHoldingTemperatureLog} />
  <Stack.Screen name="UnderbarChillerTemperatureLog" component={UnderbarChillerTemperatureLog} />
  <Stack.Screen name="CustomerSatisfactionQuestionnaire" component={CustomerSatisfactionQuestionnaire} />
  <Stack.Screen name="PPEIssuanceForm" component={PPEIssuanceForm} />
  <Stack.Screen name="PersonalHygieneChecklist" component={PersonalHygieneChecklist} />
  <Stack.Screen name="BravoHealthStatusCheck" component={BravoHealthStatusCheck} />
  <Stack.Screen name="ProductReleaseForm" component={ProductReleaseForm} />
  <Stack.Screen name="BeverageReceivingForm" component={BeverageReceivingForm} />
  <Stack.Screen name="PackagingMaterialsReceivingForm" component={PackagingMaterialsReceivingForm} />
  <Stack.Screen name="ProcessQualityOutOfControlReport" component={require('./forms/Process_Quality_OutOfControlReport').default} />
  <Stack.Screen name="PastInspectionForm" component={require('./forms/PastInspectionForm').default} />
        </Stack.Navigator>
      </NavigationContainer>
    </ResponsiveView>
  );
}


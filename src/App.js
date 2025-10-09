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

const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081'],
  config: {
    screens: {
  Home: '',
  FormSaves: 'FormSaves',
      FOHFormScreen: 'FOHFormScreen',
      FOH_FrontOfHouseCleaningChecklist: 'FOH_FrontOfHouseCleaningChecklist',
      WelfareFacilities_CleaningChecklist: 'WelfareFacilities_CleaningChecklist',
  ColdRoom_FreezerRoomCleaningChecklist: 'ColdRoom_FreezerRoomCleaningChecklist',
  SculleryArea_CleaningChecklist: 'SculleryArea_CleaningChecklist',
  CleaningEquipment_CleaningChecklist: 'CleaningEquipment_CleaningChecklist',
  DryStorageArea_CleaningChecklist: 'DryStorageArea_CleaningChecklist',
  CertificateOfAnalysis: 'CertificateOfAnalysis',
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
      <Stack.Screen name="CoolingTemperatureLog" component={require('./forms/CoolingTemperatureLog').default} />
  <Stack.Screen name="Bakery_SanitizingLog" component={require('./forms/Bakery_SanitizingLog').default} />
  <Stack.Screen name="Bakery_CleaningChecklist" component={require('./forms/Bakery_CleaningChecklist').default} />
  <Stack.Screen name="WelfareFacilities_CleaningChecklist" component={require('./forms/WelfareFacilities_CleaningChecklist').default} />
  <Stack.Screen name="SculleryArea_CleaningChecklist" component={require('./forms/SculleryArea_CleaningChecklist').default} />
  <Stack.Screen name="CleaningEquipment_CleaningChecklist" component={require('./forms/CleaningEquipment_CleaningChecklist').default} />
  <Stack.Screen name="DryStorageArea_CleaningChecklist" component={require('./forms/DryStorageArea_CleaningChecklist').default} />
  <Stack.Screen name="CertificateOfAnalysis" component={require('./forms/CertificateOfAnalysis').default} />
        </Stack.Navigator>
      </NavigationContainer>
    </ResponsiveView>
  );
}


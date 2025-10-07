import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import useResponsive from '../utils/responsive';

// Wrap form screens to optionally lock to landscape on small devices
export default function FormScreenWrapper({ children, landscapeThreshold = 600 }) {
  const { width } = useWindowDimensions();
  const resp = useResponsive();

  useEffect(() => {
    let didLock = false;
    (async () => {
      try {
        // If device is narrow (phone in portrait), lock the form to landscape so wide tables fit
        if (width < landscapeThreshold) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          didLock = true;
        }
      } catch (e) {
        // ignore orientation errors for platforms that don't support it
      }
    })();

    return () => {
      (async () => {
        if (didLock) {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
          } catch (e) {}
        }
      })();
    };
  }, [width, landscapeThreshold]);

  // If there's a single child element, inject responsive prop so forms can use it directly
  const content = React.Children.count(children) === 1
    ? React.cloneElement(React.Children.only(children), { responsive: resp })
    : children;

  return (
    <View style={{ flex: 1 }}>
      {content}
    </View>
  );
}

import React, { useEffect } from 'react';
import { View, useWindowDimensions, Platform, StyleSheet } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import useResponsive from '../utils/responsive';
import BackButton from './BackButton';

// Wrap form screens to optionally lock to landscape on small devices
export default function FormScreenWrapper({ children, landscapeThreshold = 600, disableAutoLandscape = false }) {
  const { width, height } = useWindowDimensions();
  const resp = useResponsive();

  useEffect(() => {
    let didLock = false;
    (async () => {
      try {
        // Skip on web and when explicitly disabled
        if (Platform.OS !== 'web' && !disableAutoLandscape) {
          // For mobile platforms (iOS/Android) force landscape on mount so forms display wide content better.
          // Use explicit platform check to avoid unpredictable behavior on other native targets.
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            didLock = true;
          } else {
            // Fallback: on other native platforms only lock when the device appears narrow in portrait
            if (height > width && width < landscapeThreshold) {
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
              didLock = true;
            }
          }
        }
      } catch (e) {
        // ignore orientation errors for platforms that don't support it or in case of permission issues
      }
    })();

    return () => {
      (async () => {
        if (didLock) {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
          } catch (e) {
            // swallow cleanup errors
          }
        }
      })();
    };
  }, [width, landscapeThreshold, disableAutoLandscape]);

  // If there's a single child element, inject responsive prop so forms can use it directly
  const singleChild = React.Children.count(children) === 1 ? React.Children.only(children) : null;
  const content = singleChild
    ? React.cloneElement(singleChild, { responsive: resp })
    : children;

  return (
    <View style={{ flex: 1 }}>
      {content}
      {/* show back button overlay if the child has navigation and can goBack */}
      {singleChild && singleChild.props && singleChild.props.navigation && singleChild.props.navigation.canGoBack() && (
        <View style={styles.backBtnWrap} pointerEvents="box-none">
          <BackButton onPress={() => singleChild.props.navigation.goBack()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtnWrap: {
    position: 'absolute',
    top: 18,
    left: 12,
    zIndex: 1000,
  },
});

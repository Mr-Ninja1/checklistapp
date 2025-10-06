import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import useResponsive from '../utils/responsive';

export function ResponsiveView({ children, style, lockLandscape = false }) {
  const resp = useResponsive();

  useEffect(() => {
    let didLock = false;
    (async () => {
      try {
        if (lockLandscape) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          didLock = true;
        }
      } catch (e) {
        // ignore errors from orientation lock on unsupported platforms
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
  }, [lockLandscape]);

  // If there's a single child, inject the responsive helper. Otherwise render children as-is.
  const content = React.Children.count(children) === 1
    ? React.cloneElement(React.Children.only(children), { responsive: resp })
    : children;

  return (
    <View style={[styles.container, style]} data-responsive>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ResponsiveView;

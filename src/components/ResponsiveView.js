import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import useResponsive from '../utils/responsive';

export function ResponsiveView({ children, style, lockLandscape = false }) {
  const resp = useResponsive();

  useEffect(() => {
    // Respect lockLandscape when explicitly requested, but skip on web (ScreenOrientation not supported there).
    if (Platform.OS === 'web') return;
    let didLock = false;
    (async () => {
      try {
        if (lockLandscape) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          didLock = true;
        }
      } catch (e) {
        // ignore orientation errors on platforms that don't support it
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

  // If a single child, inject responsive helper; otherwise render children as-is.
  const content = React.Children.count(children) === 1
    ? React.cloneElement(React.Children.only(children), { responsive: resp })
    : children;

  // On web avoid a global ScrollView (prevents double scrollbars and reflow glitches).
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
        {content}
      </SafeAreaView>
    );
  }

  // Wrap entire app in SafeAreaView and a ScrollView on native platforms so any screen can scroll when content exceeds viewport.
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ResponsiveView;

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(1)).current;
  const spinnerAnim = useRef(new Animated.Value(0)).current;
  const SPLASH_DURATION = 4000;

  useEffect(() => {
    // subtle logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.04, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 0.98, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ])
    ).start();

    // continuous double-ring spinner rotation
    Animated.loop(
      Animated.timing(spinnerAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const timeout = setTimeout(() => {
      try { navigation.replace('Home', { showWhatsNew: true }); } catch (e) {}
    }, SPLASH_DURATION);

    return () => { clearTimeout(timeout); };
  }, [logoScale, spinnerAnim, navigation]);

  const outerRotate = spinnerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const innerRotate = spinnerAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={styles.container}>
      <Animated.View style={styles.logoWrapper}>
        <Animated.Image
          source={require('../assets/logo.jpeg')}
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </Animated.View>
      
      <View style={styles.spinnerContainer}>
        <Animated.View style={[styles.spinnerOuter, { transform: [{ rotate: outerRotate }] }]} />
        <Animated.View style={[styles.spinnerInner, { transform: [{ rotate: innerRotate }] }]} />
      </View>
      <Text style={styles.tagline}>Fresh &amp; Quick</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoWrapper: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
  bravo: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 24,
  },
  spinnerContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  spinnerOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 6,
    borderColor: '#000',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  spinnerInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#000',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    opacity: 0.9,
  },
  tagline: {
    fontSize: 16,
    color: '#000',
    marginTop: 4,
  },
});

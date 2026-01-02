import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { ActivityIndicator } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const confettiDots = React.useMemo(() => new Array(10).fill(0).map((_, i) => ({ id: i, left: `${6 + i * 8}%`, color: ['#FFD54F','#FF8A65','#FF5252','#4CAF50'][i % 4] })), []);
  const confettiAnims = useRef(confettiDots.map(() => new Animated.Value(0))).current;
  const today = new Date();
  // show new year greeting only through January 3rd (inclusive)
  const isNewYearSeason = (today.getMonth() === 0 && today.getDate() <= 3);

  useEffect(() => {
    // show greeting briefly then navigate to Home
    let mounted = true;
    // logo pulse (always)
    Animated.loop(Animated.sequence([
      Animated.timing(logoScale, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 0.98, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ])).start();

    // greeting fade & pulse
    Animated.sequence([
      Animated.timing(greetingOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(greetingScale, { toValue: 1.04, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(greetingScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
      ]))
    ]).start();

    // confetti (only run during new year season)
    if (isNewYearSeason) {
      try {
        confettiAnims.forEach((a, i) => {
          Animated.loop(
            Animated.sequence([
              Animated.delay(i * 120),
              Animated.timing(a, { toValue: 1, duration: 1200 + (i % 3) * 240, useNativeDriver: true }),
              Animated.timing(a, { toValue: 0, duration: 260, useNativeDriver: true }),
              Animated.delay(400 + (i % 2) * 160),
            ])
          ).start();
        });
      } catch (e) {}
    }

    // navigate to Home after a short delay so the splash is visible
    const navTimer = setTimeout(() => { if (mounted) navigation.replace('Home'); }, 2200);
    return () => { mounted = false; clearTimeout(navTimer); };
  }, []);

  // navigation will be triggered after all messages have been displayed once

  return (
    <LinearGradient colors={["#22c1c3", "#185a9d"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.Image source={require('../assets/logo.jpeg')} style={[styles.logo, { transform: [{ scale: logoScale }] }]} resizeMode="contain" />
      </View>
      <Animated.Text style={[styles.bravo, { opacity: greetingOpacity, transform: [{ scale: greetingScale }], fontSize: 44, letterSpacing: 6 }]}>HAPPY NEW YEAR!</Animated.Text>

      {/* full-screen confetti (covers entire splash) */}
      {isNewYearSeason && confettiDots.map((c, i) => {
        const translateY = confettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-60, 260] });
        const opacityA = confettiAnims[i].interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.9, 0.9, 0] });
        const rotate = confettiAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.View key={c.id} pointerEvents="none" style={{ position: 'absolute', left: c.left, top: -60, width: 10, height: 10, borderRadius: 6, backgroundColor: c.color, transform: [{ translateY }, { rotate }], opacity: opacityA }} />
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
  
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 130,
    height: 110,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  spinner: {
    marginTop: 32,
  },
  bravo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  loadingText: {
    marginTop: 18,
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.6,
    textAlign: 'center',
    maxWidth: '80%',
  },
});

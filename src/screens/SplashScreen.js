import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { ActivityIndicator } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const today = new Date();

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

    // no seasonal confetti on splash

    // navigate to Home after a short delay so the splash is visible
    const navTimer = setTimeout(() => { if (mounted) navigation.replace('Home', { showWhatsNew: true }); }, 2200);
    return () => { mounted = false; clearTimeout(navTimer); };
  }, []);

  // navigation will be triggered after all messages have been displayed once

  return (
    <LinearGradient colors={["#22c1c3", "#185a9d"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Animated.Image source={require('../assets/logo.jpeg')} style={[styles.logo, { transform: [{ scale: logoScale }] }]} resizeMode="contain" />
      </View>
      <Animated.Text style={[styles.bravo, { opacity: greetingOpacity, transform: [{ scale: greetingScale }], fontSize: 44, letterSpacing: 6 }]}>Bravo!</Animated.Text>
      <WindowsSpinner size={44} dotSize={6} color="#ffffff" />
    </LinearGradient>
  );
}

function WindowsSpinner({ size = 44, dotSize = 6, color = '#fff' }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const count = 8;
  const radius = Math.max((size / 2) - dotSize, 8);
  const dots = Array.from({ length: count });

  return (
    <View style={{ marginTop: 12, marginBottom: 6 }}>
      <Animated.View style={{ width: size, height: size, transform: [{ rotate }], alignSelf: 'center' }}>
        {dots.map((_, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2; // start at top
          const x = Math.cos(angle) * radius + size / 2 - dotSize / 2;
          const y = Math.sin(angle) * radius + size / 2 - dotSize / 2;
          return (
            <View key={i} style={{ position: 'absolute', left: x, top: y, width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, opacity: 0.95 }} />
          );
        })}
      </Animated.View>
    </View>
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

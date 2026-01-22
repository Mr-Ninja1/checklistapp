import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { ActivityIndicator } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

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
    const navTimer = setTimeout(() => { if (mounted) navigation.replace('Home', { showWhatsNew: true }); }, 9200);
    return () => { mounted = false; clearTimeout(navTimer); };
  }, []);

  // navigation will be triggered after all messages have been displayed once

  return (
    <View style={[styles.container, { backgroundColor: '#001021' }]}>
      {/* cyan radial halo behind the logo */}
      <View style={styles.haloCyan} pointerEvents="none" />
      {/* violet subtle overlay */}
      <View style={styles.haloViolet} pointerEvents="none" />
      <View style={styles.logoContainer}>
        <Animated.Image source={require('../assets/logo.jpeg')} style={[styles.logo, { transform: [{ scale: logoScale }] }]} resizeMode="cover" />
        {/* white sheen overlay */}
        <View style={styles.logoSheen} pointerEvents="none" />
      </View>
      <Animated.Text style={[styles.bravo, { opacity: greetingOpacity, transform: [{ scale: greetingScale }], fontSize: 44, letterSpacing: 6 }]}>Bravo!</Animated.Text>
      <WindowsSpinner size={44} dotSize={6} color="#ffffff" />
      <TipsSlideshow />
    </View>
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

function TipsSlideshow({ tips, interval = 3000 }) {
  const defaultTips = [
    'Always save Draft after you type something',
    'Ensure Dropbox is always connected',
    'You can manually check for updates on the history page',
  ];
  const messages = tips && tips.length ? tips : defaultTips;
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % messages.length), interval);
    return () => clearInterval(t);
  }, [messages.length, interval]);

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(6);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[styles.tipsContainer, { opacity, transform: [{ translateY }] }]}> 
      <Text style={styles.tipsText}>{messages[index]}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
  
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#001822',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
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
  tipsContainer: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  tipsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '84%',
    letterSpacing: 0.4,
  },
  haloCyan: {
    position: 'absolute',
    width: 360,
    height: 360,
    left: '50%',
    marginLeft: -180,
    top: 80,
    borderRadius: 180,
    backgroundColor: 'rgba(30,167,255,0.08)',
    shadowColor: '#1EA7FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 12,
  },
  haloViolet: {
    position: 'absolute',
    width: 260,
    height: 260,
    left: '50%',
    marginLeft: -130,
    top: 120,
    borderRadius: 130,
    backgroundColor: 'rgba(111,92,255,0.06)',
    shadowColor: '#6F5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 10,
  },
  logoSheen: {
    position: 'absolute',
    width: 80,
    height: 30,
    right: 18,
    top: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ rotate: '-20deg' }],
    opacity: 0.95,
  },
});

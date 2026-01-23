import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';

export default function SplashScreen({ navigation }) {
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const today = new Date();
  // Splash duration (ms) — the loading bar will animate for this duration
  // Reduced to speed startup
  const SPLASH_DURATION = 4000;

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

    // navigation will be triggered by the loading bar completion handler
    return () => { mounted = false; };
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
      <LoadingBar width={220} height={10} color="#1EA7FF" duration={SPLASH_DURATION} onComplete={() => navigation.replace('Home', { showWhatsNew: true })} />
    </View>
  );
}
function LoadingBar({ width = 220, height = 8, color = '#1EA7FF', duration = 10000, onComplete } ) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(progress, { toValue: 1, duration: duration, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
    anim.start(({ finished }) => { if (finished && typeof onComplete === 'function') onComplete(); });
    return () => anim.stop();
  }, [progress, duration, onComplete]);

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  return (
    <View style={{ marginTop: 12, marginBottom: 6 }}>
      <View style={[styles.loadingBarTrack, { width, height, borderRadius: height / 2 }]}>
        <Animated.View style={[styles.loadingBarFill, { width: fillWidth, height, backgroundColor: color, borderRadius: height / 2 }]} />
      </View>
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
  
  loadingBarTrack: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  loadingBarFill: {
    shadowColor: '#1EA7FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
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

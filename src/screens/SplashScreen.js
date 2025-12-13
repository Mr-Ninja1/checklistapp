import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { ActivityIndicator } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const messages = [
    'Starting app',
    'Loading forms',
    'Connecting to the internet',
    'Starting Dropbox',
  ];

  useEffect(() => {
    let mounted = true;
    const run = () => {
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(opacity, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        if (!mounted) return;
        setIndex(i => (i + 1) % messages.length);
      });
    };
    run();
    return () => { mounted = false; opacity.stopAnimation(); };
  }, [index]);

  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Home'), 2000);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <LinearGradient colors={["#22c1c3", "#185a9d"]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.bravo}>Bravo!</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      <Animated.Text
        style={[
          styles.loadingText,
          {
            opacity: opacity,
            transform: [
              {
                translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
              },
            ],
          },
        ]}
        numberOfLines={1}
      >
        {messages[index]}
      </Animated.Text>
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

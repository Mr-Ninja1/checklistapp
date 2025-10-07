import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, StatusBar } from 'react-native';
import { ActivityIndicator } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
  navigation.replace('Home');
    }, 2000);
  }, [navigation]);

  return (
    <ImageBackground source={require('../assets/image.png')} style={styles.container} imageStyle={{ resizeMode: 'cover' }}>
      <StatusBar hidden />
      <View style={styles.overlay}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.bravo}>Bravo!</Text>
        <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
  
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
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
  overlay: {
    flex: 1,
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 28,
    paddingHorizontal: 20,
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
});

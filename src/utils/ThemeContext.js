import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme_pref';

const light = {
  mode: 'light',
  background: '#f6fdff',
  card: '#0a1722',
  text: '#e6eef2',
  subtext: '#cbd5e1',
  primary: '#04122a',
  accent: '#1EA7FF',
  glowViolet: '#6F5CFF',
  glowCyan: '#1EA7FF',
  surface: '#fff',
  muted: '#f3f4f6',
};
const dark = {
  mode: 'dark',
  background: '#001021',
  card: '#04122a',
  text: '#e6eef2',
  subtext: '#cbd5e1',
  primary: '#04122a',
  accent: '#1EA7FF',
  glowViolet: '#6F5CFF',
  glowCyan: '#1EA7FF',
  surface: '#0b1220',
  muted: '#0b1228',
};

const ThemeContext = createContext({ theme: light, setThemeMode: () => {} });

export function ThemeProvider({ children }) {
  // Default to light theme unless user has previously chosen dark
  const [theme, setTheme] = useState(light);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored) {
          setTheme(stored === 'dark' ? dark : light);
        }
      } catch (e) {}
    })();
  }, []);

  const setThemeMode = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (e) {}
    setTheme(mode === 'dark' ? dark : light);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;

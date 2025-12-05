import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme_pref';

const light = {
  mode: 'light',
  background: '#f6fdff',
  card: '#ffffff',
  text: '#111827',
  subtext: '#555',
  primary: '#185a9d',
  accent: '#43cea2',
  surface: '#fff',
  muted: '#f3f4f6',
};
const dark = {
  mode: 'dark',
  background: '#0b1220',
  card: '#0f1724',
  text: '#e6eef2',
  subtext: '#cbd5e1',
  primary: '#43cea2',
  accent: '#22c1c3',
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

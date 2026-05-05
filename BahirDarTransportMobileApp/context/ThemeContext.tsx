import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useReactNativeColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { lightTheme, darkTheme } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: typeof lightTheme.colors;
  themeConfig: typeof lightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useReactNativeColorScheme();
  const { setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
    setColorScheme(isDark ? 'dark' : 'light');
  }, [theme, systemColorScheme, setColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('appTheme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

  const currentThemeConfig = isDark ? darkTheme : lightTheme;
  const colors = currentThemeConfig.colors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, colors, themeConfig: currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};



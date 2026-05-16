import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FontContextType {
  fontScale: number;
  setFontScale: (scale: number) => Promise<void>;
  isLoading: boolean;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScaleState] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadFontScale = useCallback(async () => {
    try {
      const savedScale = await AsyncStorage.getItem('fontScale');
      if (savedScale) {
        setFontScaleState(parseFloat(savedScale));
      }
    } catch (error) {
      console.error('Error loading font scale:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFontScale();
  }, [loadFontScale]);

  const setFontScale = async (scale: number) => {
    try {
      setFontScaleState(scale);
      await AsyncStorage.setItem('fontScale', scale.toString());
    } catch (error) {
      console.error('Error saving font scale:', error);
    }
  };

  return (
    <FontContext.Provider value={{ fontScale, setFontScale, isLoading }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};

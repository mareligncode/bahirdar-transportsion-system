import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

const defaultSettings = {
  themeMode: 'light',
  language: 'en',
  emailNotifications: true,
  pushNotifications: true,
  fontSize: 'medium',
  showAvatars: true,
  autoRefresh: false,
  refreshInterval: 30000,
  itemsPerPage: 10,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  // Apply theme
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.setAttribute('data-theme', 'light');
    }
  }, [settings.themeMode]);

  // Apply language to HTML tag
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'am' ? 'ltr' : 'ltr';
  }, [settings.language]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }[settings.fontSize] || '16px';
  }, [settings.fontSize]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      themeMode: prev.themeMode === 'light' ? 'dark' : 'light'
    }));
  };

  const changeLanguage = (lang) => {
    setSettings(prev => ({
      ...prev,
      language: lang
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSetting,
    toggleTheme,
    changeLanguage,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
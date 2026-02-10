import { useSettings } from '../contexts/SettingsContext';
import enTranslations from '../locales/en.json';
import amTranslations from '../locales/am.json';

const translations = {
  en: enTranslations,
  am: amTranslations,
};

export const useTranslation = () => {
  const { settings } = useSettings();
  
  const t = (key, params = {}) => {
    // Get translation for current language, fallback to English
    let translation = translations[settings.language]?.[key] || translations.en[key] || key;
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  };

  return { t, language: settings.language };
};
import { useTranslation as useI18n } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';

export const useTranslation = () => {
  const { settings } = useSettings();
  const { t: i18nTranslate } = useI18n();

  const t = (key, params = {}) => {
    // i18next handles nesting (e.g. 'common.welcome') and parameters automatically
    return i18nTranslate(key, params);
  };

  return { t, language: settings.language };
};
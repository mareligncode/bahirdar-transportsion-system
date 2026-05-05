import { useCallback } from 'react';
import { useTranslation as useI18n } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';

export const useTranslation = () => {
  const { settings } = useSettings();
  const { t: i18nTranslate } = useI18n();

  const t = useCallback((key, params = {}) => {
    // i18next handles nesting (e.g. 'common.welcome') and parameters automatically
    return i18nTranslate(key, params);
  }, [i18nTranslate]);

  return { t, language: settings.language };
};
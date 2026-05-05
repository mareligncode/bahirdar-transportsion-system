import { useLanguage } from '@/context/LanguageContext';

export const useTranslation = () => {
  const { t, language, setLanguage, isLoading } = useLanguage();

  const translate = (key: keyof typeof t, params?: Record<string, string | number>) => {
    let text = t[key] || String(key);

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }

    return text;
  };

  const pluralize = (key: string, count: number, params?: Record<string, string | number>) => {
    const pluralKey = `${key}_plural` as keyof typeof t;
    const translationKey = count === 1 ? key : (t[pluralKey] ? pluralKey : key);
    return translate(translationKey as keyof typeof t, { count, ...params });
  };

  return {
    t,
    language,
    setLanguage,
    isLoading,
    translate,
    pluralize
  };
};
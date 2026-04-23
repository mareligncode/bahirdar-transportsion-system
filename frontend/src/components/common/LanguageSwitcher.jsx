import React from 'react';
import { Globe } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';

const LanguageSwitcher = () => {
    const { t } = useTranslation();
    const { settings, changeLanguage } = useSettings();

    const toggleLanguage = () => {
        const nextLng = settings.language === 'en' ? 'am' : 'en';
        changeLanguage(nextLng);
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-4 py-2 ${settings.themeMode === 'dark' ? 'bg-white/10 text-white' : 'bg-primary-50 text-primary-700'} backdrop-blur-md border ${settings.themeMode === 'dark' ? 'border-white/20' : 'border-primary-100'} rounded-xl hover:shadow-lg transition-all active:scale-95 group relative overflow-hidden`}
            title={t('common.language')}
        >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Globe className={`w-4 h-4 relative z-10 transition-transform duration-500 ${settings.language === 'am' ? 'rotate-180' : ''}`} />
            <span className="text-[10px] font-black relative z-10 uppercase tracking-widest">
                {settings.language === 'en' ? 'EN' : 'አማ'}
            </span>
        </button>
    );
};

export default LanguageSwitcher;

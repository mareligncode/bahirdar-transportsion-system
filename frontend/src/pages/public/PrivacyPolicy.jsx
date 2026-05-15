import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../contexts/SettingsContext';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Server, Bell, Globe, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const isDark = settings.themeMode === 'dark';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} py-16 px-4`}>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link
                        to="/"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isDark ? 'bg-gray-900 hover:bg-gray-800 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600 shadow-sm'} border border-gray-200/10`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">{t('Back to Home')}</span>
                    </Link>
                </div>
                <header className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-500/10 mb-6 border border-teal-500/20">
                        <Shield className="w-10 h-10 text-teal-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-teal-400 to-primary-500 bg-clip-text text-transparent">
                        {t('Privacy Policy')}
                    </h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
                        {t('Your privacy is our priority.')}
                    </p>
                </header>

                <div className={`space-y-12 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-teal-500">
                            <Eye className="w-6 h-6" /> 1. {t('Information We Collect')}
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">1</span>
                                </div>
                                <div>
                                    <h3 className="font-bold">{t('Personal Data')}</h3>
                                    <p className="text-sm">Name, email address, phone number, and profile picture (if provided).</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-primary-600 font-bold">2</span>
                                </div>
                                <div>
                                    <h3 className="font-bold">{t('Location Information')}</h3>
                                    <p className="text-sm">Real-time GPS location of vehicles and drivers for trip tracking and safety.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-teal-500">
                            <Bell className="w-6 h-6" /> 2. {t('How We Use Your Data')}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            We use the collected information to provide, maintain, and improve our services, including:
                        </p>
                        <ul className="space-y-2 list-disc pl-6 text-sm">
                            <li>Processing your trip bookings and payments.</li>
                            <li>Sending important notifications regarding trip updates and status changes.</li>
                            <li>Providing live map tracking for passengers.</li>
                            <li>Ensuring security and safety within the transportation network.</li>
                        </ul>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-teal-500">
                            <Lock className="w-6 h-6" /> 3. {t('Data Security')}
                        </h2>
                        <p className="leading-relaxed">
                            We implement industry-standard encryption and security measures to protect your sensitive data. Your payment information is processed through secure gateways (like Chapa) and is never stored directly on our servers in raw format.
                        </p>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-teal-500">
                            <Globe className="w-6 h-6" /> 4. {t('Third-Party Services')}
                        </h2>
                        <p className="leading-relaxed">
                            We do not sell your personal data. We only share information with third-party partners (such as map providers and payment processors) necessary to deliver our services.
                        </p>
                    </section>
                </div>

                <footer className="mt-16 text-center border-t border-gray-200/20 pt-8">
                    <div className="flex justify-center gap-6 mb-6">
                        <Server className="w-6 h-6 text-gray-400" />
                        <Lock className="w-6 h-6 text-gray-400" />
                        <Shield className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                        For data deletion requests or privacy inquiries, contact our Data Protection Officer at privacy@bahirdar-transport.ph
                    </p>
                </footer>
            </div>
        </div>
    );
}

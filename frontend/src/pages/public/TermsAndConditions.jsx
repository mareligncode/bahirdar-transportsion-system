import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../contexts/SettingsContext';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle, Info, ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
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
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500/10 mb-6 border border-primary-500/20">
                        <FileText className="w-10 h-10 text-primary-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary-400 to-blue-500 bg-clip-text text-transparent">
                        {t('Terms of Service')}
                    </h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
                        {t('Last updated')}: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <div className={`space-y-12 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary-500">
                            <Info className="w-6 h-6" /> 1. {t('Acceptance of Terms')}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            By accessing and using the Bahir Dar Transportation System, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the system.
                        </p>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary-500">
                            <CheckCircle className="w-6 h-6" /> 2. {t('Booking & Cancellation')}
                        </h2>
                        <ul className="space-y-4 list-disc pl-6">
                            <li>Bookings must be made through the official system platform.</li>
                            <li><strong>Cancellation Policy:</strong> Bookings can be cancelled up to 2 hours before the scheduled departure time. Cancellations made within less than 2 hours are subject to a fee.</li>
                            <li>Seats are assigned at the time of booking and are non-transferable to other users.</li>
                        </ul>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary-500">
                            <Shield className="w-6 h-6" /> 3. {t('User Responsibilities')}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            Users must provide accurate information during registration and booking. Any misuse of the system, including fraudulent bookings or harassment of staff/drivers, will lead to immediate account suspension.
                        </p>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary-500">
                            <Lock className="w-6 h-6" /> 4. {t('Payments & Refunds')}
                        </h2>
                        <p className="leading-relaxed">
                            We support both online payments and manual bank transfers. Refunds for cancelled trips (meeting the 2-hour criteria) will be processed within 3-5 business days to the original payment method or as system credit.
                        </p>
                    </section>

                    <section className={`p-8 rounded-3xl border ${isDark ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200'} shadow-sm`}>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-500">
                            <Shield className="w-6 h-6" /> 5. {t('Driver Policy & Penalties')}
                        </h2>
                        <div className="space-y-4">
                            <p className="font-semibold text-red-600 dark:text-red-400">
                                Drivers are the backbone of our service and must adhere to the highest safety and professional standards.
                            </p>
                            <ul className="space-y-3 list-disc pl-6 text-sm">
                                <li><strong>Violation of Terms:</strong> Any driver found violating station rules, overcharging passengers, or operating outside the assigned queue will face immediate penalties.</li>
                                <li><strong>Suspension:</strong> Severe or repeated violations will result in the driver and vehicle being <strong>blocked from the station and the system for a minimum of one week (Weekend suspension)</strong>.</li>
                                <li><strong>System Monitoring:</strong> GPS tracking and passenger feedback are used to monitor compliance automatically.</li>
                            </ul>
                        </div>
                    </section>
                </div>

                <footer className="mt-16 text-center">
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        If you have any questions about our Terms, please <a href="/contact" className="text-primary-500 hover:underline">contact us</a>.
                    </p>
                </footer>
            </div>
        </div>
    );
}

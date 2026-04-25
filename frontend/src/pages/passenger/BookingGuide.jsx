import React from 'react';
import {
  Search,
  MapPin,
  Users,
  CreditCard,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../contexts/SettingsContext';

const BookingGuide = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  const steps = [
    {
      icon: <Search className="w-6 h-6 text-blue-500" />,
      title: t('1. Search Your Trip'),
      description: t("Enter your departure station and destination on the 'Book Trip' page. Select your travel date to see available trips."),
      color: "blue"
    },
    {
      icon: <MapPin className="w-6 h-6 text-purple-500" />,
      title: t("2. Choose a Trip"),
      description: t("Browse the list of available trips. You can see the price, departure time, and remaining seats for each option."),
      color: "purple"
    },
    {
      icon: <Users className="w-6 h-6 text-orange-500" />,
      title: t("3. Select Your Seats"),
      description: t("Click on 'Choose Seats' and pick your preferred spot from the interactive seat map. You can book multiple seats at once."),
      color: "orange"
    },
    {
      icon: <CreditCard className="w-6 h-6 text-emerald-500" />,
      title: t("4. Complete Payment"),
      description: t("Choose your payment method. You can pay securely online via Chapa or choose 'Pay at Station' to pay with cash."),
      color: "emerald"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
      title: t("5. Get Your Ticket"),
      description: t("Once confirmed, your ticket will appear in 'My Bookings'. You can download or show it at the station when boarding."),
      color: "blue"
    }
  ];

  return (
    <div className={`p-4 sm:p-6 lg:p-8 min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-3">
            <HelpCircle className="w-8 h-8 text-blue-500" />
            {t('Booking Guide')}
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
            {t('Follow these simple steps to book your journey with Bahir Dar Transportation System.')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${isDark
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-100 hover:border-blue-100 shadow-sm'
                }`}
            >
              <div className="flex items-start gap-5">
                <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0 ${step.color === 'blue' ? 'bg-blue-500' :
                    step.color === 'purple' ? 'bg-purple-500' :
                      step.color === 'orange' ? 'bg-orange-500' :
                        'bg-emerald-500'
                  }`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {step.title}
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line for desktop (visible between blocks) */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 -mr-4 hidden lg:block text-gray-300">
                  <ArrowRight className="w-8 h-8 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Important Note */}
        <div className={`mt-10 p-6 rounded-2xl border-l-4 border-blue-500 ${isDark ? 'bg-gray-800/50' : 'bg-blue-50'
          }`}>
          <div className="flex gap-4">
            <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold mb-1">{t('Important Information')}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                {t("Please arrive at the station at least 30 minutes before departure. If you chose 'Pay at Station', ensure you complete your payment at least 1 hour before the trip starts to secure your seat.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingGuide;

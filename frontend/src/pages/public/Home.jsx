import { Link } from 'react-router-dom';
import { Search, Shield, Clock, DollarSign } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../contexts/SettingsContext';

export default function Home() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  return (
    <div className="pt-0 mt-0">
      {/* Hero Section with Background Image - Full Width */}
      <section
        className="relative text-white min-h-screen w-screen flex items-start justify-center overflow-hidden -mt-[var(--header-height,0px)]"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw',
          marginTop: 0,
          paddingTop: 0
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>

        <div className="container relative z-10 mx-auto px-4 flex flex-col justify-between min-h-screen py-8 md:py-12">
          {/* Top section with heading and subtitle */}
          <div className="text-center pt-8 md:pt-12 lg:pt-16">
            {/* Main heading with gradient text */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                {t('welcome_title')}
              </span>
            </h1>

            {/* Subtitle with gradient and glow effect */}
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 bg-clip-text text-transparent font-medium drop-shadow-lg text-center">
                {t('welcome_subtitle')}
              </span>
            </p>
          </div>

          {/* Buttons at the bottom */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pb-8 md:pb-12 px-6 sm:px-0">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-white/30 hover:border-white/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-center"
            >
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent font-bold">
                {t('login')}
              </span>
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-white/30 hover:border-white/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-center"
            >
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent font-bold">
                {t('get_started')}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works with Subtle Transportation Pattern - FULL WIDTH */}
      <section
        className="relative w-screen py-16 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, ${isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(249, 250, 251, 0.95)'}, ${isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(249, 250, 251, 0.98)'}),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895-2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='${isDark ? '%233b82f6' : '%233b82f6'}' fill-opacity='${isDark ? '0.05' : '0.1'}' fill-rule='evenodd'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 300px',
          backgroundPosition: 'center, center',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw'
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">{t('how_it_works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: t('search_title'), desc: t('search_desc') },
              { icon: Clock, title: t('book_title'), desc: t('book_desc') },
              { icon: Shield, title: t('travel_title'), desc: t('travel_desc') },
              { icon: DollarSign, title: t('pay_title'), desc: t('pay_desc') },
            ].map((step, index) => (
              <div key={index} className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-blue-50">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Road Map Background - FULL WIDTH */}
      <section
        className="relative w-screen py-16 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, ${isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(243, 244, 246, 0.95)'}, ${isDark ? 'rgba(31, 41, 55, 0.97)' : 'rgba(243, 244, 246, 0.97)'}),
            url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 100 Q100 20, 180 100' stroke='%233b82f6' stroke-width='2' stroke-opacity='0.1' fill='none'/%3E%3Cpath d='M20 120 Q100 40, 180 120' stroke='%233b82f6' stroke-width='2' stroke-opacity='0.1' fill='none'/%3E%3Ccircle cx='20' cy='100' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='100' cy='20' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='180' cy='100' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='20' cy='120' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='100' cy='40' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='180' cy='120' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 400px',
          backgroundPosition: 'center, center',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw'
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">{t('why_choose_us')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('online_payment_title'),
                desc: t('online_payment_desc'),
                icon: '🌐'
              },
              {
                title: t('safe_secure_title'),
                desc: t('safe_secure_desc'),
                icon: '🛡️'
              },
              {
                title: t('pay_faster_title'),
                desc: t('pay_faster_desc'),
                icon: '⚡'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="relative bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
              >
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Section: Transportation Network - FULL WIDTH */}
      <section
        className={`relative w-screen py-16 overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-t border-white/5' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
          }`}
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 px-2">{t("largest_network_title")}</h2>
          <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-3xl mx-auto px-4">
            {t('largest_network_desc')}
          </p>
        </div>
      </section>
    </div>
  );
}
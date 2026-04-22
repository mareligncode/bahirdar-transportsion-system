import { Link } from 'react-router-dom';
import { Search, Shield, Clock, DollarSign } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function Home() {
  const { t } = useTranslation();
  
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                {t('Your Guide to Transportation in Bahir Dar')}
              </span>
            </h1>
            
            {/* Subtitle with gradient and glow effect */}
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 bg-clip-text text-transparent font-medium drop-shadow-lg">
                {t('Seamlessly connect with rides and drivers across the city. Your journey, simplified.')}
              </span>
            </p>
          </div>
          
          {/* Buttons at the bottom */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pb-8 md:pb-12">
            <Link 
              to="/login" 
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-white/30 hover:border-white/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30"
            >
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent font-bold">
                {t('Login')}
              </span>
            </Link>
            <Link 
              to="/register" 
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-white/30 hover:border-white/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30"
            >
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent font-bold">
                {t('Sign in')}
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
            linear-gradient(to bottom, rgba(249, 250, 251, 0.95), rgba(249, 250, 251, 0.98)),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%233b82f6' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 300px',
          backgroundPosition: 'center, center',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw'
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">{t('How It Works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: t('Search'), desc: t('Enter your destination to find available rides') },
              { icon: Clock, title: t('Book'), desc: t('Choose your preferred ride and confirm instantly') },
              { icon: Shield, title: t('Travel'), desc: t('Meet your driver and enjoy a safe trip') },
              { icon: DollarSign, title: t('Pay'), desc: t('Pay securely through the app') },
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
            linear-gradient(to bottom, rgba(243, 244, 246, 0.95), rgba(243, 244, 246, 0.97)),
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
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">{t('Why Choose Us?')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('Online payment'),
                desc: t('Make secure online payments in just a few taps and focus on enjoying your journey, not the process.'),
                icon: '🌐'
              },
              {
                title: t('Safe & Secure'),
                desc: t('Ride safely with verified drivers and protected payments that keep every journey secure and reliable.'),
                icon: '🛡️'
              },
              {
                title: t('Pay Faster Online'),
                desc: t('Online payment saves time because you don’t have to go there in person.'),
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
        className="relative w-screen py-16 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">{t("Bahir Dar's Largest Transport Network")}</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
            {t('Connecting every corner of the city with reliable, affordable, and comfortable transportation options. From the bustling marketplaces to serene lakeside views, we\'ve got your journey covered.')}
          </p>
        </div>
      </section>
    </div>
  );
}
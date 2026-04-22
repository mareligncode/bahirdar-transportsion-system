import { Link } from 'react-router-dom';
import { 
  Bus, 
  Navigation, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Shield, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-12 pb-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary-500 to-teal-500"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Company Info */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-primary-600 p-2 rounded-xl">
                <Bus className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-primary-400 bg-clip-text text-transparent">
                  {t('Bahir dar meneharia')}
                </h2>
                <p className="text-sm text-gray-400">{t('Smart transportation system')}</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              {t('Revolutionizing urban mobility')}
            </p>
            
            {/* App Badges */}
            <div className="flex gap-3 mb-4">
              <a 
                href="https://play.google.com/store/apps/details?id=com.bahirhartransport" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary-400" />
                  <div>
                    <p className="text-xs text-gray-400">{t('download on')}</p>
                    <p className="text-sm font-semibold">{t('google play')}</p>
                  </div>
                </div>
              </a>
              <a 
                href="https://apps.apple.com/app/id1234567890" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary-400" />
                  <div>
                    <p className="text-xs text-gray-400">{t('download on')}</p>
                    <p className="text-sm font-semibold">{t('App store')}</p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact & Social Section - Combined */}
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Contact Info */}
                <div>
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-400" />
                    {t('contact info')}
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">
                       {t('Main office at')}<br />
                        {t('Ethiopia')}, {t('Bahir dar')}
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">+251978522105</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">leulyenealem@gmail.com</span>
                    </li>
                  </ul>
                </div>

                {/* Follow Us */}
                <div>
                  <h4 className="font-bold text-lg mb-4">{t('Follow us on')}</h4>
                  <div className="flex gap-3">
                    {[
                      { 
                        icon: Facebook, 
                        color: 'hover:bg-blue-600', 
                        label: 'Facebook',
                        link: 'https://facebook.com'
                      },
                      { 
                        icon: Twitter, 
                        color: 'hover:bg-sky-500', 
                        label: 'Twitter',
                        link: 'https://twitter.com'
                      },
                      { 
                        icon: Instagram, 
                        color: 'hover:bg-pink-600', 
                        label: 'Instagram',
                        link: 'https://instagram.com'
                      },
                      { 
                        icon: Linkedin, 
                        color: 'hover:bg-blue-700', 
                        label: 'LinkedIn',
                        link: 'https://linkedin.com'
                      },
                    ].map((social) => (
                      <a
                        key={social.label}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center transition-all duration-300 hover:scale-110 ${social.color}`}
                        aria-label={social.label}
                      >
                        <social.icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-400 text-xs">
              &copy; {currentYear} {t('Bahir dar meneharia transportation system')}. {t('all rights reserved')}.
            </p>
            
            <div className="flex flex-wrap justify-center gap-5 text-xs">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                {t('Terms of service')}
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                {t('Privacy Policy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
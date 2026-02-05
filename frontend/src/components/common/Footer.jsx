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

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-12 pb-6 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary-500 to-teal-500"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-primary-600 p-2 rounded-xl">
                <Bus className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-primary-400 bg-clip-text text-transparent">
                  Bahir Dar Meneharia
                </h2>
                <p className="text-sm text-gray-400">Smart Transportation System</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Revolutionizing urban mobility in Bahir Dar with smart, reliable, 
              and eco-friendly transportation solutions. Connecting people and places seamlessly.
            </p>
            
            {/* App Badges */}
            <div className="flex gap-3 mb-8">
              <div className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer transition-all hover:scale-105">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-xs text-gray-400">Download on</p>
                    <p className="font-semibold">Google Play</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 cursor-pointer transition-all hover:scale-105">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-xs text-gray-400">Download on</p>
                    <p className="font-semibold">App Store</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary-400" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { name: 'Home', path: '/' },
                  { name: 'Book a Ride', path: '/book' },
                  { name: 'Track Bus', path: '/track' },
                  { name: 'Routes', path: '/routes' },
                  { name: 'Fare Calculator', path: '/fare' },
                  { name: 'Live Schedule', path: '/schedule' },
                ].map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path}
                      className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group"
                    >
                      <div className="w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-400" />
                Our Services
              </h4>
              <ul className="space-y-3">
                {[
                  'City Bus Service',
                  'Express Routes',
                  'Monthly Subscription',
                  'Accessible Transport'
                  'Student Pass',
                  'Monthly Subscription',
                  'Corporate Plans',
                  'Tourist Packages',
                  'Accessible Transport',
                  'Night Service'
                ].map((service) => (
                  <li key={service}>
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      {service}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Legal */}
            <div className="space-y-8">
              <div>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-400" />
                  Contact Info
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
                    <span className="text-gray-300">
                      123 Transportation Hub,<br />
                      Bahir Dar, Ethiopia
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    <span className="text-gray-300">+251 123 456 789</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    <span className="text-gray-300">contact@bahirdartransit.com</span>
                  </li>
                </ul>
              </div>

              {/* Social Media */}
              <div>
                <h4 className="font-bold text-lg mb-4">Follow Us</h4>
                <div className="flex gap-3">
                  {[
                    { icon: Facebook, color: 'hover:bg-blue-600', label: 'Facebook' },
                    { icon: Twitter, color: 'hover:bg-sky-500', label: 'Twitter' },
                    { icon: Instagram, color: 'hover:bg-pink-600', label: 'Instagram' },
                    { icon: Linkedin, color: 'hover:bg-blue-700', label: 'LinkedIn' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href="#"
                      className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-all duration-300 hover:scale-110 ${social.color}`}
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} Bahir Dar Meneharia Transportation System. All rights reserved.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link to="/accessibility" className="text-gray-400 hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Tracking Active</span>
            </div>
            <div>•</div>
            <div>24/7 Customer Support</div>
            <div>•</div>
            <div>500+ Active Vehicles</div>
            <div>•</div>
            <div>ISO 9001:2022 Certified</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
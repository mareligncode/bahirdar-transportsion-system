import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, MapPin, Bus, Settings } from 'lucide-react'; // Removed Bell from here
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import NotificationBell from '../notifications/NotificationBell'; // ✅ ADD THIS

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Add settings hook
  const { settings, updateSetting, toggleTheme, changeLanguage } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  
  // Add ref for click outside detection
  const settingsRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Format user display name
  const getDisplayName = () => {
    if (!user) return '';
    return user.fullName || user.email.split('@')[0];
  };

  // Get user role display
  const getRoleDisplay = () => {
    if (!user) return '';
    const roleMap = {
      'passenger': t('passenger'),
      'driver': t('driver'),
      'station_admin': t('station_admin'),
      'super_admin': t('super_admin')
    };
    return roleMap[user.role] || user.role;
  };

  return (
    <>
      <header 
        className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 shadow-xl overflow-visible z-40"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(49, 46, 129, 0.95) 100%),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2360a5fa' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 200px'
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between h-20">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white group-hover:text-cyan-100 transition-colors">
                  {t('Bahir dar meneharia')}
                </span>
                <span className="text-xs text-blue-200 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {t('smart city transport')}
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {isAuthenticated && (
                <>
                  {user?.role === 'super_admin' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    >
                      <span className="relative z-10">{t('admin_dashboard')}</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </Link>
                  )}
                  {user?.role === 'station_admin' && (
                    <Link 
                      to="/station/dashboard" 
                      className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    >
                      <span className="relative z-10">{t('station_control')}</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </Link>
                  )}
                  {user?.role === 'driver' && (
                    <Link 
                      to="/driver/dashboard" 
                      className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                    >
                      <span className="relative z-10">{t('driver_hub')}</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 group"
                  >
                    <span className="relative z-10">{t('my_profile')}</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  </Link>
                </>
              )}
            </nav>

            {/* Enhanced User Actions */}
            <div className="flex items-center space-x-4 relative z-50" ref={settingsRef}>
              {/* Settings Button */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                  title={t('settings')}
                >
                  <Settings className={`w-5 h-5 text-white transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`} />
                </button>

                {/* Simple Settings Dropdown */}
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-[100] animate-fadeIn">
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-gray-500" />
                        {t('quick_settings')}
                      </h3>
                    </div>
                    
                    <div className="p-3 space-y-3">
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('theme')}</span>
                        <button
                          onClick={toggleTheme}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                        >
                          {settings.themeMode === 'light' ? '🌙 Dark' : '☀️ Light'}
                        </button>
                      </div>

                      {/* Language Selector */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('language')}</span>
                        <select
                          value={settings.language}
                          onChange={(e) => changeLanguage(e.target.value)}
                          className="text-sm bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="en">🇺🇸 English</option>
                          <option value="am">🇪🇹 አማርኛ</option>
                          <option value="om">🇪🇹 Afaan Oromoo</option>
                        </select>
                      </div>

                      {/* Font Size */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('font_size')}</span>
                        <select
                          value={settings.fontSize}
                          onChange={(e) => updateSetting('fontSize', e.target.value)}
                          className="text-sm bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="small">{t('small')}</option>
                          <option value="medium">{t('medium')}</option>
                          <option value="large">{t('large')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell - REPLACED the old notification button with this */}
              {isAuthenticated && user && (
                <NotificationBell />
              )}

              {/* User Info */}
              {isAuthenticated && user && (
                <>
                  <div className="hidden md:flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                      <p className="text-xs text-blue-200">{getRoleDisplay()}</p>
                    </div>
                    
                    <Link to="/profile" className="block">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    title={t('logout')}
                  >
                    <LogOut className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {/* Auth Buttons */}
              {!isAuthenticated && (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="text-white/90 hover:text-white px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors text-sm"
                  >
                    {t('Login')}
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-white/90 px-4 py-2 rounded-lg border border-white/30 text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    {t('get started')}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
      </header>

      {/* Add these CSS animations */}
      <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .animate-shine {
          animation: shine 1.5s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
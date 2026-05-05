import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MapPin, Bus, Settings } from 'lucide-react'; // Removed Bell from here
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import NotificationBell from '../notifications/NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header({ onMenuClick, isMenuOpen }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { settings, updateSetting, toggleTheme, changeLanguage } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add ref for click outside detection
  const settingsRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }

    // Close mobile menu when window is resized to desktop
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
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
        className={`sticky top-0 z-50 transition-all duration-300 ${settings.themeMode === 'dark' ? 'glass-dark border-gray-700/50' : 'glass border-white/20'} border-b shadow-xl`}
      >
        {/* Animated background elements - more subtle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between h-20">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Bus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
              </div>
              <div className="hidden xsm:flex flex-col min-w-0 overflow-hidden">
                <span className={`text-base sm:text-lg md:text-xl font-bold truncate ${settings.themeMode === 'dark' ? 'text-white' : 'text-gray-900'} group-hover:text-primary-600 transition-colors`}>
                  {t('Bahir dar meneharia')}
                </span>
                <span className="text-[10px] sm:text-xs text-blue-500 flex items-center font-medium truncate">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                  {t('smart city transport')}
                </span>
              </div>
            </Link>

            {/* Navigation - Pills style */}
            <nav className="hidden md:flex items-center space-x-1 p-1 bg-gray-100/50 rounded-2xl backdrop-blur-sm border border-gray-200/30">
              {isAuthenticated && (
                <>
                  {user?.role === 'super_admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all"
                    >
                      {t('admin_dashboard')}
                    </Link>
                  )}
                  {user?.role === 'station_admin' && (
                    <Link
                      to="/station/dashboard"
                      className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all"
                    >
                      {t('station_control')}
                    </Link>
                  )}
                  {user?.role === 'driver' && (
                    <Link
                      to="/driver/dashboard"
                      className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all"
                    >
                      {t('driver_hub')}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all"
                  >
                    {t('my_profile')}
                  </Link>
                </>
              )}
            </nav>

            {/* Enhanced User Actions */}
            <div className="flex items-center relative z-50" ref={settingsRef}>
              {/* Desktop Actions - Hidden on Mobile */}
              <div className="hidden md:flex items-center space-x-4 mr-4">
                {/* Settings Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                    title={t('settings')}
                  >
                    <Settings className={`w-5 h-5 transition-transform duration-300 ${isDark ? 'text-white' : 'text-gray-900'} ${showSettings ? 'rotate-180' : ''}`} />
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

                <LanguageSwitcher />

                {isAuthenticated && user && (
                  <>
                    <NotificationBell />
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{getDisplayName()}</p>
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

                    <button
                      onClick={handleLogout}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:scale-105 transition-all border border-red-500/20"
                      title={t('logout')}
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                )}

                {!isAuthenticated && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/login"
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all"
                    >
                      {t('get_started')}
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={onMenuClick || (() => setIsMobileMenuOpen(!isMobileMenuOpen))}
                className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                aria-label="Toggle menu"
              >
                {isMenuOpen || isMobileMenuOpen ? (
                  <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                ) : (
                  <Menu className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t animate-fadeIn overflow-hidden ${isDark ? 'glass-dark border-white/10' : 'bg-white/95 backdrop-blur-md border-gray-100'}`}>
            <div className="container mx-auto px-4 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className={`flex items-center space-x-3 p-3 rounded-xl mb-4 ${isDark ? 'bg-white/10' : 'bg-gray-50'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{getDisplayName()}</p>
                      <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>{getRoleDisplay()}</p>
                    </div>
                  </div>

                  {user?.role === 'super_admin' && (
                    <Link
                      to="/admin/dashboard"
                      className={`block px-4 py-3 rounded-xl text-base font-medium ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('admin_dashboard')}
                    </Link>
                  )}
                  {user?.role === 'station_admin' && (
                    <Link
                      to="/station/dashboard"
                      className={`block px-4 py-3 rounded-xl text-base font-medium ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('station_control')}
                    </Link>
                  )}
                  {user?.role === 'driver' && (
                    <Link
                      to="/driver/dashboard"
                      className={`block px-4 py-3 rounded-xl text-base font-medium ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('driver_hub')}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className={`block px-4 py-3 rounded-xl text-base font-medium ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('my_profile')}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium flex items-center ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    {t('logout')}
                  </button>

                  <div className={`pt-4 mt-4 border-t space-y-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('preferences')}</p>

                    <div className="px-4 flex items-center justify-between">
                      <span className={`${isDark ? 'text-white' : 'text-gray-700'} text-sm`}>{t('language')}</span>
                      <LanguageSwitcher />
                    </div>

                    <div className="px-4 flex items-center justify-between">
                      <span className={`${isDark ? 'text-white' : 'text-gray-700'} text-sm`}>{t('notifications')}</span>
                      <NotificationBell />
                    </div>

                    <div className="px-4 flex items-center justify-between">
                      <span className={`${isDark ? 'text-white' : 'text-gray-700'} text-sm`}>{t('theme')}</span>
                      <button
                        onClick={toggleTheme}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      >
                        {settings.themeMode === 'light' ? '🌙 Dark' : '☀️ Light'}
                      </button>
                    </div>

                    <div className="px-4 flex items-center justify-between">
                      <span className={`${isDark ? 'text-white' : 'text-gray-700'} text-sm`}>{t('font_size')}</span>
                      <select
                        value={settings.fontSize}
                        onChange={(e) => updateSetting('fontSize', e.target.value)}
                        className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
                      >
                        <option value="small" className={isDark ? 'bg-gray-800' : 'bg-white'}>{t('small')}</option>
                        <option value="medium" className={isDark ? 'bg-gray-800' : 'bg-white'}>{t('medium')}</option>
                        <option value="large" className={isDark ? 'bg-gray-800' : 'bg-white'}>{t('large')}</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      className={`flex items-center justify-center px-4 py-3 rounded-xl text-base font-bold border ${isDark ? 'text-white border-white/20 hover:bg-white/10' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center px-4 py-3 rounded-xl text-base font-bold bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('get_started')}
                    </Link>
                  </div>

                  <div className={`pt-4 border-t space-y-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <div className="px-4 flex items-center justify-between">
                      <span className={`${isDark ? 'text-white' : 'text-gray-700'} text-sm`}>{t('language')}</span>
                      <LanguageSwitcher />
                    </div>
                    <div className="px-4 flex items-center justify-between">
                      <span className={`${isDark ? 'text-white' : 'text-gray-700'} text-sm`}>{t('theme')}</span>
                      <button
                        onClick={toggleTheme}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      >
                        {settings.themeMode === 'light' ? '🌙 Dark' : '☀️ Light'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
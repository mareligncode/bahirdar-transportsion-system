import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, Bell, LogOut, MapPin, Bus, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation'; // ✅ ADD THIS

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(); // ✅ ADD THIS
  
  // Add settings hook
  const { settings, updateSetting, toggleTheme, changeLanguage, resetSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

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
        className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 shadow-xl"
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
                  {t('bahir_dar_meneharia')}
                </span>
                <span className="text-xs text-blue-200 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {t('smart_city_transport')}
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
            <div className="flex items-center space-x-6">
              {/* Settings Button - Always Visible */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group relative"
                  title={t('settings')}
                >
                  <Settings className={`w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500 ${showSettings ? 'rotate-180' : ''}`} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                </button>

                {/* Settings Dropdown Menu */}
                {showSettings && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fadeIn">
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                      <h3 className="text-white font-semibold flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('settings')}
                      </h3>
                      <p className="text-blue-100 text-xs mt-1">{t('customize_your_experience')}</p>
                    </div>
                    
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {/* Theme Toggle */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('theme')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('switch_between_light_and_dark')}</p>
                          </div>
                          <button
                            onClick={toggleTheme}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            {settings.themeMode === 'light' ? `🌙 ${t('dark')}` : `☀️ ${t('light')}`}
                          </button>
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('language')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('choose_your_preferred_language')}</p>
                          </div>
                          <select
                            value={settings.language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="am">አማርኛ</option>
                            <option value="om">Afaan Oromoo</option>
                          </select>
                        </div>
                      </div>

                      {/* Font Size */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('font_size')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('adjust_text_size')}</p>
                          </div>
                          <div className="flex space-x-2">
                            {['small', 'medium', 'large'].map((size) => (
                              <button
                                key={size}
                                onClick={() => updateSetting('fontSize', size)}
                                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all duration-200 ${
                                  settings.fontSize === size
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                {t(size)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email_notifications')}</label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('receive_email_updates')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('push_notifications')}</label>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('get_real_time_alerts')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.pushNotifications}
                                onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Show Avatars */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('show_avatars')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('display_user_profile_pictures')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.showAvatars}
                              onChange={(e) => updateSetting('showAvatars', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Auto Refresh */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto_refresh')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('automatically_refresh_data')}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.autoRefresh}
                                onChange={(e) => updateSetting('autoRefresh', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                            {settings.autoRefresh && (
                              <select
                                value={settings.refreshInterval}
                                onChange={(e) => updateSetting('refreshInterval', Number(e.target.value))}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                              >
                                <option value={15000}>15{t('s')}</option>
                                <option value={30000}>30{t('s')}</option>
                                <option value={60000}>1{t('m')}</option>
                                <option value={300000}>5{t('m')}</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items Per Page */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('items_per_page')}</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('default_list_size')}</p>
                          </div>
                          <select
                            value={settings.itemsPerPage}
                            onChange={(e) => updateSetting('itemsPerPage', Number(e.target.value))}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                      </div>

                      {/* Reset Settings Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            resetSettings();
                            setShowSettings(false);
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                          {t('reset_to_default_settings')}
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setShowSettings(false)}
                        className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {t('close_settings')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing notification button */}
              {isAuthenticated && user && (
                <>
                  <button className="relative p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group">
                    <Bell className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      0
                    </span>
                  </button>

                  {/* Enhanced User Info */}
                  <div className="hidden md:flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{getDisplayName()}</p>
                      <p className="text-xs text-blue-200 bg-blue-900/30 px-2 py-0.5 rounded-full inline-block">
                        {getRoleDisplay()}
                      </p>
                    </div>
                    
                    <div className="relative group">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/30 ring-offset-2 ring-offset-blue-900 group-hover:ring-cyan-400 transition-all duration-300">
                        <Link to="/profile">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.fullName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </Link>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>

                  {/* Enhanced Logout */}
                  <button
                    onClick={handleLogout}
                    className="p-3 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 group"
                    title={t('logout')}
                  >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <div className="flex items-center space-x-6">
                  <Link 
                    to="/login" 
                    className="text-white/90 hover:text-white px-6 py-2.5 rounded-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  >
                    {t('login')}
                  </Link>
                  <Link 
                    to="/register" 
                    className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden group"
                  >
                    <span className="relative z-10">{t('get_started')}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 group-hover:animate-shine"></div>
                  </Link>
                </div>
              )}

              {/* Enhanced Mobile Menu Button */}
              <button className="md:hidden p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Menu className="w-6 h-6 text-white" />
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
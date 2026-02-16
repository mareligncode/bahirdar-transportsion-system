import { NavLink, useNavigate, useLocation} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Car, 
  Ticket, 
  BarChart3,
  Settings,
  MapPin,
  FileText,
  UserCircle,
  Shield,
  Bell,
  HelpCircle,
  CreditCard,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Globe,
  Palette,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useState } from 'react';

export default function Sidebar({ userRole }) {
  const { user, logout } = useAuth();
  const { settings, toggleTheme, changeLanguage, updateSetting } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get menu items based on user role - FULLY TRANSLATED
  const getMenuItems = () => {
    const commonItems = [
      { icon: Bell, label: t('notifications'), path: '/notifications' },
      { icon: Settings, label: t('settings'), path: '/settings' },
      { icon: UserCircle, label: t('profile'), path: '/profile' },
    ];

    const passengerItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
      { icon: Ticket, label: t('book_trip'), path: '/passenger/book-trip' },
      { icon: Calendar, label: t('my_booking'), path: '/passenger/my-booking' },
      { icon: CreditCard, label: t('payment_methods'), path: '/passenger/payments' },
      { icon: MessageSquare, label: t('support'), path: '/passenger/support' },
    ];

    const driverItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/driver/dashboard' },
      { icon: Car, label: t('My Trips'), path: '/driver/trips' },
      { icon: BarChart3, label: t('My Vehicle'), path: '/driver/vehicle' },
      { icon: Calendar, label: t('Driver Reports'), path: '/driver/reports' },
    ];

    const stationAdminItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/station/dashboard' },
      { icon: Users, label: t('user_management'), path: '/station/users' },
      { icon: Car, label: t('drivers'), path: '/station/drivers' },
      { icon: Car, label: t('vehicles'), path: '/station/vehicles' },
      { icon: Calendar, label: t('trip_management'), path: '/station/trips' },
      { icon: BarChart3, label: t('station_reports'), path: '/station/reports' },
    ];

    const superAdminItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/admin/dashboard' },     
      { icon: Users, label: t('all_users'), path: '/admin/AllUsers' },
      { icon: Shield, label: t('role_management'), path: '/admin/role-management' },
      { icon: Calendar, label: t('schedules'), path: '/admin/schedules' },
      { icon: Car, label: t('vehicles'), path: '/admin/vehicles' },
      { icon: MapPin, label: t('stations'), path: '/admin/stations' },
      { icon: BarChart3, label: t('system_reports'), path: '/admin/reports' },
    ];

    switch(userRole) {
      case 'passenger':
        return [ ...passengerItems, ...commonItems];
      case 'driver':
        return [...driverItems, ...commonItems];
      case 'station_admin':
        return [...stationAdminItems, ...commonItems];
      case 'super_admin':
        return [...superAdminItems, ...commonItems];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  // Get panel title based on role - FULLY TRANSLATED
  const getPanelTitle = () => {
    switch(userRole) {
      case 'passenger': return t('passenger_dashboard');
      case 'driver': return t('driver_dashboard');
      case 'station_admin': return t('station_admin_panel');
      case 'super_admin': return t('super_admin_panel');
      default: return t('dashboard');
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' }
  ];

  // Get role name in current language
  const getRoleName = () => {
    switch(userRole) {
      case 'super_admin': return t('super_admin');
      case 'station_admin': return t('station_admin');
      case 'driver': return t('driver');
      default: return t('passenger');
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        {/* User Info Section */}
        {user && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-100">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {getRoleName()}
                </p>
                {user.stationID && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('station')}: {user.stationID}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel Title */}
        <h2 className="text-lg font-semibold mb-6 text-gray-700">
          {getPanelTitle()}
        </h2>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:border-l-4 hover:border-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Quick Settings Toggle Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5" />
              <span className="font-medium">{t('quick_settings')}</span>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Quick Settings Dropdown */}
          {showSettings && (
            <div className="ml-8 p-3 bg-gray-50 rounded-lg space-y-3 border border-gray-100">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {settings.themeMode === 'dark' ? (
                    <Moon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Sun className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-700">{t('dark_mode')}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.themeMode === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.themeMode === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{t('language')}</span>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="text-sm bg-white border border-gray-300 rounded px-2 py-1 text-gray-700"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{t('font_size')}</span>
                </div>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', e.target.value)}
                  className="text-sm bg-white border border-gray-300 rounded px-2 py-1 text-gray-700"
                >
                  <option value="small">{t('small')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="large">{t('large')}</option>
                </select>
              </div>

              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{t('auto_refresh')}</span>
                </div>
                <button
                  onClick={() => updateSetting('autoRefresh', !settings.autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoRefresh ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* View All Settings Link */}
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowSettings(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 pt-2 border-t border-gray-200"
              >
                {t('view_all_settings')} →
              </button>
            </div>
          )}

          {/* Support Link */}
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-6 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <HelpCircle className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium">{t('help_support')}</span>
              </>
            )}
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </nav>

        {/* Settings Status */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {t('current_settings')}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">
              {settings.language.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <div className="flex items-center">
              {settings.themeMode === 'dark' ? (
                <>
                  <Moon className="w-3 h-3 mr-1 text-gray-500" />
                  <span>{t('dark_mode_enabled')}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3 h-3 mr-1 text-gray-500" />
                  <span>{t('light_mode_enabled')}</span>
                </>
              )}
            </div>
            <span className="text-gray-300">•</span>
            <span>{t('font_size')}: {t(settings.fontSize)}</span>
            <span className="text-gray-300">•</span>
            <span>{t('auto_refresh')}: {settings.autoRefresh ? t('on') : t('off')}</span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('account_type')}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              userRole === 'super_admin' ? 'bg-purple-100 text-purple-700' :
              userRole === 'station_admin' ? 'bg-blue-100 text-blue-700' :
              userRole === 'driver' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getRoleName()}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
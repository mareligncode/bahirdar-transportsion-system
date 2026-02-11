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
      { icon: Car, label: t('assigned_trips'), path: '/driver/trips' },
      { icon: MapPin, label: t('trip_tracking'), path: '/driver/tracking' },
      { icon: BarChart3, label: t('earnings'), path: '/driver/earnings' },
      { icon: Calendar, label: t('availability'), path: '/driver/availability' },
      { icon: FileText, label: t('documents'), path: '/driver/documents' },
    ];

    const stationAdminItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/station/dashboard' },
      { icon: Users, label: t('user_management'), path: '/station/users' },
      { icon: Car, label: t('drivers'), path: '/station/drivers' },
      { icon: Car, label: t('vehicles'), path: '/station/vehicles' },
      { icon: Calendar, label: t('trip_management'), path: '/station/trips' },
      { icon: BarChart3, label: t('station_reports'), path: '/station/reports' },
      { icon: Settings, label: t('station_settings'), path: '/station/station' },
    ];

    const superAdminItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/admin/dashboard' },     
      { icon: Shield, label: t('role_management'), path: '/admin/role-management' },
      { icon: Users, label: t('all_users'), path: '/admin/AllUsers' },
      { icon: Calendar, label: t('schedules'), path: '/admin/schedules' },
      { icon: Car, label: t('vehicles'), path: '/admin/vehicles' },
      { icon: MapPin, label: t('stations'), path: '/admin/stations' },
      { icon: BarChart3, label: t('system_reports'), path: '/admin/reports' },
      { icon: Settings, label: t('system_settings'), path: '/admin/settings' },
      { icon: FileText, label: t('audit_logs'), path: '/admin/audit-logs' },
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
    <aside className="w-64 bg-white border-r shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div className="p-6">
        {/* User Info Section */}
        {user && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center border-2 border-primary-200 dark:border-primary-700">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                  {getRoleName()}
                </p>
                {user.stationID && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('station')}: {user.stationID}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel Title */}
        <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">
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
                    ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600 dark:border-primary-500 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:border-l-4 hover:border-gray-300 dark:hover:border-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
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
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400'
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
            <div className="ml-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {settings.themeMode === 'dark' ? (
                    <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="text-sm">{t('dark_mode')}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.themeMode === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
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
                  <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm">{t('language')}</span>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
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
                  <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm">{t('font_size')}</span>
                </div>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', e.target.value)}
                  className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                >
                  <option value="small">{t('small')}</option>
                  <option value="medium">{t('medium')}</option>
                  <option value="large">{t('large')}</option>
                </select>
              </div>

              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm">{t('auto_refresh')}</span>
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
                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 pt-2 border-t border-gray-200 dark:border-gray-700"
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
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <HelpCircle className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className="font-medium">{t('help_support')}</span>
              </>
            )}
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300 mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </nav>

        {/* Settings Status */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('current_settings')}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
              {settings.language.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              {settings.themeMode === 'dark' ? (
                <>
                  <Moon className="w-3 h-3 mr-1" />
                  <span>{t('dark_mode_enabled')}</span>
                </>
              ) : (
                <>
                  <Sun className="w-3 h-3 mr-1" />
                  <span>{t('light_mode_enabled')}</span>
                </>
              )}
            </div>
            <span>•</span>
            <span>{t('font_size')}: {t(settings.fontSize)}</span>
            <span>•</span>
            <span>{settings.autoRefresh ? t('auto_refresh_on') : t('auto_refresh_off')}</span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('account_type')}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              userRole === 'super_admin' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300' :
              userRole === 'station_admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' :
              userRole === 'driver' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
              'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
            }`}>
              {getRoleName()}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
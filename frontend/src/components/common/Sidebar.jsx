import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Eye,
  Route,
  TrendingUp,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useState, useEffect } from 'react';
import api from '../../services/api';


export default function Sidebar({ userRole }) {
  const { user, logout } = useAuth();
  const { settings, toggleTheme, changeLanguage, updateSetting } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      { icon: MapPin, label: t('Live Map'), path: '/live-map' },
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
      { icon: RefreshCw, label: t('Vehicle Queue'), path: '/driver/queue' },
      { icon: Car, label: t('My Trips'), path: '/driver/trips' },
      { icon: BarChart3, label: t('My Vehicle'), path: '/driver/vehicle' },
      { icon: Calendar, label: t('Driver Reports'), path: '/driver/reports' },
    ];

    const stationAdminItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/station/dashboard' },
      { icon: RefreshCw, label: t('Queue Management'), path: '/station/queue' },
      { icon: Users, label: t('user_management'), path: '/station/users' },
      { icon: Car, label: t('drivers'), path: '/station/drivers' },
      { icon: Car, label: t('vehicles'), path: '/station/vehicles' },
      { icon: Route, label: t('routes'), path: '/admin/routes' },
      { icon: Calendar, label: t('trip_management'), path: '/station/trips' },
      { icon: BarChart3, label: t('station_reports'), path: '/station/reports' },
    ];

    const superAdminItems = [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/admin/dashboard' },
      { icon: Users, label: t('all_users'), path: '/admin/AllUsers' },
      { icon: Shield, label: t('role_management'), path: '/admin/role-management' },
      { icon: Calendar, label: t('schedules'), path: '/admin/schedules' },
      { icon: Route, label: t('routes'), path: '/admin/routes' },
      { icon: Car, label: t('vehicles'), path: '/admin/vehicles' },
      { icon: MapPin, label: t('stations'), path: '/admin/stations' },
      { icon: BarChart3, label: t('system_reports'), path: '/admin/reports' },
    ];

    switch (userRole) {
      case 'passenger': return [...passengerItems, ...commonItems];
      case 'driver': return [...driverItems, ...commonItems];
      case 'station_admin': return [...stationAdminItems, ...commonItems];
      case 'super_admin': return [...superAdminItems, ...commonItems];
      default: return commonItems;
    }
  };

  const menuItems = getMenuItems();

  const getRoleName = () => {
    switch (userRole) {
      case 'super_admin': return t('super_admin');
      case 'station_admin': return t('station_admin');
      case 'driver': return t('driver');
      default: return t('passenger');
    }
  };

  return (
    <aside className={`h-full transition-all duration-300 ease-in-out flex flex-col ${settings.themeMode === 'dark' ? 'glass-dark text-white' : 'glass'} border-r border-gray-200/50 shadow-2xl ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Sidebar Header / Logo Area - Hidden on mobile as it's in the top header */}
      <div className="p-6 hidden md:flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-12 transition-transform hover:rotate-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-500">
              {t('Bahir dar meneharia')}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-white hover:shadow-md transition-all border border-gray-200"
        >
          <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar`}>
        {/* Profile Card */}
        {user && !isCollapsed && (
          <div className={`mb-6 p-3 sm:p-4 glass-card ${settings.themeMode === 'dark' ? 'border-gray-700/50' : 'border-blue-100/50'} relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 -mr-10 -mt-10 rounded-full transition-transform group-hover:scale-150 duration-700" />
            <div className="flex items-center space-x-2 sm:space-x-3 relative z-10">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center shadow-inner border border-blue-50 p-0.5 flex-shrink-0">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {user.fullName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{user.fullName}</p>
                <p className="text-[10px] font-medium text-blue-600 uppercase tracking-tighter">{getRoleName()}</p>
              </div>
            </div>
          </div>
        )}


        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center py-4' : 'space-x-3 px-4 py-3'} rounded-xl transition-all duration-300 group ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 translate-x-1'
                  : 'text-gray-500 hover:bg-white hover:text-primary-600 hover:shadow-md border border-transparent hover:border-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`transition-transform duration-300 group-hover:scale-110 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'text-white' : ''}`} />
                  {!isCollapsed && <span className="font-semibold text-sm">{item.label}</span>}
                  {!isCollapsed && isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Settings Toggle Area */}
        <div className="pt-8 mt-8 border-t border-gray-100">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center ${isCollapsed ? 'justify-center border-none' : 'justify-between px-4 border border-gray-100 shadow-sm'} w-full py-3 rounded-xl transition-all duration-200 ${showSettings ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center space-x-3">
              <Palette className={isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} />
              {!isCollapsed && <span className="font-semibold text-sm">{t('quick_settings')}</span>}
            </div>
            {!isCollapsed && <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />}
          </button>

          {showSettings && !isCollapsed && (
            <div className="mt-2 p-4 glass-card space-y-4 text-sm animate-in fade-in slide-in-from-top-2">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{t('dark_mode')}</span>
                <button onClick={toggleTheme} className={`w-10 h-5 rounded-full transition-colors relative ${settings.themeMode === 'dark' ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.themeMode === 'dark' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Language Selector */}
              <div className="space-y-2">
                <span className="font-medium text-gray-700 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{t('language')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {['en', 'am'].map(l => (
                    <button
                      key={l}
                      onClick={() => changeLanguage(l)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${settings.language === l ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {l === 'en' ? 'EN' : 'AM'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={handleLogout}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'} w-full py-3 rounded-xl transition-all duration-300 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold group`}
        >
          <LogOut className={`transition-transform duration-300 group-hover:-translate-x-1 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
          {!isCollapsed && <span className="text-sm">{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
}

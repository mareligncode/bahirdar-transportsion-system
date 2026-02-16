import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import {
  Settings,
  Moon,
  Sun,
  Globe,
  Bell,
  Eye,
  RefreshCw,
  Save,
  Shield,
  User,
  Car,
  Home,
  Check,
  Palette,
  Languages,
  Monitor,
  Smartphone,
  Tablet,
  Volume2,
  Vibrate,
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  Users,
  Truck,
  MapPin,
  CreditCard,
  Lock,
  Key,
  LogOut
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { settings, updateSetting, toggleTheme, changeLanguage, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' }
  ];

  const fontSizes = [
    { value: 'small', label: 'Small', preview: '14px' },
    { value: 'medium', label: 'Medium', preview: '16px' },
    { value: 'large', label: 'Large', preview: '18px' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: Settings, description: 'Language' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and visual settings' },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with gradient */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
              <p className="text-gray-500 mt-1">Manage your preferences and account settings</p>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {saved && (
          <div className="mb-6 animate-slideDown">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center shadow-sm">
              <div className="p-1 bg-emerald-100 rounded-full mr-3">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-800">Settings saved successfully!</p>
                <p className="text-sm text-emerald-600">Your changes have been applied.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 border-2 border-white/50">
                    <span className="text-3xl font-bold text-white">
                      {getInitials(user?.fullName)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{user?.fullName || 'User'}</h3>
                  <p className="text-sm text-blue-100">{user?.email}</p>
                  <div className="mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                    {user?.role?.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === tab.id ? 'bg-white shadow-sm' : ''
                    }`}>
                      <tab.icon className={`w-5 h-5 ${
                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${
                        activeTab === tab.id ? 'text-blue-700' : 'text-gray-700'
                      }`}>{tab.label}</p>
                      <p className={`text-xs ${
                        activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'
                      }`}>{tab.description}</p>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">Save Changes</span>
                </button>
                <button
                  onClick={resetSettings}
                  className="w-full mt-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Reset to Defaults</span>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Languages className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Language Preferences</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`p-5 border-2 rounded-xl flex items-center justify-between transition-all ${
                            settings.language === lang.code
                              ? 'border-blue-500 bg-blue-50/50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl">{lang.flag}</span>
                            <div className="text-left">
                              <p className={`font-semibold ${
                                settings.language === lang.code ? 'text-blue-700' : 'text-gray-700'
                              }`}>{lang.name}</p>
                              <p className={`text-sm ${
                                settings.language === lang.code ? 'text-blue-500' : 'text-gray-400'
                              }`}>{lang.native}</p>
                            </div>
                          </div>
                          {settings.language === lang.code && (
                            <div className="p-1 bg-blue-500 rounded-full">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Palette className="w-5 h-5 text-orange-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Theme & Appearance</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Light Theme Card */}
                      <button
                        onClick={() => settings.themeMode !== 'light' && toggleTheme()}
                        className={`p-6 border-2 rounded-xl transition-all ${
                          settings.themeMode === 'light'
                            ? 'border-blue-500 bg-blue-50/50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Sun className="w-6 h-6 text-amber-600" />
                          </div>
                          {settings.themeMode === 'light' && (
                            <div className="p-1 bg-blue-500 rounded-full">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-1">Light Mode</h3>
                        <p className="text-sm text-gray-500">Clean and bright interface</p>
                        <div className="mt-4 flex space-x-1">
                          <div className="w-6 h-6 bg-gray-200 rounded"></div>
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                          <div className="w-6 h-6 bg-gray-400 rounded"></div>
                        </div>
                      </button>

                      {/* Dark Theme Card */}
                      <button
                        onClick={() => settings.themeMode !== 'dark' && toggleTheme()}
                        className={`p-6 border-2 rounded-xl transition-all ${
                          settings.themeMode === 'dark'
                            ? 'border-blue-500 bg-blue-50/50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Moon className="w-6 h-6 text-indigo-600" />
                          </div>
                          {settings.themeMode === 'dark' && (
                            <div className="p-1 bg-blue-500 rounded-full">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-1">Dark Mode</h3>
                        <p className="text-sm text-gray-500">Easy on the eyes at night</p>
                        <div className="mt-4 flex space-x-1">
                          <div className="w-6 h-6 bg-gray-700 rounded"></div>
                          <div className="w-6 h-6 bg-gray-800 rounded"></div>
                          <div className="w-6 h-6 bg-gray-900 rounded"></div>
                        </div>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-medium text-gray-700 mb-4">Font Size</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {fontSizes.map(size => (
                          <button
                            key={size.value}
                            onClick={() => updateSetting('fontSize', size.value)}
                            className={`p-4 border-2 rounded-xl text-center transition-all ${
                              settings.fontSize === size.value
                                ? 'border-blue-500 bg-blue-50/50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <p className={`font-semibold ${
                              settings.fontSize === size.value ? 'text-blue-700' : 'text-gray-700'
                            }`}>{size.label}</p>
                            <p className={`text-sm mt-1 ${
                              settings.fontSize === size.value ? 'text-blue-500' : 'text-gray-400'
                            }`} style={{ fontSize: size.preview }}>
                              Preview text
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
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
  Check
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { settings, updateSetting, toggleTheme, changeLanguage, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'role', label: 'Role Settings', icon: User },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getRoleSettings = () => {
    const roleSettings = {
      super_admin: [
        { key: 'showSystemLogs', label: 'Show System Logs', defaultValue: true },
        { key: 'advancedAnalytics', label: 'Advanced Analytics', defaultValue: true },
      ],
      station_admin: [
        { key: 'showStationStats', label: 'Station Statistics', defaultValue: true },
        { key: 'driverManagement', label: 'Driver Management', defaultValue: true },
      ],
      driver: [
        { key: 'tripAlerts', label: 'Trip Alerts', defaultValue: true },
        { key: 'locationSharing', label: 'Share Location', defaultValue: false },
      ],
      passenger: [
        { key: 'tripReminders', label: 'Trip Reminders', defaultValue: true },
        { key: 'priceAlerts', label: 'Price Alerts', defaultValue: false },
      ]
    };
    return roleSettings[user?.role] || [];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account preferences and system settings
          </p>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-green-700 dark:text-green-300">Settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={resetSettings}
                  className="w-full mt-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">General Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Language
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {languages.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${
                              settings.language === lang.code
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <span className="text-2xl mb-2">{lang.flag}</span>
                            <span className="font-medium">{lang.name}</span>
                            {settings.language === lang.code && (
                              <div className="mt-2 text-primary-600 dark:text-primary-400">
                                <Check className="w-5 h-5" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Items Per Page
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="5"
                          max="50"
                          step="5"
                          value={settings.itemsPerPage || 10}
                          onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-lg font-medium">{settings.itemsPerPage || 10}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {settings.themeMode === 'dark' ? (
                          <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                        <div>
                          <h3 className="font-medium">Theme</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {settings.themeMode === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
                          </p>
                        </div>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Font Size
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            onClick={() => updateSetting('fontSize', size)}
                            className={`p-4 border rounded-lg text-center capitalize ${
                              settings.fontSize === size
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'role' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    {user?.role?.replace('_', ' ').toUpperCase()} Settings
                  </h2>
                  
                  <div className="space-y-4">
                    {getRoleSettings().map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <h3 className="font-medium">{setting.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Role-specific preference
                          </p>
                        </div>
                        <button
                          onClick={() => updateSetting(setting.key, !(settings[setting.key] ?? setting.defaultValue))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            (settings[setting.key] ?? setting.defaultValue) ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (settings[setting.key] ?? setting.defaultValue) ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
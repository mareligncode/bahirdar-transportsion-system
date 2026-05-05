import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../../components/layout';
import type { AppSetting } from '../../../types/support';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationStore } from '@/store/notificationStore';

const SettingsScreen = () => {
  const router = useRouter();
  const { translate, language } = useTranslation();
  const { isDark, colors } = useTheme();
  const { preferences, updatePreferences } = useNotificationStore();
  const [settings, setSettings] = useState<AppSetting>({
    language: 'en',
    theme: 'light',
    fontSize: { scale: 1, name: 'normal' },
    privacy: {
      shareLocation: true,
      saveHistory: true,
      allowNotifications: preferences.push_enabled,
    },
    autoUpdate: true,
    cacheData: true,
    downloadOverWifi: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Ensure the parsed settings match our simplified structure
        setSettings({
          ...parsed,
          privacy: {
            shareLocation: parsed.privacy?.shareLocation ?? true,
            saveHistory: parsed.privacy?.saveHistory ?? true,
            allowNotifications: parsed.privacy?.allowNotifications ?? true,
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSetting) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = <K extends keyof AppSetting>(
    key: K,
    value: AppSetting[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const updatePrivacySetting = (
    key: 'shareLocation' | 'saveHistory' | 'allowNotifications',
    value: boolean
  ) => {
    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, [key]: value },
    };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      translate('clear_cache' as any),
      translate('clear_cache_confirm' as any),
      [
        { text: translate('cancel' as any), style: 'cancel' },
        {
          text: translate('clear_cache' as any),
          style: 'destructive',
          onPress: async () => {
            Alert.alert(translate('success' as any), translate('cache_cleared' as any));
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    description,
    onPress,
    rightElement,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center py-4 px-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={24} color={isDark ? colors.textSecondary : colors.gray600} />
      <View className="flex-1 ml-3">
        <AppText weight="medium" color="textPrimary">{title}</AppText>
        {description && (
          <AppText variant="bodySmall" color="textSecondary" className="mt-0.5">
            {description}
          </AppText>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} px-4 py-2`}>
      <AppText variant="bodySmall" weight="semibold" color="textSecondary">
        {title}
      </AppText>
    </View>
  );

  return (
    <ScreenLayout>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className={`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? colors.textSecondary : colors.gray600} />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold" color="textPrimary">
            {translate('settings_title' as any)}
          </AppText>
        </View>

        <ScrollView className="flex-1">
          {/* Appearance Section */}
          <SectionHeader title={translate('appearance_header' as any)} />
          <SettingItem
            icon="language-outline"
            title={translate('language' as any)}
            description={language === 'en' ? translate('english' as any) : translate('amharic' as any)}
            onPress={() => router.push('/menu/settings/language')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />
          <SettingItem
            icon="color-palette-outline"
            title={translate('theme' as any)}
            description={
              settings.theme === 'light'
                ? translate('light' as any)
                : settings.theme === 'dark'
                  ? translate('dark' as any)
                  : translate('system_default' as any)
            }
            onPress={() => router.push('/menu/settings/theme')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />
          <SettingItem
            icon="text-outline"
            title={translate('font_size' as any)}
            description={`${settings.fontSize.name === 'normal' ? translate('font_normal' as any) : settings.fontSize.name} (${Math.round(
              settings.fontSize.scale * 100
            )}%)`}
            onPress={() => router.push('/menu/settings/font-size')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />

          {/* Privacy Section - Only toggles, no password or 2FA */}
          <SectionHeader title={translate('privacy_header' as any)} />
          <SettingItem
            icon="location-outline"
            title={translate('share_location' as any)}
            description={translate('share_location_desc' as any)}
            rightElement={
              <Switch
                value={settings.privacy.shareLocation}
                onValueChange={(value) => updatePrivacySetting('shareLocation', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="list-outline"
            title={translate('save_history' as any)}
            description={translate('save_history_desc' as any)}
            rightElement={
              <Switch
                value={settings.privacy.saveHistory}
                onValueChange={(value) => updatePrivacySetting('saveHistory', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
              />
            }
          />

          {/* Notifications Section */}
          <SectionHeader title={translate('notifications_header' as any)} />
          <SettingItem
            icon="notifications-outline"
            title={translate('push_notifications' as any)}
            description={translate('push_notifications_desc' as any)}
            rightElement={
              <Switch
                value={preferences.push_enabled}
                onValueChange={(value) => updatePreferences({ push_enabled: value })}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="notifications-circle-outline"
            title={translate('notification_settings' as any)}
            description={translate('notification_settings_desc' as any)}
            onPress={() => router.push('/menu/settings/notifications')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />

          {/* Data & Storage */}
          <SectionHeader title={translate('data_storage_header' as any)} />
          <SettingItem
            icon="cloud-done-outline"
            title={translate('auto_update' as any)}
            description={translate('auto_update_desc' as any)}
            rightElement={
              <Switch
                value={settings.autoUpdate}
                onValueChange={(value) => updateSetting('autoUpdate', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="save-outline"
            title={translate('cache_data' as any)}
            description={translate('cache_data_desc' as any)}
            rightElement={
              <Switch
                value={settings.cacheData}
                onValueChange={(value) => updateSetting('cacheData', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="wifi-outline"
            title={translate('download_wifi_only' as any)}
            description={translate('download_wifi_only_desc' as any)}
            rightElement={
              <Switch
                value={settings.downloadOverWifi}
                onValueChange={(value) => updateSetting('downloadOverWifi', value)}
                trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="trash-outline"
            title={translate('clear_cache' as any)}
            description={translate('clear_cache_desc' as any)}
            onPress={handleClearCache}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />

          {/* About */}
          <SectionHeader title={translate('about_header' as any)} />
          <SettingItem
            icon="information-circle-outline"
            title={translate('about' as any)}
            description={translate('version_info' as any, { version: '1.0.0' })}
            onPress={() => router.push('/menu/about')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />
          <SettingItem
            icon="document-text-outline"
            title={translate('terms_conditions' as any)}
            onPress={() => router.push('/terms')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />
          <SettingItem
            icon="lock-closed-outline"
            title={translate('privacy_policy' as any)}
            onPress={() => router.push('/privacy')}
            rightElement={<Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : colors.gray400} />}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default SettingsScreen;
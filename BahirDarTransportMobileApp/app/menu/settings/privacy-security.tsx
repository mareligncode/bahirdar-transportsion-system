import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../../components/layout';
import { useTranslation } from '@/hooks/useTranslation';

const PrivacySecurityScreen = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [settings, setSettings] = useState({
    biometricLogin: false,
    showOnlineStatus: true,
    dataSharing: false,
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangePassword = () => {
    router.push('/auth/reset-password');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      translate('delete_account' as any),
      translate('delete_confirm_desc' as any),
      [
        { text: translate('cancel' as any), style: 'cancel' },
        {
          text: translate('delete' as any),
          style: 'destructive',
          onPress: () => {
            // Implement account deletion logic
            Alert.alert(translate('account_deletion' as any), translate('account_scheduled_deletion' as any));
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
      className="flex-row items-center py-4 px-4 border-b border-gray-200 dark:border-gray-700"
      disabled={!onPress}
    >
      <Ionicons name={icon} size={24} color="#4B5563" />
      <View className="flex-1 ml-3">
        <Text className="text-gray-900 dark:text-white font-medium">{title}</Text>
        {description && (
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {description}
          </Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View className="bg-gray-100 dark:bg-gray-800 px-4 py-2">
      <Text className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
        {title}
      </Text>
    </View>
  );

  return (
    <ScreenLayout>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            {translate('privacy_security_title' as any)}
          </Text>
        </View>

        <ScrollView className="flex-1">
          <SectionHeader title={translate('security_section' as any)} />
          <SettingItem
            icon="lock-closed-outline"
            title={translate('change_password' as any)}
            description={translate('update_password_desc' as any)}
            onPress={handleChangePassword}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
          />
          <SettingItem
            icon="finger-print-outline"
            title={translate('biometric_login' as any)}
            description={translate('biometric_login_desc' as any)}
            rightElement={
              <Switch
                value={settings.biometricLogin}
                onValueChange={() => toggleSetting('biometricLogin')}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="eye-off-outline"
            title={translate('hide_online_status' as any)}
            description={translate('hide_online_status_desc' as any)}
            rightElement={
              <Switch
                value={!settings.showOnlineStatus}
                onValueChange={() => toggleSetting('showOnlineStatus')}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              />
            }
          />

          <SectionHeader title={translate('data_privacy_section' as any)} />
          <SettingItem
            icon="share-outline"
            title={translate('data_sharing' as any)}
            description={translate('data_sharing_desc' as any)}
            rightElement={
              <Switch
                value={settings.dataSharing}
                onValueChange={() => toggleSetting('dataSharing')}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="download-outline"
            title={translate('download_my_data' as any)}
            description={translate('download_my_data_desc' as any)}
            onPress={() => Alert.alert(translate('coming_soon' as any), translate('feature_available_soon' as any))}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
          />

          <SectionHeader title={translate('communication_section' as any)} />
          <SettingItem
            icon="mail-outline"
            title={translate('email_notifications' as any)}
            description={translate('receive_email_updates' as any)}
            rightElement={
              <Switch
                value={settings.emailNotifications}
                onValueChange={() => toggleSetting('emailNotifications')}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="chatbubble-outline"
            title={translate('sms_notifications' as any)}
            description={translate('receive_sms_updates' as any)}
            rightElement={
              <Switch
                value={settings.smsNotifications}
                onValueChange={() => toggleSetting('smsNotifications')}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              />
            }
          />
          <SettingItem
            icon="megaphone-outline"
            title={translate('marketing_emails' as any)}
            description={translate('receive_marketing_offers' as any)}
            rightElement={
              <Switch
                value={settings.marketingEmails}
                onValueChange={() => toggleSetting('marketingEmails')}
                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              />
            }
          />

          <SectionHeader title={translate('account_management_section' as any)} />
          <SettingItem
            icon="log-out-outline"
            title={translate('logout' as any)}
            description={translate('sign_out_all_devices' as any)}
            onPress={() => {
              Alert.alert(translate('logout' as any), translate('logout_confirm_desc' as any), [
                { text: translate('cancel' as any), style: 'cancel' },
                {
                  text: translate('logout' as any),
                  style: 'destructive',
                  onPress: () => {
                    // Implement sign out logic
                    router.replace('/auth/Login');
                  },
                },
              ]);
            }}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
          />
          <SettingItem
            icon="trash-outline"
            title={translate('delete_account' as any)}
            description={translate('permanently_delete_account' as any)}
            onPress={handleDeleteAccount}
            rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default PrivacySecurityScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationStore } from '@/store/notificationStore';
import { AppText } from '@/components/common/AppText';

export default function NotificationsScreen() {
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();
  const { preferences, updatePreferences } = useNotificationStore();

  const notificationSettings = [
    {
      title: translate('push_notifications' as any),
      description: translate('push_notifications_desc' as any),
      key: 'push_enabled',
      value: preferences.push_enabled,
    },
    {
      title: translate('email_notifications' as any),
      description: translate('email_notifications_desc' as any),
      key: 'email_enabled',
      value: preferences.email_enabled,
    },
    {
      title: translate('booking_updates' as any),
      description: translate('booking_updates_desc' as any),
      key: 'booking_updates',
      value: preferences.booking_updates,
    },
    {
      title: translate('payment_updates' as any),
      description: translate('payment_updates_desc' as any),
      key: 'payment_updates',
      value: preferences.payment_updates,
    },
    {
      title: translate('promotional_offers' as any),
      description: translate('promotional_offers_desc' as any),
      key: 'promotions',
      value: preferences.promotions,
    },
    {
      title: translate('trip_alerts' as any),
      description: translate('trip_alerts_desc' as any),
      key: 'trip_updates',
      value: preferences.trip_updates,
    },
  ];

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header
        title={translate('notifications' as any)}
        showBackButton
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Card className="mb-6">
            <View className="items-center py-4">
              <AppText variant="h3" weight="semibold" color="textPrimary" className="mb-2">
                {translate('notification_pref' as any)}
              </AppText>
              <AppText color="textSecondary" align="center">
                {translate('manage_notif_desc' as any)}
              </AppText>
            </View>
          </Card>

          {notificationSettings.map((setting, index) => (
            <Card key={index} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <AppText weight="semibold" color="textPrimary">
                    {setting.title}
                  </AppText>
                  <AppText variant="bodySmall" color="textSecondary" className="mt-1">
                    {setting.description}
                  </AppText>
                </View>

                <Switch
                  value={setting.value}
                  onValueChange={(value) => handleToggle(setting.key, value)}
                  trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
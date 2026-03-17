import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../../store/notificationStore';
import { useToast } from '../../../components/common/Toast';
import { NotificationList } from '../../../components/notifications/notificationList';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { AppText } from '@/components/common/AppText';
// Fix the import path - use relative path instead of alias
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../../../lib/notifications';

export default function NotificationScreen() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAllAsRead, deleteNotification } = useNotificationStore();
  const { showToast } = useToast();
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { translate } = useTranslation();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    // Set up local notification listeners regardless of push notification availability
    unsubscribe = setupNotificationListeners();
    
    // Only attempt to register for push notifications if not in Expo Go
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log('Push notification token registered:', token);
      } else {
        console.log('Push notifications not available (likely running in Expo Go)');
      }
    }).catch(error => {
      console.log('Push notification registration skipped:', error.message);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const handleViewNotification = (notificationId: string) => {
    router.push(`/(screens)/notification/${notificationId}`);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    showToast(translate('mark_all_read_success'), 'success');
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      translate('delete_notification'),
      translate('delete_notification_confirm'),
      [
        { text: translate('back'), style: 'cancel' },
        {
          text: translate('delete_btn_label'),
          style: 'destructive',
          onPress: () => {
            deleteNotification(notificationId);
            showToast(translate('notification_deleted_success'), 'success');
          },
        },
      ]
    );
  };

  const filtered = activeTab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="flex-1">
        <View className={`${isDark ? 'bg-blue-700' : 'bg-blue-600'} px-4 py-3`}>
          <View className="flex-row justify-between items-center">
            <AppText className="text-white font-semibold text-lg">{translate('notifications')}</AppText>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                className={`px-3 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}
                activeOpacity={0.8}
              >
                <AppText className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-medium`}>{translate('mark_all_read_btn')}</AppText>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row space-x-4 mt-3">
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'all' ? (isDark ? 'bg-gray-800' : 'bg-white') : (isDark ? 'bg-blue-800/50' : 'bg-blue-500')
              }`}
              activeOpacity={0.9}
            >
              <AppText
                className={`font-medium ${
                  activeTab === 'all' ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-white'
                }`}
              >
                {translate('all_filter')} ({notifications.length})
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('unread')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'unread' ? (isDark ? 'bg-gray-800' : 'bg-white') : (isDark ? 'bg-blue-800/50' : 'bg-blue-500')
              }`}
              activeOpacity={0.9}
            >
              <AppText
                className={`font-medium ${
                  activeTab === 'unread' ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-white'
                }`}
              >
                {translate('unread_filter')} ({unreadCount})
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
        
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
          </View>
        ) : (
          <NotificationList
            items={filtered}
            unreadCount={unreadCount}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPressItem={handleViewNotification}
            onDeleteItem={handleDeleteNotification}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
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
// Fix the import path - use relative path instead of alias
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../../../lib/notifications';

export default function NotificationScreen() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAllAsRead, deleteNotification } = useNotificationStore();
  const { showToast } = useToast();
  const router = useRouter();

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
    showToast('All notifications marked as read', 'success');
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNotification(notificationId);
            showToast('Notification deleted', 'success');
          },
        },
      ]
    );
  };

  const filtered = activeTab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <View className="bg-blue-600 px-4 py-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-white font-semibold text-lg">Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                className="px-3 py-2 bg-white rounded-lg"
                activeOpacity={0.8}
              >
                <Text className="text-blue-600 font-medium">Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row space-x-4 mt-3">
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'all' ? 'bg-white' : 'bg-blue-500'
              }`}
              activeOpacity={0.9}
            >
              <Text
                className={`font-medium ${
                  activeTab === 'all' ? 'text-blue-600' : 'text-white'
                }`}
              >
                All ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('unread')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'unread' ? 'bg-white' : 'bg-blue-500'
              }`}
              activeOpacity={0.9}
            >
              <Text
                className={`font-medium ${
                  activeTab === 'unread' ? 'text-blue-600' : 'text-white'
                }`}
              >
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
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
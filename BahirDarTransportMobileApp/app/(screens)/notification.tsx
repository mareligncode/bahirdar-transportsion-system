import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Check,
  Clock,
  CreditCard,
  User,
} from 'lucide-react-native';
import { useNotificationStore } from '../../store/notificationStore';
import { useToast } from '../../components/common/Toast';
import * as Haptics from 'expo-haptics';
import { Notification } from '../../types/notification';

export default function NotificationScreen() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    showToast('Notification marked as read', 'success');
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

  const renderNotification = ({ item }: { item: Notification }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'booking':
          return <Check size={20} color="#10b981" />;
        case 'payment':
          return <CreditCard size={20} color="#f59e0b" />;
        case 'trip':
          return <Clock size={20} color="#3b82f6" />;
        case 'system':
          return <Bell size={20} color="#ef4444" />;
        case 'promotion':
          return <User size={20} color="#8b5cf6" />;
        default:
          return <Bell size={20} color="#6b7280" />;
      }
    };

    const getTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) {
        return `${diffInDays}d ago`;
      } else if (diffInHours > 0) {
        return `${diffInHours}h ago`;
      } else {
        return 'Just now';
      }
    };

    return (
      <TouchableOpacity
        onPress={() => handleMarkAsRead(item.id)}
        className={`mx-4 p-4 bg-white rounded-xl border ${
          item.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
        }`}
      >
        <View className="flex-row items-start space-x-3">
          {getIcon()}
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 text-base">
              {item.title}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              {item.message}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              {getTimeAgo(item.created_at)}
            </Text>
          </View>
          {!item.is_read && (
            <View className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-blue-600 px-4 py-3 flex-row justify-between items-center">
          <Text className="text-white font-semibold text-lg">Notifications</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'all' ? 'bg-white' : 'bg-blue-500'
              }`}
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

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center px-8">
            <Bell size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-4 text-base">
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-center mt-2 text-sm">
              Your booking confirmations and updates will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'unread' ? notifications.filter(n => !n.is_read) : notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

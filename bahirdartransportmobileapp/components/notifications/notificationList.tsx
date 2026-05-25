import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { AppText } from '../common/AppText';
import { Bell } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { Notification } from '../../types/notification';
import { NotificationItem } from './notificationItem';

type Props = {
  items: Notification[];
  unreadCount?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
};

export function NotificationList({
  items,
  unreadCount = 0,
  refreshing = false,
  onRefresh,
  onPressItem,
  onDeleteItem,
}: Props) {
  const { isDark } = useTheme();
  
  const handleNotificationPress = (item: Notification) => {
    onPressItem?.(item.id);
  };
  if (!items?.length) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="relative">
          <Bell size={48} color={isDark ? '#4b5563' : "#9ca3af"} />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center">
              <AppText variant="caption" weight="bold" color="white">{unreadCount}</AppText>
            </View>
          )}
        </View>
        <AppText weight="medium" color="textSecondary" className="text-center mt-4">
          No notifications yet
        </AppText>
        <AppText variant="caption" color="textTertiary" className="text-center mt-2">
          Your booking confirmations and updates will appear here
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item: Notification) => item.id}
      renderItem={({ item }) => (
        <NotificationItem 
          item={item} 
          onPress={() => handleNotificationPress(item)} 
          onDelete={onDeleteItem} 
        />
      )}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={isDark ? '#60A5FA' : '#3B82F6'}
          colors={[isDark ? '#60A5FA' : '#3B82F6']}
        />
      }
    />
  );
}

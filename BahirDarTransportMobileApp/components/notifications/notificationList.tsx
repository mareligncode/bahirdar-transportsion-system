import React from 'react';
import { FlatList, RefreshControl, View, Text, Alert } from 'react-native';
import { Bell } from 'lucide-react-native';
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
  
  const handleNotificationPress = (item: Notification) => {
    // Show alert with notification details
    Alert.alert(
      item.title,
      item.message,
      [
        { text: 'OK', onPress: () => onPressItem?.(item.id) }
      ]
    );
  };
  if (!items?.length) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="relative">
          <Bell size={48} color="#9ca3af" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-center mt-4 text-base">
          No notifications yet
        </Text>
        <Text className="text-gray-400 text-center mt-2 text-sm">
          Your booking confirmations and updates will appear here
        </Text>
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

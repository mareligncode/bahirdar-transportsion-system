import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell, Check, Clock, CreditCard, User, Trash2 } from 'lucide-react-native';
import type { Notification } from '../../types/notification';

type Props = {
  item: Notification;
  onPress?: (id: string) => void;
  onDelete?: (id: string) => void;
};

const getIcon = (type: Notification['type']) => {
  switch (type) {
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

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);
  if (diffD > 0) return `${diffD}d ago`;
  if (diffH > 0) return `${diffH}h ago`;
  return 'Just now';
};

export function NotificationItem({ item, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress?.(item.id)}
      className={`flex-row mx-4 p-4 bg-white rounded-xl border ${
        item.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
      }`}
      activeOpacity={0.8}
    >
      <View className="flex-1 flex-row items-start space-x-3">
        {getIcon(item.type)}
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 text-base">
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            {item.message}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            {timeAgo(item.created_at)}
          </Text>
        </View>
        {!item.is_read && <View className="w-2 h-2 bg-blue-500 rounded-full" />}
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          className="ml-3 p-2 rounded-full"
          activeOpacity={0.8}
        >
          <Trash2 size={18} color="#6b7280" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

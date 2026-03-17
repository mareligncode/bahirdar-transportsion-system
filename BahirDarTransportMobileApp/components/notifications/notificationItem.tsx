import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '../common/AppText';
import { Bell, Check, Clock, CreditCard, User, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
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
  const { isDark, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onPress?.(item.id)}
      className={`flex-row mx-4 p-4 rounded-xl border ${
        item.is_read 
          ? `bg-white dark:bg-gray-800 ${isDark ? 'border-gray-700' : 'border-gray-200'}` 
          : `bg-blue-50 dark:bg-blue-900/20 ${isDark ? 'border-blue-900/50' : 'border-blue-200'}`
      }`}
      activeOpacity={0.8}
    >
      <View className="flex-1 flex-row items-start space-x-3">
        {getIcon(item.type)}
        <View className="flex-1 ml-3">
          <AppText weight="semibold" color="textPrimary" variant="bodyMedium">
            {item.title}
          </AppText>
          <AppText color="textSecondary" variant="bodySmall" className="mt-1">
            {item.message}
          </AppText>
          <AppText variant="caption" color="textTertiary" className="mt-1">
            {timeAgo(item.created_at)}
          </AppText>
        </View>
        {!item.is_read && <View className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
      </View>
      {onDelete && (
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          className="ml-3 p-2 rounded-full"
          activeOpacity={0.8}
        >
          <Trash2 size={18} color={isDark ? colors.textTertiary : "#6b7280"} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

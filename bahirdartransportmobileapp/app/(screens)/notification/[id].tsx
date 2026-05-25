import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Clock, 
  CreditCard, 
  User, 
  Share2, 
  Trash2,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react-native';
import { useNotificationStore } from '@/store/notificationStore';
import { useToast } from '@/components/common/Toast';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { AppText } from '@/components/common/AppText';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { notifications, markAsRead, deleteNotification } = useNotificationStore();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { translate } = useTranslation();
  
  const [isDeleting, setIsDeleting] = useState(false);

  const notification = notifications.find((n) => n.id === id);

  // Auto-mark as read when the detail screen is opened
  useEffect(() => {
    if (notification && !notification.is_read) {
      markAsRead(notification.id);
    }
  }, [notification?.id]);

  if (!notification) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 justify-center items-center">
          <Bell size={48} color={isDark ? '#4b5563' : "#9ca3af"} />
          <AppText className={`text-center mt-4 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {translate('notification_not_found')}
          </AppText>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
          >
            <AppText className="text-white font-medium">{translate('back')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getIcon = (type: typeof notification.type) => {
    switch (type) {
      case 'booking':
        return <Check size={24} color="#10b981" />;
      case 'payment':
        return <CreditCard size={24} color="#f59e0b" />;
      case 'trip':
        return <Clock size={24} color="#3b82f6" />;
      case 'system':
        return <Bell size={24} color="#ef4444" />;
      case 'promotion':
        return <User size={24} color="#8b5cf6" />;
      default:
        return <Bell size={24} color={isDark ? colors.textTertiary : "#6b7280"} />;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const handleMarkAsRead = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
      showToast(translate('mark_all_read_success'), 'success');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      translate('delete_notification'),
      translate('delete_notification_confirm'),
      [
        { text: translate('back'), style: 'cancel' },
        {
          text: translate('delete_btn_label'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteNotification(notification.id);
              showToast(translate('notification_deleted_success'), 'success');
              router.back();
            } catch {
              showToast(translate('something_went_wrong'), 'error');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: notification.title,
        message: `${notification.title}\n\n${notification.message}`,
      });
    } catch {
      showToast(translate('failed_share_notification'), 'error');
    }
  };

  const getNotificationDetails = () => {
    if (!notification.data) return null;

    const details = [];
    
    if (notification.type === 'booking') {
      if (notification.data.booking_id) {
        details.push({ icon: <Calendar size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('booking_details'), value: notification.data.booking_id });
      }
      if (notification.data.trip_date) {
        details.push({ icon: <Calendar size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('date'), value: formatDateTime(notification.data.trip_date) });
      }
      if (notification.data.from_station) {
        details.push({ icon: <MapPin size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('from'), value: notification.data.from_station });
      }
      if (notification.data.to_station) {
        details.push({ icon: <MapPin size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('to'), value: notification.data.to_station });
      }
      if (notification.data.seat_number) {
        details.push({ icon: <User size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('seat_label_static'), value: `${translate('seat_label_static')} ${notification.data.seat_number}` });
      }
    }

    if (notification.type === 'payment') {
      if (notification.data.transaction_id) {
        details.push({ icon: <CreditCard size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('transaction_ref'), value: notification.data.transaction_id });
      }
      if (notification.data.amount) {
        details.push({ icon: <DollarSign size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('total_amount'), value: `${translate('etb')} ${notification.data.amount}` });
      }
      if (notification.data.payment_method) {
        details.push({ icon: <CreditCard size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('payment_method'), value: notification.data.payment_method });
      }
    }

    if (notification.type === 'trip') {
      if (notification.data.trip_id) {
        details.push({ icon: <Calendar size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('trip'), value: notification.data.trip_id });
      }
      if (notification.data.departure_time) {
        details.push({ icon: <Clock size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('departure'), value: formatDateTime(notification.data.departure_time) });
      }
      if (notification.data.status) {
        details.push({ icon: <Bell size={16} color={isDark ? colors.textTertiary : "#6b7280"} />, label: translate('status'), value: notification.data.status });
      }
    }

    return details.length > 0 ? details : null;
  };

  const details = getNotificationDetails();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="flex-1">
        {/* Header */}
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 py-3 border-b`}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color={isDark ? colors.textSecondary : "#374151"} />
            </TouchableOpacity>
            
            <View className="flex-row items-center space-x-2">
              {!notification.is_read && (
                <TouchableOpacity
                  onPress={handleMarkAsRead}
                  className={`px-3 py-1 ${isDark ? 'bg-green-900/30' : 'bg-green-100'} rounded-full`}
                  activeOpacity={0.8}
                >
                  <AppText className={`${isDark ? 'text-green-400' : 'text-green-700'} text-sm font-medium`}>{translate('mark_read')}</AppText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleShare}
                className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}
                activeOpacity={0.8}
              >
                <Share2 size={20} color={isDark ? '#60A5FA' : "#3b82f6"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting}
                className={`p-2 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Trash2 size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Notification Card */}
            <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 shadow-sm border`}>
              <View className="flex-row items-start space-x-4">
                <View className={`w-12 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl items-center justify-center`}>
                  {getIcon(notification.type)}
                </View>
                
                <View className="flex-1 ml-4">
                  <View className="flex-row items-center justify-between">
                    <AppText className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} text-lg`}>
                      {notification.title}
                    </AppText>
                    {!notification.is_read && (
                      <View className="w-3 h-3 bg-blue-500 rounded-full" />
                    )}
                  </View>
                  
                  <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-2`}>
                    {formatDateTime(notification.created_at)}
                  </AppText>
                </View>
              </View>

              <View className="mt-4">
                <AppText className={`${isDark ? 'text-gray-200' : 'text-gray-800'} text-base leading-relaxed`}>
                  {notification.message}
                </AppText>
              </View>

              {/* Additional Details */}
              {details && (
                <View className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <AppText className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs uppercase font-semibold mb-3`}>
                    {translate('quick_actions')}
                  </AppText>
                  <View className="space-y-4">
                    {details.map((detail, index) => (
                      <View key={index} className="flex-row items-center space-x-3 mb-3">
                        <View className={`w-8 h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg items-center justify-center`}>
                          {detail.icon}
                        </View>
                        <View className="flex-1 ml-3">
                          <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{detail.label}</AppText>
                          <AppText className={`${isDark ? 'text-gray-200' : 'text-gray-800'} font-medium`}>{detail.value}</AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Type Badge */}
              <View className="mt-6 flex-row items-center justify-end">
                <View className={`px-3 py-1 rounded-full ${
                  notification.type === 'booking' ? (isDark ? 'bg-green-900/30' : 'bg-green-100') :
                  notification.type === 'payment' ? (isDark ? 'bg-yellow-900/30' : 'bg-yellow-100') :
                  notification.type === 'trip' ? (isDark ? 'bg-blue-900/30' : 'bg-blue-100') :
                  notification.type === 'system' ? (isDark ? 'bg-red-900/30' : 'bg-red-100') :
                  (isDark ? 'bg-purple-900/30' : 'bg-purple-100')
                }`}>
                  <AppText className={`text-xs font-medium ${
                    notification.type === 'booking' ? (isDark ? 'text-green-400' : 'text-green-700') :
                    notification.type === 'payment' ? (isDark ? 'text-yellow-400' : 'text-yellow-700') :
                    notification.type === 'trip' ? (isDark ? 'text-blue-400' : 'text-blue-700') :
                    notification.type === 'system' ? (isDark ? 'text-red-400' : 'text-red-700') :
                    (isDark ? 'text-purple-400' : 'text-purple-700')
                  }`}>
                    {notification.type.toUpperCase()}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
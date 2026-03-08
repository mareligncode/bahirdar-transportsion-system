import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
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

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { notifications, markAsRead, deleteNotification } = useNotificationStore();
  const { showToast } = useToast();
  
  const [isDeleting, setIsDeleting] = useState(false);

  const notification = notifications.find((n) => n.id === id);

  if (!notification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Bell size={48} color="#9ca3af" />
          <Text className="text-gray-500 text-center mt-4 text-base">
            Notification not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
          >
            <Text className="text-white font-medium">Go Back</Text>
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
        return <Bell size={24} color="#6b7280" />;
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
      showToast('Notification marked as read', 'success');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteNotification(notification.id);
              showToast('Notification deleted', 'success');
              router.back();
            } catch {
              showToast('Failed to delete notification', 'error');
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
      showToast('Failed to share notification', 'error');
    }
  };

  const getNotificationDetails = () => {
    if (!notification.data) return null;

    const details = [];
    
    if (notification.type === 'booking') {
      if (notification.data.booking_id) {
        details.push({ icon: <Calendar size={16} color="#6b7280" />, label: 'Booking ID', value: notification.data.booking_id });
      }
      if (notification.data.trip_date) {
        details.push({ icon: <Calendar size={16} color="#6b7280" />, label: 'Trip Date', value: formatDateTime(notification.data.trip_date) });
      }
      if (notification.data.from_station) {
        details.push({ icon: <MapPin size={16} color="#6b7280" />, label: 'From', value: notification.data.from_station });
      }
      if (notification.data.to_station) {
        details.push({ icon: <MapPin size={16} color="#6b7280" />, label: 'To', value: notification.data.to_station });
      }
      if (notification.data.seat_number) {
        details.push({ icon: <User size={16} color="#6b7280" />, label: 'Seat', value: `Seat ${notification.data.seat_number}` });
      }
    }

    if (notification.type === 'payment') {
      if (notification.data.transaction_id) {
        details.push({ icon: <CreditCard size={16} color="#6b7280" />, label: 'Transaction ID', value: notification.data.transaction_id });
      }
      if (notification.data.amount) {
        details.push({ icon: <DollarSign size={16} color="#6b7280" />, label: 'Amount', value: `ETB ${notification.data.amount}` });
      }
      if (notification.data.payment_method) {
        details.push({ icon: <CreditCard size={16} color="#6b7280" />, label: 'Method', value: notification.data.payment_method });
      }
    }

    if (notification.type === 'trip') {
      if (notification.data.trip_id) {
        details.push({ icon: <Calendar size={16} color="#6b7280" />, label: 'Trip ID', value: notification.data.trip_id });
      }
      if (notification.data.departure_time) {
        details.push({ icon: <Clock size={16} color="#6b7280" />, label: 'Departure', value: formatDateTime(notification.data.departure_time) });
      }
      if (notification.data.status) {
        details.push({ icon: <Bell size={16} color="#6b7280" />, label: 'Status', value: notification.data.status });
      }
    }

    return details.length > 0 ? details : null;
  };

  const details = getNotificationDetails();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 rounded-lg bg-gray-100"
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            
            <View className="flex-row items-center space-x-2">
              {!notification.is_read && (
                <TouchableOpacity
                  onPress={handleMarkAsRead}
                  className="px-3 py-1 bg-green-100 rounded-full"
                  activeOpacity={0.8}
                >
                  <Text className="text-green-700 text-sm font-medium">Mark Read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleShare}
                className="p-2 rounded-lg bg-blue-100"
                activeOpacity={0.8}
              >
                <Share2 size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-lg bg-red-100"
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <View className="w-5 h-5 border-2 border-red-400 border-t-red-600 rounded-full animate-spin" />
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
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <View className="flex-row items-start space-x-4">
                <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center">
                  {getIcon(notification.type)}
                </View>
                
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-gray-900 text-lg">
                      {notification.title}
                    </Text>
                    {!notification.is_read && (
                      <View className="w-3 h-3 bg-blue-500 rounded-full" />
                    )}
                  </View>
                  
                  <Text className="text-gray-600 text-sm mt-2">
                    {formatDateTime(notification.created_at)}
                  </Text>
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-gray-800 text-base leading-relaxed">
                  {notification.message}
                </Text>
              </View>

              {/* Additional Details */}
              {details && (
                <View className="mt-6 pt-4 border-t border-gray-100">
                  <Text className="text-gray-500 text-xs uppercase font-semibold mb-3">
                    Additional Details
                  </Text>
                  <View className="space-y-3">
                    {details.map((detail, index) => (
                      <View key={index} className="flex-row items-center space-x-3">
                        <View className="w-6 h-6 bg-gray-100 rounded-lg items-center justify-center">
                          {detail.icon}
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-500 text-sm">{detail.label}</Text>
                          <Text className="text-gray-800 font-medium">{detail.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Type Badge */}
              <View className="mt-6 flex-row items-center justify-end">
                <View className={`px-3 py-1 rounded-full ${
                  notification.type === 'booking' ? 'bg-green-100' :
                  notification.type === 'payment' ? 'bg-yellow-100' :
                  notification.type === 'trip' ? 'bg-blue-100' :
                  notification.type === 'system' ? 'bg-red-100' :
                  'bg-purple-100'
                }`}>
                  <Text className={`text-xs font-medium ${
                    notification.type === 'booking' ? 'text-green-700' :
                    notification.type === 'payment' ? 'text-yellow-700' :
                    notification.type === 'trip' ? 'text-blue-700' :
                    notification.type === 'system' ? 'text-red-700' :
                    'text-purple-700'
                  }`}>
                    {notification.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
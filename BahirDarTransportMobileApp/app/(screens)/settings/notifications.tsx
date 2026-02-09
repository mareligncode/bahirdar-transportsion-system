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

export default function NotificationsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [paymentUpdates, setPaymentUpdates] = useState(true);
  const [promotional, setPromotional] = useState(false);
  const [tripAlerts, setTripAlerts] = useState(true);

  const notificationSettings = [
    {
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      value: pushNotifications,
      onChange: setPushNotifications,
    },
    {
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      value: emailNotifications,
      onChange: setEmailNotifications,
    },
    {
      title: 'Booking Updates',
      description: 'Updates about your bookings and reservations',
      value: bookingUpdates,
      onChange: setBookingUpdates,
    },
    {
      title: 'Payment Updates',
      description: 'Notifications about payments and transactions',
      value: paymentUpdates,
      onChange: setPaymentUpdates,
    },
    {
      title: 'Promotional Offers',
      description: 'Special offers and discounts',
      value: promotional,
      onChange: setPromotional,
    },
    {
      title: 'Trip Alerts',
      description: 'Real-time updates about your trips',
      value: tripAlerts,
      onChange: setTripAlerts,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header 
        title="Notifications" 
        showBackButton
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Card className="mb-6">
            <View className="items-center py-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Notification Preferences
              </Text>
              <Text className="text-gray-600 text-center">
                Manage how and when you receive notifications
              </Text>
            </View>
          </Card>

          {notificationSettings.map((setting, index) => (
            <Card key={index} className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {setting.title}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {setting.description}
                  </Text>
                </View>
                
                <Switch
                  value={setting.value}
                  onValueChange={setting.onChange}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
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
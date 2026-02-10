import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ScreenLayout } from '@/components/layout';
import { Card, EmptyState, Loader, Badge, Button } from '@/components/common';
import { 
  Bell, 
  Trash2, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  Ticket,
  MapPin,
  CheckCircle,
  XCircle,
  CheckCheck
} from 'lucide-react-native';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your trip to Gondar has been confirmed. Seat: A12',
    time: '10 min ago',
    isRead: false,
    icon: Ticket,
    color: '#10B981',
    bgColor: 'bg-green-100',
    action: '/tabs/tickets/1',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Your payment of 250 ETB was processed for trip BD-101',
    time: '1 hour ago',
    isRead: true,
    icon: CreditCard,
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    action: '/(screens)/payment/history',
  },
  {
    id: '3',
    type: 'alert',
    title: 'Bus Delay Alert',
    message: 'Bus BD-101 is delayed by 15 minutes. New departure: 08:45 AM',
    time: '2 hours ago',
    isRead: false,
    icon: AlertCircle,
    color: '#F59E0B',
    bgColor: 'bg-yellow-100',
    action: '/tabs/trips/1',
  },
  {
    id: '4',
    type: 'tracking',
    title: 'Live Tracking Started',
    message: 'Your bus to Addis Ababa is now being tracked. ETA: 6:30 PM',
    time: '1 day ago',
    isRead: true,
    icon: MapPin,
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    action: '/(screens)/tracking/live-tracking',
  },
  {
    id: '5',
    type: 'booking',
    title: 'Booking Reminder',
    message: 'Your trip to Debre Markos departs tomorrow at 07:00 AM',
    time: '2 days ago',
    isRead: true,
    icon: Calendar,
    color: '#EC4899',
    bgColor: 'bg-pink-100',
    action: '/tabs/tickets/2',
  },
];

export default function NotificationScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const fetchNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };
  
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };
  
  const clearAll = () => {
    setNotifications([]);
  };
  
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'booking':
        return <Badge text="Booking" variant="success" size="small" />;
      case 'payment':
        return <Badge text="Payment" variant="primary" size="small" />;
      case 'alert':
        return <Badge text="Alert" variant="warning" size="small" />;
      case 'tracking':
        return <Badge text="Tracking" variant="info" size="small" />;
      default:
        return <Badge text="Notification" variant="secondary" size="small" />;
    }
  };
  
  if (loading) {
    return <Loader message="Loading notifications..." />;
  }
  
  return (
    <ScreenLayout
      showHeader={true}
      headerTitle="Notifications"
      showBackButton={true}
      rightAction={
        <View className="flex-row items-center space-x-4">
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} className="flex-row items-center">
              <CheckCheck size={18} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-1">Mark all</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      }
      className="bg-gray-50"
      showBottomTab={false}
    >
      {/* Tabs */}
      <Card variant="outline" className="mx-4 mt-4 p-0">
        <View className="flex-row">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-l-lg ${activeTab === 'all' ? 'bg-blue-50' : 'bg-white'}`}
            onPress={() => setActiveTab('all')}
          >
            <View className="items-center">
              <Text className={`font-medium ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-600'}`}>
                All
              </Text>
              <Badge 
                text={notifications.length.toString()} 
                variant={activeTab === 'all' ? 'primary' : 'secondary'} 
                size="small"
                className="mt-1"
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 rounded-r-lg ${activeTab === 'unread' ? 'bg-blue-50' : 'bg-white'}`}
            onPress={() => setActiveTab('unread')}
          >
            <View className="items-center">
              <Text className={`font-medium ${activeTab === 'unread' ? 'text-blue-600' : 'text-gray-600'}`}>
                Unread
              </Text>
              <Badge 
                text={unreadCount.toString()} 
                variant={unreadCount > 0 ? 'danger' : 'secondary'} 
                size="small"
                className="mt-1"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Card>
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {filteredNotifications.length > 0 ? (
          <View className="p-4 space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                onPress={() => router.push(notification.action as any)}
                className={`${notification.isRead ? 'opacity-80' : ''}`}
              >
                <View className="flex-row items-start">
                  <View className={`w-12 h-12 rounded-full ${notification.bgColor} items-center justify-center mr-3`}>
                    {notification.type === 'booking' && <Ticket size={24} color={notification.color} />}
                    {notification.type === 'payment' && <CreditCard size={24} color={notification.color} />}
                    {notification.type === 'alert' && <AlertCircle size={24} color={notification.color} />}
                    {notification.type === 'tracking' && <MapPin size={24} color={notification.color} />}
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="font-bold text-gray-800">{notification.title}</Text>
                      {!notification.isRead && (
                        <Badge text="New" variant="danger" size="small" />
                      )}
                    </View>
                    
                    <Text className="text-gray-600 text-sm mb-2">{notification.message}</Text>
                    
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        {getNotificationBadge(notification.type)}
                        <Text className="text-gray-400 text-xs ml-2">{notification.time}</Text>
                      </View>
                      
                      <View className="flex-row space-x-2">
                        {!notification.isRead && (
                          <TouchableOpacity
                            onPress={() => markAsRead(notification.id)}
                            className="p-1"
                          >
                            <CheckCircle size={18} color="#10B981" />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => deleteNotification(notification.id)}
                          className="p-1"
                        >
                          <XCircle size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Bell}
            title={activeTab === 'unread' ? "No unread notifications" : "No notifications yet"}
            description={
              activeTab === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "Check back later for updates about your trips and bookings."
            }
            buttonText="Refresh"
            onButtonPress={fetchNotifications}
          >
            {activeTab === 'all' && notifications.length === 0 && (
              <View className="mt-4">
                <Button
                  title="Book Your First Trip"
                  onPress={() => router.push('/tabs/trips')}
                  variant="outline"
                  className="mt-2"
                />
              </View>
            )}
          </EmptyState>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}
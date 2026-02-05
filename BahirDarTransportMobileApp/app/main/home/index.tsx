import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { Card } from '@/components/common/Card';
import { 
  Search, 
  Ticket, 
  Map, 
  Bell, 
  HelpCircle,
  Calendar,
  CreditCard,
  LogOut,
  User
} from 'lucide-react-native';

const quickActions = [
  {
    title: 'Book a Trip',
    description: 'Find and book your next journey',
    icon: Search,
    route: '/main/trips',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'My Tickets',
    description: 'View upcoming and past trips',
    icon: Ticket,
    route: '/main/tickets',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: 'Live Tracking',
    description: 'Track your bus in real-time',
    icon: Map,
    route: '/main/tracking/live-tracking',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Notifications',
    description: 'Check your alerts and updates',
    icon: Bell,
    route: '/main/home/notification',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    title: 'Payment History',
    description: 'View your transactions',
    icon: CreditCard,
    route: '/main/payment/history',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    title: 'Help & Support',
    description: 'Get assistance when needed',
    icon: HelpCircle,
    route: '/main/support/help',
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
];

export default function HomeScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel'
        },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // The logout function already handles navigation
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  if (loading || authLoading) {
    return <Loader message="Loading dashboard..." />;
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Logout Button */}
      <View className="px-4 pt-6 pb-4 flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-800">
            {greeting()}, {user?.fullName?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'Traveler'}!
          </Text>
          <Text className="text-gray-600 mt-1">
            Welcome to Bahir Dar Transport
          </Text>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="w-10 h-10 bg-red-100 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View className="flex-row mb-6">
          <Card className="flex-1 mr-2">
            <View className="items-center">
              <Ticket size={24} color="#3B82F6" />
              <Text className="text-2xl font-bold mt-2">0</Text>
              <Text className="text-gray-600 text-sm">Upcoming Trips</Text>
            </View>
          </Card>
          <Card className="flex-1 ml-2">
            <View className="items-center">
              <Calendar size={24} color="#10B981" />
              <Text className="text-2xl font-bold mt-2">0</Text>
              <Text className="text-gray-600 text-sm">Booked This Month</Text>
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className="w-1/2 px-1 mb-2"
                onPress={() => router.push(action.route)}
                activeOpacity={0.7}
              >
                <Card>
                  <View className={`w-12 h-12 rounded-full ${action.bgColor} items-center justify-center mb-3`}>
                    <action.icon size={24} className={action.iconColor} />
                  </View>
                  <Text className="font-semibold text-gray-800 mb-1">
                    {action.title}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {action.description}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mb-20">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-800">
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          <Card>
            <View className="items-center py-8">
              <Text className="text-gray-500 mb-2">No recent activity</Text>
              <Text className="text-gray-400 text-sm">
                Your trips and bookings will appear here
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
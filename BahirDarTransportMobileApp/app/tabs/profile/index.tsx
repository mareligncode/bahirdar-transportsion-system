import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { 
  User,
  Ticket,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
  Info,
  CreditCard,
  Bell,
  Globe,
  Calendar,
  Map,
  Car
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: User,
      title: 'Edit Profile',
      description: 'Update your personal information',
      route: '/(screens)/profile/edit-profile',
      color: 'bg-blue-100',
    },
    {
      icon: Calendar,
      title: 'My Bookings',
      description: 'View and manage your bookings',
      route: '/(screens)/booking',
      color: 'bg-green-100',
    },
    {
      icon: Car,
      title: 'My Rides',
      description: 'Tickets and trip history',
      route: '../tickets', // Tab 2
      color: 'bg-teal-100',
    },
    {
      icon: Map,
      title: 'Live Tracking',
      description: 'Track your bus in real-time',
      route: '/(screens)/tracking', // Screen
      color: 'bg-purple-100',
    },
    {
      icon: CreditCard,
      title: 'Payment History',
      description: 'View your transactions',
      route: '/(screens)/payment/history',
      color: 'bg-indigo-100',
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'App preferences and settings',
      route: '/(screens)/settings',
      color: 'bg-purple-100',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage notification preferences',
      route: '/(screens)/settings/notifications',
      color: 'bg-yellow-100',
    },
    {
      icon: Globe,
      title: 'Language',
      description: 'Change app language',
      route: '/(screens)/settings/language',
      color: 'bg-indigo-100',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Manage your privacy settings',
      route: '/(screens)/settings/privacy-security',
      color: 'bg-red-100',
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help and support',
      route: '/(screens)/support/help',
      color: 'bg-pink-100',
    },
    {
      icon: Info,
      title: 'About',
      description: 'App information and version',
      route: '/(screens)/settings/about',
      color: 'bg-gray-100',
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScreenLayout
      showHeader={true}
      headerTitle="My Profile"
      showBackButton={false}
      className="bg-gray-50"
      showBottomTab={true} // Show bottom tab
    >
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Profile Header */}
        <View className="px-6 pt-6 pb-6 bg-white">
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Text className="text-blue-600 font-bold text-2xl">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {user?.fullName || 'User'}
              </Text>
              <Text className="text-gray-600 mt-1">
                {user?.email || 'user@example.com'}
              </Text>
              <Text className="text-gray-500 text-sm mt-2">
                {user?.phoneNumber || 'No phone number'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6 py-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.route as any)}
              className="mb-3"
              activeOpacity={0.7}
            >
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-full ${item.color} items-center justify-center mr-4`}>
                    <item.icon size={24} color="#3B82F6" />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">
                      {item.title}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {item.description}
                    </Text>
                  </View>
                  
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View className="px-6 py-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 py-4 rounded-xl items-center flex-row justify-center"
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#EF4444" className="mr-2" />
            <Text className="text-red-600 font-semibold text-lg">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
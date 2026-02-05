// app/main/profile/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/common/Card';
import { User, LogOut, Settings } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-800">Profile</Text>
          <Text className="text-gray-600 mt-1">
            Manage your account and settings
          </Text>
        </View>

        {/* Profile Card */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center mr-4">
              <User size={30} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">
                {user?.name || 'User'}
              </Text>
              <Text className="text-gray-600 mt-1">
                {user?.email || 'user@example.com'}
              </Text>
              <Text className="text-gray-400 text-sm mt-1">Passenger</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <Card className="mb-4">
          <TouchableOpacity 
            className="flex-row items-center py-3"
            onPress={() => router.push('/profile')}
          >
            <Settings size={20} color="#6B7280" className="mr-3" />
            <Text className="flex-1 text-base text-gray-800">Settings</Text>
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Card>
          <TouchableOpacity 
            className="flex-row items-center py-3"
            onPress={logout}
          >
            <LogOut size={20} color="#EF4444" className="mr-3" />
            <Text className="flex-1 text-base text-red-500">Logout</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
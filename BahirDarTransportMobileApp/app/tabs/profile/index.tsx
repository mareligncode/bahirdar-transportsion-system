// app/tabs/profile/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  User,
  Mail,
  Phone,
  LogOut,
  Edit2,
  Check,
  X,
} from 'lucide-react-native';
import { Input } from '@/components/common/Input';
import { COLORS } from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const result = await updateUser(formData);
    if (result?.success) {
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header - NO MENU BUTTON, only title and edit button */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-900">My Profile</Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="p-2"
            >
              <Edit2 size={20} color="#3b82f6" />
            </TouchableOpacity>
          ) : (
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    fullName: user?.fullName || '',
                    phoneNumber: user?.phoneNumber || '',
                  });
                }}
                className="mr-2"
              >
                <X size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                <Check size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Profile Avatar */}
        <View className="items-center mt-8">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center border-4 border-white shadow-md">
            <Text className="text-blue-600 font-bold text-3xl">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View className="bg-white mx-4 mt-6 p-5 rounded-xl border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Personal Information
          </Text>

          {!isEditing ? (
            // View Mode
            <View className="space-y-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <User size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Full Name</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user?.fullName || 'Not set'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Mail size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Email Address</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user?.email || 'Not set'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                  <Phone size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">Phone Number</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user?.phoneNumber || 'Not set'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Edit Mode
            <View className="space-y-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter your full name"
                leftIcon={<User size={20} color="#6b7280" />}
              />

              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color="#6b7280" />}
              />

              <Text className="text-xs text-gray-500 mt-2">
                Email cannot be changed. Contact support if needed.
              </Text>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <View className="mx-4 mt-8 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 py-4 rounded-xl items-center flex-row justify-center border border-red-200"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-600 font-semibold text-lg ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
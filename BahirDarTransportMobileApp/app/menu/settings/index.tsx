// app/menu/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  Globe,
  Shield,
  ChevronRight,
  ArrowLeft
} from 'lucide-react-native';

export default function SettingsMainScreen() {
  const settingsItems = [
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      route: '/menu/settings/notifications',
      color: 'bg-yellow-100',
    },
    {
      icon: Globe,
      label: 'Language',
      description: 'Change app language',
      route: '/menu/settings/language',
      color: 'bg-green-100',
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      description: 'Manage your privacy settings',
      route: '/menu/settings/privacy-security',
      color: 'bg-red-100',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Settings</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(item.route as any)}
            className="bg-white p-4 rounded-xl mb-3 border border-gray-200"
          >
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-full ${item.color} items-center justify-center mr-4`}>
                <item.icon size={24} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{item.label}</Text>
                <Text className="text-sm text-gray-500 mt-1">{item.description}</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
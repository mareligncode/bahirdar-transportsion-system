// app/menu/about.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Info,
  ArrowLeft,
  Github,
  Globe,
  Mail,
  FileText,
  Shield,
  Heart
} from 'lucide-react-native';

export default function AboutScreen() {
  const appVersion = '1.0.0';
  const buildNumber = '20250222';

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">About</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* App Icon */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-blue-600 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white font-bold text-4xl">B</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">Bahir Dar Transport</Text>
          <Text className="text-gray-500 mt-1">Version {appVersion} ({buildNumber})</Text>
        </View>

        {/* App Description */}
        <View className="bg-white p-5 rounded-xl border border-gray-200 mb-6">
          <Text className="text-gray-700 leading-6">
            Bahir Dar Transport System makes it easy to book bus tickets, track your trips, 
            and manage your travel across Ethiopia. Safe, reliable, and convenient.
          </Text>
        </View>

        {/* Quick Links */}
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <TouchableOpacity
            onPress={() => openLink('https://example.com/terms')}
            className="flex-row items-center p-4 border-b border-gray-200"
          >
            <FileText size={20} color="#6b7280" />
            <Text className="flex-1 text-gray-700 ml-3">Terms of Service</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => openLink('https://example.com/privacy')}
            className="flex-row items-center p-4 border-b border-gray-200"
          >
            <Shield size={20} color="#6b7280" />
            <Text className="flex-1 text-gray-700 ml-3">Privacy Policy</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => openLink('mailto:support@bahirdartransport.com')}
            className="flex-row items-center p-4"
          >
            <Mail size={20} color="#6b7280" />
            <Text className="flex-1 text-gray-700 ml-3">Contact Support</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View className="bg-white p-5 rounded-xl border border-gray-200">
          <Text className="text-gray-900 font-semibold mb-3">Made with</Text>
          <View className="flex-row items-center">
            <Heart size={16} color="#ef4444" fill="#ef4444" />
            <Text className="text-gray-600 ml-2">in Bahir Dar, Ethiopia</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-4 text-center">
            © 2025 Bahir Dar Transport System. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
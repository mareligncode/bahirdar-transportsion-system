// BahirDarTransportMobileApp/app/profile/edit-profile.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { User } from 'lucide-react-native';

export default function EditProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header 
        title="Edit Profile" 
        showBackButton
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Card>
            <View className="items-center py-8">
              <User size={48} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                Edit Profile
              </Text>
              <Text className="text-gray-600 text-center">
                Profile editing feature coming soon
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
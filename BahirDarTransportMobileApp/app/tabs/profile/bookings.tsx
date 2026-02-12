// BahirDarTransportMobileApp/app/profile/bookings.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Ticket } from 'lucide-react-native';

export default function BookingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header 
        title="My Bookings" 
        showBackButton
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Card>
            <View className="items-center py-8">
              <Ticket size={48} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                My Bookings
              </Text>
              <Text className="text-gray-600 text-center">
                Your booking history will appear here
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
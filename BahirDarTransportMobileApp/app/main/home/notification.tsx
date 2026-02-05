// app/main/home/notification.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { Card } from '@/components/common/Card';

export default function NotificationScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4">
        <View className="pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-800">Notifications</Text>
          <Text className="text-gray-600 mt-1">Your alerts and updates</Text>
        </View>

        <Card className="items-center py-12">
          <Bell size={48} color="#9CA3AF" />
          <Text className="text-lg font-semibold text-gray-600 mt-4">
            No notifications yet
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Your notifications will appear here when you have updates
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
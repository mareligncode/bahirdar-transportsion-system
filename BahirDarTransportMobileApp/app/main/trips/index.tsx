// app/main/trips/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TripsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
      <Text className="text-xl font-bold text-gray-800">Trips Screen</Text>
      <Text className="text-gray-600 mt-2">Coming soon...</Text>
    </SafeAreaView>
  );
}
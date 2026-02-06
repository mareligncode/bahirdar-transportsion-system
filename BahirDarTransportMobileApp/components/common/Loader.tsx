// components/common/Loader.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'large';
}

export function Loader({ message = 'Loading...', size = 'large' }: LoaderProps) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size={size} color="#3B82F6" />
      {message && (
        <Text className="mt-4 text-base text-gray-600 text-center">{message}</Text>
      )}
    </View>
  );
}
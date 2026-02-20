// BahirDarTransportMobileApp/components/common/Loader.tsx
import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  transparent?: boolean;
  color?: string;
}

export function Loader({ 
  message = 'Loading...', 
  size = 'large',
  fullScreen = true,
  transparent = false,
  color = '#3B82F6'
}: LoaderProps) {
  
  // Full screen loader with overlay
  if (fullScreen) {
    return (
      <Modal
        transparent={transparent}
        animationType="fade"
        visible={true}
      >
        <View 
          className={`flex-1 justify-center items-center ${
            transparent ? 'bg-black/50' : 'bg-white'
          }`}
        >
          <View className="bg-white p-6 rounded-2xl shadow-xl items-center">
            <ActivityIndicator size={size} color={color} />
            {message && (
              <Text className="mt-4 text-base text-gray-700 text-center font-medium">
                {message}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Inline loader (for inside screens)
  return (
    <View className="flex-1 justify-center items-center bg-white min-h-[200px]">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="mt-3 text-sm text-gray-600 text-center">
          {message}
        </Text>
      )}
    </View>
  );
}

// Alternative: Simple spinner without text
export function Spinner({ 
  size = 'large', 
  color = '#3B82F6',
  className = ''
}: {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}) {
  return (
    <View className={`justify-center items-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

// Page loader with custom styling
export function PageLoader({ message = 'Loading page...' }: { message?: string }) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
      <Text className="text-gray-600 text-base">{message}</Text>
    </View>
  );
}

// Content loader (for lazy loading sections)
export function ContentLoader({ message = 'Loading content...' }: { message?: string }) {
  return (
    <View className="py-8 justify-center items-center">
      <ActivityIndicator size="small" color="#3B82F6" />
      {message && (
        <Text className="mt-2 text-sm text-gray-500">{message}</Text>
      )}
    </View>
  );
}
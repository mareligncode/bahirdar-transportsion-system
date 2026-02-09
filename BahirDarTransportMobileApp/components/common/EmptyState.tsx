// components/common/EmptyState.tsx - CREATE THIS FILE
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  children?: React.ReactNode;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  buttonText, 
  onButtonPress,
  children 
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      {Icon && (
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Icon size={32} color="#6B7280" />
        </View>
      )}
      
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">
        {title}
      </Text>
      
      {description && (
        <Text className="text-gray-600 text-center mb-6 max-w-[280px]">
          {description}
        </Text>
      )}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity
          onPress={onButtonPress}
          className="bg-blue-600 px-6 py-3 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-white font-medium">{buttonText}</Text>
        </TouchableOpacity>
      )}
      
      {children}
    </View>
  );
}
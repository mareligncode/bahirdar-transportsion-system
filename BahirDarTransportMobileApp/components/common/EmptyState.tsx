 // components/common/EmptyState.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  message?: string;
  description?: string;
  buttonText?: string;
  buttonTitle?: string; 
  onButtonPress?: () => void;
  children?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  message,
  description, 
  buttonText, 
  onButtonPress,
  children,
  actionLabel,
  onAction
}: EmptyStateProps) {
  const displayMessage = message || description;
  
  return (
    <View className="flex-1 items-center justify-center p-8">
      {icon && typeof icon === 'string' ? (
        <Text className="text-4xl mb-4">{icon}</Text>
      ) : icon ? (
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
          {icon}
        </View>
      ) : null}
      
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">
        {title}
      </Text>
      
      {displayMessage && (
        <Text className="text-gray-600 text-center mb-6 max-w-[280px]">
          {displayMessage}
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
      
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-blue-600 px-6 py-3 rounded-lg mt-4"
          activeOpacity={0.7}
        >
          <Text className="text-white font-medium">{actionLabel}</Text>
        </TouchableOpacity>
      )}
      
      {children}
    </View>
  );
}

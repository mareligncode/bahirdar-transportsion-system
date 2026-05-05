import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';

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
        <AppText className="text-4xl mb-4">{icon}</AppText>
      ) : icon ? (
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
          {icon}
        </View>
      ) : null}
      
      <AppText variant="h3" weight="bold" color="textPrimary" className="text-center mb-2">
        {title}
      </AppText>
      
      {displayMessage && (
        <AppText color="textSecondary" className="text-center mb-6 max-w-[280px]">
          {displayMessage}
        </AppText>
      )}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity
          onPress={onButtonPress}
          className="bg-blue-600 px-6 py-3 rounded-lg"
          activeOpacity={0.7}
        >
          <AppText weight="medium" color="white">{buttonText}</AppText>
        </TouchableOpacity>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-blue-600 px-6 py-3 rounded-lg mt-4"
          activeOpacity={0.7}
        >
          <AppText weight="medium" color="white">{actionLabel}</AppText>
        </TouchableOpacity>
      )}
      
      {children}
    </View>
  );
}

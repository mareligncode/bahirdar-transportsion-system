// BahirDarTransportMobileApp/components/common/Card.tsx
import React, { ReactNode } from 'react';
import { View, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface CardProps extends TouchableOpacityProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'elevated';
  onPress?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  onPress,
  ...props 
}: CardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300';
      case 'elevated':
        return 'bg-white shadow-lg shadow-gray-200';
      default:
        return 'bg-white border border-gray-200';
    }
  };

  const cardContent = (
    <View className={`rounded-xl p-4 ${getVariantClasses()} ${className}`}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`rounded-xl ${getVariantClasses()} ${className}`}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return cardContent;
}
import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium';
  rounded?: boolean;
  className?: string;
}

export function Badge({
  text,
  variant = 'primary',
  size = 'medium',
  rounded = true,
  className = '',
}: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 text-gray-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'danger':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <View
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${rounded ? 'rounded-full' : 'rounded-md'}
        items-center justify-center
        ${className}
      `}
    >
      <Text className={`font-medium ${getSizeClasses().includes('text-xs') ? 'text-xs' : 'text-sm'}`}>
        {text}
      </Text>
    </View>
  );
}
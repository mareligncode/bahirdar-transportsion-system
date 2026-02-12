import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium';
  rounded?: boolean;
  className?: string;
  textClassName?: string;
}

export function Badge({
  text,
  variant = 'primary',
  size = 'medium',
  rounded = true,
  className = '',
  textClassName = '',
}: BadgeProps) {
  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100';
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'danger':
        return 'bg-red-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getTextVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'text-gray-800';
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'danger':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1';
      default:
        return 'px-3 py-1.5';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      default:
        return 'text-sm';
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
      <Text className={`font-medium ${getTextSizeClasses()} ${getTextVariantClasses()} ${textClassName}`}>
        {text}
      </Text>
    </View>
  );
}
import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'error' | 'info'; // Added 'error'
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
        return 'bg-gray-100 dark:bg-gray-700';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'danger':
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getTextVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'text-gray-800 dark:text-gray-200';
      case 'success':
        return 'text-green-800 dark:text-green-400';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-400';
      case 'danger':
      case 'error':
        return 'text-red-800 dark:text-red-400';
      case 'info':
        return 'text-blue-800 dark:text-blue-400';
      default:
        return 'text-blue-800 dark:text-blue-400';
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

  const getTextVariant = () => {
    switch (size) {
      case 'small':
        return 'caption';
      default:
        return 'bodySmall';
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
      <AppText 
        variant={getTextVariant()}
        weight="500"
        className={`${getTextVariantClasses()} ${textClassName}`}
      >
        {text}
      </AppText>
    </View>
  );
}
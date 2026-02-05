// components/common/Button.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  TouchableOpacityProps 
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export function Button({ 
  title, 
  loading = false, 
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600';
      case 'outline':
        return 'bg-transparent border border-blue-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-4';
      case 'large':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const getTextVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'text-blue-600';
      default:
        return 'text-white';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      className={`
        rounded-lg items-center justify-center flex-row
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#3B82F6' : '#FFFFFF'} 
          size={size === 'small' ? 'small' : 'large'}
        />
      ) : (
        <Text className={`
          font-semibold
          ${getTextVariantClasses()}
          ${getTextSizeClasses()}
        `}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
// components/common/IconButton.tsx
import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';
import { LucideIcon } from 'lucide-react-native';

interface IconButtonProps {
  title: string;
  onPress: () => void;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export function IconButton({
  title,
  onPress,
  icon: Icon,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  iconPosition = 'left',
  className = '',
}: IconButtonProps) {
  const variantStyles = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    outline: 'bg-transparent border border-gray-300',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-gray-800',
  };

  const sizeStyles = {
    small: 'px-3 py-2',
    medium: 'px-4 py-3',
    large: 'px-6 py-4',
  };

  const textSize = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const iconSize = {
    small: 16,
    medium: 18,
    large: 20,
  };

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center rounded-lg
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || loading ? 'opacity-50' : ''}
        ${className}
      `}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? '#4B5563' : '#FFFFFF'} 
          className="mr-2"
        />
      ) : Icon && iconPosition === 'left' && (
        <Icon 
          size={iconSize[size]} 
          color={variant === 'outline' ? '#4B5563' : '#FFFFFF'}
          className="mr-2"
        />
      )}
      
      <AppText 
        weight="semibold"
        color={variant === 'outline' ? '#1f2937' : 'white'}
        variant={size === 'small' ? 'bodySmall' : size === 'large' ? 'bodyLarge' : 'bodyMedium'}
        className={className}
      >
        {title}
      </AppText>
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon 
          size={iconSize[size]} 
          color={variant === 'outline' ? '#4B5563' : '#FFFFFF'}
          className="ml-2"
        />
      )}
    </TouchableOpacity>
  );
}
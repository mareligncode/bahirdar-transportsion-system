// BahirDarTransportMobileApp/components/common/IconButton.tsx
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface IconButtonProps extends TouchableOpacityProps {
  icon: LucideIcon;
  size?: number;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  rounded?: boolean;
}

export function IconButton({ 
  icon: Icon, 
  size = 20,
  variant = 'primary',
  rounded = false,
  className = '',
  ...props 
}: IconButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100';
      case 'ghost':
        return 'bg-transparent';
      case 'danger':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'secondary':
        return '#4B5563';
      case 'ghost':
        return '#6B7280';
      case 'danger':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };

  return (
    <TouchableOpacity
      className={`
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        items-center justify-center
        ${getVariantClasses()}
        ${className}
      `}
      activeOpacity={0.7}
      {...props}
    >
      <Icon size={size} color={getIconColor()} />
    </TouchableOpacity>
  );
}
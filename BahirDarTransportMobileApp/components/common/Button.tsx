import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  TouchableOpacityProps,
  View 
} from 'react-native';

interface ButtonProps extends Omit<TouchableOpacityProps, 'title'> {
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export function Button({ 
  title, 
  children,
  loading = false, 
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  leftIcon,
  onPress,
  ...props
}: ButtonProps) {
  
  // Use static class mappings
  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    outline: 'bg-transparent border border-blue-600'
  };

  const sizeClasses = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8',
    small: 'py-2 px-4',
    medium: 'py-3 px-6',
    large: 'py-4 px-8'
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-blue-600'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const buttonContent = children || title;
  const isDisabled = disabled || loading;

  // Get the specific classes based on props
  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  const textVariantClass = textVariantClasses[variant] || textVariantClasses.primary;
  const textSizeClass = textSizeClasses[size] || textSizeClasses.medium;

  // Build className safely - use conditional logic instead of template literals with booleans
  let buttonClassName = 'rounded-lg items-center justify-center flex-row';
  buttonClassName += ` ${variantClass}`;
  buttonClassName += ` ${sizeClass}`;
  
  if (fullWidth) {
    buttonClassName += ' w-full';
  }
  
  if (isDisabled) {
    buttonClassName += ' opacity-50';
  }
  
  if (className) {
    buttonClassName += ` ${className}`;
  }

  return (
    <TouchableOpacity
      className={buttonClassName}
      onPress={onPress}
      activeOpacity={isDisabled ? 1 : 0.7}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#3B82F6' : '#FFFFFF'} 
          size="small"
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          {typeof buttonContent === 'string' ? (
            <Text className={`font-semibold ${textVariantClass} ${textSizeClass}`}>
              {buttonContent}
            </Text>
          ) : (
            buttonContent
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
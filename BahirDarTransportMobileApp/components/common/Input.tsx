import React, { forwardRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { AppText } from './AppText';
import { useFont } from '@/context/FontContext';
import { TYPOGRAPHY } from '@/constants/typography';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<RNTextInput, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
  fullWidth = false,
  style,
  ...props
}, ref) => {
  const { fontScale } = useFont();
  
  return (
    <View className={`mb-4 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <AppText variant="bodySmall" weight="500" color="#374151" className="mb-2">
          {label}
        </AppText>
      )}
      
      <View className={`flex-row items-center border rounded-lg px-3 py-3 ${
        error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
      }`}>
        {leftIcon && (
          <View className="mr-3">
            {leftIcon}
          </View>
        )}
        
        <RNTextInput
          ref={ref}
          className={`flex-1 text-gray-900 ${
            props.editable === false ? 'opacity-50' : ''
          }`}
          style={[{ 
            fontSize: TYPOGRAPHY.bodyMedium.fontSize * fontScale,
            lineHeight: TYPOGRAPHY.bodyMedium.lineHeight * fontScale,
          }, style]}
          placeholderTextColor="#9CA3AF"
          selectionColor="#3B82F6"
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            className="ml-3"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <AppText variant="caption" color="#EF4444" className="mt-1 ml-1">
          {error}
        </AppText>
      )}
    </View>
  );
});

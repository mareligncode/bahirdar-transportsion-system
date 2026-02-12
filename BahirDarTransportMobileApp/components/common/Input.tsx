import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';

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
  ...props
}, ref) => {
  return (
    <View className={`mb-4 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label}
        </Text>
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
          className={`flex-1 text-base text-gray-900 ${
            props.editable === false ? 'opacity-50' : ''
          }`}
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
        <Text className="text-red-500 text-xs mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
});

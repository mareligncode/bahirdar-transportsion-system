// components/common/Card.tsx - SIMPLIFIED VERSION
import React, { ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  onPress,
}: CardProps) {
  const baseClasses = 'bg-white rounded-xl p-4 border border-gray-200';
  
  if (onPress) {
    return (
      <TouchableOpacity
        className={`${baseClasses} ${className}`}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseClasses} ${className}`}>
      {children}
    </View>
  );
}
// components/common/Card.tsx
import React, { ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, className = '', onPress, elevated = true }: CardProps) {
  const cardClasses = `bg-white rounded-xl p-4 ${
    elevated ? 'shadow-sm shadow-black/5' : ''
  } ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} className={cardClasses}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={cardClasses}>
      {children}
    </View>
  );
}
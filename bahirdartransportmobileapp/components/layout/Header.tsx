import React from 'react';
import { View, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { AppText } from '../common/AppText';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function Header({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
  subtitle,
  className = ''
}: HeaderProps) {
  const router = useRouter();
  const { isDark } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.canGoBack() ? router.back() : router.replace('/tabs/home');
    }
  };

  return (
    <View className={`bg-white dark:bg-gray-800 ${Platform.OS === 'android' ? 'pt-6' : 'pt-2'} pb-4 px-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#1F2937" : "#FFFFFF"} 
      />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {showBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              className="mr-3 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={isDark ? "#FFFFFF" : "#374151"} />
            </TouchableOpacity>
          )}

          <View className="flex-1">
            <AppText 
              variant="h3" 
              color={isDark ? "#FFFFFF" : "#111827"}
              numberOfLines={1}
            >
              {title}
            </AppText>
            {subtitle && (
              <AppText 
                variant="bodySmall"
                color={isDark ? "#9CA3AF" : "#4B5563"}
                className="mt-1" 
                numberOfLines={1}
              >
                {subtitle}
              </AppText>
            )}
          </View>
        </View>

        {rightAction && (
          <View className="ml-3">
            {rightAction}
          </View>
        )}
      </View>
    </View>
  );
}
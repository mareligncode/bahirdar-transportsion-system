import React, { ReactNode } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { Header } from './Header';
import { BottomTab } from './BottomTab';
import { useTheme } from '@/context/ThemeContext';

interface ScreenLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  showBottomTab?: boolean;
  safeArea?: boolean;
  className?: string;
  headerClassName?: string;
}

export function ScreenLayout({
  children,
  showHeader = true,
  headerTitle = '',
  showBackButton = false,
  onBackPress,
  rightAction,
  showBottomTab = false,
  safeArea = true,
  className = '',
  headerClassName = '',
}: ScreenLayoutProps) {
  const { isDark } = useTheme();

  const content = (
    <View className={`flex-1 bg-white dark:bg-gray-900 ${className}`}>
      {showHeader && (
        <Header 
          title={headerTitle} 
          showBackButton={showBackButton}
          onBackPress={onBackPress}
          rightAction={rightAction}
          className={headerClassName}
        />
      )}
      
      <View className={`flex-1 ${showBottomTab ? 'pb-16' : ''}`}>
        {children}
      </View>
      
      {showBottomTab && <BottomTab />}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={isDark ? "#111827" : "#FFFFFF"} 
        />
        {content}
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#111827" : "#FFFFFF"} 
      />
      {content}
    </>
  );
}
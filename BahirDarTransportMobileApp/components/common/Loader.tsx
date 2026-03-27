// BahirDarTransportMobileApp/components/common/Loader.tsx
import React from 'react';
import { View, ActivityIndicator, Modal } from 'react-native';
import { AppText } from './AppText';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';


interface LoaderProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
  transparent?: boolean;
  color?: string;
}

export function Loader({
  message,
  size = 'large',
  fullScreen = true,
  transparent = false,
  color = '#3B82F6'
}: LoaderProps) {
  const { translate } = useTranslation();
  const { isDark } = useTheme();
  const displayMessage = message || translate('loading' as any);

  // Full screen loader with overlay
  if (fullScreen) {
    return (
      <Modal
        transparent={transparent}
        animationType="fade"
        visible={true}
      >
        <View
          className={`flex-1 justify-center items-center ${transparent ? 'bg-black/50' : (isDark ? 'bg-gray-900' : 'bg-white')
            }`}
        >
          <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-xl items-center`}>
            <ActivityIndicator size={size} color={color} />
            {displayMessage && (
              <AppText variant="bodyMedium" weight="medium" color="textPrimary" className="mt-4 text-center">
                {displayMessage}
              </AppText>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Inline loader (for inside screens)
  return (
    <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-white'} min-h-[200px]`}>
      <ActivityIndicator size={size} color={color} />
      {displayMessage && (
        <AppText variant="bodySmall" color="textSecondary" className="mt-3 text-center">
          {displayMessage}
        </AppText>
      )}
    </View>
  );
}

// Alternative: Simple spinner without text
export function Spinner({
  size = 'large',
  color = '#3B82F6',
  className = ''
}: {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}) {
  return (
    <View className={`justify-center items-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

// Page loader with custom styling
export function PageLoader({ message }: { message?: string }) {
  const { translate } = useTranslation();
  const { isDark } = useTheme();
  const displayMessage = message || translate('loading_page' as any);
  return (
    <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className={`w-20 h-20 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full items-center justify-center mb-4`}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
      <AppText variant="bodyMedium" color="textSecondary">{displayMessage}</AppText>
    </View>
  );
}

// Content loader (for lazy loading sections)
export function ContentLoader({ message }: { message?: string }) {
  const { translate } = useTranslation();
  const displayMessage = message || translate('loading_content' as any);
  return (
    <View className="py-8 justify-center items-center">
      <ActivityIndicator size="small" color="#3B82F6" />
      {displayMessage && (
        <AppText variant="bodySmall" color="textTertiary" className="mt-2">{displayMessage}</AppText>
      )}
    </View>
  );
}
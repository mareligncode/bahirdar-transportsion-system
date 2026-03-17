// components/layout/CustomDrawerContent.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { AppText } from '../common/AppText';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import {
  LogOut,
  Settings,
  HelpCircle,
  Info,
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { APP_CONSTANTS } from '@/constants/routes';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomDrawerContentProps {
  onClose?: () => void;
}

export function CustomDrawerContent({ onClose }: CustomDrawerContentProps) {
  const { logout } = useAuth();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    router.replace('/');
  };

  const navigateTo = (route: string) => {
    if (onClose) onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const menuItems = [
    { label: translate('settings'), icon: Settings, route: '/menu/settings' },
    { label: translate('help_support'), icon: HelpCircle, route: '/menu/support' },
    { label: translate('about'), icon: Info, route: '/menu/about' },
  ];

  const renderIcon = (Icon: React.ComponentType<any>, size: number, color: string) => {
    return <Icon size={size} color={color} />;
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} style={{ paddingBottom: insets.bottom }}>
      {/* Simple Header - just title, no user info */}
      <View className="bg-blue-600 px-4 py-8">
        <AppText variant="h2" weight="bold" color="white">{translate('menu_title')}</AppText>
      </View>

      <View className="flex-1 px-2 pt-4">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigateTo(item.route)}
            className={`flex-row items-center px-4 py-4 rounded-lg mb-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
          >
            {renderIcon(item.icon, 24, isDark ? colors.textSecondary : '#374151')}
            <AppText weight="medium" color={isDark ? '#e5e7eb' : '#1f2937'} variant="bodyLarge" className="ml-4">
              {item.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className={`flex-row items-center px-6 py-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
      >
        {renderIcon(LogOut, 24, COLORS.danger)}
        <AppText weight="medium" color="#dc2626" variant="bodyLarge" className="ml-4">{translate('logout')}</AppText>
      </TouchableOpacity>

      {/* Version */}
      <View className="px-6 py-3">
        <AppText variant="caption" color={isDark ? '#6b7280' : '#9ca3af'}>{translate('version')} {APP_CONSTANTS.VERSION}</AppText>
      </View>
    </View>
  );
}
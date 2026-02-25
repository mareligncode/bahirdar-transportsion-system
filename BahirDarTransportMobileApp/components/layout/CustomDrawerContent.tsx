// components/layout/CustomDrawerContent.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
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

interface CustomDrawerContentProps {
  onClose?: () => void;
}

export function CustomDrawerContent({ onClose }: CustomDrawerContentProps) {
  const { logout } = useAuth();

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
    { label: 'Settings', icon: Settings, route: '/menu/settings' },
    { label: 'Help & Support', icon: HelpCircle, route: '/menu/support' },
    { label: 'About', icon: Info, route: '/menu/about' },
  ];

  const renderIcon = (Icon: React.ComponentType<any>, size: number, color: string) => {
    return <Icon size={size} color={color} />;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Simple Header - just title, no user info */}
      <View className="bg-blue-600 px-4 py-6">
        <Text className="text-white text-2xl font-bold">Menu</Text>
      </View>

      <View className="flex-1 px-2 pt-4">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigateTo(item.route)}
            className="flex-row items-center px-4 py-4 rounded-lg mb-2 border-b border-gray-100"
          >
            {renderIcon(item.icon, 24, COLORS.gray700)}
            <Text className="ml-4 font-medium text-gray-800 text-lg">
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center px-6 py-5 border-t border-gray-200"
      >
        {renderIcon(LogOut, 24, COLORS.danger)}
        <Text className="ml-4 text-red-600 font-medium text-lg">Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <View className="px-6 py-3">
        <Text className="text-xs text-gray-400">Version {APP_CONSTANTS.VERSION}</Text>
      </View>
    </View>
  );
}
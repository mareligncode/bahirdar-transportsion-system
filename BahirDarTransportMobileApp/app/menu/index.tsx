// app/menu/index.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Settings,
  HelpCircle,
  Info,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { APP_CONSTANTS } from '@/constants/routes';

export default function MenuScreen() {
  const menuItems = [
    {
      id: 'settings',
      title: 'Settings',
      description: 'App preferences, notifications, language, and privacy',
      icon: Settings,
      route: '/menu/settings',
      color: 'bg-blue-500',
      iconColor: COLORS.white,
    },
    {
      id: 'support',
      title: 'Help & Support',
      description: 'FAQs, contact us, and send feedback',
      icon: HelpCircle,
      route: '/menu/support',
      color: 'bg-purple-500',
      iconColor: COLORS.white,
    },
    {
      id: 'about',
      title: 'About',
      description: 'App information, version, and legal',
      icon: Info,
      route: '/menu/about',
      color: 'bg-gray-700',
      iconColor: COLORS.white,
    },
  ];

  const renderIcon = (Icon: React.ComponentType<any>, size: number, color: string) => {
    return <Icon size={size} color={color} />;
  };

  const handleNavigation = (route: string) => {
    console.log('➡️ Navigating to:', route);
    router.push(route as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Menu</Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2 -mr-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {renderIcon(X, 24, COLORS.gray600)}
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 mt-1">
          Settings, support, and app information
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items Grid */}
        <View className="space-y-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              <View className="p-5">
                <View className="flex-row items-center">
                  {/* Icon with colored background */}
                  <View className={`w-16 h-16 rounded-2xl ${item.color} items-center justify-center mr-4 shadow-sm`}>
                    {renderIcon(item.icon, 32, item.iconColor)}
                  </View>
                  
                  {/* Content */}
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900 mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500 leading-5">
                      {item.description}
                    </Text>
                  </View>
                  
                  {/* Chevron */}
                  {renderIcon(ChevronRight, 24, COLORS.gray400)}
                </View>

                {/* Bottom accent bar */}
                <View className={`h-1 w-20 mt-4 rounded-full ${item.color}`} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View className="items-center py-8 mt-4">
          <Text className="text-gray-400 text-xs">
            Version {APP_CONSTANTS.VERSION}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            © 2025 {APP_CONSTANTS.APP_NAME}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '../common/AppText';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import { Home, Ticket, Car, User, Navigation } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const tabs = [
  {
    key: 'home',
    icon: Home,
    route: '/tabs/home',
  },
  {
    key: 'trips',
    icon: Car,
    route: '/tabs/trips',
  },
  {
    key: 'map',
    icon: Navigation,
    route: '/tabs/map',
  },
  {
    key: 'tickets',
    icon: Ticket,
    route: '/tabs/tickets',
  },
  {
    key: 'profile',
    icon: User,
    route: '/tabs/profile',
  },
];

export function BottomTab() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 border-t-2 px-4 pt-3 shadow-2xl"
      style={{ 
        paddingBottom: insets.bottom + 4,
        backgroundColor: colors.cardBackground,
        borderTopColor: colors.border,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      }} 
    >
      <View className="flex-row justify-between items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.route || 
                          pathname?.startsWith(`${tab.route}/`);
          
          const activeColor = colors.primary;
          const inactiveColor = colors.textSecondary;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => router.push(tab.route)}
              className="items-center justify-center flex-1"
              activeOpacity={0.7}
            >
              <tab.icon
                size={24}
                color={isActive ? activeColor : inactiveColor}
                fill={isActive ? activeColor : 'transparent'}
              />
              <AppText
                variant="caption"
                weight={isActive ? 'bold' : 'medium'}
                color={isActive ? colors.primary : colors.textSecondary}
                className="mt-1"
              >
                {translate(tab.key as any)}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
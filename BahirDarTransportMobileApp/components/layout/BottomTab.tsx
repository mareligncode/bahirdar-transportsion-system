import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Ticket, Car, User } from 'lucide-react-native';

const tabs = [
  {
    name: 'Home',
    icon: Home,
    route: '/tabs/home',
  },
  {
    name: 'Trips',
    icon: Car,
    route: '/tabs/trips',
  },
  {
    name: 'Tickets',
    icon: Ticket,
    route: '/tabs/tickets',
  },
  {
    name: 'Profile',
    icon: User,
    route: '/tabs/profile',
  },
];

export function BottomTab() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 shadow-lg"
      style={{ paddingBottom: insets.bottom }} // Only one style prop - acceptable!
    >
      <View className="flex-row justify-between items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.route || 
                          pathname?.startsWith(`${tab.route}/`);
          
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(tab.route)}
              className="items-center justify-center flex-1"
              activeOpacity={0.7}
            >
              <tab.icon
                size={24}
                color={isActive ? '#3B82F6' : '#9CA3AF'}
                fill={isActive ? '#3B82F6' : 'transparent'}
              />
              <Text
                className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
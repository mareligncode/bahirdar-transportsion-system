// components/layout/BottomTab.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { usePathname, router } from 'expo-router';
import { 
  Home, 
  Search, 
  Ticket, 
  User 
} from 'lucide-react-native';

const tabs = [
  {
    name: 'Home',
    icon: Home,
    route: '/main/home',
  },
  {
    name: 'Search',
    icon: Search,
    route: '/main/trips',
  },
  {
    name: 'Tickets',
    icon: Ticket,
    route: '/main/tickets',
  },
  {
    name: 'Profile',
    icon: User,
    route: '/main/profile',
  },
];

export function BottomTab() {
  const pathname = usePathname();

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <View className="flex-row justify-between items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.route || pathname.startsWith(`${tab.route}/`);
          
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => router.push(tab.route)}
              className="items-center justify-center"
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
// BahirDarTransportMobileApp/app/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { 
  Bell,
  Globe,
  Shield,
  Info,
  Moon,
  Download,
  ChevronRight,
  User
} from 'lucide-react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          title: 'Notifications',
          description: 'Manage notification preferences',
          route: '/settings/notifications',
          color: 'bg-yellow-100',
        },
        {
          icon: Globe,
          title: 'Language',
          description: 'Change app language',
          route: '/settings/language',
          color: 'bg-indigo-100',
        },
        {
          icon: Moon,
          title: 'Dark Mode',
          description: 'Switch between light and dark theme',
          component: (
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          ),
          color: 'bg-purple-100',
        },
      ],
    },
    {
      title: 'Security & Privacy',
      items: [
        {
          icon: Shield,
          title: 'Privacy & Security',
          description: 'Manage your privacy settings',
          route: '/settings/privacy-security',
          color: 'bg-red-100',
        },
        {
          icon: Download,
          title: 'Data & Storage',
          description: 'Clear cache and manage storage',
          route: null,
          component: <Text className="text-gray-500">1.2 GB</Text>,
          color: 'bg-green-100',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: Info,
          title: 'About App',
          description: 'App version and information',
          route: '/settings/about',
          color: 'bg-blue-100',
        },
        {
          icon: User,
          title: 'Account',
          description: 'Edit profile and account settings',
          route: '/profile',
          color: 'bg-pink-100',
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header 
        title="Settings" 
        showBackButton
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4 px-6">
              {section.title}
            </Text>
            
            <View className="px-6">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={() => item.route && router.push(item.route as any)}
                  className="mb-3"
                  activeOpacity={item.route ? 0.7 : 1}
                  disabled={!item.route}
                >
                  <Card>
                    <View className="flex-row items-center">
                      <View className={`w-12 h-12 rounded-full ${item.color} items-center justify-center mr-4`}>
                        <item.icon size={24} color="#3B82F6" />
                      </View>
                      
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">
                          {item.title}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-1">
                          {item.description}
                        </Text>
                      </View>
                      
                      {item.component ? (
                        item.component
                      ) : (
                        <ChevronRight size={20} color="#9CA3AF" />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        
        {/* App Version */}
        <View className="px-6 py-8 items-center">
          <Text className="text-gray-500 text-sm">
            BahirDar Transport v1.0.0
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            © 2024 All rights reserved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
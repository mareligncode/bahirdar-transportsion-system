import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenLayout } from '../../../components/layout';
import { AppText } from '@/components/common/AppText';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

const ThemeScreen = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { theme: selectedTheme, setTheme, isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeSelect = async (theme: ThemeMode) => {
    try {
      setIsSaving(true);
      await setTheme(theme);

      Alert.alert(
        translate('success' as any),
        translate('theme_updated' as any),
        [{ text: translate('ok' as any) }]
      );
    } catch (error) {
      console.error('Error saving theme:', error);
      Alert.alert(
        translate('error' as any),
        translate('save_failed' as any)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const themes = [
    {
      id: 'light' as const,
      name: translate('theme_light' as any),
      icon: 'sunny-outline',
      description: translate('always_light' as any),
      previewColors: {
        bg: '#FFFFFF',
        text: '#000000',
        accent: '#2563EB',
      }
    },
    {
      id: 'dark' as const,
      name: translate('theme_dark' as any),
      icon: 'moon-outline',
      description: translate('always_dark' as any),
      previewColors: {
        bg: '#1F2937',
        text: '#FFFFFF',
        accent: '#60A5FA',
      }
    },
    {
      id: 'system' as const,
      name: translate('theme_system' as any),
      icon: 'phone-portrait-outline',
      description: translate('match_device' as any),
      previewColors: {
        bg: isDark ? '#1F2937' : '#F3F4F6',
        text: isDark ? '#FFFFFF' : '#111827',
        accent: '#8B5CF6',
      }
    },
  ];

  return (
    <ScreenLayout>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#4B5563"} />
          </TouchableOpacity>
          <AppText className="text-xl font-bold text-gray-900 dark:text-white">
            {translate('theme' as any)}
          </AppText>
        </View>

        <ScrollView className="flex-1">
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              onPress={() => handleThemeSelect(theme.id)}
              disabled={isSaving}
              className={`flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 ${selectedTheme === theme.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.previewColors.accent + '20' }}
                >
                  <Ionicons
                    name={theme.icon as any}
                    size={24}
                    color={theme.previewColors.accent}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <AppText className={`text-base font-medium ${selectedTheme === theme.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                    }`}>
                    {theme.name}
                  </AppText>
                  <AppText className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {theme.description}
                  </AppText>
                </View>
              </View>
              {selectedTheme === theme.id && (
                <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
              )}
            </TouchableOpacity>
          ))}

          {/* Theme Preview */}
          <View className="p-4 mt-4">
            <AppText className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {translate('preview' as any)}
            </AppText>

            {/* Preview Card */}
            <View
              className="rounded-lg p-4 border"
              style={{
                backgroundColor: themes.find(t => t.id === selectedTheme)?.previewColors.bg,
                borderColor: isDark ? '#374151' : '#E5E7EB'
              }}
            >
              <AppText
                className="text-base font-medium mb-2"
                style={{ color: themes.find(t => t.id === selectedTheme)?.previewColors.text }}
              >
                {translate('theme' as any)} {translate('preview' as any)}
              </AppText>

              <View className="flex-row space-x-2 mb-3" style={{ gap: 8 }}>
                <View className="flex-1 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <View className="flex-1 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <View
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.previewColors.accent }}
                />
              </View>

              <View className="flex-row justify-between">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.previewColors.accent + '20' }}
                >
                  <AppText
                    className="text-xs"
                    style={{ color: themes.find(t => t.id === selectedTheme)?.previewColors.accent }}
                  >
                    {translate('button' as any)}
                  </AppText>
                </View>
                <AppText
                  className="text-xs"
                  style={{ color: (themes.find(t => t.id === selectedTheme)?.previewColors.text || '#000000') + '80' }}
                >
                  {new Date().toLocaleTimeString()}
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default ThemeScreen;


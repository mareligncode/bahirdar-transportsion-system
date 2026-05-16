import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenLayout } from '../../../components/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { translations } from '@/constants/translations';

const LanguageScreen = () => {
  const router = useRouter();
  const { translate, language, setLanguage, isLoading } = useTranslation();

  const handleLanguageSelect = async (code: 'en' | 'am') => {
    try {
      await setLanguage(code);

      const nextT = translations[code];

      Alert.alert(
        nextT.success,
        nextT.language_updated,
        [
          {
            text: nextT.ok,
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert(
        translate('error' as any),
        translate('save_failed' as any)
      );
    }
  };

  return (
    <ScreenLayout>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            {translate('language' as any)}
          </Text>
        </View>

        <ScrollView className="flex-1">
          {/* English Option */}
          <TouchableOpacity
            onPress={() => handleLanguageSelect('en')}
            disabled={isLoading}
            className={`flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 ${language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
          >
            <View className="flex-1">
              <Text className={`text-base font-medium ${language === 'en'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-900 dark:text-white'
                }`}>
                {translate('english' as any)}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                English
              </Text>
            </View>
            {language === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
            )}
          </TouchableOpacity>

          {/* Amharic Option */}
          <TouchableOpacity
            onPress={() => handleLanguageSelect('am')}
            disabled={isLoading}
            className={`flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 ${language === 'am' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
          >
            <View className="flex-1">
              <Text className={`text-base font-medium ${language === 'am'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-900 dark:text-white'
                }`}>
                {translate('amharic' as any)}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                አማርኛ
              </Text>
            </View>
            {language === 'am' && (
              <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
            )}
          </TouchableOpacity>

          {/* Preview Section */}
          <View className="p-4 mt-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {translate('preview' as any)}
            </Text>
            <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-gray-900 dark:text-white text-base mb-2">
                {language === 'en' ? 'Sample Text' : 'የናሙና ጽሑፍ'}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-sm">
                {language === 'en'
                  ? 'This is how text will appear in your selected language.'
                  : 'ጽሑፍ በመረጡት ቋንቋ እንዴት እንደሚታይ ይህ ነው።'}
              </Text>
            </View>
          </View>

          {/* Note about app restart */}
          <View className="p-4 mt-2">
            <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={20} color="#B45309" />
                <Text className="flex-1 ml-2 text-yellow-800 dark:text-yellow-200 text-xs">
                  {translate('language_change_note' as any)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default LanguageScreen;
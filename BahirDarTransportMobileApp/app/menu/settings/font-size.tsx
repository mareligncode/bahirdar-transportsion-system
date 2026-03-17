import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenLayout } from '../../../components/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useFont } from '@/context/FontContext';
import { AppText } from '@/components/common/AppText';

interface FontSizeOption {
  scale: number;
  name: 'small' | 'normal' | 'large' | 'extra-large';
  label: string;
}

const FontSizeScreen = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { fontScale, setFontScale, isLoading } = useFont();

  const getFontSizes = useCallback((): FontSizeOption[] => [
    { scale: 0.8, name: 'small', label: translate('small' as any) },
    { scale: 1, name: 'normal', label: translate('medium' as any) },
    { scale: 1.2, name: 'large', label: translate('large' as any) },
    { scale: 1.4, name: 'extra-large', label: translate('extraLarge' as any) },
  ], [translate]);

  const handleFontSizeChange = (value: number) => {
    const roundedValue = Math.round(value * 10) / 10;
    const fontSizesList = getFontSizes();
    const matchingSize = fontSizesList.find(
      (s) => Math.abs(s.scale - roundedValue) < 0.1
    ) || fontSizesList[1];

    setFontScale(matchingSize.scale);
  };

  const fontSizes = getFontSizes();


  return (
    <ScreenLayout>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold" color="textPrimary">
            {translate('fontSize' as any)}
          </AppText>
        </View>

        <ScrollView className="flex-1">
          {/* Slider Section */}
          <View className="p-6">
            <AppText color="textSecondary" className="text-center mb-4">
              {translate('adjust_font_size' as any)}
            </AppText>

            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0.8}
              maximumValue={1.4}
              step={0.2}
              value={fontScale}
              onValueChange={handleFontSizeChange}
              minimumTrackTintColor="#2563EB"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#2563EB"
              disabled={isLoading}
            />

            <View className="flex-row justify-between mt-4 px-2">
              {fontSizes.map((size) => (
                <TouchableOpacity
                  key={size.name}
                  onPress={() => handleFontSizeChange(size.scale)}
                  className="items-center"
                  disabled={isLoading}
                >
                  <View
                    className={`w-3 h-3 rounded-full ${Math.abs(fontScale - size.scale) < 0.1
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  />
                  <AppText variant="caption" color="textTertiary" className="mt-2 text-center">
                    {size.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <AppText variant="bodySmall" color="textTertiary" className="text-center mt-4">
              {translate('currentScale' as any)}: {Math.round(fontScale * 100)}%
            </AppText>
          </View>

          {/* Preview Section */}
          <View className="px-4">
            <AppText weight="medium" color="textPrimary" className="mb-3">
              {translate('preview' as any)}
            </AppText>

            <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              {/* Title Preview */}
              <AppText
                variant="h3"
                className="mb-3"
              >
                {translate('trip_details' as any)}
              </AppText>

              {/* Body Text Preview */}
              <AppText
                variant="bodyMedium"
                className="text-gray-700 dark:text-gray-300 mb-4"
              >
                {translate('app_description' as any)}
              </AppText>

              {/* Small Text Preview */}
              <View className="flex-row justify-between items-center">
                <AppText
                  variant="bodySmall"
                  className="text-gray-500 dark:text-gray-400"
                >
                  {translate('passenger' as any)}: {translate('sample_name' as any)}
                </AppText>
                <AppText
                  variant="bodySmall"
                  className="text-gray-500 dark:text-gray-400"
                >
                  {translate('time' as any)}: 08:00 AM
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default FontSizeScreen;
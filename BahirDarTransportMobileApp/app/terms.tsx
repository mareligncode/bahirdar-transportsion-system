import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '../components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../context/ThemeContext';

export default function TermsOfService() {
  const { isDark, colors } = useTheme();
  const { translate: t } = useTranslation();
  
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className={`mb-6 w-10 h-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center justify-center`}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <AppText variant="h1" weight="bold" color="textPrimary" className="mb-6">
            {t('terms_of_service_title')}
          </AppText>
          
          <View className="space-y-4">
            <AppText variant="bodyLarge" weight="medium" color="textSecondary">
              {t('terms_last_updated', { date: lastUpdated })}
            </AppText>
            
            <AppText color="textSecondary">
              {t('terms_intro')}
            </AppText>
            
            <View>
              <AppText variant="h3" weight="bold" color="textPrimary" className="mb-2">
                {t('terms_section_1_title')}
              </AppText>
              <AppText color="textSecondary">
                {t('terms_section_1_content')}
              </AppText>
            </View>
            
            <View>
              <AppText variant="h3" weight="bold" color="textPrimary" className="mb-2">
                {t('terms_section_2_title')}
              </AppText>
              <AppText color="textSecondary">
                {t('terms_section_2_content')}
              </AppText>
            </View>
            
            <AppText variant="caption" color="textTertiary" className="mt-8">
              {t('terms_consent')}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
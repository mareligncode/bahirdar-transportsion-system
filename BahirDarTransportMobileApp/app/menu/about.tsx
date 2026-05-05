import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  Shield,
  Heart,
  ArrowLeft,
  Mail
} from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';

export default function AboutScreen() {
  const { translate } = useTranslation();
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const appVersion = '1.0.0';
  const buildNumber = '20250222';

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      {/* Header */}
      <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 py-4 border-b`}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color={isDark ? colors.textSecondary : colors.gray900} />
          </TouchableOpacity>
          <AppText variant="h2" weight="bold" color="textPrimary">{translate('about_title' as any)}</AppText>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* App Icon */}
        <View className="items-center mb-8">
          <View className={`w-24 h-24 ${isDark ? 'bg-blue-700' : 'bg-blue-600'} rounded-2xl items-center justify-center mb-4`}>
            <AppText weight="bold" color="white" className="text-4xl">B</AppText>
          </View>
          <AppText variant="h1" weight="bold" color="textPrimary">{translate('app_name' as any)}</AppText>
          <AppText color="textSecondary" className="mt-1">{translate('version' as any)} {appVersion} ({buildNumber})</AppText>
        </View>

        {/* App Description */}
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-5 rounded-xl border mb-6`}>
          <AppText color="textPrimary" className="leading-6">
            {translate('app_desc' as any)}
          </AppText>
        </View>

        {/* Quick Links */}
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden mb-6`}>
          <TouchableOpacity
            onPress={() => router.push('/terms')}
            className={`flex-row items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <FileText size={20} color={isDark ? colors.textSecondary : colors.gray600} />
            <AppText className="flex-1 ml-3" color="textPrimary">{translate('terms_of_service' as any)}</AppText>
            <AppText color="textTertiary">›</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/privacy')}
            className={`flex-row items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <Shield size={20} color={isDark ? colors.textSecondary : colors.gray600} />
            <AppText weight="medium" className="flex-1 ml-3" color="textPrimary">{translate('privacy_policy' as any)}</AppText>
            <AppText color="textTertiary">›</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => openLink('mailto:support@bahirdartransport.com')}
            className="flex-row items-center p-4"
          >
            <Mail size={20} color={isDark ? colors.textSecondary : colors.gray600} />
            <AppText className="flex-1 ml-3" color="textPrimary">{translate('contact_support' as any)}</AppText>
            <AppText color="textTertiary">›</AppText>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-5 rounded-xl border`}>
          <AppText weight="semibold" className="mb-3" color="textPrimary">{translate('made_with' as any)}</AppText>
          <View className="flex-row items-center">
            <Heart size={16} color="#ef4444" fill="#ef4444" />
            <AppText color="textSecondary" className="ml-2">{translate('in_bahirdar' as any)}</AppText>
          </View>
          <AppText variant="caption" color="textTertiary" className="mt-4 text-center">
            {translate('all_rights_reserved' as any)}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
import React from 'react';
import {
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';

const MenuScreen = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();

  const MenuItem = ({
    icon,
    title,
    description,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center py-4 px-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
    >
      <Ionicons name={icon} size={24} color={isDark ? colors.textSecondary : "#4B5563"} />
      <View className="flex-1 ml-3">
        <AppText weight="medium" color={isDark ? 'white' : 'textPrimary'}>{title}</AppText>
        {description && (
          <AppText variant="bodySmall" color="textSecondary" className="mt-0.5">
            {description}
          </AppText>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDark ? colors.textTertiary : "#9CA3AF"} />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="px-4 py-6">
          <AppText variant="h1" weight="bold" color="textPrimary">
            {translate('menu_title')}
          </AppText>
        </View>

        <ScrollView className="flex-1">
          <MenuItem
            icon="settings-outline"
            title={translate('settings')}
            description={translate('menu_subtitle')}
            onPress={() => router.push('/menu/settings')}
          />
          <MenuItem
            icon="help-circle-outline"
            title={translate('support')}
            description={translate('help_center_desc')}
            onPress={() => router.push('/menu/support')}
          />
          <MenuItem
            icon="information-circle-outline"
            title={translate('about')}
            description={translate('app_info')}
            onPress={() => router.push('/menu/about')}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenLayout>
  );
};

export default MenuScreen;
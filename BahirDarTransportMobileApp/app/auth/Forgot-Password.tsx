import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';
import { Loader } from '@/components/common/Loader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Mail, ArrowLeft, CheckCircle, ExternalLink, Smartphone, Info } from 'lucide-react-native';

const forgotPasswordSchema = z.object({
  email: z.string()
    .email('email_invalid')
    .min(1, 'email_required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword: forgotPasswordFn } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setSubmittedEmail(data.email);

    try {
      const result = await forgotPasswordFn(data.email);
      if (result.success || result.message) {
        // According to the backend response, even if the email doesn't exist, it returns success
        router.push({
          pathname: '/auth/reset-password',
          params: { email: data.email }
        });
      }
    } catch (error: any) {
      Alert.alert(translate('error'), error.message || translate('something_went_wrong'));
    } finally {
      setLoading(false);
    }
  };

  const openEmailApp = () => {
    Linking.openURL('mailto:').catch(() => {
      Alert.alert(translate('error'), translate('unable_open_email'));
    });
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message={translate('sending_instructions')} />
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 40
          }}
        >
          <View className="flex-1 items-center justify-center px-6 py-8">

            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
                <CheckCircle size={48} color="#10B981" />
              </View>

              <AppText variant="h2" weight="bold" className={`${isDark ? 'text-white' : 'text-gray-900'} text-center`}>
                {translate('check_email')}
              </AppText>
              <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mt-2`}>
                {translate('sent_instructions')}
              </AppText>
              <AppText variant="h3" weight="semibold" className="text-blue-600 mt-1">
                {submittedEmail}
              </AppText>
            </View>

            <View className="w-full bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
              <View className="flex-row items-center mb-3">
                <Smartphone size={20} color="#3B82F6" />
                <AppText variant="h3" weight="bold" className="text-blue-800 ml-2">
                  📱 {translate('mobile_users')}
                </AppText>
              </View>

              <View className="space-y-3">
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <AppText weight="bold" variant="bodySmall" className="text-blue-800">1</AppText>
                  </View>
                   <AppText className="text-blue-800 flex-1">
                    {translate('step_1')}
                  </AppText>
                </View>

                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <AppText weight="bold" variant="bodySmall" className="text-blue-800">2</AppText>
                  </View>
                   <AppText className="text-blue-800 flex-1">
                    {translate('step_2')}
                  </AppText>
                </View>

                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <AppText weight="bold" variant="bodySmall" className="text-blue-800">3</AppText>
                  </View>
                   <AppText className="text-blue-800 flex-1">
                    {translate('step_3')}
                  </AppText>
                </View>

                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <AppText weight="bold" variant="bodySmall" className="text-blue-800">4</AppText>
                  </View>
                   <AppText className="text-blue-800 flex-1">
                    {translate('step_4')}
                  </AppText>
                </View>
              </View>

              <View className="mt-4 pt-3 border-t border-blue-200">
                <View className="flex-row items-center">
                  <Info size={16} color="#3B82F6" />
                  <AppText variant="bodySmall" className="text-blue-700 ml-2">
                    {translate('expo_go_note')}
                  </AppText>
                </View>
              </View>
            </View>

            <View className={`w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'} rounded-xl p-5 mb-6`}>
                <AppText variant="h3" weight="bold" className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                 💻 {translate('using_desktop')}
               </AppText>
                <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                 {translate('desktop_desc')}
               </AppText>
                <AppText variant="caption" className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                 {translate('desktop_note')}
               </AppText>
            </View>

            <View className="w-full space-y-3">
              <TouchableOpacity
                onPress={openEmailApp}
                className="w-full bg-blue-50 py-4 px-6 rounded-lg flex-row items-center justify-center border border-blue-200"
              >
                <ExternalLink size={20} color="#3B82F6" />
                 <AppText weight="semibold" className="text-blue-600 ml-2">
                  📧 {translate('open_email_app')}
                </AppText>
              </TouchableOpacity>

               <Button
                title={"← " + translate('back_to_login')}
                onPress={handleBackToLogin}
                variant="outline"
                size="large"
                className="w-full"
              />
            </View>

            <View className="mt-8 w-full">
              <TouchableOpacity
                onPress={() => setSubmitted(false)}
                className="items-center"
              >
                  <AppText weight="semibold" className="text-blue-600">
                   {translate('didnt_receive')}
                 </AppText>
              </TouchableOpacity>

                <AppText variant="caption" className="text-gray-400 text-center mt-4">
                 {translate('spam_note')}
               </AppText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: insets.bottom + 40
            }}
          >
            <View className="px-6 pt-4 pb-8">

              <View className="mb-8">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mb-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#3B82F6" />
                </TouchableOpacity>

                <View>
                    <AppText variant="h1" weight="bold" className="text-blue-600 mb-2">
                     {translate('reset_password_title')}
                   </AppText>
                   <AppText className="text-gray-600 text-base">
                     {translate('reset_password_sub')}
                   </AppText>
                </View>
              </View>

              <View className="space-y-6">
                <Controller
                  name="email"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                        <Input
                         label={translate('email_address')}
                         placeholder={translate('email_placeholder')}
                         value={value}
                         onChangeText={onChange}
                         onBlur={onBlur}
                         error={errors.email?.message ? translate(errors.email.message as any) : undefined}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        leftIcon={<Mail size={20} color="#6B7280" />}
                        className="bg-gray-50"
                      />

                       <View className="flex-row items-center mt-2">
                         <Info size={14} color="#6B7280" />
                          <AppText variant="caption" className="text-gray-500 ml-1">
                           {translate('spam_note')}
                         </AppText>
                       </View>
                    </View>
                  )}
                />

                 <View className="bg-blue-50 p-4 rounded-lg mt-2">
                    <AppText weight="semibold" className="text-blue-800 mb-2">
                     📱 {translate('how_it_works')}:
                   </AppText>
                   <AppText variant="bodySmall" className="text-blue-700 mb-1">
                     1. {translate('enter_email_step')}
                   </AppText>
                   <AppText variant="bodySmall" className="text-blue-700 mb-1">
                     2. {translate('click_link_step')}
                   </AppText>
                   <AppText variant="bodySmall" className="text-blue-700">
                     3. {translate('app_opens_step')}
                   </AppText>
                 </View>

                 <Button
                  title={translate('send_reset')}
                  onPress={handleSubmit(handleForgotPassword)}
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  size="large"
                  className="mt-4"
                  fullWidth
                />

                <View className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <View className="flex-row justify-center items-center">
                     <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                     {translate('already_have_account')}{' '}
                   </AppText>
                   <TouchableOpacity
                     onPress={() => router.back()}
                     activeOpacity={0.7}
                   >
                      <AppText weight="bold" className="text-blue-600">
                       {translate('sign_in')}
                     </AppText>
                   </TouchableOpacity>
                  </View>
                </View>

                 <TouchableOpacity className="items-center mt-4">
                    <AppText variant="bodySmall" className="text-gray-400">
                     {translate('need_help')}? {translate('contact_us')}
                   </AppText>
                 </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
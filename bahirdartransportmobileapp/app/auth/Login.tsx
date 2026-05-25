import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader } from '@/components/common/Loader';
import { useTheme } from '@/context/ThemeContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { validateLoginForm } from '@/utils/validations';
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { LoginFormData } from '@/types/auth';
import { AppText } from '@/components/common/AppText';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { login, isLoading: authLoading } = useAuth();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    clearErrors,
    trigger,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const handleLogin = async (data: LoginFormData) => {
    clearErrors();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const validationErrors = validateLoginForm(data);

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setFormError(field as keyof LoginFormData, { message });
        setFieldErrors(prev => ({ ...prev, [field]: message }));
      });
      return;
    }

    try {
      const result = await login({
        email: data.email,
        password: data.password
      });

      if (result.success) {
        setSuccess(translate('login_success'));

        setTimeout(() => {
          router.replace('/tabs/home');
        }, 1000);
      } else {
        throw new Error(result.message || translate('login_failed'));
      }
    } catch (err: any) {
      const errorMessage = err.message || translate('login_failed_desc');
      setError(errorMessage);

      if (errorMessage.includes('email') || errorMessage.includes('not found')) {
        setFormError('email', { message: translate('invalid_credentials') });
        setFieldErrors(prev => ({ ...prev, email: translate('invalid_credentials') }));
      } else if (errorMessage.includes('password')) {
        setFormError('password', { message: translate('invalid_credentials') });
        setFieldErrors(prev => ({ ...prev, password: translate('invalid_credentials') }));
      }
    }
  };

  const clearAllErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const loading = authLoading || isSubmitting;

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message={translate('signing_in')} />
        </View>
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
              paddingBottom: insets.bottom + 40
            }}
          >
            <View className="px-6 pt-4">
              <View className="mb-8">
                <TouchableOpacity
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/');
                    }
                  }}
                  className={`mb-6 w-10 h-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center justify-center`}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#3B82F6" />
                </TouchableOpacity>

                <View className="items-center mb-6">
                  <View className={`w-16 h-16 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-full items-center justify-center mb-4`}>
                    <View className={`w-12 h-12 bg-blue-600 rounded-lg items-center justify-center`}>
                      <AppText className="text-white font-bold text-xl">B</AppText>
                    </View>
                  </View>
                  <AppText variant="h1" weight="bold" className={`${isDark ? 'text-white' : 'text-gray-900'} mb-2 text-center`}>
                    {translate('welcome_back')}
                  </AppText>
                  <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                    {translate('sign_in_sub')}
                  </AppText>
                </View>
              </View>

              {success && (
                <Card className={`${isDark ? 'bg-green-950/20 border-green-900/50' : 'bg-green-50 border-green-200'} mb-6`}>
                  <View className="flex-row items-start">
                    <CheckCircle size={20} color="#10B981" style={{ marginTop: 2, marginRight: 12 }} />
                    <View className="flex-1">
                      <AppText weight="medium" className={isDark ? 'text-green-400' : 'text-green-700'}>{success}</AppText>
                    </View>
                  </View>
                </Card>
              )}

              {error && (
                <Card className={`${isDark ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200'} mb-6`}>
                  <View className="flex-row items-start">
                    <AlertCircle size={20} color="#EF4444" style={{ marginTop: 2, marginRight: 12 }} />
                    <View className="flex-1">
                      <AppText weight="medium" className={isDark ? 'text-red-400' : 'text-red-600'}>{translate('login_failed')}</AppText>
                      <AppText variant="bodySmall" className={isDark ? 'text-red-300/80' : 'text-red-600' + ' mt-1'}>{error}</AppText>
                    </View>
                  </View>
                </Card>
              )}

              <View className="mb-6">
                <Controller
                  name="email"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                      <Input
                        label={translate('email_address') + " *"}
                        placeholder="name@example.com"
                        value={value}
                        onChangeText={(text) => {
                          clearAllErrors();
                          onChange(text);
                          trigger('email');
                        }}
                        onBlur={onBlur}
                        error={errors.email?.message || fieldErrors.email}
                        leftIcon={<Mail size={20} color="#6B7280" />}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                        autoFocus
                      />
                    </View>
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                      <Input
                        label={translate('password_label') + " *"}
                        placeholder={translate('password_placeholder')}
                        value={value}
                        onChangeText={(text) => {
                          clearAllErrors();
                          onChange(text);
                          trigger('password');
                        }}
                        onBlur={onBlur}
                        error={errors.password?.message || fieldErrors.password}
                        leftIcon={<Lock size={20} color="#6B7280" />}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        rightIcon={
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            {showPassword ? (
                              <EyeOff size={20} color="#6B7280" />
                            ) : (
                              <Eye size={20} color="#6B7280" />
                            )}
                          </TouchableOpacity>
                        }
                      />
                    </View>
                  )}
                />
                <TouchableOpacity
                  onPress={() => router.push('/auth/Forgot-Password')}
                  className="self-end mb-6"
                  activeOpacity={0.7}
                >
                  <AppText variant="bodySmall" weight="medium" className="text-blue-600">
                    {translate('forgot_password_link')}
                  </AppText>
                </TouchableOpacity>
              </View>

              <Button
                title={translate('sign_in')}
                onPress={handleSubmit(handleLogin)}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="large"
                className="mb-6"
                fullWidth
              />
                <View className={`pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <View className="flex-row justify-center">
                  <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{translate('dont_have_account')} </AppText>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/Register')}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <AppText weight="bold" className="text-blue-600">{translate('sign_up')}</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
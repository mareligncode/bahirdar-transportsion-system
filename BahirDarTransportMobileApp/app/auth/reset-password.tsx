import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { AppText } from '@/components/common/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '@/lib/api/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/context/ThemeContext';
import { Loader } from '@/components/common/Loader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react-native';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'pass_req_min_6')
    .regex(/[a-z]/, 'lowercase_req')
    .regex(/[A-Z]/, 'uppercase_req')
    .regex(/[0-9]/, 'number_req')
    .regex(/[^a-zA-Z0-9]/, 'one_special'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "pass_mismatch",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    const extractToken = () => {
      console.log('🔐 Reset password params:', params);

      if (params.token) {
        setToken(params.token as string);
      } else {
        setTokenValid(false);
        setValidatingToken(false);
        setError(translate('invalid_link'));
      }
    };

    extractToken();
  }, [params]);
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setValidatingToken(false);
        return;
      }

      try {
        const result = await authAPI.validateResetToken(token);

        if (result.valid) {
          setTokenValid(true);
          setError('');
        } else {
          setTokenValid(false);
          setError(result.message || translate('invalid_link'));
        }
      } catch (err: any) {
        console.error('❌ Token validation error:', err);
        setTokenValid(false);
        const errorMessage = err.message || translate('val_token_failed');
        setError(errorMessage);
      } finally {
        setValidatingToken(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!token) {
        throw new Error('Reset token is missing');
      }

      const result = await authAPI.resetPassword(token, data.password);

      if (result.success) {
        setSuccess(result.message || translate('reset_success'));
        setTimeout(() => {
          router.replace('/auth/Login');
        }, 3000);
      } else {
        setError(result.message || translate('reset_failed'));
      }

    } catch (err: any) {

      const errorMessage = err.message || translate('something_went_wrong');
      setError(errorMessage);

      Alert.alert(translate('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '#EF4444', width: 0 };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

     const strengthMap = {
      0: { label: translate('strength_very_weak'), color: '#EF4444' },
      1: { label: translate('strength_weak'), color: '#F59E0B' },
      2: { label: translate('strength_fair'), color: '#F59E0B' },
      3: { label: translate('strength_good'), color: '#10B981' },
      4: { label: translate('strength_strong'), color: '#10B981' },
      5: { label: translate('strength_very_strong'), color: '#10B981' }
    };

    const width = (strength / 5) * 100;

    return {
      strength,
      label: strengthMap[strength as keyof typeof strengthMap]?.label || '',
      color: strengthMap[strength as keyof typeof strengthMap]?.color || '#EF4444',
      width
    };
  };

  const strength = getPasswordStrength(password || '');

  if (validatingToken) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <View className="items-center">
             <View className={`w-16 h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-4 animate-pulse`} />
            <AppText className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-base`}>{translate('validating_token')}</AppText>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  if (!tokenValid) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
             <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
              <AlertCircle size={40} color="#DC2626" />
            </View>
            <AppText variant="h2" weight="bold" className={`${isDark ? 'text-white' : 'text-gray-900'} mb-2 text-center`}>
              {translate('invalid_link')}
            </AppText>
            <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mb-6`}>
              {error || translate('invalid_link_desc')}
            </AppText>
             <Button
              title={translate('request_new_link')}
              onPress={() => router.replace('/auth/Forgot-Password')}
              variant="primary"
              size="large"
              fullWidth
              className="mt-2"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }
  if (success) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className="flex-1 px-6 justify-center">
          <View className="items-center">
             <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <CheckCircle size={40} color="#10B981" />
            </View>
            <AppText variant="h2" weight="bold" className={`${isDark ? 'text-white' : 'text-gray-900'} mb-2 text-center`}>
              {translate('reset_success')}
            </AppText>
            <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mb-4`}>
              {success}
            </AppText>
             <AppText variant="bodySmall" className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-center mb-8`}>
              {translate('redirecting_login')}
            </AppText>
             <Button
              title={translate('go_to_login')}
              onPress={() => router.replace('/auth/Login')}
              variant="primary"
              size="large"
              fullWidth
            />
          </View>
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
              flexGrow: 1,
              paddingBottom: insets.bottom + 20
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-6 pt-4">
              <View className="mb-8">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mb-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#3B82F6" />
                </TouchableOpacity>

                <View className="items-center mb-4">
                  <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <View className="w-16 h-16 bg-blue-600 rounded-lg items-center justify-center">
                      <AppText weight="bold" variant="h1" className="text-white">B</AppText>
                    </View>
                  </View>
                    <AppText variant="h1" weight="bold" className={`${isDark ? 'text-white' : 'text-gray-900'} mb-2 text-center`}>
                     {translate('reset_password_title')}
                   </AppText>
                   <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-base text-center`}>
                     {translate('new_password_prompt')}
                   </AppText>
                </View>
              </View>
              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex-row items-start">
                   <AlertCircle size={20} color="#DC2626" style={{ marginTop: 2 }} />
                   <View className="flex-1 ml-3">
                    <AppText weight="medium" className="text-red-600">{translate('error')}</AppText>
                    <AppText variant="bodySmall" className="text-red-600 mt-1">{error}</AppText>
                  </View>
                </View>
              ) : null}

              <View className="space-y-6">
                <Controller
                  name="password"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                       <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {translate('new_password')}
                      </Text>
                       <Input
                        placeholder={translate('password_placeholder')}
                        value={value}
                         onChangeText={(text) => {
                          onChange(text);
                          setError('');
                        }}
                        onBlur={onBlur}
                        error={errors.password?.message ? translate(errors.password.message as any) : undefined}
                        secureTextEntry={!showPassword}
                        leftIcon={<Lock size={20} color="#9CA3AF" />}
                        rightIcon={
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ?
                              <EyeOff size={20} color="#6B7280" /> :
                              <Eye size={20} color="#6B7280" />
                            }
                          </TouchableOpacity>
                        }
                        className="bg-white border border-gray-300"
                        editable={!loading}
                      />
                      {value ? (
                        <View className="mt-2">
                          <View className="flex-row justify-between mb-1">
                              <AppText variant="caption" className="text-gray-500">
                               {translate('password_strength')}:
                             </AppText>
                             <AppText variant="caption" weight="semibold" style={{ color: strength.color }}>
                               {strength.label}
                             </AppText>
                          </View>
                          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <View
                              style={{
                                width: `${strength.width}%`,
                                backgroundColor: strength.color,
                                height: '100%'
                              }}
                            />
                          </View>
                            <AppText variant="caption" className="text-gray-500 mt-2">
                             {translate('pass_min_6_desc')}
                           </AppText>
                         </View>
                       ) : (
                          <AppText variant="caption" className="text-gray-500 mt-2">
                           {translate('pass_min_6_desc')}
                         </AppText>
                       )}
                    </View>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                       <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {translate('confirm_new_password')}
                      </Text>
                       <Input
                        placeholder={translate('confirm_new_password_placeholder')}
                        value={value}
                        onChangeText={(text) => {
                          onChange(text);
                          setError('');
                        }}
                        onBlur={onBlur}
                        error={errors.confirmPassword?.message ? translate(errors.confirmPassword.message as any) : undefined}
                        secureTextEntry={!showConfirmPassword}
                        leftIcon={<Lock size={20} color="#9CA3AF" />}
                        rightIcon={
                          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ?
                              <EyeOff size={20} color="#6B7280" /> :
                              <Eye size={20} color="#6B7280" />
                            }
                          </TouchableOpacity>
                        }
                        className="bg-white border border-gray-300"
                        editable={!loading}
                      />
                    </View>
                  )}
                />
                 <View className="bg-blue-50 p-4 rounded-lg">
                  <AppText weight="semibold" className="text-blue-800 mb-2">
                    {translate('pass_requirements')}
                  </AppText>
                  <View className="space-y-1">
                    <AppText variant="bodySmall" className="text-blue-700">
                      {translate('pass_req_min_6')}
                    </AppText>
                    <AppText variant="bodySmall" className="text-blue-700">
                      {translate('pass_req_uppercase')}
                    </AppText>
                    <AppText variant="bodySmall" className="text-blue-700">
                      {translate('pass_req_lowercase')}
                    </AppText>
                    <AppText variant="bodySmall" className="text-blue-700">
                      {translate('pass_req_number')}
                    </AppText>
                    <AppText variant="bodySmall" className="text-blue-700">
                      {translate('pass_req_special')}
                    </AppText>
                  </View>
                </View>
                 <Button
                  title={loading ? translate('resetting') : translate('reset_password_title')}
                  onPress={handleSubmit(handleResetPassword)}
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  size="large"
                  fullWidth
                  className="mt-4"
                />
                 <TouchableOpacity
                   onPress={() => router.replace('/auth/Forgot-Password')}
                   className="mt-6 py-4"
                   disabled={loading}
                 >
                    <AppText weight="bold" className="text-blue-600 text-center">
                     {translate('request_new_reset_link')}
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
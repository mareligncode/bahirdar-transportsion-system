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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '@/lib/api/auth';
import { Loader } from '@/components/common/Loader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react-native';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
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
        setError('Invalid or missing reset token');
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
          setError(result.message || 'Invalid or expired reset token');
        }
      } catch (err: any) {
        console.error('❌ Token validation error:', err);
        setTokenValid(false);
        const errorMessage = err.message || 'Failed to validate reset token';
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
        setSuccess(result.message || 'Password has been reset successfully');
        setTimeout(() => {
          router.replace('/auth/Login');
        }, 3000);
      } else {
        setError(result.message || 'Failed to reset password');
      }

    } catch (err: any) {

      const errorMessage = err.message || 'Something went wrong. Please try again.';
      setError(errorMessage);

      Alert.alert('Error', errorMessage);
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
      0: { label: 'Very Weak', color: '#EF4444' },
      1: { label: 'Weak', color: '#F59E0B' },
      2: { label: 'Fair', color: '#F59E0B' },
      3: { label: 'Good', color: '#10B981' },
      4: { label: 'Strong', color: '#10B981' },
      5: { label: 'Very Strong', color: '#10B981' }
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
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <View className="items-center">
            <View className="w-16 h-16 bg-gray-200 rounded-full mb-4 animate-pulse" />
            <Text className="text-gray-600 text-base">Validating reset token...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  if (!tokenValid) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
              <AlertCircle size={40} color="#DC2626" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Invalid Reset Link
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </Text>
            <Button
              title="Request New Link"
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
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 px-6 justify-center">
          <View className="items-center">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <CheckCircle size={40} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Password Reset Successfully!
            </Text>
            <Text className="text-gray-600 text-center mb-4">
              {success}
            </Text>
            <Text className="text-gray-500 text-sm text-center mb-8">
              Redirecting to login page...
            </Text>
            <Button
              title="Go to Login Now"
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
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
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
                      <Text className="text-white font-bold text-2xl">B</Text>
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    Reset Password
                  </Text>
                  <Text className="text-gray-600 text-base text-center">
                    Enter your new password
                  </Text>
                </View>
              </View>
              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex-row items-start">
                  <AlertCircle size={20} color="#DC2626" style={{ marginTop: 2 }} />
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-red-600">Error</Text>
                    <Text className="text-sm text-red-600 mt-1">{error}</Text>
                  </View>
                </View>
              ) : null}

              <View className="space-y-6">
                <Controller
                  name="password"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </Text>
                      <Input
                        placeholder="Enter new password"
                        value={value}
                        onChangeText={(text) => {
                          onChange(text);
                          setError('');
                        }}
                        onBlur={onBlur}
                        error={errors.password?.message}
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
                            <Text className="text-xs text-gray-500">
                              Password strength:
                            </Text>
                            <Text style={{ color: strength.color }} className="text-xs font-semibold">
                              {strength.label}
                            </Text>
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
                          <Text className="text-xs text-gray-500 mt-2">
                            Must be at least 6 characters long
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-xs text-gray-500 mt-2">
                          Must be at least 6 characters long
                        </Text>
                      )}
                    </View>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </Text>
                      <Input
                        placeholder="Confirm new password"
                        value={value}
                        onChangeText={(text) => {
                          onChange(text);
                          setError('');
                        }}
                        onBlur={onBlur}
                        error={errors.confirmPassword?.message}
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
                  <Text className="text-blue-800 font-semibold mb-2">
                    Password Requirements:
                  </Text>
                  <View className="space-y-1">
                    <Text className="text-blue-700 text-sm">
                      ✓ At least 6 characters
                    </Text>
                    <Text className="text-blue-700 text-sm">
                      ✓ At least 1 uppercase letter
                    </Text>
                    <Text className="text-blue-700 text-sm">
                      ✓ At least 1 lowercase letter
                    </Text>
                    <Text className="text-blue-700 text-sm">
                      ✓ At least 1 number
                    </Text>
                    <Text className="text-blue-700 text-sm">
                      ✓ At least 1 special character
                    </Text>
                  </View>
                </View>
                <Button
                  title={loading ? 'Resetting...' : 'Reset Password'}
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
                  <Text className="text-blue-600 font-bold text-center">
                    Request a new reset link
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
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
import { Loader } from '@/components/common/Loader';
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

export default function Login() {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login, isLoading: authLoading } = useAuth();

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
        setSuccess('Login successful! Redirecting...');

        setTimeout(() => {
          router.replace('/tabs/home');
        }, 1000);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);

      if (errorMessage.includes('email') || errorMessage.includes('not found')) {
        setFormError('email', { message: 'Invalid email or password' });
        setFieldErrors(prev => ({ ...prev, email: 'Invalid email or password' }));
      } else if (errorMessage.includes('password')) {
        setFormError('password', { message: 'Invalid email or password' });
        setFieldErrors(prev => ({ ...prev, password: 'Invalid email or password' }));
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
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message="Signing in..." />
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
                  className="mb-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#3B82F6" />
                </TouchableOpacity>

                <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <View className="w-12 h-12 bg-blue-600 rounded-lg items-center justify-center">
                      <Text className="text-white font-bold text-xl">B</Text>
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    Welcome Back
                  </Text>
                  <Text className="text-gray-600 text-center">
                    Sign in to your account
                  </Text>
                </View>
              </View>

              {success && (
                <Card className="bg-green-50 border-green-200 mb-6">
                  <View className="flex-row items-start">
                    <CheckCircle size={20} color="#10B981" style={{ marginTop: 2, marginRight: 12 }} />
                    <View className="flex-1">
                      <Text className="font-medium text-green-700">{success}</Text>
                    </View>
                  </View>
                </Card>
              )}

              {error && (
                <Card className="bg-red-50 border-red-200 mb-6">
                  <View className="flex-row items-start">
                    <AlertCircle size={20} color="#EF4444" style={{ marginTop: 2, marginRight: 12 }} />
                    <View className="flex-1">
                      <Text className="font-medium text-red-600">Login failed</Text>
                      <Text className="text-sm text-red-600 mt-1">{error}</Text>
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
                        label="Email Address *"
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
                        label="Password *"
                        placeholder="Enter your password"
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
                  <Text className="text-blue-600 font-medium text-sm">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Sign In"
                onPress={handleSubmit(handleLogin)}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="large"
                className="mb-6"
                fullWidth
              />
              <View className="pt-6 border-t border-gray-200">
                <View className="flex-row justify-center">
                  <Text className="text-gray-600">Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/auth/Register')}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text className="text-blue-600 font-bold">Sign up</Text>
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
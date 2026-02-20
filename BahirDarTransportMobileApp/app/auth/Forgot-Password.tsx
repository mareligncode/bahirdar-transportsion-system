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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Mail, ArrowLeft, CheckCircle, ExternalLink, Smartphone, Info } from 'lucide-react-native';

// Zod Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
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
      console.log('📱 Forgot password request for:', data.email);
      
      // Show success screen immediately without waiting
      forgotPasswordFn(data.email)
        .then(result => {
          console.log('✅ Background API call completed:', result);
        })
        .catch(error => {
          console.error('❌ Background API call failed (user already sees success):', error);
        });
      
      // Show success screen immediately
      setSubmitted(true);
      
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      // Still show success screen
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const openEmailApp = () => {
    Linking.openURL('mailto:').catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message="Sending reset instructions..." />
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: insets.bottom + 40 
          }}
        >
          <View className="flex-1 items-center justify-center px-6 py-8">
            {/* Success Icon */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
                <CheckCircle size={48} color="#10B981" />
              </View>
              
              <Text className="text-2xl font-bold text-gray-900 text-center">
                Check Your Email
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                We've sent reset instructions to:
              </Text>
              <Text className="text-blue-600 font-semibold text-lg mt-1">
                {submittedEmail}
              </Text>
            </View>

            {/* Mobile App Instructions - PRIORITY */}
            <View className="w-full bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
              <View className="flex-row items-center mb-3">
                <Smartphone size={20} color="#3B82F6" />
                <Text className="text-blue-800 font-bold text-lg ml-2">
                  📱 Mobile App Users
                </Text>
              </View>
              
              <View className="space-y-3">
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <Text className="text-blue-800 font-bold text-sm">1</Text>
                  </View>
                  <Text className="text-blue-800 flex-1">
                    Open your email app
                  </Text>
                </View>
                
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <Text className="text-blue-800 font-bold text-sm">2</Text>
                  </View>
                  <Text className="text-blue-800 flex-1">
                    Find email from <Text className="font-bold">"Bahir Dar Transport System"</Text>
                  </Text>
                </View>
                
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <Text className="text-blue-800 font-bold text-sm">3</Text>
                  </View>
                  <Text className="text-blue-800 flex-1">
                    Tap <Text className="font-bold">"Open App to Reset Password"</Text> button
                  </Text>
                </View>
                
                <View className="flex-row items-start">
                  <View className="w-6 h-6 rounded-full bg-blue-200 items-center justify-center mr-2 mt-0.5">
                    <Text className="text-blue-800 font-bold text-sm">4</Text>
                  </View>
                  <Text className="text-blue-800 flex-1">
                    App will open automatically to reset your password
                  </Text>
                </View>
              </View>

              {/* Expo Go Note */}
              <View className="mt-4 pt-3 border-t border-blue-200">
                <View className="flex-row items-center">
                  <Info size={16} color="#3B82F6" />
                  <Text className="text-blue-700 text-sm ml-2">
                    Using Expo Go? Make sure it's installed on your device
                  </Text>
                </View>
              </View>
            </View>

            {/* Desktop/Web Fallback */}
            <View className="w-full bg-gray-50 rounded-xl p-5 mb-6">
              <Text className="text-gray-700 font-bold text-lg mb-3">
                💻 Using Desktop?
              </Text>
              <Text className="text-gray-600 mb-2">
                Click the web link in the email or copy/paste it in your browser.
              </Text>
              <Text className="text-gray-500 text-xs">
                Note: Desktop link will open web version
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="w-full space-y-3">
              <TouchableOpacity
                onPress={openEmailApp}
                className="w-full bg-blue-50 py-4 px-6 rounded-lg flex-row items-center justify-center border border-blue-200"
              >
                <ExternalLink size={20} color="#3B82F6" />
                <Text className="text-blue-600 font-semibold ml-2">
                  📧 Open Email App
                </Text>
              </TouchableOpacity>
              
              <Button
                title="← Back to Login"
                onPress={handleBackToLogin}
                variant="outline"
                size="large"
                className="w-full"
              />
            </View>

            {/* Didn't receive email? */}
            <View className="mt-8 w-full">
              <TouchableOpacity 
                onPress={() => setSubmitted(false)}
                className="items-center"
              >
                <Text className="text-blue-600 font-semibold">
                  Didn't receive email? Try again
                </Text>
              </TouchableOpacity>
              
              <Text className="text-gray-400 text-xs text-center mt-4">
                Check spam folder • Link expires in 15 minutes
              </Text>
            </View>
          </View>
        </ScrollView>
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
              paddingBottom: insets.bottom + 40 
            }}
          >
            <View className="px-6 pt-4 pb-8">
              {/* Header with Back Button */}
              <View className="mb-8">
                <TouchableOpacity 
                  onPress={() => router.back()}
                  className="mb-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#3B82F6" />
                </TouchableOpacity>
                
                <View>
                  <Text className="text-3xl font-bold text-blue-600 mb-2">
                    Reset Password
                  </Text>
                  <Text className="text-gray-600 text-base">
                    Enter your email address and we'll send you instructions to reset your password
                  </Text>
                </View>
              </View>

              {/* Form */}
              <View className="space-y-6">
                <Controller
                  name="email"
                  control={control}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View>
                      <Input
                        label="Email Address"
                        placeholder="your.email@example.com"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
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
                        <Text className="text-gray-500 text-xs ml-1">
                          We'll send a secure link that expires in 15 minutes
                        </Text>
                      </View>
                    </View>
                  )}
                />

                {/* Info Box */}
                <View className="bg-blue-50 p-4 rounded-lg mt-2">
                  <Text className="text-blue-800 font-semibold mb-2">
                    📱 How it works:
                  </Text>
                  <Text className="text-blue-700 text-sm mb-1">
                    1. Enter your email above
                  </Text>
                  <Text className="text-blue-700 text-sm mb-1">
                    2. Click the link in the email
                  </Text>
                  <Text className="text-blue-700 text-sm">
                    3. App opens → Create new password
                  </Text>
                </View>

                {/* Submit Button */}
                <Button
                  title="Send Reset Instructions"
                  onPress={handleSubmit(handleForgotPassword)}
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  size="large"
                  className="mt-4"
                  fullWidth
                />

                {/* Back to Login Link */}
                <View className="mt-8 pt-6 border-t border-gray-200">
                  <View className="flex-row justify-center items-center">
                    <Text className="text-gray-600">
                      Remember your password?{' '}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => router.back()}
                      activeOpacity={0.7}
                    >
                      <Text className="text-blue-600 font-bold">
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Help Link */}
                <TouchableOpacity className="items-center mt-4">
                  <Text className="text-gray-400 text-sm">
                    Need help? Contact Support
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
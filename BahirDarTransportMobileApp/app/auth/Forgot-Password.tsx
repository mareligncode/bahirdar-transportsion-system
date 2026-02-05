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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Mail, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react-native';

// Zod Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ GET AUTH FUNCTIONS
  const { forgotPassword: forgotPasswordFn } = useAuth();

  // React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
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
    const result = await forgotPasswordFn(data.email);
    
    if (result.success) {
      setSubmitted(true);
      Alert.alert(
        '✅ Reset Email Sent',
        'Check your email for password reset instructions.',
        [
          { 
            text: 'Open Email App', 
            onPress: () => {
              Linking.openURL('mailto:');
            }
          },
          { 
            text: 'OK', 
            style: 'default',
            onPress: () => router.back()
          },
        ]
      );
    } else {
      Alert.alert('Error', result.message || 'Failed to send reset email');
    }
  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    
    let errorMessage = error.message || 'Something went wrong. Please try again.';
    
    if (errorMessage.includes('Email not found')) {
      Alert.alert(
        'Email Not Found',
        'This email is not registered. Please check the email address or create a new account.',
        [
          {
            text: 'Create Account',
            onPress: () => router.push('/auth/Register'),
          },
          { text: 'Try Again' },
        ]
      );
    } else if (errorMessage.includes('Network') || errorMessage.includes('connect')) {
      errorMessage = 'Cannot connect to server. Please check your internet connection.';
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <Loader message="Sending reset instructions..." />;
  }

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
              <CheckCircle size={40} color="#10B981" />
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Check Your Email
            </Text>
            
            <Text className="text-gray-600 text-center mb-2">
              We've sent password reset instructions to:
            </Text>
            
            <Text className="text-blue-600 font-semibold text-lg mb-6">
              {submittedEmail}
            </Text>
            
            <View className="bg-blue-50 p-4 rounded-lg mb-6 w-full">
              <Text className="text-blue-800 font-semibold mb-2">
                📧 What to do next:
              </Text>
              <Text className="text-blue-700 text-sm mb-1">
                1. Open your email app
              </Text>
              <Text className="text-blue-700 text-sm mb-1">
                2. Look for "Bahir Dar Transport" email
              </Text>
              <Text className="text-blue-700 text-sm">
                3. Click the reset link (opens in browser)
              </Text>
            </View>
            
            <Button
              title="Back to Login"
              onPress={() => router.back()}
              variant="primary"
              size="large"
              className="w-full mb-4"
            />
            
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => Linking.openURL('mailto:')}
            >
              <ExternalLink size={16} color="#3B82F6" />
              <Text className="text-blue-600 font-semibold ml-2">
                Open Email App
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          >
            <View className="px-6 pt-4">
              {/* Header */}
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
                    Enter your email to receive reset instructions
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
                        placeholder="john@example.com"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        leftIcon={<Mail size={20} color="#6B7280" />}
                      />
                      
                      <Text className="text-gray-500 text-sm mt-2">
                        We'll send a reset link to your email
                      </Text>
                    </View>
                  )}
                />

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

                {/* Back to Login */}
                <View className="mt-8 pt-6 border-t border-gray-200">
                  <View className="flex-row justify-center">
                    <Text className="text-gray-600">Remember your password? </Text>
                    <TouchableOpacity 
                      onPress={() => router.back()}
                      activeOpacity={0.7}
                    >
                      <Text className="text-blue-600 font-bold">Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
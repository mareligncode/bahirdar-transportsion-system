// app/terms.tsx - Terms of Service Page
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function TermsOfService() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#3B82F6" />
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold text-gray-900 mb-6">
            Terms of Service
          </Text>
          
          {/* Content */}
          <View className="space-y-4">
            <Text className="text-gray-700 text-lg font-medium">
              Last Updated: {new Date().toLocaleDateString()}
            </Text>
            
            <Text className="text-gray-600">
              Welcome to BahirDar Transport! These Terms of Service govern your use of our mobile application and services.
            </Text>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                1. Acceptance of Terms
              </Text>
              <Text className="text-gray-600">
                By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                2. User Accounts
              </Text>
              <Text className="text-gray-600">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                3. Service Usage
              </Text>
              <Text className="text-gray-600">
                You agree to use our services only for lawful purposes and in accordance with these Terms. You must not misuse our services by introducing viruses, trojans, worms, or other malicious material.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                4. Booking and Payments
              </Text>
              <Text className="text-gray-600">
                All bookings are subject to availability. Payment must be completed to confirm your booking. Cancellation policies apply as specified during the booking process.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                5. Limitation of Liability
              </Text>
              <Text className="text-gray-600">
                BahirDar Transport shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                6. Changes to Terms
              </Text>
              <Text className="text-gray-600">
                We reserve the right to modify or replace these Terms at any time. We will provide notice of significant changes through our application or via email.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                7. Contact Information
              </Text>
              <Text className="text-gray-600">
                If you have any questions about these Terms, please contact us at support@bahirdartransport.com
              </Text>
            </View>
            
            <Text className="text-gray-500 text-sm mt-8">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
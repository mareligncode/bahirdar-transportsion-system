// app/privacy.tsx - Privacy Policy Page
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PrivacyPolicy() {
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
            Privacy Policy
          </Text>
          
          {/* Content */}
          <View className="space-y-4">
            <Text className="text-gray-700 text-lg font-medium">
              Effective Date: {new Date().toLocaleDateString()}
            </Text>
            
            <Text className="text-gray-600">
              At BahirDar Transport, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </Text>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                1. Information We Collect
              </Text>
              <Text className="text-gray-600">
                We collect personal information that you voluntarily provide when you register, such as your name, email address, phone number, and payment information. We also collect usage data and device information automatically when you use our app.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                2. How We Use Your Information
              </Text>
              <Text className="text-gray-600">
                We use your information to: provide and maintain our services, process your bookings, send important notifications, improve our services, and comply with legal obligations.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                3. Data Security
              </Text>
              <Text className="text-gray-600">
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                4. Sharing Your Information
              </Text>
              <Text className="text-gray-600">
                We do not sell your personal information. We may share your information with trusted third parties who assist us in operating our app, conducting our business, or servicing you, as long as they agree to keep this information confidential.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                5. Your Rights
              </Text>
              <Text className="text-gray-600">
                You have the right to access, correct, or delete your personal information. You can update your information in the app settings or contact us directly.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                6. Cookies and Tracking
              </Text>
              <Text className="text-gray-600">
                We use cookies and similar tracking technologies to track activity on our app and hold certain information to improve user experience.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                7. Children's Privacy
              </Text>
              <Text className="text-gray-600">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                8. Changes to Privacy Policy
              </Text>
              <Text className="text-gray-600">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date.
              </Text>
            </View>
            
            <View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                9. Contact Us
              </Text>
              <Text className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at privacy@bahirdartransport.com
              </Text>
            </View>
            
            <Text className="text-gray-500 text-sm mt-8">
              By using our services, you consent to our Privacy Policy and agree to its terms.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
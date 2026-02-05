
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Search, 
  MapPin, 
  Clock, 
  Shield, 
  DollarSign, 
  Ticket, 
  Users, 
  Star, 
  Phone, 
  Headphones,
  UserCircle,
  Settings,
  Bell
} from 'lucide-react-native';

export default function LandingPage() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Hero Section */}
        <View className="relative">
          <Image
            source={require('@/assets/images/Screenshot 2026-02-04 000534.png')}
            className="w-full h-72"
            resizeMode="cover"
          />
          {/* Gradient Overlay */}
          <View className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
          
          {/* Content Overlay */}
          <View className="absolute inset-0 px-6 justify-center">
            <Text className="text-3xl font-bold text-white mb-4 leading-tight">
              Bahir Dar Transport
            </Text>
            <Text className="text-lg text-white/90 mb-8 leading-relaxed">
              Your trusted companion for hassle-free city transportation
            </Text>
            
            <TouchableOpacity
              onPress={() => router.push('/auth/Login')}
              className="bg-white py-4 rounded-xl active:opacity-90"
              activeOpacity={0.8}
            >
              <Text className="text-blue-600 text-center font-semibold text-lg">
                Start Your Journey
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Access - Matches your folder structure */}
        <View className="px-6 py-8 bg-blue-50">
          <Text className="text-xl font-bold text-gray-800 mb-6 text-center">
            Quick Access
          </Text>
          
          <View className="flex-row flex-wrap -mx-2">
            {[
              { 
                icon: Search, 
                title: 'Find Trips', 
                route: '/main/trips/search',
                color: 'bg-blue-100'
              },
              { 
                icon: MapPin, 
                title: 'Live Tracking', 
                route: '/main/tracking/live-tracking',
                color: 'bg-green-100'
              },
              { 
                icon: Ticket, 
                title: 'My Tickets', 
                route: '/main/tickets/index',
                color: 'bg-purple-100'
              },
              { 
                icon: Clock, 
                title: 'Bookings', 
                route: '/profile/bookings',
                color: 'bg-orange-100'
              },
              { 
                icon: DollarSign, 
                title: 'Payments', 
                route: '/main/payment/history',
                color: 'bg-red-100'
              },
              { 
                icon: Bell, 
                title: 'Notifications', 
                route: '/main/home/notification',
                color: 'bg-indigo-100'
              },
              { 
                icon: UserCircle, 
                title: 'Profile', 
                route: '/profile/index',
                color: 'bg-teal-100'
              },
              { 
                icon: Settings, 
                title: 'Settings', 
                route: '/settings/index',
                color: 'bg-gray-100'
              },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(action.route)}
                className="w-1/2 px-2 mb-4"
                activeOpacity={0.8}
              >
                <View className={`${action.color} p-5 rounded-xl items-center`}>
                  <action.icon size={24} color="#3B82F6" />
                  <Text className="text-gray-800 font-medium mt-2 text-center text-sm">
                    {action.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How It Works - Updated to match your screens */}
        <View className="px-6 py-12 bg-white">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-8">
            Travel in 4 Easy Steps
          </Text>
          
          <View className="space-y-4">
            {[
              { 
                icon: Search, 
                title: 'Search Trips', 
                desc: 'Browse available trips from your location',
                screen: '/main/trips/index'
              },
              { 
                icon: Users, 
                title: 'Book Seats', 
                desc: 'Select seats and confirm your booking',
                screen: '/main/trips/seat-selection'
              },
              { 
                icon: MapPin, 
                title: 'Track & Travel', 
                desc: 'Live tracking and digital ticket access',
                screen: '/main/tracking/live-tracking'
              },
              { 
                icon: DollarSign, 
                title: 'Easy Payment', 
                desc: 'Secure payment with multiple options',
                screen: '/main/payment/checkout'
              },
            ].map((step, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(step.screen)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                    <step.icon size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">{step.title}</Text>
                    <Text className="text-gray-600 text-sm">{step.desc}</Text>
                  </View>
                  <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features - Matches your app sections */}
        <View className="px-6 py-12 bg-gray-50">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-8">
            Complete Travel Solution
          </Text>
          
          <View className="space-y-6">
            {[
              {
                icon: Ticket,
                title: 'Digital Tickets',
                desc: 'Access all your tickets in one place, generate QR codes',
                screen: '/main/tickets/index'
              },
              {
                icon: Shield,
                title: 'Safe Travel',
                desc: 'Verified drivers, emergency contacts, trip sharing',
                screen: '/main/support/help'
              },
              {
                icon: DollarSign,
                title: 'Payment History',
                desc: 'Track all your transactions and download receipts',
                screen: '/main/payment/history'
              },
              {
                icon: Users,
                title: 'Booking Management',
                desc: 'View, cancel or reschedule your bookings easily',
                screen: '/main/booking/index'
              },
            ].map((feature, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(feature.screen)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-start bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4 flex-shrink-0">
                    <feature.icon size={24} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800 mb-1">
                      {feature.title}
                    </Text>
                    <Text className="text-gray-600 leading-relaxed">
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Section - Direct links to your support screens */}
        <View className="px-6 py-12 bg-white">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
            Need Assistance?
          </Text>
          
          <View className="flex-row flex-wrap -mx-2 mb-6">
            {[
              {
                icon: Phone,
                title: 'Contact Us',
                route: '/main/support/contact',
                color: 'bg-blue-100'
              },
              {
                icon: Headphones,
                title: 'Help Center',
                route: '/main/support/help',
                color: 'bg-green-100'
              },
              {
                icon: Star,
                title: 'Feedback',
                route: '/main/support/feedback',
                color: 'bg-purple-100'
              },
              {
                icon: Shield,
                title: 'Safety',
                route: '/main/support/help',
                color: 'bg-orange-100'
              },
            ].map((support, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(support.route)}
                className="w-1/2 px-2 mb-4"
                activeOpacity={0.8}
              >
                <View className={`${support.color} p-5 rounded-xl items-center`}>
                  <support.icon size={24} color="#3B82F6" />
                  <Text className="text-gray-800 font-medium mt-2 text-center text-sm">
                    {support.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/auth/Register')}
            className="bg-blue-600 py-4 rounded-xl active:opacity-90"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Create Free Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Sections Preview */}
        <View className="px-6 py-12 bg-blue-50">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
            Everything You Need
          </Text>
          
          <View className="space-y-4">
            {[
              'Trips & Booking Management',
              'Live Vehicle Tracking',
              'Digital Ticket System',
              'Secure Payment Gateway',
              'Booking History & Receipts',
              'Profile & Settings',
              '24/7 Customer Support',
              'Safety & Emergency Features',
            ].map((feature, index) => (
              <View key={index} className="flex-row items-center">
                <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center mr-3">
                  <Text className="text-white text-xs">✓</Text>
                </View>
                <Text className="text-gray-700 flex-1">{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Final CTA */}
        <View className="px-6 py-12 bg-blue-600">
          <View className="items-center">
            <MapPin size={48} color="white" />
            <Text className="text-2xl font-bold text-white text-center mt-4 mb-3">
              Ready to Explore Bahir Dar?
            </Text>
            <Text className="text-white/90 text-center mb-8">
              Join thousands of satisfied passengers
            </Text>
            
            <View className="flex-row space-x-4 w-full max-w-xs">
              <TouchableOpacity
                onPress={() => router.push('/auth/Login')}
                className="bg-white py-3 px-6 rounded-xl flex-1 active:opacity-90"
                activeOpacity={0.8}
              >
                <Text className="text-blue-600 font-bold text-center">
                  Sign In
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push('/auth/Register')}
                className="bg-transparent border-2 border-white py-3 px-6 rounded-xl flex-1 active:opacity-90"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-center">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text className="text-white/70 text-center mt-6 text-sm">
              Free to use • No hidden charges
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

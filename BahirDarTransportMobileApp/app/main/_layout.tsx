// app/main/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { 
  Home, 
  MapPin, 
  Ticket, 
  CreditCard,
  MessageSquare,
  Bell,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function MainLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
          headerTitle: 'Dashboard',
          headerRight: () => (
            <Bell size={24} color="#FFFFFF" style={{ marginRight: 15 }} />
          ),
        }}
      />

      {/* Trips Tab */}
      <Tabs.Screen
        name="trips/index"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <MapPin size={size} color={color} />
          ),
          headerTitle: 'Find Trips',
        }}
      />

      {/* Tickets Tab */}
      <Tabs.Screen
        name="tickets/index"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size }) => (
            <Ticket size={size} color={color} />
          ),
          headerTitle: 'My Tickets',
        }}
      />

      {/* Payments Tab */}
      <Tabs.Screen
        name="payment/index"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
          headerTitle: 'Payment History',
        }}
      />

      {/* Support Tab */}
      <Tabs.Screen
        name="support/index"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
          headerTitle: 'Help & Support',
        }}
      />

      {/* Hidden screens (not in tab bar) */}
      <Tabs.Screen
        name="home/notification"
        options={{
          href: null, // Hide from tab bar
          headerTitle: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="trips/search"
        options={{
          href: null,
          headerTitle: 'Search Trips',
        }}
      />
      <Tabs.Screen
        name="trips/[id]"
        options={{
          href: null,
          headerTitle: 'Trip Details',
        }}
      />
      <Tabs.Screen
        name="trips/seat-selection"
        options={{
          href: null,
          headerTitle: 'Select Seat',
        }}
      />
      <Tabs.Screen
        name="booking/index"
        options={{
          href: null,
          headerTitle: 'Booking',
        }}
      />
      <Tabs.Screen
        name="booking/[id]"
        options={{
          href: null,
          headerTitle: 'Booking Details',
        }}
      />
      <Tabs.Screen
        name="booking/cancel-reschedule"
        options={{
          href: null,
          headerTitle: 'Modify Booking',
        }}
      />
      <Tabs.Screen
        name="payment/checkout"
        options={{
          href: null,
          headerTitle: 'Checkout',
        }}
      />
      <Tabs.Screen
        name="payment/history"
        options={{
          href: null,
          headerTitle: 'Payment History',
        }}
      />
      <Tabs.Screen
        name="payment/success"
        options={{
          href: null,
          headerTitle: 'Payment Successful',
        }}
      />
      <Tabs.Screen
        name="tickets/[id]"
        options={{
          href: null,
          headerTitle: 'Ticket Details',
        }}
      />
      <Tabs.Screen
        name="tracking/live-tracking"
        options={{
          href: null,
          headerTitle: 'Live Tracking',
        }}
      />
      <Tabs.Screen
        name="support/contact"
        options={{
          href: null,
          headerTitle: 'Contact Support',
        }}
      />
      <Tabs.Screen
        name="support/feedback"
        options={{
          href: null,
          headerTitle: 'Feedback',
        }}
      />
      <Tabs.Screen
        name="support/help"
        options={{
          href: null,
          headerTitle: 'Help Center',
        }}
      />
    </Tabs>
  );
}
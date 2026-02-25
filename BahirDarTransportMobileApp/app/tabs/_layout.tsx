// app/tabs/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { BottomTab } from '@/components/layout/BottomTab';

export default function TabsLayout() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return <Loader message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}
      >
        {/* Home has its own drawer layout - using index path for file-based routing */}
        <Tabs.Screen
          name="home/index"
          options={{
            title: 'Home',
            href: '/tabs/home',
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trips',
            href: '/tabs/trips',
          }}
        />
        <Tabs.Screen
          name="tickets/index"
          options={{
            title: 'Tickets',
            href: '/tabs/tickets',
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            href: '/tabs/profile',
          }}
        />
      </Tabs>
      <BottomTab />
    </>
  );
}

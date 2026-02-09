import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { BottomTab } from '@/components/layout/BottomTab';

export default function TabsLayout() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  // Show loader while checking auth
  if (authLoading) {
    return <Loader message="Loading..." />;
  }

  // Redirect will be handled by app/_layout.tsx, but we can add a fallback
  if (!isAuthenticated) {
    return null; // app/_layout.tsx will redirect
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none', // We use our custom BottomTab component
          },
        }}
      >
        {/* Tab Screens */}
        <Tabs.Screen 
          name="home/index" 
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen 
          name="trips/index" 
          options={{
            title: 'Trips',
          }}
        />
        <Tabs.Screen 
          name="tickets/index" 
          options={{
            title: 'Tickets',
          }}
        />
        <Tabs.Screen 
          name="profile/index" 
          options={{
            title: 'Profile',
          }}
        />

        {/* Add missing tab screens if they exist */}
        <Tabs.Screen name="trips/search" />
        <Tabs.Screen name="trips/[id]" />
        <Tabs.Screen name="tickets/[id]" />
      </Tabs>
      <BottomTab />
    </>
  );
}
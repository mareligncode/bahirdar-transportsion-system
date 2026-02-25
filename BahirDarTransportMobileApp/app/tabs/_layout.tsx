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
        {/* Tab Screens */}
        <Tabs.Screen 
          name="home" 
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen 
          name="trips" 
          options={{
            title: 'Trips',
          }}
        />
        <Tabs.Screen 
          name="tickets" 
          options={{
            title: 'Tickets',
          }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
      <BottomTab />
    </>
  );
}
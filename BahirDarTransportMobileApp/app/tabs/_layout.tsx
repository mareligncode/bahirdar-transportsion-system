import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';
import { BottomTab } from '@/components/layout/BottomTab';
import { useTranslation } from '@/hooks/useTranslation';

export default function TabsLayout() {
  const { translate } = useTranslation();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return <Loader message={translate('loading')} />;
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
            title: translate('home'),
            href: '/tabs/home',
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: translate('trips'),
            href: '/tabs/trips',
          }}
        />
        <Tabs.Screen
          name="tickets/index"
          options={{
            title: translate('tickets'),
            href: '/tabs/tickets',
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: translate('profile'),
            href: '/tabs/profile',
          }}
        />
      </Tabs>
      <BottomTab />
    </>
  );
}

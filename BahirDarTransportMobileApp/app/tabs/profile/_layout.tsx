// BahirDarTransportMobileApp/app/profile/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { Header } from '@/components/layout/Header';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="bookings" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
// app/(screens)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function ScreensLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: '#f8fafc',
          },
        }}
      >
        {/* Notification Screen */}
        <Stack.Screen
          name="notification"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        {/* Booking Screens */}
        <Stack.Screen
          name="booking/index"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="booking/confirmation"
          options={{
            animation: 'fade',
            gestureEnabled: false, // Prevent going back from confirmation
          }}
        />

        {/* Payment Screens */}
        <Stack.Screen
          name="payment/checkout"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="payment/history"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="payment/success"
          options={{
            animation: 'fade',
            gestureEnabled: false, // Prevent going back from success
          }}
        />

        {/* Catch-all for any unmatched routes */}
        <Stack.Screen
          name="*"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </View>
  );
}
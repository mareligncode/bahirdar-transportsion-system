import { Stack } from 'expo-router';

export default function BookingLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: true,
          headerTitle: 'My Bookings',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: true,
          headerTitle: 'Booking Details',
        }} 
      />
      <Stack.Screen 
        name="cancel-reschedule" 
        options={{ 
          headerShown: true,
          headerTitle: 'Modify Booking',
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}
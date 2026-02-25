// app/tabs/trips/_layout.tsx
import { Stack } from 'expo-router';

export default function TripsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="search" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="seat-selection" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}
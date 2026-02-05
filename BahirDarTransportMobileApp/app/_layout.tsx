// app/_layout.tsx - SIMPLIFIED VERSION
import '../global.css'; // ← MAKE SURE THIS EXISTS
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/Login" />
        <Stack.Screen name="auth/Register" />
        <Stack.Screen name="auth/Forgot-Password" />
      </Stack>
    </SafeAreaProvider>
  );
}


// app/menu/_layout.tsx
import { Stack } from 'expo-router';

export default function MenuLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Menu Main */}
      <Stack.Screen name="index" />
      
      {/* Settings Group - using full path for file-based routing */}
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy-security" />
      
      {/* Support Group */}
      <Stack.Screen name="support/index" />
      <Stack.Screen name="support/contact" />
      <Stack.Screen name="support/feedback" />
      <Stack.Screen name="support/help" />
      
      {/* About - Top Level */}
      <Stack.Screen name="about" />
    </Stack>
  );
}

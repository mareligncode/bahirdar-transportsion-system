import { Stack } from 'expo-router';

export default function MenuLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy-security" />

      <Stack.Screen name="support/index" />
      <Stack.Screen name="support/contact" />
      <Stack.Screen name="support/feedback" />
      <Stack.Screen name="support/help" />

      <Stack.Screen name="about" />
    </Stack>
  );
}

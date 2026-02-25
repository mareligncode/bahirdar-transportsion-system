// app/(screens)/booking/_layout.tsx
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/colors';

export default function BookingLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.gray900,
        },
        headerTintColor: COLORS.primary,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
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
        name="[id]"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="passenger-details"
        options={{
          headerShown: true,
          title: 'Passenger Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.gray700} />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="cancel"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Cancel Booking',
          headerLeft: () => null,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 mr-2"
            >
              <Ionicons name="close" size={24} color={COLORS.gray700} />
            </TouchableOpacity>
          ),
          gestureEnabled: true,
          gestureDirection: 'vertical',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
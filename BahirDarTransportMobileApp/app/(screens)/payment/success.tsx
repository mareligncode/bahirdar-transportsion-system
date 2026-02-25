// (screens)/payment/success.tsx - Update with proper navigation
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Bus, Receipt } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const handleViewTicket = () => {
    router.replace({
      pathname: '/(screens)/booking/confirmation',
      params: { bookingId, success: 'true' }
    });
  };

  const handleBookAnother = () => {
    router.push('/tabs/trips');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ConfettiCannon
        count={200}
        origin={{ x: 200, y: 0 }}
        fadeOut={true}
        autoStart={true}
        colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
      />

      <View className="flex-1 justify-center items-center p-6">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
          <CheckCircle size={48} color="#16a34a" />
        </View>

        <Text className="text-2xl font-bold text-gray-800 text-center">
          Payment Successful!
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Your booking has been confirmed. Check your email for the ticket.
        </Text>

        <View className="w-full mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <View className="flex-row items-center gap-2">
            <Receipt size={20} color="#3b82f6" />
            <Text className="font-semibold text-blue-600">
              Booking ID: {bookingId?.slice(-8)}
            </Text>
          </View>
        </View>

        <View className="w-full mt-8 gap-3">
          <TouchableOpacity
            onPress={handleViewTicket}
            className="py-4 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Receipt size={20} color="white" />
            <Text className="text-white font-semibold">View Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBookAnother}
            className="py-4 bg-white border border-gray-300 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Bus size={20} color="#4b5563" />
            <Text className="text-gray-700 font-semibold">Book Another Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
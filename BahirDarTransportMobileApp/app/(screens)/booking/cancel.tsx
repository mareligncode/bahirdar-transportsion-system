// app/(screens)/booking/cancel.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBooking } from '../../../hooks/useBooking';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Booking } from '../../../types/booking';
import { Trip } from '../../../types/trip';
import { COLORS } from '../../../constants/colors';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';

export default function CancelBookingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { getBookingById, cancelBooking, loading } = useBooking();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
      if (data && typeof data.tripID === 'object') {
        setTrip(data.tripID as Trip);
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setCancelling(true);
    const success = await cancelBooking(booking._id, cancellationReason);
    setCancelling(false);
    
    if (success) {
      Alert.alert(
        'Booking Cancelled',
        'Your booking has been cancelled successfully. Refund will be processed within 5-7 business days.',
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              router.dismissAll();
              router.push('/(screens)/booking');
            }
          }
        ]
      );
    }
  };

  const isCancellable = booking?.status && 
    ['confirmed', 'pending'].includes(booking.status.toLowerCase());

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking || !trip) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
          <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">Booking Not Found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isCancellable) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-yellow-100 p-4 rounded-full mb-4">
            <Ionicons name="information-circle" size={48} color="#f59e0b" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Cannot Cancel</Text>
          <Text className="text-gray-500 text-center mb-6">
            This booking cannot be cancelled because it is {booking.status}.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="bg-white p-6 rounded-xl border border-gray-200 mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Cancel Booking
          </Text>
          <Text className="text-gray-500 mb-4">
            Please tell us why you're cancelling (optional)
          </Text>

          {/* Booking Summary */}
          <View className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text className="font-semibold text-gray-800 mb-1">
              {trip.origin?.stationName} → {trip.destination?.stationName}
            </Text>
            <Text className="text-sm text-gray-600 mb-2">
              {trip.departureTime ? formatDate(trip.departureTime) : 'N/A'} at{' '}
              {trip.departureTime ? formatTime(trip.departureTime) : 'N/A'}
            </Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Seats:</Text>
              <Text className="font-medium text-gray-800">
                {booking.seatNumbers?.join(', ')}
              </Text>
            </View>
          </View>

          <Input
            placeholder="Enter reason for cancellation"
            value={cancellationReason}
            onChangeText={setCancellationReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="min-h-[80px] mb-4"
          />

          {/* Cancellation Policy */}
          <View className="bg-yellow-50 p-4 rounded-lg mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text className="font-medium text-yellow-700 ml-2">Cancellation Policy</Text>
            </View>
            <Text className="text-sm text-yellow-600">
              • Full refund for cancellations made at least 2 hours before departure
              {'\n'}• No refund for cancellations within 2 hours of departure
              {'\n'}• Refund will be processed within 5-7 business days
            </Text>
          </View>

          {/* Refund Amount */}
          <View className="bg-gray-50 p-4 rounded-lg mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Booking Amount</Text>
              <Text className="font-semibold text-gray-800">
                {formatCurrency(booking.totalPrice || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Refund Amount</Text>
              <Text className="font-bold text-blue-600 text-lg">
                {formatCurrency(booking.totalPrice || 0)}
              </Text>
            </View>
          </View>

          <View className="flex-row space-x-3">
            <Button
              title="Keep Booking"
              onPress={() => router.back()}
              variant="outline"
              className="flex-1"
            />
            <Button
              title={cancelling ? "Cancelling..." : "Confirm Cancellation"}
              onPress={handleCancelBooking}
              loading={cancelling}
              disabled={cancelling}
              className="flex-1 bg-red-500"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
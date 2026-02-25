import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Info,
  Clock,
  Bus,
  User,
  ChevronRight,
  CreditCard
} from 'lucide-react-native';
import SeatMap from '../../../components/booking/SeatMap';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useTrips } from '../../../hooks/useTrips';
import { Trip } from '../../../types';

export default function SeatSelectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const {
    selectedTrip,
    selectedSeats,
    selectSeats,
    createBooking,
    loading: bookingLoading
  } = useBooking();
  const { getTripById, loading: tripLoading } = useTrips();

  const [trip, setTrip] = useState<Trip | null>(selectedTrip);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/Login');
      return;
    }

    if (!selectedTrip && id) {
      fetchTripDetails(id);
    } else if (selectedTrip) {
      setTrip(selectedTrip);
    }
  }, [isAuthenticated, selectedTrip, id]);

  const fetchTripDetails = async (tripId: string) => {
    setLoading(true);
    try {
      const data = await getTripById(tripId);
      setTrip(data);
    } catch (error) {
      router.canGoBack() ? router.back() : router.replace('/tabs/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      selectSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      selectSeats([...selectedSeats, seatNumber]);
    }
    setError('');
  };

  const handleProceedToPayment = async () => {
    if (!trip) return;

    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setLoading(true);

    try {
      const bookings = await createBooking(trip, selectedSeats);

      if (bookings && bookings.length > 0) {
        router.push({
          pathname: '/(screens)/payment/checkout',
          params: {
            bookingId: bookings[0]._id,
            seatCount: selectedSeats.length.toString()
          }
        });
      } else {
        setError('Failed to create booking. Please try again.');

      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || tripLoading || !trip) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading trip details...</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const totalPrice = (trip.price || 0) * selectedSeats.length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header - Fixed at top */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center bg-white">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Select Your Seats
        </Text>
        <View className="bg-blue-50 px-3 py-1 rounded-full">
          <Text className="text-blue-600 text-sm font-medium">
            {selectedSeats.length}/{trip.availableSeats || 0}
          </Text>
        </View>
      </View>

      {/* Scrollable Content - Button is now inside and will scroll */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20
        }}
      >
        {/* Trip Summary */}
        <View className="p-4 bg-gray-50">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-sm text-gray-500">From</Text>
              <Text className="font-semibold text-gray-800">
                {trip.origin?.stationName || 'Unknown'}
              </Text>
            </View>
            <View className="mx-2">
              <ChevronRight size={20} color="#9ca3af" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-500">To</Text>
              <Text className="font-semibold text-gray-800">
                {trip.destination?.stationName || 'Unknown'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#6b7280" />
              <Text className="text-xs text-gray-600">
                {formatDate(trip.departureTime)} • {formatTime(trip.departureTime)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Bus size={14} color="#6b7280" />
              <Text className="text-xs text-gray-600">
                {trip.vehicle?.carType || 'Bus'}
              </Text>
            </View>
          </View>
        </View>

        {/* Seat Map */}
        <SeatMap
          trip={trip}
          selectedSeats={selectedSeats}
          onSeatSelect={handleSeatSelect}
          maxSelectable={8}
        />

        {/* Error Message */}
        {error ? (
          <View className="mx-4 p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        ) : null}

        {/* Bottom Summary - Now inside ScrollView and will scroll */}
        <View className="mx-4 mt-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-sm text-gray-500">Selected Seats</Text>
              <View className="flex-row gap-1 mt-1">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((seat) => (
                    <View key={seat} className="bg-blue-500 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">{seat}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 text-sm">None</Text>
                )}
              </View>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-500">Total Amount</Text>
              <Text className="text-xl font-bold text-blue-600">
                ETB {totalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleProceedToPayment}
            disabled={selectedSeats.length === 0 || bookingLoading}
            className={`
              py-4 rounded-xl flex-row items-center justify-center
              ${selectedSeats.length === 0 || bookingLoading
                ? 'bg-gray-300'
                : 'bg-blue-600'
              }
            `}
          >
            {bookingLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CreditCard size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  {selectedSeats.length === 0
                    ? 'Select Seats to Continue'
                    : `Proceed to Payment • ETB ${totalPrice.toLocaleString()}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Extra bottom padding for comfortable scrolling */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
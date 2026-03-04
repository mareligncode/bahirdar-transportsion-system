// app/(screens)/trips/seat-selection.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL, API_ENDPOINTS } from '../../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Info,
  Clock,
  Bus,
  User,
  ChevronRight,
  CreditCard,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  Wifi,
  Coffee,
  Tv,
  Battery,
  AirVent,
  Armchair,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { formatCurrency } from '../../../utils/helpers';
import SeatMap from '../../../components/booking/SeatMap';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useTrips } from '../../../hooks/useTrips';
import { useToast } from '../../../components/common/Toast';
import { Trip, Vehicle, Station } from '../../../types';

const { width } = Dimensions.get('window');

export default function SeatSelectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const {
    selectedTrip,
    selectedSeats,
    selectSeats,
    createBooking,
    getMyBookings,
    loading: bookingLoading,
  } = useBooking();
  const { getTripById, loading: tripLoading } = useTrips();

  const [trip, setTrip] = useState<Trip | null>(selectedTrip);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showFeatures, setShowFeatures] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [myBookedSeats, setMyBookedSeats] = useState<Set<string>>(new Set<string>());

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(50)).current;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/Login');
      return;
    }

    if (!selectedTrip && id && !isInitialized) {
      fetchTripDetails(id);
    } else if (selectedTrip && !isInitialized) {
      setTrip(selectedTrip);
      fetchMyBookedSeats(selectedTrip._id);
      setIsInitialized(true);

      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAuthenticated, selectedTrip, id, isInitialized]);

  // Refresh booked seats when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) return;
      // Refresh the user's booked seats for the current trip
      if (selectedTrip && selectedTrip._id) {
        fetchMyBookedSeats(selectedTrip._id);
      }
    }, [isInitialized, selectedTrip])
  );

  const fetchTripDetails = async (tripId: string): Promise<void> => {
    setLoading(true);
    try {
      const data = await getTripById(tripId);
      if (data) {
        setTrip(data);
        await fetchMyBookedSeats(tripId);
        setIsInitialized(true);

        RNAnimated.parallel([
          RNAnimated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          RNAnimated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      Alert.alert(
        'Error',
        'Failed to load trip details.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookedSeats = async (tripId: string): Promise<void> => {
    try {
      // Get user's own bookings for this trip
      const myBookings = await getMyBookings(true);
      const mySeatsForThisTrip = myBookings
        .filter((b: any) => {
          const bTripId = typeof b.tripID === 'object' ? b.tripID?._id : b.tripID;
          return bTripId === tripId && b.status !== 'cancelled';
        })
        .flatMap((b: any) => b.seatNumbers || (b.seatNumber ? [b.seatNumber] : []));

      const mySeatsSet = new Set<string>(mySeatsForThisTrip.map((s: any) => s.toString()));
      setMyBookedSeats(mySeatsSet);

      console.log('📍 My booked seats on this trip:', Array.from(mySeatsSet).join(', ') || 'none');

    } catch (error) {
      console.error('❌ Error fetching my booked seats:', error);
      setMyBookedSeats(new Set<string>());
    }
  };

  const handleSeatSelect = (seatNumber: number): void => {
    const seatStr = seatNumber.toString();

    // Check if this is one of our own already booked seats
    if (myBookedSeats.has(seatStr)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Seat Already Booked', `You have already booked seat ${seatNumber}.`);
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleRemoveSeat(seatNumber);
      return;
    }

    // Check against trip.availableSeats to ensure we don't select more than available
    if (selectedSeats.length >= (trip?.availableSeats || 0)) {
      Alert.alert('Not Enough Seats', `Only ${trip?.availableSeats} seats available.`);
      return;
    }

    if (selectedSeats.length >= 8) {
      Alert.alert('Maximum Seats', 'You can only select up to 8 seats.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectSeats([...selectedSeats, seatNumber]);
    showToast(`Seat ${seatNumber} selected`, 'success');
    setError('');
  };

  const handleRemoveSeat = (seatNumber: number): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectSeats(selectedSeats.filter((s: number) => s !== seatNumber));
    showToast(`Seat ${seatNumber} removed`, 'info');
  };

  // app/(screens)/trips/seat-selection.tsx - Update handleProceedToPayment

  const handleProceedToPayment = async (): Promise<void> => {
    if (!trip) return;

    if (selectedSeats.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Please select at least one seat');
      return;
    }

    if (selectedSeats.length > (trip.availableSeats || 0)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(`Only ${trip.availableSeats} seats available`);
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Creating bookings for seats:', selectedSeats);

      const bookings = await createBooking(trip, selectedSeats);

      console.log('📥 Bookings result:', bookings);

      if (bookings && bookings.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const bookingIds = bookings.map(b => b._id);

        // Store booking IDs in AsyncStorage for persistence
        try {
          await AsyncStorage.setItem('pending_booking_ids', JSON.stringify(bookingIds));
          console.log('💾 Saved pending bookings to storage:', bookingIds);
        } catch (storageError) {
          console.error('Failed to save pending bookings:', storageError);
        }

        // Add these seats to myBookedSeats set
        const newBookedSeats = new Set(myBookedSeats);
        selectedSeats.forEach(seat => newBookedSeats.add(seat.toString()));
        setMyBookedSeats(newBookedSeats);

        // Clear selected seats after successful booking
        selectSeats([]);

        // Refresh trip data to get updated available seats
        const updatedTrip = await getTripById(trip._id);
        if (updatedTrip) {
          setTrip(updatedTrip);
        }

        console.log('✅ Booking successful, navigating to payment with IDs:', bookingIds);

        // Navigate to payment
        router.push({
          pathname: '/(screens)/payment/checkout',
          params: {
            bookingIds: JSON.stringify(bookingIds),
            seatCount: selectedSeats.length.toString(),
          },
        });
      } else {
        console.error('❌ No bookings returned');
        setError('Failed to book seats. Please try again.');
        showToast('Failed to book seats', 'error');
      }
    } catch (error: any) {
      console.error('❌ Booking error in component:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage = error.response?.data?.message || error.message || 'An error occurred.';

      if (errorMessage.includes('already booked')) {
        setError('Some seats were already booked. Please try different seats.');
        const updatedTrip = await getTripById(trip._id);
        if (updatedTrip) {
          setTrip(updatedTrip);
        }
      } else {
        setError(errorMessage);
      }

      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add cleanup prevention
  useEffect(() => {
    return () => {
      // Don't clear anything on unmount - let the payment screen handle it
      console.log('🛑 SeatSelectionScreen unmounting - preserving state');
    };
  }, []);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid time';
    }
  };

  if (loading || tripLoading || !trip || !isInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 font-medium">Loading trip details...</Text>
      </SafeAreaView>
    );
  }

  const totalPrice = (trip?.price || 0) * selectedSeats.length;
  const totalSeats = trip?.totalSeats || 50;
  const isFullyBooked = (trip?.availableSeats || 0) === 0;
  const origin = trip.origin as Station;
  const destination = trip.destination as Station;

  console.log('🎯 Final Seat Status:', {
    totalSeats,
    myBookedCount: myBookedSeats.size,
    tripAvailable: trip.availableSeats,
    selectedCount: selectedSeats.length,
    isFullyBooked
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-3"
        style={{ paddingTop: insets.top > 0 ? insets.top : 12 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/tabs/home'))}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-white">
            Select Your Seats
          </Text>
        </View>

        <View className="mt-4 bg-white/10 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-blue-400 items-center justify-center">
                <MapPin size={16} color="white" />
              </View>
              <View className="ml-2 flex-1">
                <Text className="text-xs text-blue-200">From</Text>
                <Text className="font-semibold text-white" numberOfLines={1}>
                  {origin?.stationName || 'Unknown'}
                </Text>
              </View>
            </View>

            <View className="px-2">
              <ArrowRight size={16} color="#93c5fd" />
            </View>

            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-blue-400 items-center justify-center">
                <MapPin size={16} color="white" />
              </View>
              <View className="ml-2 flex-1">
                <Text className="text-xs text-blue-200">To</Text>
                <Text className="font-semibold text-white" numberOfLines={1}>
                  {destination?.stationName || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Calendar size={14} color="#93c5fd" />
              <Text className="text-xs text-white ml-1">{formatDate(trip.departureTime)}</Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color="#93c5fd" />
              <Text className="text-xs text-white ml-1">{formatTime(trip.departureTime)}</Text>
            </View>
            <View className="flex-row items-center">
              <Bus size={14} color="#93c5fd" />
              <Text className="text-xs text-white ml-1">{trip.vehicle?.carType || 'Bus'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120 + insets.bottom,
        }}
      >
        <RNAnimated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {isFullyBooked ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mx-4 mt-4">
              <View className="flex-row items-center">
                <AlertCircle size={24} color="#dc2626" />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-red-700">No Seats Available</Text>
                  <Text className="text-sm text-red-600">
                    This trip is fully booked.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mx-4 mt-4">
              <View className="flex-row items-center">
                <CheckCircle size={24} color="#16a34a" />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-green-700">
                    {trip.availableSeats} of {totalSeats} Seats Available
                  </Text>
                  <Text className="text-sm text-green-600">
                    Select up to {Math.min(8, trip.availableSeats || 0)} seats
                  </Text>
                </View>
              </View>
            </View>
          )}
        </RNAnimated.View>

        <View className="mx-4 mt-4">
          <TouchableOpacity
            onPress={() => setShowFeatures(!showFeatures)}
            activeOpacity={0.7}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                <Info size={20} color="#3b82f6" />
              </View>
              <View className="ml-3">
                <Text className="font-semibold text-gray-800">Bus Amenities</Text>
                <Text className="text-xs text-gray-500">WiFi, AC, and more</Text>
              </View>
            </View>
            <ChevronRight
              size={20}
              color="#9ca3af"
              style={{ transform: [{ rotate: showFeatures ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showFeatures && (
            <Animated.View
              entering={FadeIn}
              className="mt-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-row flex-wrap justify-between"
            >
              <View className="w-[48%] mb-4 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center">
                  <Wifi size={16} color="#3b82f6" />
                </View>
                <Text className="ml-2 text-xs text-gray-600">Free WiFi</Text>
              </View>
              <View className="w-[48%] mb-4 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center">
                  <AirVent size={16} color="#3b82f6" />
                </View>
                <Text className="ml-2 text-xs text-gray-600">Air Conditioning</Text>
              </View>
              <View className="w-[48%] mb-4 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center">
                  <Coffee size={16} color="#3b82f6" />
                </View>
                <Text className="ml-2 text-xs text-gray-600">Drinks & Snacks</Text>
              </View>
              <View className="w-[48%] mb-4 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center">
                  <Tv size={16} color="#3b82f6" />
                </View>
                <Text className="ml-2 text-xs text-gray-600">Entertainment</Text>
              </View>
              <View className="w-[48%] flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center">
                  <Battery size={16} color="#3b82f6" />
                </View>
                <Text className="ml-2 text-xs text-gray-600">Power Outlet</Text>
              </View>
            </Animated.View>
          )}
        </View>

        <SeatMap
  trip={trip}
  selectedSeats={selectedSeats}
  onSeatSelect={handleSeatSelect}
  maxSelectable={Math.min(8, trip.availableSeats || 0)}
  userBookedSeats={Array.from(myBookedSeats)}
/>

        {selectedSeats.length > 0 && (
          <View className="mx-4 mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold text-blue-800">Your Selected Seats</Text>
              <View className="bg-blue-500 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">{selectedSeats.length}</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {selectedSeats.map((seat: number) => (
                <View
                  key={seat}
                  className="bg-blue-500 px-3 py-2 rounded-full flex-row items-center shadow-sm"
                >
                  <Armchair size={14} color="white" />
                  <Text className="text-white font-bold ml-1 mr-2">{seat}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSeat(seat)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-5 h-5 bg-white/20 rounded-full items-center justify-center"
                  >
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {error ? (
          <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl border border-red-200 flex-row items-center">
            <AlertCircle size={18} color="#dc2626" />
            <Text className="ml-2 text-red-600 text-sm flex-1">{error}</Text>
          </View>
        ) : null}

        <View className="mx-4 mt-6 mb-4">
          <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-sm text-gray-500">Total Amount</Text>
                <Text className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPrice)}
                </Text>
                {selectedSeats.length > 0 && (
                  <View className="flex-row items-center mt-1">
                    <Text className="text-xs text-gray-500">
                      {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} × {formatCurrency(trip.price || 0)}
                    </Text>
                  </View>
                )}
              </View>
              <View className="items-end">
                <View className="bg-gray-100 px-3 py-2 rounded-lg mb-2">
                  <Text className="text-gray-600 font-medium text-center">
                    {selectedSeats.length}/{trip.availableSeats}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleProceedToPayment}
              disabled={selectedSeats.length === 0 || bookingLoading || isFullyBooked}
              className={`
                py-4 rounded-xl flex-row items-center justify-center
                ${selectedSeats.length === 0 || bookingLoading || isFullyBooked
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
                  <View className="ml-2">
                    <Text className="text-white font-semibold text-base">
                      {isFullyBooked
                        ? 'No Seats Available'
                        : selectedSeats.length === 0
                          ? 'Select Seats to Continue'
                          : `Proceed to Payment`}
                    </Text>
                    {selectedSeats.length > 1 && (
                      <Text className="text-white text-xs opacity-90">
                        {selectedSeats.length} seats • {formatCurrency(totalPrice)}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
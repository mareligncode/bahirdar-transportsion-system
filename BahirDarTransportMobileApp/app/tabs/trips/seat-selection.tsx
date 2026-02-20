// app/tabs/trips/seat-selection.tsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ChevronLeft, 
  Bus,
  Clock,
  MapPin,
  Users,
  DollarSign,
  CreditCard,
  Info,
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { tripsApi } from '../../../lib/api/trips';
import { Button } from '../../../components/common/Button';
import SeatMap from '../../../components/booking/SeatMap';
import { Loader } from '../../../components/common/Loader';
import { 
  formatDate, 
  formatTime, 
  formatCurrency, 
  calculateDuration 
} from '../../../utils/helpers';

export default function SeatSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { tripId, tripDetails } = useLocalSearchParams();
  const { selectedSeats, selectSeats, loading: bookingLoading } = useBooking();
  const [trip, setTrip] = useState<any>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Reset selected seats when trip changes to prevent cross-trip contamination
  useEffect(() => {
    selectSeats([]);
  }, [tripId]);

  useEffect(() => {
    loadTripDetails();
  }, [tripId, tripDetails]);

  const loadTripDetails = async () => {
    try {
      setLoadingTrip(true);
      setFetchError(null);
      
      if (tripDetails) {
        const parsedTrip = JSON.parse(tripDetails as string);
        setTrip(parsedTrip);
      } 
      else if (tripId) {
        const response = await tripsApi.getTripById(tripId as string);
        const tripData = response.data?.data || response.data;
        setTrip(tripData);
      }
    } catch (error) {
      setFetchError('Failed to load trip details');
    } finally {
      setLoadingTrip(false);
    }
  };

  const handleSeatSelect = (seats: string[]) => {
    selectSeats(seats);
  };

  const handleProceedToBooking = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Select Seats', 'Please select at least one seat to continue');
      return;
    }

    const totalAmount = (trip?.price || 0) * selectedSeats.length;
    const serviceFee = 20;
    const grandTotal = totalAmount + serviceFee;
    
    router.push({
      pathname: '/(screens)/booking/passenger-details',
      params: {
        tripId: trip._id || trip.id,
        selectedSeats: JSON.stringify(selectedSeats),
        tripDetails: JSON.stringify({
          _id: trip._id || trip.id,
          fromStation: trip.origin?.stationName || trip.fromStation?.stationName,
          toStation: trip.destination?.stationName || trip.toStation?.stationName,
          price: trip.price,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          availableSeats: trip.availableSeats,
          totalSeats: trip.totalSeats || trip.vehicle?.totalCapacity || 40,
          vehicle: trip.vehicle ? {
            _id: trip.vehicle._id,
            plateNumber: trip.vehicle.plateNumber,
            carType: trip.vehicle.carType,
            totalCapacity: trip.vehicle.totalCapacity
          } : null
        }),
        totalAmount: grandTotal.toString(),
        seatPrice: trip.price.toString(),
        serviceFee: serviceFee.toString(),
      }
    });
  };

  const handleRetry = () => {
    loadTripDetails();
  };

  // Loading state
  if (loadingTrip) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message="Loading seat map..." />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (fetchError || !trip) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center p-4">
          <AlertCircle size={48} color="#ef4444" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
            {fetchError || 'Trip Not Found'}
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            {!trip ? 'The trip you\'re looking for is no longer available' : fetchError}
          </Text>
          <View className="flex-row mt-6 space-x-4">
            <Button
              title="Go Back"
              onPress={() => router.back()}
              variant="outline"
              className="mr-2"
            />
            <Button
              title="Retry"
              onPress={handleRetry}
              variant="primary"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const totalAmount = (trip.price || 0) * selectedSeats.length;
  const serviceFee = 20;
  const grandTotal = totalAmount + serviceFee;
  const duration = calculateDuration(trip.departureTime, trip.arrivalTime);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-4 pb-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View className="flex-1 ml-2">
            <Text className="text-xl font-bold text-gray-900">
              Select Your Seats
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {trip.origin?.stationName} → {trip.destination?.stationName}
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 30
        }}
      >
        {/* Trip Summary Card */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl border border-gray-200 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 p-2.5 rounded-full">
              <Bus size={22} color="#3b82f6" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-gray-900 text-base">
                {trip.origin?.stationName}
              </Text>
              <Text className="text-xs text-gray-500">
                {trip.origin?.city || 'Bahir Dar'}
              </Text>
            </View>
            <View className="px-3 py-1.5 bg-gray-100 rounded-full">
              <Text className="text-xs font-medium text-gray-700">
                {duration}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center ml-11 mb-3">
            <View className="w-2 h-2 bg-gray-300 rounded-full" />
            <View className="w-10 h-0.5 bg-gray-300 mx-1" />
            <View className="w-2 h-2 bg-gray-300 rounded-full" />
          </View>

          <View className="flex-row items-center mb-4">
            <View className="bg-red-100 p-2.5 rounded-full">
              <MapPin size={22} color="#ef4444" />
            </View>
            <View className="ml-3">
              <Text className="font-bold text-gray-900 text-base">
                {trip.destination?.stationName}
              </Text>
              <Text className="text-xs text-gray-500">
                {trip.destination?.city || 'Bahir Dar'}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              <Clock size={16} color="#64748b" />
              <Text className="ml-1.5 text-sm text-gray-700">
                {formatTime(trip.departureTime)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Users size={16} color="#64748b" />
              <Text className={`ml-1.5 text-sm font-medium ${
                trip.availableSeats < 10 ? 'text-orange-600' : 'text-gray-700'
              }`}>
                {trip.availableSeats} seats left
              </Text>
            </View>
            <View className="flex-row items-center">
              <DollarSign size={16} color="#3b82f6" />
              <Text className="ml-1.5 text-sm font-bold text-blue-600">
                {formatCurrency(trip.price)}/seat
              </Text>
            </View>
          </View>
        </View>

        {/* Seat Map */}
        <View className="mt-4">
          <SeatMap
            trip={trip}
            bookedSeats={bookedSeats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            maxSelectable={4}
          />
        </View>

        {/* Booking Information */}
        <View className="bg-blue-50 mx-4 mt-4 p-4 rounded-xl border border-blue-200">
          <View className="flex-row items-start">
            <Info size={20} color="#3b82f6" />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900 mb-2">
                Important Information
              </Text>
              <Text className="text-sm text-gray-700 mb-1.5">
                • You can select up to 4 seats per booking
              </Text>
              <Text className="text-sm text-gray-700 mb-1.5">
                • Selected seats are held for 10 minutes
              </Text>
              <Text className="text-sm text-gray-700 mb-1.5">
                • Free cancellation up to 2 hours before departure
              </Text>
              <Text className="text-sm text-gray-700">
                • Boarding closes 15 minutes before departure
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Features */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl border border-gray-200">
          <View className="flex-row items-center mb-3">
            <Shield size={20} color="#10b981" />
            <Text className="ml-2 font-semibold text-gray-900">
              Safety & Comfort
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            <View className="flex-row items-center mr-4 mb-2">
              <CheckCircle size={14} color="#10b981" />
              <Text className="ml-1.5 text-sm text-gray-600">Professional Driver</Text>
            </View>
            <View className="flex-row items-center mr-4 mb-2">
              <CheckCircle size={14} color="#10b981" />
              <Text className="ml-1.5 text-sm text-gray-600">AC Bus</Text>
            </View>
            <View className="flex-row items-center mr-4 mb-2">
              <CheckCircle size={14} color="#10b981" />
              <Text className="ml-1.5 text-sm text-gray-600">COVID Safe</Text>
            </View>
            <View className="flex-row items-center mr-4 mb-2">
              <CheckCircle size={14} color="#10b981" />
              <Text className="ml-1.5 text-sm text-gray-600">Insurance</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-6" />

        {/* Bottom Action Bar */}
        <View className="bg-blue-50 mx-4 p-5 rounded-xl border-2 border-blue-200 shadow-lg">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-sm font-medium text-blue-700 mb-1">Selected Seats</Text>
              <Text className="text-xl font-bold text-gray-900">
                {selectedSeats.length > 0 
                  ? selectedSeats.join(', ') 
                  : 'None selected'
                }
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-medium text-blue-700 mb-1">Total Amount</Text>
              <Text className="text-3xl font-bold text-blue-600">
                {formatCurrency(grandTotal)}
              </Text>
              <Text className="text-xs text-gray-600 mt-0.5">
                + {formatCurrency(serviceFee)} service fee
              </Text>
            </View>
          </View>

          <Button
            title={bookingInProgress || bookingLoading ? 'Processing...' : 'Proceed to Payment'}
            onPress={handleProceedToBooking}
            loading={bookingInProgress || bookingLoading}
            disabled={selectedSeats.length === 0 || bookingInProgress || bookingLoading}
            icon={<CreditCard size={20} color="white" />}
            size="large"
            className="bg-blue-600"
          />

          <View className="flex-row items-center justify-center mt-3">
            <ArrowRight size={14} color="#3b82f6" />
            <Text className="text-xs text-center text-blue-600 ml-1 font-medium">
              You'll enter passenger details next
            </Text>
          </View>
        </View>

        {/* Extra space at bottom */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
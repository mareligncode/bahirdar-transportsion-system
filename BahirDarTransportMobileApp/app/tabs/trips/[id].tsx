import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Car,
  User,
  Phone,
  AlertCircle,
  ChevronLeft,
  CreditCard,
  Bus
} from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { useBooking } from '../../../hooks/useBooking';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Loader } from '../../../components/common/Loader';
import { formatTime, formatDate, formatCurrency } from '../../../utils/helpers';
import { Trip } from '../../../types/trip';

export default function TripDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const { getTripById, getVehicleById, loading, error } = useTrips();
  const { selectTrip } = useBooking();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    if (tripId === 'index') {
      setTimeout(() => {
        router.replace('/tabs/trips');
      }, 100);
      return;
    }

    if (!tripId) {
      router.canGoBack() ? router.back() : router.replace('/tabs/home');
      return;
    }

    if (tripId === 'undefined' || tripId === 'null') {
      router.canGoBack() ? router.back() : router.replace('/tabs/home');
      return;
    }

    if (tripId.length !== 24) {
      router.canGoBack() ? router.back() : router.replace('/tabs/home');
      return;
    }

    loadTripDetails(tripId);
  }, [tripId]);

  const loadTripDetails = async (id: string) => {
    try {
      const data = await getTripById(id);
      setTrip(data);
      selectTrip(data);

      if (data?.vehicle) {
        setVehicle(data.vehicle);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to load trip details. Please try again.';

      if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Trip not found. It may have been removed.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid trip ID.';
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const handleSelectSeats = () => {
    if (!trip) return;

    const availableSeats = trip.availableSeats ?? 0;

    if (availableSeats === 0) {
      Alert.alert('No seats available', 'This trip is fully booked.');
      return;
    }

    router.push({
      pathname: '/tabs/trips/seat-selection',
      params: { id: trip._id }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'boarding': return 'bg-yellow-100 text-yellow-800';
      case 'departed': return 'bg-green-100 text-green-800';
      case 'arrived': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabBarHeight = 60 + insets.bottom;

  const availableSeats = trip?.availableSeats ?? 0;
  const totalSeats = trip?.totalSeats ?? trip?.vehicle?.totalCapacity ?? 0;
  const price = trip?.price ?? 0;
  const tripStatus = trip?.tripStatus ?? 'scheduled';
  const departureTime = trip?.departureTime ?? '';
  const arrivalTime = trip?.arrivalTime ?? '';
  const originName = trip?.origin?.stationName ?? 'Unknown';
  const destinationName = trip?.destination?.stationName ?? 'Unknown';
  const originCity = trip?.origin?.city ?? '';
  const destinationCity = trip?.destination?.city ?? '';
  const driverName = trip?.driver?.fullName ?? 'Driver assigned';
  const driverPhone = trip?.driver?.phoneNumber;
  const vehiclePlate = vehicle?.plateNumber ?? trip?.vehicle?.plateNumber ?? 'Vehicle assigned';
  const vehicleType = vehicle?.carType ?? trip?.vehicle?.carType ?? 'Bus';

  const canBook = availableSeats > 0 && trip?.tripStatus === 'scheduled';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 items-center justify-center">
          <Loader message="Loading trip details..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center p-8">
          <AlertCircle size={64} color="#ef4444" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">
            Trip not found
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            The trip you're looking for doesn't exist or has been removed.
          </Text>
          <Button
            variant="outline"
            className="mt-6"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        <View className="bg-white px-4 pb-3 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="p-2 -ml-2">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 flex-1 ml-2">
              Trip Details
            </Text>
            <Badge
              variant={availableSeats > 5 ? 'success' : availableSeats > 0 ? 'warning' : 'error'}
              text={availableSeats > 0 ? `${availableSeats} seats left` : 'Full'}
            />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + 8
          }}
        >
          <View className="bg-white p-4 mb-3">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {originName} → {destinationName}
                </Text>
                <Text className="text-gray-600 mt-1">
                  {formatDate(departureTime)}
                </Text>
              </View>
              <Badge
                text={tripStatus}
                className={getStatusColor(tripStatus)}
              />
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <Calendar size={18} color="#6b7280" />
                <Text className="text-gray-700 ml-3">
                  {formatDate(departureTime)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Clock size={18} color="#6b7280" />
                <Text className="text-gray-700 ml-3">
                  {formatTime(departureTime)} - {formatTime(arrivalTime)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <MapPin size={18} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-gray-700">
                    {originCity} → {destinationCity}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View className="bg-white p-4 mb-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Vehicle & Driver
            </Text>

            <View className="space-y-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                  <Car size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {vehiclePlate}
                  </Text>
                  <Text className="text-gray-600">
                    {vehicleType} • {totalSeats} seats
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                  <User size={20} color="#10b981" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {driverName}
                  </Text>
                  <Text className="text-gray-600">
                    Licensed Driver
                  </Text>
                </View>
                {driverPhone && (
                  <TouchableOpacity
                    className="p-2 bg-blue-50 rounded-lg"
                    onPress={() => {
                      Alert.alert('Call Driver', `Call ${driverName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Call', onPress: () => console.log('Calling...') }
                      ]);
                    }}
                  >
                    <Phone size={18} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View className="bg-white p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Pricing & Information
            </Text>

            <View className="space-y-2">
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-700">Price per seat</Text>
                <Text className="text-lg font-bold text-blue-600">
                  {formatCurrency(price)}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-t border-gray-100">
                <Text className="text-gray-700">Available seats</Text>
                <Text className="font-medium text-gray-900">
                  {availableSeats} of {totalSeats}
                </Text>
              </View>

              {trip.notes && (
                <View className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <Text className="text-sm text-gray-700">
                    <Text className="font-medium">Note:</Text> {trip.notes}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View
        className="absolute left-0 right-0 bg-white border-t border-gray-200 px-4 pt-4 shadow-lg"
        style={{
          bottom: tabBarHeight,
          zIndex: 10,
          elevation: 10,
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-sm text-gray-500">Price per seat</Text>
            <Text className="text-xl font-bold text-blue-600">
              {formatCurrency(price)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-500">Available</Text>
            <Text className="text-lg font-semibold text-gray-900">
              {availableSeats} of {totalSeats} seats
            </Text>
          </View>
        </View>

        <Button
          variant="primary"
          size="large"
          onPress={handleSelectSeats}
          disabled={!canBook}
        >
          {!canBook
            ? trip?.tripStatus !== 'scheduled'
              ? 'Trip Unavailable'
              : 'Fully Booked'
            : 'Select Seats'
          }
        </Button>
      </View>
    </View>
  );
}
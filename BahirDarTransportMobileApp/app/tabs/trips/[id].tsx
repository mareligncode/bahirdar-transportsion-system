// app/tabs/trips/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Car,
  User,
  Phone,
  AlertCircle,
  ArrowLeft,
  Bus,
  ChevronRight,
  Star,
  Wifi,
  Coffee,
  Tv,
  Battery,
  AirVent,
  Shield
} from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { useBooking } from '../../../hooks/useBooking';
import { Badge } from '../../../components/common/Badge';
import { Loader } from '../../../components/common/Loader';
import { formatTime, formatDate, formatCurrency } from '../../../utils/helpers';
import { Trip, Vehicle, Driver, Station } from '../../../types/trip';

const { width } = Dimensions.get('window');

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'error' | 'info';

export default function TripDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const { getTripById, loading, error } = useTrips();
  const { selectTrip } = useBooking();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    // Validate tripId before proceeding
    if (!tripId || tripId === 'index' || tripId === 'undefined' || tripId === 'null') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tabs/home');
      }
      return;
    }

    if (tripId.length !== 24) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tabs/home');
      }
      return;
    }

    loadTripDetails(tripId);
  }, [tripId]);

  const loadTripDetails = async (id: string) => {
    try {
      const data = await getTripById(id);
      setTrip(data);
      selectTrip(data);
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

      // Navigate back after error
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/tabs/home');
        }
      }, 2000);
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

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs/home');
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'info';
      case 'boarding': return 'warning';
      case 'departed': return 'success';
      case 'arrived': return 'secondary';
      case 'cancelled': return 'error';
      default: return 'secondary';
    }
  };

  // Safe data extraction with proper typing
  const availableSeats = trip?.availableSeats ?? 0;
  const totalSeats = trip?.totalSeats ?? (trip?.vehicle as Vehicle)?.totalCapacity ?? 0;
  const price = trip?.price ?? 0;
  const tripStatus = trip?.tripStatus ?? 'scheduled';
  const departureTime = trip?.departureTime ?? '';
  const arrivalTime = trip?.arrivalTime ?? '';

  const origin = trip?.origin as Station;
  const destination = trip?.destination as Station;
  const driver = trip?.driver as Driver;
  const vehicle = trip?.vehicle as Vehicle;

  const originName = origin?.stationName ?? 'Unknown';
  const destinationName = destination?.stationName ?? 'Unknown';
  const originCity = origin?.city ?? '';
  const destinationCity = destination?.city ?? '';

  const driverName = driver?.fullName ?? 'Driver assigned';
  const driverPhone = driver?.phoneNumber;

  const vehiclePlate = vehicle?.plateNumber ?? 'Vehicle assigned';
  const vehicleType = vehicle?.carType ?? 'Bus';

  const canBook = availableSeats > 0 && (trip?.tripStatus === 'scheduled' || trip?.tripStatus === 'boarding');

  // Get vehicle features icons
  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes('wifi')) return <Wifi size={16} color="#3b82f6" />;
    if (featureLower.includes('ac') || featureLower.includes('air')) return <AirVent size={16} color="#3b82f6" />;
    if (featureLower.includes('tv')) return <Tv size={16} color="#3b82f6" />;
    if (featureLower.includes('charging') || featureLower.includes('usb')) return <Battery size={16} color="#3b82f6" />;
    if (featureLower.includes('coffee') || featureLower.includes('snack')) return <Coffee size={16} color="#3b82f6" />;
    return <Shield size={16} color="#3b82f6" />;
  };

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
          <TouchableOpacity
            onPress={handleGoBack}
            className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Header with Gradient */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-3"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleGoBack}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-sm opacity-80">Trip Details</Text>
              <Text className="text-white font-bold text-lg" numberOfLines={1}>
                {originName} → {destinationName}
              </Text>
            </View>
            <Badge
              variant={getStatusBadgeVariant(tripStatus)}
              text={tripStatus.toUpperCase()}
            />
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-3 pt-3 border-t border-white/20">
            <View className="flex-1">
              <Text className="text-xs text-blue-200">Date</Text>
              <Text className="text-sm font-semibold text-white">
                {formatDate(departureTime)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-blue-200">Time</Text>
              <Text className="text-sm font-semibold text-white">
                {formatTime(departureTime)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-blue-200">Price</Text>
              <Text className="text-sm font-semibold text-white">
                {formatCurrency(price)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 140, // Increased padding to ensure button is visible above bottom tabs
          }}
        >
          {/* Quick Info Cards */}
          <View className="flex-row px-4 mt-4 mb-3">
            <View className="flex-1 bg-white rounded-xl p-3 mr-2 border border-gray-200">
              <View className="flex-row items-center">
                <Clock size={16} color="#3b82f6" />
                <Text className="text-xs text-gray-500 ml-2">Duration</Text>
              </View>
              <Text className="text-lg font-bold text-gray-900 mt-1">
                {Math.ceil((new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / (1000 * 60 * 60))}h
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-3 mr-2 border border-gray-200">
              <View className="flex-row items-center">
                <Users size={16} color="#f59e0b" />
                <Text className="text-xs text-gray-500 ml-2">Available</Text>
              </View>
              <Text className="text-lg font-bold text-gray-900 mt-1">
                {availableSeats}/{totalSeats}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-3 border border-gray-200">
              <View className="flex-row items-center">
                <Star size={16} color="#10b981" />
                <Text className="text-xs text-gray-500 ml-2">Rating</Text>
              </View>
              <Text className="text-lg font-bold text-gray-900 mt-1">4.8</Text>
            </View>
          </View>

          {/* Trip Summary Card */}
          <View className="bg-white p-4 mx-4 mb-3 rounded-xl border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Journey Details
            </Text>

            <View className="space-y-4">
              {/* Origin */}
              <View className="flex-row">
                <View className="w-8 items-center">
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                </View>
                <View className="flex-1 ml-2 pb-4">
                  <Text className="text-sm text-gray-500">Departure</Text>
                  <Text className="font-semibold text-gray-900">{originName}</Text>
                  <Text className="text-sm text-gray-600">{originCity}</Text>
                  <Text className="text-sm text-blue-600 font-medium mt-1">
                    {formatTime(departureTime)}
                  </Text>
                </View>
              </View>

              {/* Line connecting dots */}
              <View className="absolute left-3 top-6 bottom-6 w-0.5 bg-gray-300" style={{ transform: [{ translateX: -1.5 }] }} />

              {/* Destination */}
              <View className="flex-row">
                <View className="w-8 items-center">
                  <View className="w-3 h-3 rounded-full bg-red-500" />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-sm text-gray-500">Arrival</Text>
                  <Text className="font-semibold text-gray-900">{destinationName}</Text>
                  <Text className="text-sm text-gray-600">{destinationCity}</Text>
                  <Text className="text-sm text-green-600 font-medium mt-1">
                    {formatTime(arrivalTime)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Vehicle & Driver Card */}
          <View className="bg-white p-4 mx-4 mb-3 rounded-xl border border-gray-200">
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

          {/* Amenities Card */}
          <View className="bg-white p-4 mx-4 mb-3 rounded-xl border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Amenities
            </Text>
            <View className="flex-row flex-wrap">
              {vehicle?.features && vehicle.features.length > 0 ? (
                vehicle.features.map((feature, index) => (
                  <View key={index} className="bg-blue-50 px-3 py-2 rounded-full mr-2 mb-2 flex-row items-center">
                    {getFeatureIcon(feature)}
                    <Text className="text-blue-600 text-sm font-medium ml-1">{feature}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500">Standard amenities included</Text>
              )}
            </View>
          </View>

          {/* Notes Card */}
          {trip.notes && (
            <View className="bg-yellow-50 p-4 mx-4 mb-4 rounded-xl border border-yellow-200">
              <Text className="text-sm text-gray-700">
                <Text className="font-medium text-yellow-800">Note:</Text> {trip.notes}
              </Text>
            </View>
          )}

          {/* Price Summary Card */}
          <View className="bg-white p-4 mx-4 mb-3 rounded-xl border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Price Summary
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
                <Text className={`font-medium ${availableSeats > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {availableSeats} of {totalSeats}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-t border-gray-100">
                <Text className="text-gray-700">Total for 1 seat</Text>
                <Text className="text-xl font-bold text-blue-600">
                  {formatCurrency(price)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button - Enhanced and more visible */}
          <View className="mx-4 mt-4 mb-6">
            <TouchableOpacity
              onPress={handleSelectSeats}
              disabled={!canBook}
              className={`
                py-4 rounded-xl flex-row items-center justify-center shadow-lg
                ${!canBook ? 'bg-gray-400' : 'bg-blue-600'}
              `}
            >
              <Bus size={22} color="white" />
              <Text className="text-white font-bold ml-2 text-lg">
                {!canBook
                  ? (trip?.tripStatus !== 'scheduled' && trip?.tripStatus !== 'boarding')
                    ? 'Trip Unavailable'
                    : 'Fully Booked'
                  : 'Select Seats'}
              </Text>
              {canBook && <ChevronRight size={22} color="white" className="ml-2" />}
            </TouchableOpacity>

            {/* Booking Info */}
            {canBook && (
              <View className="mt-3 flex-row justify-center items-center">
                <Shield size={14} color="#10b981" />
                <Text className="text-xs text-gray-500 ml-1">
                  Secure booking • Free cancellation within 2 hours
                </Text>
              </View>
            )}

            {!canBook && trip?.tripStatus === 'scheduled' && availableSeats === 0 && (
              <View className="mt-3 bg-red-50 p-3 rounded-lg border border-red-200">
                <Text className="text-red-600 text-xs text-center">
                  This trip is fully booked. Please check other available trips.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
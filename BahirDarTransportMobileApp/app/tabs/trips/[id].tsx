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
} from 'lucide-react-native';
import { useTrips } from '../../../hooks/useTrips';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Loader } from '../../../components/common/Loader';
import { formatTime, formatDate, formatCurrency } from '../../../utils/helpers';
import { Trip } from '../../../types/trip';

export default function TripDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
  // Handle array params
  const tripId = Array.isArray(id) ? id[0] : id;
  
  const { getTripById, getVehicleById, loading, error } = useTrips();
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
      Alert.alert('Error', 'No trip ID provided');
      router.back();
      return;
    }
    
    if (tripId === 'undefined' || tripId === 'null') {
      Alert.alert('Error', 'Invalid trip ID');
      router.back();
      return;
    }

    if (tripId.length !== 24) {
     Alert.alert('Error', `Invalid trip ID format. Length: ${tripId.length} (should be 24)`);
      router.back();
      return;
    }
    
    loadTripDetails(tripId);
  }, [tripId]);

  const loadTripDetails = async (id: string) => {
    try {
      const data = await getTripById(id);
      setTrip(data);
      
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
    if (!trip || trip.availableSeats === 0) {
      Alert.alert('No seats available', 'This trip is fully booked.');
      return;
    }
    
    router.push({
      pathname: '/tabs/trips/seat-selection',
      params: { 
        tripId: trip._id,
        tripDetails: JSON.stringify({
          fromStation: trip.origin?.stationName,
          toStation: trip.destination?.stationName,
          price: trip.price,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          availableSeats: trip.availableSeats,
          vehicleId: trip.vehicle?._id,
        })
      }
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
            onPress={() => router.back()}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const tripStatus = trip.tripStatus || 'scheduled';
  const availableSeats = trip.availableSeats || 0;
  const totalSeats = trip.totalSeats || trip.vehicle?.totalCapacity || 0;
  const departureTime = trip.departureTime;
  const arrivalTime = trip.arrivalTime;

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="bg-white px-4 pb-3 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
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
          {/* Trip Overview */}
          <View className="bg-white p-4 mb-3">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {trip.origin?.stationName} → {trip.destination?.stationName}
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
                    {trip.origin?.city} → {trip.destination?.city}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Vehicle & Driver Info */}
          <View className="bg-white p-4 mb-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Vehicle & Driver
            </Text>

            <View className="space-y-4">
              {/* Vehicle Info */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                  <Car size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {vehicle?.plateNumber || trip.vehicle?.plateNumber || 'Vehicle assigned'}
                  </Text>
                  <Text className="text-gray-600">
                    {vehicle?.carType || trip.vehicle?.carType || 'Bus'} • {totalSeats} seats
                  </Text>
                </View>
              </View>

              {/* Driver Info */}
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                  <User size={20} color="#10b981" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {trip.driver?.fullName || 'Driver assigned'}
                  </Text>
                  <Text className="text-gray-600">
                    Licensed Driver
                  </Text>
                </View>
                {trip.driver?.phoneNumber && (
                  <TouchableOpacity 
                    className="p-2 bg-blue-50 rounded-lg"
                    onPress={() => {
                      Alert.alert('Call Driver', `Call ${trip.driver?.fullName}?`, [
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
                  {formatCurrency(trip.price)}
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
        <Button
          variant="primary"
          size="large"
          onPress={handleSelectSeats}
          disabled={availableSeats === 0}
        >
          {availableSeats === 0 ? 'Fully Booked' : 'Select Seats'}
        </Button>
      </View>
    </View>
  );
}
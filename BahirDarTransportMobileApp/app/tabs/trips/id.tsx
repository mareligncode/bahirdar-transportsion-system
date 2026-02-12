import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
import { ScreenLayout } from '../../../components/layout/ScreenLayout';
import { formatTime, formatDate, formatCurrency } from '../../../utils/helpers';
import { IconButton } from '@/components/common';

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { getTripById, loading, error } = useTrips();
  const [trip, setTrip] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    loadTripDetails();
  }, [id]);

  const loadTripDetails = async () => {
    try {
      const data = await getTripById(id as string);
      setTrip(data);
    } catch (err) {
      console.error('Failed to load trip details:', err);
    }
  };

  const handleBookTrip = () => {
    if (!trip || trip.availableSeats === 0) {
      Alert.alert('No seats available', 'This trip is fully booked.');
      return;
    }
    
    router.push({
      pathname: '/trips/seat-selection',
      params: { 
        tripId: trip.id,
        tripDetails: JSON.stringify({
          from: trip.origin?.stationName,
          to: trip.destination?.stationName,
          price: trip.price,
          departureTime: trip.departureTime,
          availableSeats: trip.availableSeats,
        })
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'boarding': return 'bg-yellow-100 text-yellow-800';
      case 'departed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ScreenLayout>
        <Loader message="Loading trip details..." />
      </ScreenLayout>
    );
  }

  if (error || !trip) {
    return (
      <ScreenLayout>
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
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-200">
          <View className="flex-row items-center mb-3">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 flex-1">
              Trip Details
            </Text>
            <Badge
              variant={trip.availableSeats > 5 ? 'success' : 'warning'}
              text={`${trip.availableSeats} seats left`}
            />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Trip Overview */}
          <View className="bg-white p-4 mb-3">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {trip.origin?.stationName} → {trip.destination?.stationName}
                </Text>
                <Text className="text-gray-600 mt-1">
                  {formatDate(trip.departureTime)} • {trip.station?.stationName}
                </Text>
              </View>
              <Badge
                text={trip.tripStatus || 'scheduled'}
                className={getStatusColor(trip.tripStatus)}
              />
            </View>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <Calendar size={18} color="#6b7280" />
                <Text className="text-gray-700 ml-3">
                  {formatDate(trip.departureTime)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Clock size={18} color="#6b7280" />
                <Text className="text-gray-700 ml-3">
                  {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}
                  <Text className="text-gray-500">
                    {' '}({trip.estimatedDuration || '3h 15m'})
                  </Text>
                </Text>
              </View>

              <View className="flex-row items-center">
                <MapPin size={18} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-gray-700">
                    {trip.origin?.city} → {trip.destination?.city}
                  </Text>
                  {trip.routePoints?.length > 0 && (
                    <Text className="text-gray-500 text-sm mt-1">
                      Via: {trip.routePoints.join(', ')}
                    </Text>
                  )}
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
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                  <Car size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {trip.vehicle?.plateNumber}
                  </Text>
                  <Text className="text-gray-600">
                    {trip.vehicle?.carType || 'Standard Bus'} • {trip.vehicle?.totalCapacity} seats
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                  <User size={20} color="#10b981" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">
                    {trip.driver?.fullName || 'Driver not assigned'}
                  </Text>
                  <Text className="text-gray-600">
                    Licensed Driver • {trip.driver?.yearsOfExperience || 'Experienced'}
                  </Text>
                </View>
                {trip.driver?.phoneNumber && (
                  <TouchableOpacity className="p-2 bg-primary-50 rounded-lg">
                    <Phone size={18} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Pricing & Notes */}
          <View className="bg-white p-4 mb-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Pricing & Information
            </Text>

            <View className="space-y-2">
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-700">Price per seat</Text>
                <Text className="text-lg font-bold text-primary-600">
                  {formatCurrency(trip.price)}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-t border-gray-100">
                <Text className="text-gray-700">Available seats</Text>
                <Text className="font-medium text-gray-900">
                  {trip.availableSeats} of {trip.totalSeats}
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

        {/* Book Button */}
        <View className="p-4 bg-white border-t border-gray-200">
          <Button
            variant="primary"
            size="large"
            onPress={handleBookTrip}
            disabled={trip.availableSeats === 0}
          >
            {trip.availableSeats === 0 ? 'Fully Booked' : 'Select Seats'}
          </Button>
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
}
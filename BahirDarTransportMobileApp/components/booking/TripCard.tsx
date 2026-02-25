// components/booking/TripCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { 
  Bus, 
  Clock, 
  MapPin, 
  Users, 
  ChevronRight,
  AlertCircle,
  Shield,
} from 'lucide-react-native';
import { Trip } from '../../types/trip';
import { COLORS } from '@/constants/colors';

interface TripCardProps {
  trip: Trip;
  onSelect?: (trip: Trip) => void;
  compact?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ 
  trip, 
  onSelect,
  compact = false 
}) => {

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (available === 0) return 'bg-red-100 text-red-700';
    if (percentage <= 20) return 'bg-orange-100 text-orange-700';
    if (percentage <= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const handlePress = () => {
    
    const tripId = trip._id;
    
    const isAvailable = trip.availableSeats > 0 && trip.tripStatus === 'scheduled';
    
    if (!isAvailable) {
      Alert.alert('Not Available', 'This trip is fully booked or unavailable.');
      return;
    }
    
    if (!tripId) {
      Alert.alert('Error', 'Invalid trip data - missing ID');
      return;
    }
    
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(tripId);
    
    if (tripId === 'index' || !isValidMongoId) {
      console.error('❌ Invalid trip ID:', tripId);
      Alert.alert('Error', 'Invalid trip data. Please try searching again.');
      return;
    }
    
    if (onSelect) {
      onSelect(trip);
    } else {
      router.push({
        pathname: '/tabs/trips/[id]',
        params: { id: tripId }
      });
    }
  };

  const isAvailable = trip.availableSeats > 0 && trip.tripStatus === 'scheduled';
  const duration = '2h 30m'; 
  const availabilityColor = getAvailabilityColor(trip.availableSeats, trip.totalSeats || 50);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isAvailable}
      className={`
        bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm
        ${isAvailable ? 'active:bg-gray-50' : 'opacity-75'}
      `}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-100 p-2 rounded-full mr-3">
              <Bus size={20} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-gray-900 flex-1">
              {trip.origin?.stationName}
            </Text>
          </View>
          
          <View className="ml-10">
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-gray-300 rounded-full" />
              <View className="w-10 h-0.5 bg-gray-300 mx-1" />
              <ChevronRight size={16} color={COLORS.gray400} />
              <View className="w-10 h-0.5 bg-gray-300 mx-1" />
              <View className="w-2 h-2 bg-gray-300 rounded-full" />
            </View>
            <Text className="text-xs text-gray-500 mt-1 ml-1">{duration}</Text>
          </View>

          <View className="flex-row items-center mt-2">
            <View className="bg-red-100 p-2 rounded-full mr-3">
              <MapPin size={20} color={COLORS.danger} />
            </View>
            <Text className="text-lg font-bold text-gray-900">
              {trip.destination?.stationName}
            </Text>
          </View>
        </View>

        <View className={`px-3 py-1.5 rounded-full ${availabilityColor}`}>
          <Text className="text-xs font-semibold">
            {trip.availableSeats === 0 
              ? 'Sold Out' 
              : `${trip.availableSeats} seats`}
          </Text>
        </View>
      </View>

      {/* Time Information */}
      <View className="bg-gray-50 p-4 rounded-xl mb-4">
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Departure</Text>
            <View className="flex-row items-center">
              <Clock size={16} color={COLORS.primary} />
              <Text className="ml-1.5 font-semibold text-gray-900">
                {new Date(trip.departureTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              {new Date(trip.departureTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="text-xs text-gray-500 mb-1">Duration</Text>
            <View className="bg-white px-3 py-1.5 rounded-full border border-gray-200">
              <Text className="text-sm font-medium text-gray-700">{duration}</Text>
            </View>
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs text-gray-500 mb-1">Arrival</Text>
            <View className="flex-row items-center">
              <Clock size={16} color={COLORS.gray500} />
              <Text className="ml-1.5 font-semibold text-gray-900">
                {new Date(trip.arrivalTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              {new Date(trip.arrivalTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View className="flex-row items-center justify-between pt-3 mt-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <View className="bg-gray-100 p-1.5 rounded-full mr-2">
              <Bus size={14} color="#4b5563" />
            </View>
            <Text className="text-sm text-gray-700">
              {trip.vehicle?.carType || 'Standard Bus'}
            </Text>
            <Text className="text-xs text-gray-500 ml-2">
              {trip.vehicle?.plateNumber || ''}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Shield size={14} color={COLORS.secondary} />
            <Text className="text-xs text-green-600 ml-1">Safe Travel</Text>
          </View>
        </View>
      </View>

      {/* Price - Just display price, no button here */}
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Price per seat</Text>
          <View className="flex-row items-baseline">
            <Text className="text-3xl font-bold text-blue-600">
              ETB {trip.price || 0}
            </Text>
          </View>
        </View>

        {/* Simple indicator that this card is clickable */}
        <View className="bg-blue-50 px-4 py-2 rounded-full">
          <Text className="text-blue-600 font-medium">View Details</Text>
        </View>
      </View>

      {/* Notes */}
      {trip.notes && (
        <View className="mt-3 bg-blue-50 p-3 rounded-lg flex-row items-start">
          <AlertCircle size={16} color={COLORS.primary} />
          <Text className="ml-2 text-xs text-blue-700 flex-1">
            {trip.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
// components/booking/TripCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Clock, Car, Users, ArrowRight } from 'lucide-react-native';
import { Trip } from '../../types/trip';
import { formatTime, formatCurrency } from '../../utils/helpers';
import { Button } from '../common/Button';

interface TripCardProps {
  trip: Trip;
}

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const getVehicleIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bus':
      case 'luxury_bus':
        return '🚌';
      case 'minibus':
        return '🚐';
      case 'coaster':
        return '🚍';
      default:
        return '🚗';
    }
  };

  const getStatusColor = (seats: number) => {
    if (seats === 0) return 'bg-red-100 text-red-800';
    if (seats < 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <View className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-gray-200">
      {/* Header with route */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">
            {trip.origin?.stationName} → {trip.destination?.stationName}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {trip.origin?.city} to {trip.destination?.city}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(trip.availableSeats)}`}>
          <Text className="font-semibold text-sm">
            {trip.availableSeats === 0 ? 'Sold Out' : `${trip.availableSeats} seats left`}
          </Text>
        </View>
      </View>

      {/* Trip details */}
      <View className="space-y-3 mb-4">
        <View className="flex-row items-center">
          <Clock size={18} color="#6b7280" />
          <Text className="text-gray-700 ml-2">
            {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}
            {trip.estimatedDuration && (
              <Text className="text-gray-500"> ({trip.estimatedDuration})</Text>
            )}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Car size={18} color="#6b7280" />
          <Text className="text-gray-700 ml-2">
            {trip.vehicle?.carType || 'Standard'} • {getVehicleIcon(trip.vehicle?.carType || '')}
          </Text>
        </View>

        {trip.routePoints && trip.routePoints.length > 0 && (
          <View className="flex-row items-center">
            <ArrowRight size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-2">
              Via: {trip.routePoints.join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Footer with price and action */}
      <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
        <View>
          <Text className="text-2xl font-bold text-primary-600">
            {formatCurrency(trip.price)}
          </Text>
          <Text className="text-gray-500 text-sm">per seat</Text>
        </View>
        
        <Link href={`/trips/${trip.id}`} asChild>
          <Button
            title="Select Seats"
            variant="primary"
            size="medium"
            disabled={trip.availableSeats === 0}
          />
        </Link>
      </View>
    </View>
  );
};
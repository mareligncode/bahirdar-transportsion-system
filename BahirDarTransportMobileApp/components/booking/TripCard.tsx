// components/booking/TripCard.tsx
import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { AppText } from '../common/AppText';
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
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../context/ThemeContext';

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
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (available === 0) return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700';
    if (percentage <= 20) return isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700';
    if (percentage <= 50) return isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
    return isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700';
  };

  const handlePress = () => {

    const tripId = trip._id;

    const isAvailable = trip.availableSeats > 0 && trip.tripStatus === 'scheduled';

    if (!isAvailable) {
      Alert.alert(translate('not_available') || 'Not Available', translate('trip_unavailable') || 'This trip is fully booked or unavailable.');
      return;
    }

    if (!tripId) {
      Alert.alert(translate('error'), translate('invalid_trip_id'));
      return;
    }

    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(tripId);

    if (tripId === 'index' || !isValidMongoId) {
      console.error('❌ Invalid trip ID:', tripId);
      Alert.alert(translate('error'), translate('invalid_trip_data') || 'Invalid trip data. Please try searching again.');
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

  const isAvailable = trip.availableSeats > 0 && (trip.tripStatus === 'scheduled' || trip.tripStatus === 'boarding');
  const duration = '2h 30m';
  const availabilityColor = getAvailabilityColor(trip.availableSeats, trip.totalSeats || 50);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!isAvailable}
      className={`
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5 mb-4 shadow-sm
        ${isAvailable ? 'active:opacity-80' : 'opacity-75'}
      `}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className={`${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} p-2 rounded-full mr-3`}>
              <Bus size={20} color={isDark ? '#60a5fa' : colors.primary} />
            </View>
            <AppText variant="bodyLarge" weight="bold" color={colors.text} className="flex-1">
              {trip.origin?.stationName}
            </AppText>
          </View>

          <View className="ml-10">
            <View className="flex-row items-center">
              <View className={`w-2 h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`} />
              <View className={`w-10 h-0.5 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} mx-1`} />
              <ChevronRight size={16} color={colors.textTertiary} />
              <View className={`w-10 h-0.5 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} mx-1`} />
              <View className={`w-2 h-2 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`} />
            </View>
            <AppText variant="caption" color={colors.textSecondary} className="mt-1 ml-1">{duration}</AppText>
          </View>

          <View className="flex-row items-center mt-2">
            <View className={`${isDark ? 'bg-red-900/30' : 'bg-red-100'} p-2 rounded-full mr-3`}>
              <MapPin size={20} color={isDark ? '#f87171' : colors.error} />
            </View>
            <AppText variant="bodyLarge" weight="bold" color={colors.text}>
              {trip.destination?.stationName}
            </AppText>
          </View>
        </View>

        <View className={`px-3 py-1.5 rounded-full ${availabilityColor}`}>
          <AppText variant="label" weight="semibold">
            {trip.availableSeats === 0
              ? (translate('sold_out') || 'Sold Out')
              : `${trip.availableSeats} ${translate('seats') || 'seats'}`}
          </AppText>
        </View>
      </View>

      {/* Time Information */}
      <View className={`${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-transparent'} border p-4 rounded-xl mb-4`}>
        <View className="flex-row justify-between">
          <View className="flex-1">
            <AppText variant="caption" color={colors.textSecondary} className="mb-1">{translate('departure') || 'Departure'}</AppText>
            <View className="flex-row items-center">
              <Clock size={16} color={colors.primary} />
              <AppText variant="bodyMedium" weight="semibold" color={colors.text} className="ml-1.5">
                {new Date(trip.departureTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} className="mt-1">
              {new Date(trip.departureTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </AppText>
          </View>

          <View className="flex-1 items-center">
            <AppText variant="caption" color={colors.textSecondary} className="mb-1">{translate('duration') || 'Duration'}</AppText>
            <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-3 py-1.5 rounded-full border`}>
              <AppText variant="bodySmall" weight="500" color={colors.text}>{duration}</AppText>
            </View>
          </View>

          <View className="flex-1 items-end">
            <AppText variant="caption" color={colors.textSecondary} className="mb-1">{translate('arrival') || 'Arrival'}</AppText>
            <View className="flex-row items-center">
              <Clock size={16} color={colors.textTertiary} />
              <AppText variant="bodyMedium" weight="semibold" color={colors.text} className="ml-1.5">
                {new Date(trip.arrivalTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} className="mt-1">
              {new Date(trip.arrivalTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </AppText>
          </View>
        </View>

        {/* Vehicle Info */}
        <View className={`flex-row items-center justify-between pt-3 mt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <View className="flex-row items-center">
            <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} p-1.5 rounded-full mr-2`}>
              <Bus size={14} color={colors.textSecondary} />
            </View>
            <AppText variant="bodySmall" color={colors.text}>
              {trip.vehicle?.carType || 'Standard Bus'}
            </AppText>
            <AppText variant="caption" color={colors.textTertiary} className="ml-2">
              {trip.vehicle?.plateNumber || ''}
            </AppText>
          </View>

          <View className="flex-row items-center">
            <Shield size={14} color={isDark ? '#10b981' : colors.secondary} />
            <AppText variant="caption" color={isDark ? '#10b981' : '#16a34a'} className="ml-1">{translate('safe_travel') || 'Safe Travel'}</AppText>
          </View>
        </View>
      </View>

      {/* Price - Just display price, no button here */}
      <View className="flex-row justify-between items-center">
        <View>
          <AppText variant="caption" color={colors.textSecondary} className="mb-1">{translate('price_per_seat') || 'Price per seat'}</AppText>
          <View className="flex-row items-baseline">
            <AppText variant="h1" color={isDark ? '#60a5fa' : colors.primary}>
              {translate('etb')} {trip.price || 0}
            </AppText>
          </View>
        </View>

        {/* Simple indicator that this card is clickable */}
        <View className={`${isDark ? 'bg-blue-900/40' : 'bg-blue-50'} px-4 py-2 rounded-full`}>
          <AppText variant="bodySmall" weight="bold" color={isDark ? '#93c5fd' : '#2563eb'}>{translate('view_details') || 'View Details'}</AppText>
        </View>
      </View>

      {/* Notes */}
      {trip.notes && (
        <View className={`mt-3 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} p-3 rounded-lg flex-row items-start`}>
          <AlertCircle size={16} color={isDark ? '#60a5fa' : colors.primary} />
          <AppText variant="caption" color={isDark ? '#93c5fd' : '#1d4ed8'} className="ml-2 flex-1">
            {trip.notes}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};
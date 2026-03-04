// components/booking/BookingCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Bus,
  Clock,
  MapPin,
  User,
  CreditCard,
  ChevronRight,
  XCircle,
  CheckCircle,
  AlertCircle,
  Clock as PendingIcon
} from 'lucide-react-native';
import { Booking } from '../../types/booking';
import { Trip } from '../../types/trip';
import { COLORS, getBookingStatusColors } from '../../constants/colors';
import { formatTime, formatDate, formatCurrency, formatBookingNumber, calculateDuration } from '../../utils/helpers';

interface BookingCardProps {
  booking: Booking;
  onCancel?: () => void;
  onViewTicket?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onViewTicket
}) => {
  const trip = typeof booking.tripID === 'object' ? booking.tripID as Trip : null;

  const origin = trip?.origin || { stationName: 'Unknown', city: '' };
  const destination = trip?.destination || { stationName: 'Unknown', city: '' };
  const vehicle = trip?.vehicle || { carType: 'Bus', plateNumber: 'N/A', _id: '' };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle size={16} color={COLORS.booking.confirmedText} />;
      case 'pending':
        return <PendingIcon size={16} color={COLORS.booking.pendingText} />;
      case 'cancelled':
        return <XCircle size={16} color={COLORS.booking.cancelledText} />;
      case 'completed':
        return <CheckCircle size={16} color={COLORS.booking.completedText} />;
      default:
        return <AlertCircle size={16} color={COLORS.gray500} />;
    }
  };

  const isCancellable = ['confirmed', 'pending'].includes(booking.status?.toLowerCase() || '');
  const statusColors = getBookingStatusColors(booking.status);

  const duration = trip?.departureTime && trip?.arrivalTime
    ? calculateDuration(trip.departureTime, trip.arrivalTime)
    : '~2h';

  return (
    <View className="bg-white rounded-xl mb-4 shadow-sm border border-gray-200 overflow-hidden">
      <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <View className="bg-blue-100 p-2 rounded-full mr-3">
            <Bus size={20} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900" numberOfLines={1}>
              {origin.stationName} → {destination.stationName}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatBookingNumber(booking._id)}
            </Text>
          </View>
        </View>

        <View
          className="px-2 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: statusColors.bg }}
        >
          {getStatusIcon(booking.status)}
          <Text
            className="ml-1 text-xs font-medium"
            style={{ color: statusColors.text }}
          >
            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
          </Text>
        </View>
      </View>

      {/* Trip Details */}
      <View className="p-4">
        {/* Time and Route */}
        <View className="flex-row justify-between mb-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Departure</Text>
            <Text className="font-semibold text-gray-900">
              {trip?.departureTime ? formatTime(trip.departureTime) : 'N/A'}
            </Text>
            <Text className="text-xs text-gray-500">
              {trip?.departureTime ? formatDate(trip.departureTime) : 'N/A'}
            </Text>
          </View>

          <View className="items-center px-2">
            <Clock size={14} color={COLORS.gray400} />
            <Text className="text-xs text-gray-500 mt-1">Duration</Text>
            <Text className="text-xs font-medium text-gray-700">
              {duration}
            </Text>
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs text-gray-500">Arrival</Text>
            <Text className="font-semibold text-gray-900">
              {trip?.arrivalTime ? formatTime(trip.arrivalTime) : 'N/A'}
            </Text>
            <Text className="text-xs text-gray-500">
              {trip?.arrivalTime ? formatDate(trip.arrivalTime) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Seats and Price */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-wrap flex-1">
            <User size={14} color={COLORS.gray500} />
            <Text className="ml-1 text-sm text-gray-700">
              {booking.seatNumbers?.length || 1} seat(s)
            </Text>
            <View className="flex-row ml-2 flex-wrap">
              {booking.seatNumbers && booking.seatNumbers.length > 0 ? (
                booking.seatNumbers.map((seat, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 px-2 py-0.5 rounded mr-1 mb-1"
                  >
                    <Text className="text-xs font-medium text-gray-700">
                      {seat}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="bg-gray-100 px-2 py-0.5 rounded mr-1">
                  <Text className="text-xs font-medium text-gray-700">
                    Seat {booking.seatNumber || 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View>
            <Text className="text-xs text-gray-500 text-right">Total Price</Text>
            <Text className="font-bold text-blue-600">
              {formatCurrency(booking.totalPrice || booking.amount || (trip?.price ? trip.price * (booking.seatNumbers?.length || 1) : 0))}
            </Text>
            {trip?.price && (booking.seatNumbers?.length || 0) > 1 && (
              <Text className="text-xs text-gray-500 text-right">
                {formatCurrency(trip.price)}/seat
              </Text>
            )}
          </View>
        </View>

        {/* Vehicle Info */}
        <View className="flex-row items-center mb-4">
          <MapPin size={14} color={COLORS.gray500} />
          <Text className="ml-1 text-xs text-gray-600">
            {vehicle.carType} • {vehicle.plateNumber}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row pt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={onViewTicket}
            className="flex-1 flex-row items-center justify-center py-3 mr-2 bg-blue-50 rounded-lg"
            style={{ backgroundColor: `${COLORS.primary}10` }}
          >
            <CreditCard size={16} color={COLORS.primary} />
            <Text className="ml-2 text-blue-600 font-medium">View Ticket</Text>
            <ChevronRight size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {isCancellable && (
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 flex-row items-center justify-center py-3 ml-2 bg-red-50 rounded-lg"
              style={{ backgroundColor: `${COLORS.danger}10` }}
            >
              <XCircle size={16} color={COLORS.danger} />
              <Text className="ml-2 text-red-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Special Requests if any */}
        {booking.specialRequests && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500">Special Requests:</Text>
            <Text className="text-sm text-gray-700 mt-1">{booking.specialRequests}</Text>
          </View>
        )}
      </View>
    </View>
  );
};


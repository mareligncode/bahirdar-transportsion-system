import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText } from '../common/AppText';
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
            <AppText weight="bold" color="#111827" numberOfLines={1}>
              {origin.stationName} → {destination.stationName}
            </AppText>
            <AppText variant="caption" color="#6b7280">
              {formatBookingNumber(booking._id)}
            </AppText>
          </View>
        </View>

        <View
          className="px-2 py-1 rounded-full flex-row items-center"
          style={{ backgroundColor: statusColors.bg }}
        >
          {getStatusIcon(booking.status)}
          <AppText
            variant="label"
            weight="500"
            className="ml-1"
            style={{ color: statusColors.text }}
          >
            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
          </AppText>
        </View>
      </View>

      <View className="p-4">
        {/* Time and Route */}
        <View className="flex-row justify-between mb-3">
          <View className="flex-1">
            <AppText variant="caption" color="#6b7280">Departure</AppText>
            <AppText weight="semibold" color="#111827">
              {trip?.departureTime ? formatTime(trip.departureTime) : 'N/A'}
            </AppText>
            <AppText variant="caption" color="#6b7280">
              {trip?.departureTime ? formatDate(trip.departureTime) : 'N/A'}
            </AppText>
          </View>

          <View className="items-center px-2">
            <Clock size={14} color={COLORS.gray400} />
            <AppText variant="caption" color="#6b7280" className="mt-1">Duration</AppText>
            <AppText variant="caption" weight="500" color="#374151">
              {duration}
            </AppText>
          </View>

          <View className="flex-1 items-end">
            <AppText variant="caption" color="#6b7280">Arrival</AppText>
            <AppText weight="semibold" color="#111827">
              {trip?.arrivalTime ? formatTime(trip.arrivalTime) : 'N/A'}
            </AppText>
            <AppText variant="caption" color="#6b7280">
              {trip?.arrivalTime ? formatDate(trip.arrivalTime) : 'N/A'}
            </AppText>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-wrap flex-1">
            <User size={14} color={COLORS.gray500} />
            <AppText variant="bodySmall" color="#374151" className="ml-1">
              {booking.seatNumbers?.length || 1} seat(s)
            </AppText>
            <View className="flex-row ml-2 flex-wrap">
              {booking.seatNumbers && booking.seatNumbers.length > 0 ? (
                booking.seatNumbers.map((seat, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 px-2 py-0.5 rounded mr-1 mb-1"
                  >
                    <AppText variant="caption" weight="500" color="#374151">
                      {seat}
                    </AppText>
                  </View>
                ))
              ) : (
                <View className="bg-gray-100 px-2 py-0.5 rounded mr-1">
                  <AppText variant="caption" weight="500" color="#374151">
                    Seat {booking.seatNumber || 'N/A'}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          <View>
            <AppText variant="caption" color="#6b7280" className="text-right">Total Price</AppText>
            <AppText weight="bold" color="#2563eb">
              {formatCurrency(booking.totalPrice || booking.amount || (trip?.price ? trip.price * (booking.seatNumbers?.length || 1) : 0))}
            </AppText>
            {trip?.price && (booking.seatNumbers?.length || 0) > 1 && (
              <AppText variant="caption" color="#6b7280" className="text-right">
                {formatCurrency(trip.price)}/seat
              </AppText>
            )}
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <MapPin size={14} color={COLORS.gray500} />
          <AppText variant="caption" color="#4b5563" className="ml-1">
            {vehicle.carType} • {vehicle.plateNumber}
          </AppText>
        </View>

        <View className="flex-row pt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={onViewTicket}
            className="flex-1 flex-row items-center justify-center py-3 mr-2 bg-blue-50 rounded-lg"
            style={{ backgroundColor: `${COLORS.primary}10` }}
          >
            <CreditCard size={16} color={COLORS.primary} />
            <AppText weight="500" color="#2563eb" className="ml-2">View Ticket</AppText>
            <ChevronRight size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {isCancellable && (
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 flex-row items-center justify-center py-3 ml-2 bg-red-50 rounded-lg"
              style={{ backgroundColor: `${COLORS.danger}10` }}
            >
              <XCircle size={16} color={COLORS.danger} />
              <AppText weight="500" color="#dc2626" className="ml-2">Cancel</AppText>
            </TouchableOpacity>
          )}
        </View>

        {booking.specialRequests && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <AppText variant="caption" color="#6b7280">Special Requests:</AppText>
            <AppText variant="bodySmall" color="#374151" className="mt-1">{booking.specialRequests}</AppText>
          </View>
        )}
      </View>
    </View>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setStringAsync } from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Bus,
  User,
  Calendar,
  MapPin,
  Copy,
  AlertTriangle,
  Ticket,
  Eye,
  CreditCard
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { Booking, Trip, Station } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';
import * as Haptics from 'expo-haptics';

export default function BookingConfirmationScreen() {
  const { bookingIds, bookingId, success } = useLocalSearchParams<{
    bookingIds: string;
    bookingId: string;
    success?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getBookingById, cancelBooking, canCancelBooking, currentBooking, loading } = useBooking();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const parsedBookingIds = useMemo(() =>
    bookingIds ? JSON.parse(bookingIds) : (bookingId ? [bookingId] : []),
    [bookingIds, bookingId]
  );

  useEffect(() => {
    if (parsedBookingIds.length > 0 && !currentBooking) {
      fetchAllBookings();
    } else if (currentBooking) {
      setBookings([currentBooking]);
    }
  }, [parsedBookingIds, currentBooking]);

  useEffect(() => {
    if (success === 'true' && bookings.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [success, bookings]);

  const fetchAllBookings = async () => {
    try {
      const allBookings: Booking[] = [];

      for (const id of parsedBookingIds) {
        try {
          const data = await getBookingById(id);
          if (data) {
            allBookings.push(data);
          }
        } catch (error) {
          console.error(`Error fetching booking ${id}:`, error);
        }
      }

      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchBooking = async () => {
    try {
      const data = await getBookingById(bookingId);
      if (data) {
        setBookings([data]);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    }
  };

  const handleCopyCode = async () => {
    const code = bookings[0]?.bookingNumber || bookings[0]?._id?.slice(-6).toUpperCase() || '';
    await setStringAsync(code);
    setCopySuccess(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopySuccess(false), 2000);
    showToast('Booking code copied!', 'success');
  };

  const handleViewTicketDetail = () => {
    if (booking && !isCancelled) {
      router.push(`/tabs/tickets/${booking._id}`);
    }
  };

  const handleViewAllBookings = () => {
    router.push('/(screens)/booking');
  };

  const handleCancelBooking = () => {
    const booking = bookings.length > 0 ? bookings[0] : null;
    if (!booking) return;

    const tripData = (booking.tripID || {}) as Trip;
    const originData = (tripData.origin || {}) as Station;
    const destData = (tripData.destination || {}) as Station;

    let dateStr = 'N/A';
    if (tripData.departureTime) {
      try {
        const d = new Date(tripData.departureTime);
        dateStr = d.toLocaleString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) { }
    }

    const amount = booking.totalPrice || booking.amount || 0;

    const message =
      `Are you sure you want to cancel this booking?\n\n` +
      `${originData.stationName || 'Unknown'} → ${destData.stationName || 'Unknown'}\n` +
      `${dateStr}\n\n` +
      `Refund Amount: ETB ${amount.toLocaleString()}`;

    Alert.alert(
      'Cancel Booking',
      message,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const success = await cancelBooking(booking._id);
            setCancelling(false);
            if (success) {
              showToast('Booking cancelled successfully! Seat(s) released.', 'success');
              // Redirect to booking list to see updated availability
              router.replace('/(screens)/booking');
            }
          }
        }
      ]
    );
  };

  const handleMakePayment = () => {
    if (!booking) return;
    router.push({
      pathname: '/(screens)/payment/checkout',
      params: {
        bookingId: booking._id,
        bookingIds: JSON.stringify(parsedBookingIds),
        seatCount: seatNumbers.length.toString()
      }
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (bookings.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="p-4">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}>
            <ArrowLeft size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <XCircle size={60} color="#ef4444" />
          <Text className="text-xl font-semibold text-gray-800 mt-4">
            Booking Not Found
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            We couldn't find your booking details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const booking = bookings[0];

  const isConfirmed = booking.status?.toLowerCase() === 'confirmed' ||
    (success === 'true' && booking.status?.toLowerCase() !== 'cancelled');
  const isPending = booking.status?.toLowerCase() === 'pending' && success !== 'true';
  const isCancelled = booking.status?.toLowerCase() === 'cancelled';
  const canCancel = canCancelBooking(booking) && !isCancelled;

  const trip = typeof booking.tripID === 'object' && booking.tripID !== null
    ? booking.tripID as Trip
    : {} as Trip;
  const origin = (trip.origin || {}) as Station;
  const destination = (trip.destination || {}) as Station;

  const seatNumbers = bookings.flatMap(booking =>
    booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : [])
  );

  const totalAmount = booking.totalPrice || booking.amount || 0;
  const pricePerSeat = seatNumbers.length > 0 ? totalAmount / seatNumbers.length : 0;

  const statusCardBg = isCancelled ? 'bg-red-50' :
    isConfirmed ? 'bg-green-50' :
      isPending ? 'bg-yellow-50' :
        'bg-gray-50';

  const statusTextColor = isCancelled ? 'text-red-700' :
    isConfirmed ? 'text-green-700' :
      isPending ? 'text-yellow-700' :
        'text-gray-700';

  const cancelBtnClass = cancelling ? 'bg-gray-400' : 'bg-red-500';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Booking Details
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {success === 'true' && !isCancelled && (
          <View className="mx-4 mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <View className="flex-row items-center gap-2">
              <CheckCircle size={24} color="#16a34a" />
              <View className="flex-1">
                <Text className="font-semibold text-green-800">
                  Payment Successful!
                </Text>
                <Text className="text-sm text-green-600">
                  Your booking has been confirmed.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-gray-200">
          <View className={`p-4 ${statusCardBg}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {isCancelled && <XCircle size={24} color="#dc2626" />}
                {isConfirmed && !isCancelled && <CheckCircle size={24} color="#16a34a" />}
                {isPending && !isCancelled && <Clock size={24} color="#ca8a04" />}
                <View>
                  <Text className={`text-lg font-bold ${statusTextColor}`}>
                    {isCancelled ? 'CANCELLED' :
                      isConfirmed ? 'CONFIRMED' :
                        booking.status?.toUpperCase()}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    #{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleCopyCode} className="p-2">
                <Copy size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {copySuccess && (
              <Text className="text-xs text-green-600 mt-1">Copied to clipboard!</Text>
            )}
          </View>

          <View className="p-4">
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <MapPin size={16} color={COLORS.primary} />
                <Text className="text-sm text-gray-600">From</Text>
              </View>
              <Text className="text-lg font-semibold text-gray-800 ml-6">
                {origin.stationName || 'N/A'}
              </Text>

              <View className="flex-row items-center ml-6 my-2">
                <View className="w-2 h-2 bg-gray-300 rounded-full" />
                <View className="flex-1 h-0.5 bg-gray-300 mx-2" />
                <Bus size={16} color={COLORS.primary} />
                <View className="flex-1 h-0.5 bg-gray-300 mx-2" />
                <View className="w-2 h-2 bg-gray-300 rounded-full" />
              </View>

              <View className="flex-row items-center gap-2 mb-2 ml-6">
                <MapPin size={16} color="#ef4444" />
                <Text className="text-sm text-gray-600">To</Text>
              </View>
              <Text className="text-lg font-semibold text-gray-800 ml-12">
                {destination.stationName || 'N/A'}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3 bg-gray-50 p-3 rounded-lg">
              <View className="items-center flex-1">
                <Calendar size={16} color={COLORS.primary} />
                <Text className="text-xs text-gray-500 mt-1">Date</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {formatDate(trip.departureTime)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Clock size={16} color={COLORS.primary} />
                <Text className="text-xs text-gray-500 mt-1">Departure</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {formatTime(trip.departureTime)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Clock size={16} color="#10b981" />
                <Text className="text-xs text-gray-500 mt-1">Arrival</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {formatTime(trip.arrivalTime)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600">Seat Number(s)</Text>
              <View className="flex-row gap-1">
                {seatNumbers.length > 0 ? (
                  seatNumbers.map((seat: number, index: number) => (
                    <View key={index} className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-sm font-bold">{seat}</Text>
                    </View>
                  ))
                ) : (
                  <View className="bg-gray-300 px-3 py-1 rounded-full">
                    <Text className="text-white text-sm font-bold">Not assigned</Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row items-center mb-3">
              <User size={16} color="#6b7280" />
              <Text className="ml-2 text-gray-700">
                {booking.passengerDetails?.fullName || user?.fullName}
              </Text>
            </View>

            <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
              <View>
                <Text className="text-base font-medium text-gray-700">
                  Total Amount
                </Text>
                {seatNumbers.length > 1 && (
                  <Text className="text-xs text-gray-500">
                    {seatNumbers.length} seats
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalAmount)}
                </Text>
                {seatNumbers.length > 1 && (
                  <Text className="text-xs text-gray-500">
                    {formatCurrency(pricePerSeat)} per seat
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 pb-4 gap-3">
          {isPending && (!booking.paymentStatus || booking.paymentStatus === 'pending') && (
            <TouchableOpacity
              onPress={handleMakePayment}
              className="flex-row items-center justify-center py-4 bg-yellow-500 rounded-xl gap-2"
            >
              <CreditCard size={20} color="white" />
              <Text className="font-semibold text-white text-lg">Complete Payment Now</Text>
            </TouchableOpacity>
          )}

          {isPending && booking.paymentStatus === 'success' && (
            <View className="flex-row items-center justify-center py-4 bg-green-500 rounded-xl gap-2">
              <CheckCircle size={20} color="white" />
              <Text className="font-semibold text-white text-lg">Payment Completed - Awaiting Confirmation</Text>
            </View>
          )}

          {isConfirmed && !isCancelled && (
            <TouchableOpacity
              onPress={handleViewTicketDetail}
              className="flex-row items-center justify-center py-4 bg-blue-600 rounded-xl gap-2"
            >
              <Ticket size={20} color="white" />
              <Text className="font-semibold text-white text-lg">View Ticket Details</Text>
            </TouchableOpacity>
          )}

          {canCancel && !isCancelled && (
            <TouchableOpacity
              onPress={handleCancelBooking}
              disabled={cancelling}
              className={`flex-row items-center justify-center py-4 rounded-xl gap-2 ${cancelBtnClass}`}
            >
              {cancelling ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <XCircle size={20} color="white" />
                  <Text className="font-medium text-white text-lg">Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleViewAllBookings}
            className="flex-row items-center justify-center py-4 bg-gray-700 rounded-xl gap-2"
          >
            <Eye size={20} color="white" />
            <Text className="font-medium text-white text-lg">View All Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
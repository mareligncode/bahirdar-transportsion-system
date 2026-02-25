import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Platform
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
  CreditCard,
  Share2,
  Copy,
  AlertTriangle,
  Ticket
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { Booking, Trip, Station } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';

export default function BookingConfirmationScreen() {
  const { bookingId, success } = useLocalSearchParams<{
    bookingId: string;
    success?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getBookingById, cancelBooking, canCancelBooking, currentBooking, loading } = useBooking();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(currentBooking);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (success === 'true') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    if (bookingId && !currentBooking) {
      fetchBooking();
    } else if (currentBooking) {
      setBooking(currentBooking);
    }
  }, [bookingId, currentBooking, success]);

  const fetchBooking = async () => {
    const data = await getBookingById(bookingId);
    if (data) {
      setBooking(data);
    }
  };

  const handleCopyCode = async () => {
    const code = booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase() || '';
    await setStringAsync(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    showToast('Booking code copied to clipboard!', 'success');
  };

  const handleViewTicket = () => {
    if (booking) {
      router.push(`/tabs/tickets/${booking._id}`);
    }
  };

  const handleShare = async () => {
    if (!booking) return;

    const trip = (booking.tripID || {}) as Trip;
    const origin = (trip.origin || {}) as Station;
    const destination = (trip.destination || {}) as Station;
    const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
    const seatNumbers = booking.seatNumber ? [booking.seatNumber] : (booking.seatNumbers || []);
    const totalAmount = booking.totalPrice || booking.amount || 0;

    const message = `🚌 Bahir Dar Transport - Booking Confirmation\n\n` +
      `From: ${origin.stationName || 'Origin'}\n` +
      `To: ${destination.stationName || 'Destination'}\n` +
      `Date: ${departureTime ? formatDate(departureTime) : 'N/A'}\n` +
      `Time: ${departureTime ? formatTime(departureTime) : 'N/A'}\n` +
      `Seat: ${seatNumbers.join(', ')}\n` +
      `Booking #: ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
      `Amount: ${formatCurrency(totalAmount)}\n` +
      `Status: ${booking.status?.toUpperCase() || 'PENDING'}\n\n` +
      `View your ticket in the app for QR code and details.`;

    try {
      await Share.share({
        message,
        title: 'Booking Confirmation'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCancelBooking = () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const success = await cancelBooking(booking._id);
            setCancelling(false);
            if (success) {
              fetchBooking(); // Refresh to show cancelled status
              showToast('Booking cancelled successfully', 'success');
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
        seatCount: (booking.seatNumbers?.length || 1).toString()
      }
    });
  };

  if (loading && !booking) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
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
          <Text className="text-gray-500 text-center mt-2">
            The booking you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/tabs/home')}
            className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold">Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isConfirmed = booking.status?.toLowerCase() === 'confirmed';
  const isPending = booking.status?.toLowerCase() === 'pending';
  const isCancelled = booking.status?.toLowerCase() === 'cancelled';
  const canCancel = canCancelBooking(booking);
  const needsPayment = isPending && (!booking.paymentStatus || booking.paymentStatus === 'pending');

  const trip = (booking.tripID || {}) as Trip;
  const origin = (trip.origin || {}) as Station;
  const destination = (trip.destination || {}) as Station;
  const seatNumbers = booking.seatNumber ? [booking.seatNumber] : (booking.seatNumbers || []);
  const totalAmount = booking.totalPrice || booking.amount || 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Booking Confirmation
        </Text>
        <TouchableOpacity onPress={handleShare}>
          <Share2 size={20} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Confetti effect placeholder */}
      {showConfetti && (
        <View className="absolute top-0 left-0 right-0 h-2 bg-green-500 z-10" />
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Success Banner */}
        {success === 'true' && (
          <View className="mx-4 mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <View className="flex-row items-center gap-2">
              <CheckCircle size={24} color="#16a34a" />
              <View className="flex-1">
                <Text className="font-semibold text-green-800">
                  Payment Successful!
                </Text>
                <Text className="text-sm text-green-600">
                  Your booking has been confirmed. View your ticket for QR code.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Status Card */}
        <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden border border-gray-200">
          <View className={`p-4 ${isConfirmed ? 'bg-green-50' : isPending ? 'bg-yellow-50' : isCancelled ? 'bg-red-50' : 'bg-gray-50'}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {isConfirmed && <CheckCircle size={24} color="#16a34a" />}
                {isPending && <Clock size={24} color="#ca8a04" />}
                {isCancelled && <XCircle size={24} color="#dc2626" />}
                <View>
                  <Text className={`text-lg font-bold ${isConfirmed ? 'text-green-700' :
                    isPending ? 'text-yellow-700' :
                      isCancelled ? 'text-red-700' : 'text-gray-700'
                    }`}>
                    {booking.status?.toUpperCase()}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Booking #{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
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

          {/* Booking Summary */}
          <View className="p-4">
            {/* Route */}
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

            {/* Date & Time */}
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

            {/* Seats */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600">Seat Number(s)</Text>
              <View className="flex-row gap-1">
                {seatNumbers.map((seat: number, index: number) => (
                  <View key={index} className="bg-blue-500 px-3 py-1 rounded-full">
                    <Text className="text-white text-sm font-bold">{seat}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Passenger */}
            <View className="flex-row items-center mb-3">
              <User size={16} color="#6b7280" />
              <Text className="ml-2 text-gray-700">
                {booking.passengerDetails?.fullName || user?.fullName}
              </Text>
            </View>

            {/* Amount */}
            <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
              <Text className="text-base font-medium text-gray-700">
                Total Amount
              </Text>
              <Text className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </Text>
            </View>
            {seatNumbers.length > 1 && (
              <Text className="text-xs text-gray-500 text-right mt-1">
                {seatNumbers.length} seats
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 pb-4 gap-3">
          {/* Payment Button for Pending Bookings */}
          {needsPayment && (
            <TouchableOpacity
              onPress={handleMakePayment}
              className="flex-row items-center justify-center py-4 bg-yellow-500 rounded-xl gap-2"
            >
              <CreditCard size={20} color="white" />
              <Text className="font-semibold text-white">Complete Payment Now</Text>
            </TouchableOpacity>
          )}

          {/* View Ticket Button - Only for confirmed bookings */}
          {isConfirmed && (
            <TouchableOpacity
              onPress={handleViewTicket}
              className="flex-row items-center justify-center py-4 bg-blue-600 rounded-xl gap-2"
            >
              <Ticket size={20} color="white" />
              <Text className="font-semibold text-white">View Ticket</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button - Show if cancellable */}
          {canCancel && !isCancelled && (
            <TouchableOpacity
              onPress={handleCancelBooking}
              disabled={cancelling}
              className={`flex-row items-center justify-center py-3 rounded-xl gap-2 ${cancelling ? 'bg-gray-400' : 'bg-red-500'
                }`}
            >
              {cancelling ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <XCircle size={20} color="white" />
                  <Text className="font-medium text-white">Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Cancelled Message */}
          {isCancelled && (
            <View className="p-4 bg-red-50 rounded-xl border border-red-200 flex-row items-center gap-2">
              <AlertTriangle size={20} color="#dc2626" />
              <Text className="flex-1 text-red-700 text-sm">
                This booking has been cancelled.
                {booking.cancellationReason && ` Reason: ${booking.cancellationReason}`}
              </Text>
            </View>
          )}

          {/* Share Button - Always available */}
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center py-3 bg-white border border-gray-300 rounded-xl gap-2"
          >
            <Share2 size={20} color="#4b5563" />
            <Text className="font-medium text-gray-700">Share Confirmation</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View className="px-4 pt-0 gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/tabs/trips')}
            className="flex-row items-center justify-center py-3 bg-blue-600 rounded-xl gap-2"
          >
            <Bus size={20} color="white" />
            <Text className="font-medium text-white">Book Another Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/tabs/tickets')}
            className="flex-row items-center justify-center py-3 bg-white border border-gray-300 rounded-xl gap-2"
          >
            <Text className="font-medium text-gray-700">View All Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Copy Success Toast */}
      {copySuccess && (
        <View className="absolute bottom-20 left-4 right-4 bg-green-600 py-2 rounded-lg">
          <Text className="text-white text-center text-sm">
            Booking code copied!
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
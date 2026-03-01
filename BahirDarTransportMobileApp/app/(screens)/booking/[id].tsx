// app/(screens)/booking/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Bus,
  Clock,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Copy,
  ChevronRight,
  Ticket,
  AlertTriangle
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { Booking, Trip, Station, Vehicle, Driver } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getBookingById, cancelBooking, canCancelBooking, loading } = useBooking();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    const data = await getBookingById(id);
    if (data) {
      setBooking(data);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    const code = booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase() || '';
    await Clipboard.setStringAsync(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    showToast('Booking code copied to clipboard!', 'success');
  };

  const handleShare = async () => {
    if (!booking) return;

    const trip = (booking.tripID || {}) as Trip;
    const origin = (trip.origin || {}) as Station;
    const destination = (trip.destination || {}) as Station;
    const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
    const seatNumbers = booking.seatNumber ? [booking.seatNumber] : (booking.seatNumbers || []);
    const totalAmount = booking.totalPrice || booking.amount || 0;

    const message = `🚌 Bahir Dar Transport - Booking Details\n\n` +
      `From: ${origin.stationName || 'Origin'}\n` +
      `To: ${destination.stationName || 'Destination'}\n` +
      `Date: ${departureTime ? formatDate(departureTime) : 'N/A'}\n` +
      `Time: ${departureTime ? formatTime(departureTime) : 'N/A'}\n` +
      `Seat: ${seatNumbers.join(', ')}\n` +
      `Booking #: ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
      `Amount: ${formatCurrency(totalAmount)}\n` +
      `Status: ${booking.status?.toUpperCase() || 'PENDING'}`;

    try {
      await Share.share({
        message,
        title: 'Booking Details'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCancelBooking = () => {
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
            const success = await cancelBooking(id);
            setCancelling(false);
            if (success) {
              await fetchBooking();
            }
          }
        }
      ]
    );
  };

  const handleMakePayment = () => {
    router.push({
      pathname: '/(screens)/payment/checkout',
      params: {
        bookingId: id,
        seatCount: (booking?.seatNumbers?.length || 1).toString()
      }
    });
  };

  const handleViewTicket = () => {
    if (booking) {
      router.push(`/tabs/tickets/${booking._id}`);
    }
  };

  if (loading && !refreshing) {
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
            The booking you're looking for doesn't exist or you don't have permission to view it.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(screens)/booking')}
            className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold">View My Bookings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isConfirmed = booking.status?.toLowerCase() === 'confirmed';
  const isPending = booking.status?.toLowerCase() === 'pending';
  const isCancelled = booking.status?.toLowerCase() === 'cancelled';
  const isCompleted = booking.status?.toLowerCase() === 'completed';
  const canCancel = canCancelBooking(booking);
  const needsPayment = isPending && (!booking.paymentStatus || booking.paymentStatus === 'pending');

  const trip = (booking.tripID || {}) as Trip;
  const vehicle = (trip.vehicle || {}) as Vehicle;
  const origin = (trip.origin || {}) as Station;
  const destination = (trip.destination || {}) as Station;
  const driver = (trip.driver || {}) as Driver;
  const seatNumbers = booking.seatNumber ? [booking.seatNumber] : (booking.seatNumbers || []);
  const totalAmount = booking.totalPrice || booking.amount || 0;

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Booking Details
        </Text>
        <TouchableOpacity onPress={handleShare} className="p-2">
          <Share2 size={20} color="#4b5563" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Status Banner */}
        <View className={`p-4 ${isConfirmed ? 'bg-green-50' : isPending ? 'bg-yellow-50' : isCancelled ? 'bg-red-50' : 'bg-gray-50'}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {isConfirmed && <CheckCircle size={20} color="#16a34a" />}
              {isPending && <Clock size={20} color="#ca8a04" />}
              {isCancelled && <XCircle size={20} color="#dc2626" />}
              {isCompleted && <CheckCircle size={20} color="#2563eb" />}
              <View>
                <Text className={`font-semibold ${isConfirmed ? 'text-green-700' :
                  isPending ? 'text-yellow-700' :
                    isCancelled ? 'text-red-700' :
                      'text-gray-700'
                  }`}>
                  {booking.status?.toUpperCase()}
                </Text>
                <Text className="text-xs text-gray-500">
                  Booking #{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCopyCode} className="p-2">
              <Copy size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {copySuccess && (
            <Text className="text-xs text-green-600 mt-1">Copied to clipboard!</Text>
          )}
        </View>

        {/* Main Booking Card */}
        <View className="m-4 bg-white rounded-2xl overflow-hidden border border-gray-200">
          {/* Route Header */}
          <View className="p-4 bg-blue-50 border-b border-blue-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 items-center">
                <Text className="text-xs text-gray-500">From</Text>
                <Text className="font-bold text-gray-800 text-center">
                  {origin.stationName || 'N/A'}
                </Text>
                {origin.city && (
                  <Text className="text-xs text-gray-500">{origin.city}</Text>
                )}
              </View>
              <View className="px-4">
                <Bus size={24} color={COLORS.primary} />
              </View>
              <View className="flex-1 items-center">
                <Text className="text-xs text-gray-500">To</Text>
                <Text className="font-bold text-gray-800 text-center">
                  {destination.stationName || 'N/A'}
                </Text>
                {destination.city && (
                  <Text className="text-xs text-gray-500">{destination.city}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <View className="flex-row items-center gap-1 mb-1">
                  <Clock size={14} color={COLORS.primary} />
                  <Text className="text-xs text-gray-500">Departure</Text>
                </View>
                <Text className="font-semibold text-gray-800">
                  {formatDateTime(trip.departureTime)}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1 mb-1">
                  <Clock size={14} color="#10b981" />
                  <Text className="text-xs text-gray-500">Arrival</Text>
                </View>
                <Text className="font-semibold text-gray-800">
                  {formatDateTime(trip.arrivalTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View className="p-4 gap-4">
            {/* Seat Info */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">Seat Number(s)</Text>
              <View className="flex-row gap-1">
                {seatNumbers.map((seat: number, index: number) => (
                  <View key={index} className="bg-blue-500 px-3 py-1 rounded-full">
                    <Text className="text-white text-sm font-bold">{seat}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Vehicle Info */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">Vehicle</Text>
              <Text className="font-medium text-gray-800">
                {vehicle.carType || 'Bus'} • {vehicle.plateNumber || 'N/A'}
              </Text>
            </View>

            {/* Driver Info */}
            {driver.fullName && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">Driver</Text>
                <Text className="font-medium text-gray-800">
                  {driver.fullName}
                </Text>
              </View>
            )}

            {/* Passenger Details */}
            <View className="mt-2 pt-2 border-t border-gray-200">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Passenger Details
              </Text>
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <User size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-600">
                    {booking.passengerDetails?.fullName || user?.fullName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Phone size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-600">
                    {booking.passengerDetails?.phoneNumber || user?.phoneNumber}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Mail size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-600">
                    {booking.passengerDetails?.email || user?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Info */}
            <View className="mt-2 pt-2 border-t border-gray-200">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Payment Information
              </Text>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <CreditCard size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-600">Status</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${booking.paymentStatus === 'success' ? 'bg-green-100' :
                  booking.paymentStatus === 'pending' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  }`}>
                  <Text className={`text-xs font-medium ${booking.paymentStatus === 'success' ? 'text-green-700' :
                    booking.paymentStatus === 'pending' ? 'text-yellow-700' :
                      'text-gray-700'
                    }`}>
                    {booking.paymentStatus?.toUpperCase() || 'PENDING'}
                  </Text>
                </View>
              </View>
              {booking.paymentMethod && (
                <View className="flex-row justify-between items-center mt-2">
                  <Text className="text-sm text-gray-500">Method</Text>
                  <Text className="text-sm font-medium">
                    {booking.paymentMethod}
                  </Text>
                </View>
              )}
            </View>

            {/* Total Amount */}
            <View className="mt-2 pt-2 border-t border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-medium text-gray-700">
                  Total Amount
                </Text>
                <Text className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              {seatNumbers.length > 1 && (
                <Text className="text-xs text-gray-500 text-right mt-1">
                  {seatNumbers.length} seats × {formatCurrency(totalAmount / seatNumbers.length)}
                </Text>
              )}
            </View>
          </View>

          {/* Footer */}
          <View className="p-3 bg-gray-50 border-t border-gray-200">
            <Text className="text-xs text-gray-400 text-center">
              Booked on: {formatDateTime(booking.bookingDate || booking.createdAt)}
            </Text>
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

          {/* View Ticket Button - Only for confirmed/completed bookings */}
          {(isConfirmed || isCompleted) && (
            <TouchableOpacity
              onPress={handleViewTicket}
              className="flex-row items-center justify-center py-4 bg-blue-600 rounded-xl gap-2"
            >
              <Ticket size={20} color="white" />
              <Text className="font-semibold text-white">View Ticket</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          {canCancel && !isCancelled && (
            <TouchableOpacity
              onPress={handleCancelBooking}
              disabled={cancelling}
              className={`flex-row items-center justify-center py-3 bg-red-500 rounded-xl gap-2 ${cancelling ? 'opacity-50' : ''
                }`}
            >
              {cancelling ? (
                <ActivityIndicator color="white" />
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
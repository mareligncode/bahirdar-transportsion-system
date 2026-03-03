// app/(screens)/booking/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  Ticket,
  AlertTriangle,
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { Booking, Trip, Station, Vehicle } from '../../../types';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  useEffect(() => {
    if (booking) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [booking]);

  const fetchBooking = async () => {
    const data = await getBookingById(id);
    if (data) {
      setBooking(data);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchBooking();
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    const code = booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase() || '';
    await Clipboard.setStringAsync(code);
    setCopySuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopySuccess(false), 2000);
    showToast('Booking code copied!', 'success');
  };

  const handleShare = async () => {
    if (!booking) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const trip = (booking.tripID || {}) as Trip;
    const origin = (trip.origin || {}) as Station;
    const destination = (trip.destination || {}) as Station;
    const departureTime = trip.departureTime ? new Date(trip.departureTime) : null;
    const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);
    const totalAmount = booking.totalPrice || booking.amount || 0;

    const message = `🚌 *Bahir Dar Transport - Booking Details*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*From:* ${origin.stationName || 'Origin'}\n` +
      `*To:* ${destination.stationName || 'Destination'}\n` +
      `*Date:* ${departureTime ? departureTime.toLocaleDateString() : 'N/A'}\n` +
      `*Time:* ${departureTime ? departureTime.toLocaleTimeString() : 'N/A'}\n` +
      `*Seat:* ${seatNumbers.join(', ')}\n` +
      `*Booking #:* ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
      `*Amount:* ${formatCurrency(totalAmount)}\n` +
      `*Status:* ${booking.status?.toUpperCase() || 'PENDING'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Thank you for choosing Bahir Dar Transport System!`;

    try {
      await Share.share({ message, title: 'Booking Details' });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCancelBooking = () => {
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const success = await cancelBooking(id);
            setCancelling(false);
            if (success) {
              showToast('Booking cancelled successfully! Seat(s) released.', 'success');
              // Navigate back to booking list since the booking will be deleted
              router.replace('/(screens)/booking');
            }
          }
        }
      ]
    );
  };

  const handleMakePayment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/tabs/tickets/${booking._id}`);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600 font-medium">Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="px-4 py-3">
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-red-100 w-20 h-20 rounded-full items-center justify-center mb-4">
            <XCircle size={40} color="#ef4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            Booking Not Found
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-base">
            The booking you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(screens)/booking')}
            className="mt-8 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <Text className="text-white font-semibold text-base">View My Bookings</Text>
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
  const seatNumbers = booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []);
  const totalAmount = booking.totalPrice || booking.amount || 0;

  const getStatusConfig = () => {
    if (isConfirmed) return { color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, text: 'CONFIRMED' };
    if (isPending) return { color: '#ca8a04', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock, text: 'PENDING' };
    if (isCancelled) return { color: '#dc2626', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, text: 'CANCELLED' };
    if (isCompleted) return { color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, text: 'COMPLETED' };
    return { color: '#6b7280', bg: 'bg-gray-50', border: 'border-gray-200', icon: AlertCircle, text: 'UNKNOWN' };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={isConfirmed ? ['#16a34a', '#15803d'] :
          isPending ? ['#ca8a04', '#854d0e'] :
            isCancelled ? ['#dc2626', '#991b1b'] :
              ['#1e40af', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-3"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-white">
            Booking Details
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Share2 size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-full mr-3">
              <StatusIcon size={20} color="white" />
            </View>
            <View>
              <Text className="text-white text-xs opacity-80">Booking Status</Text>
              <Text className="text-white font-bold text-lg">{statusConfig.text}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCopyCode}
            className="bg-white/20 px-3 py-2 rounded-lg flex-row items-center"
          >
            <Copy size={14} color="white" />
            <Text className="text-white text-xs ml-1 font-medium">
              {booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        {copySuccess && (
          <Text className="text-white text-xs mt-1 text-center bg-black/20 py-1 rounded">
            Copied to clipboard!
          </Text>
        )}
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
            ]
          }}
          className="mx-4 mt-4"
        >
          <View className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <LinearGradient
              colors={['#3b82f6', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 items-center">
                  <Text className="text-white text-xs opacity-80">From</Text>
                  <Text className="text-white font-bold text-lg text-center">
                    {origin.stationName || 'N/A'}
                  </Text>
                </View>
                <View className="px-4">
                  <View className="bg-white/20 p-2 rounded-full">
                    <Bus size={24} color="white" />
                  </View>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-white text-xs opacity-80">To</Text>
                  <Text className="text-white font-bold text-lg text-center">
                    {destination.stationName || 'N/A'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View className="p-4 border-b border-gray-100">
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                    <Clock size={20} color={COLORS.primary} />
                  </View>
                  <Text className="text-xs text-gray-500">Departure</Text>
                  <Text className="font-bold text-gray-800 text-sm mt-1">
                    {formatTime(trip.departureTime)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {formatDate(trip.departureTime)}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center mb-2">
                    <Clock size={20} color="#10b981" />
                  </View>
                  <Text className="text-xs text-gray-500">Arrival</Text>
                  <Text className="font-bold text-gray-800 text-sm mt-1">
                    {formatTime(trip.arrivalTime)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {formatDate(trip.arrivalTime)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <MapPin size={16} color={COLORS.primary} />
                  </View>
                  <Text className="text-sm font-medium text-gray-700">Seat Number(s)</Text>
                </View>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat: number, index: number) => (
                    <View key={index} className="bg-blue-500 px-4 py-2 rounded-lg shadow-sm">
                      <Text className="text-white text-base font-bold">{seat}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="bg-blue-50 p-4 rounded-xl">
                <Text className="text-sm font-bold text-gray-700 mb-3">Payment Information</Text>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600">Status</Text>
                  <View className={`px-3 py-1 rounded-full ${booking.paymentStatus === 'success' ? 'bg-green-100' :
                      booking.paymentStatus === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                    <Text className={`text-xs font-bold ${booking.paymentStatus === 'success' ? 'text-green-700' :
                        booking.paymentStatus === 'pending' ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                      {(booking.paymentStatus || 'PENDING').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-blue-200">
                  <Text className="text-base font-bold text-gray-800">Total Amount</Text>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalAmount)}
                    </Text>
                    {seatNumbers.length > 1 && (
                      <Text className="text-xs text-gray-500 mt-1">
                        {seatNumbers.length} seats × {formatCurrency(totalAmount / seatNumbers.length)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <View className="px-4 pb-8 gap-3">
          {needsPayment && (
            <TouchableOpacity
              onPress={handleMakePayment}
              className="mt-4 bg-yellow-500 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            >
              <CreditCard size={20} color="white" />
              <Text className="font-bold text-white text-lg ml-2">Complete Payment Now</Text>
            </TouchableOpacity>
          )}

          {(isConfirmed || isCompleted) && (
            <TouchableOpacity
              onPress={handleViewTicket}
              className="mt-4 bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            >
              <Ticket size={20} color="white" />
              <Text className="font-bold text-white text-lg ml-2">View Ticket</Text>
            </TouchableOpacity>
          )}

          {canCancel && !isCancelled && (
            <TouchableOpacity
              onPress={handleCancelBooking}
              disabled={cancelling}
              className={`mt-3 bg-red-500 py-3 rounded-xl flex-row items-center justify-center ${cancelling ? 'opacity-50' : ''
                }`}
            >
              {cancelling ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <XCircle size={20} color="white" />
                  <Text className="font-medium text-white text-base ml-2">Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isCancelled && (
            <View className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={20} color="#dc2626" />
                <Text className="flex-1 text-red-700 text-sm font-medium">
                  This booking has been cancelled.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
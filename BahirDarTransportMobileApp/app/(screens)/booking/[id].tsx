import React, { useState, useEffect, useRef } from 'react';
import {
  View,
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
import { AppText } from '../../../components/common/AppText';
import { useTranslation } from '../../../hooks/useTranslation';
import { useTheme } from '../../../context/ThemeContext';
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
  const { translate } = useTranslation();
  const { colors, isDark } = useTheme();

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
    showToast(translate('booking_code_copied'), 'success');
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

    const message = `🚌 *${translate('share_booking_header')}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*${translate('from')}:* ${origin.stationName || translate('not_available')}\n` +
      `*${translate('to')}:* ${destination.stationName || translate('not_available')}\n` +
      `*${translate('date')}:* ${departureTime ? departureTime.toLocaleDateString() : translate('not_available')}\n` +
      `*${translate('time')}:* ${departureTime ? departureTime.toLocaleTimeString() : translate('not_available')}\n` +
      `*${translate('seats')}:* ${seatNumbers.join(', ')}\n` +
      `*${translate('booking')} #:* ${booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}\n` +
      `*${translate('price')}:* ${formatCurrency(totalAmount)}\n` +
      `*${translate('status')}:* ${booking.status?.toUpperCase() || translate('status_pending')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${translate('share_thank_you')}`;

    try {
      await Share.share({ message, title: translate('share_booking_title') });
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
      `${translate('cancel_booking_msg')}\n\n` +
      `${originData.stationName || translate('unknown')} → ${destData.stationName || translate('unknown')}\n` +
      `${dateStr}\n\n` +
      `${translate('refund_amount_label')}: ETB ${amount.toLocaleString()}`;

    Alert.alert(
      translate('cancel_booking_btn'),
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
              showToast(translate('booking_cancelled_success_msg'), 'success');
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="bodyMedium" color={colors.textSecondary} className="mt-4">{translate('loading')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
        <View className="px-4 py-3">
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}
            style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <View style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2' }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
            <XCircle size={40} color="#ef4444" />
          </View>
          <AppText variant="h2" weight="bold" color={colors.text} className="mt-4">
            {translate('booking_not_found')}
          </AppText>
          <AppText variant="bodyMedium" color={colors.textSecondary} className="text-center mt-2">
            {translate('booking_not_found_msg')}
          </AppText>
          <TouchableOpacity
            onPress={() => router.push('/(screens)/booking')}
            style={{ backgroundColor: colors.primary }}
            className="mt-8 py-3 px-8 rounded-xl shadow-lg"
          >
            <AppText variant="bodyMedium" weight="semibold" color="white">{translate('my_bookings')}</AppText>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={isDark ? 
          (isConfirmed ? ['#065f46', '#064e3b'] :
           isPending ? ['#854d0e', '#713f12'] :
           isCancelled ? ['#7f1d1d', '#991b1b'] :
           ['#1e3a8a', '#1e40af']) :
          (isConfirmed ? ['#16a34a', '#15803d'] :
           isPending ? ['#ca8a04', '#854d0e'] :
           isCancelled ? ['#dc2626', '#991b1b'] :
           ['#1e40af', '#3b82f6'])}
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
          <AppText variant="h2" weight="bold" color="white" className="flex-1 text-center">
            {translate('booking_details') || 'Booking Details'}
          </AppText>
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
              <AppText variant="caption" color="rgba(255,255,255,0.8)">{translate('booking_status') || 'Booking Status'}</AppText>
                <AppText variant="bodyLarge" weight="bold" color="white">
                  {isCancelled ? translate('cancelled_status') :
                    isConfirmed ? translate('confirmed_status') :
                      isCompleted ? translate('status_completed') :
                        booking.status?.toUpperCase()}
                </AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCopyCode}
            className="bg-white/20 px-3 py-2 rounded-lg flex-row items-center"
          >
            <Copy size={14} color="white" />
            <AppText variant="caption" weight="medium" color="white" className="ml-1">
              {booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
            </AppText>
          </TouchableOpacity>
        </View>
        {copySuccess && (
          <AppText variant="caption" color="white" className="mt-1 text-center bg-black/20 py-1 rounded">
            {translate('booking_code_copied')}
          </AppText>
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
          <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-transparent'} rounded-2xl overflow-hidden shadow-lg border`}>
            <LinearGradient
              colors={['#3b82f6', '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 items-center">
                  <AppText variant="caption" color="rgba(255,255,255,0.8)">{translate('from')}</AppText>
                  <AppText variant="bodyLarge" weight="bold" color="white" className="text-center">
                    {origin.stationName || 'N/A'}
                  </AppText>
                </View>
                <View className="px-4">
                  <View className="bg-white/20 p-2 rounded-full">
                    <Bus size={24} color="white" />
                  </View>
                </View>
                <View className="flex-1 items-center">
                  <AppText variant="caption" color="rgba(255,255,255,0.8)">{translate('to')}</AppText>
                  <AppText variant="bodyLarge" weight="bold" color="white" className="text-center">
                    {destination.stationName || 'N/A'}
                  </AppText>
                </View>
              </View>
            </LinearGradient>

            <View style={{ borderColor: colors.border, borderBottomWidth: 1 }} className="p-4">
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe' }} className="w-10 h-10 rounded-full items-center justify-center mb-2">
                    <Clock size={20} color={isDark ? '#60a5fa' : colors.primary} />
                  </View>
                  <AppText variant="caption" color={colors.textSecondary}>{translate('departure') || 'Departure'}</AppText>
                  <AppText variant="bodyMedium" weight="bold" color={colors.text} className="mt-1">
                    {formatTime(trip.departureTime)}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {formatDate(trip.departureTime)}
                  </AppText>
                </View>
                <View className="items-center flex-1">
                  <View style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#d1fae5' }} className="w-10 h-10 rounded-full items-center justify-center mb-2">
                    <Clock size={20} color="#10b981" />
                  </View>
                  <AppText variant="caption" color={colors.textSecondary}>{translate('arrival') || 'Arrival'}</AppText>
                  <AppText variant="bodyMedium" weight="bold" color={colors.text} className="mt-1">
                    {formatTime(trip.arrivalTime)}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {formatDate(trip.arrivalTime)}
                  </AppText>
                </View>
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                    <MapPin size={16} color={colors.primary} />
                  </View>
                  <AppText variant="bodyMedium" weight="medium" color={colors.text}>{translate('seat')} Number(s)</AppText>
                </View>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat: number, index: number) => (
                    <View key={index} style={{ backgroundColor: colors.primary }} className="px-4 py-2 rounded-lg shadow-sm">
                      <AppText variant="bodyLarge" weight="bold" color="white">{seat}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#eff6ff' }} className="p-4 rounded-xl">
                <AppText variant="bodyMedium" weight="bold" color={colors.text} className="mb-3">{translate('payment_information')}</AppText>
                <View className="flex-row justify-between items-center mb-2">
                  <AppText variant="bodySmall" color={colors.textSecondary}>{translate('status') || 'Status'}</AppText>
                  <View className={`px-3 py-1 rounded-full ${booking.paymentStatus === 'success' ? (isDark ? 'bg-green-900/30' : 'bg-green-100') :
                      booking.paymentStatus === 'pending' ? (isDark ? 'bg-yellow-900/30' : 'bg-yellow-100') : (isDark ? 'bg-gray-800' : 'bg-gray-100')
                    }`}>
                    <AppText variant="caption" weight="bold" color={booking.paymentStatus === 'success' ? (isDark ? '#4ade80' : '#16a34a') :
                        booking.paymentStatus === 'pending' ? (isDark ? '#fbbf24' : '#ca8a04') : colors.textSecondary
                      }>
                      {(booking.paymentStatus || 'PENDING').toUpperCase()}
                    </AppText>
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' }} className="flex-row justify-between items-center mt-3 pt-3">
                  <AppText variant="bodyLarge" weight="bold" color={colors.text}>{translate('total_amount') || 'Total Amount'}</AppText>
                  <View className="items-end">
                    <AppText variant="h2" weight="bold" color={isDark ? '#60a5fa' : colors.primary}>
                      {formatCurrency(totalAmount)}
                    </AppText>
                    {seatNumbers.length > 1 && (
                      <AppText variant="caption" color={colors.textSecondary} className="mt-1">
                        {seatNumbers.length} {translate('seats') || 'seats'} × {formatCurrency(totalAmount / seatNumbers.length)}
                      </AppText>
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
              <AppText variant="bodyLarge" weight="bold" color="white" className="ml-2">{translate('complete_payment_now')}</AppText>
            </TouchableOpacity>
          )}

          {(isConfirmed || isCompleted) && (
            <TouchableOpacity
              onPress={handleViewTicket}
              style={{ backgroundColor: colors.primary }}
              className="mt-4 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            >
              <Ticket size={20} color="white" />
              <AppText variant="bodyLarge" weight="bold" color="white" className="ml-2">{translate('view_ticket') || 'View Ticket'}</AppText>
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
                  <AppText variant="bodyMedium" weight="medium" color="white" className="ml-2">{translate('cancel_booking')}</AppText>
                </>
              )}
            </TouchableOpacity>
          )}

          {isCancelled && (
            <View style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca', borderWidth: 1 }} className="mt-4 p-4 rounded-xl">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={20} color="#dc2626" />
                  <AppText variant="bodySmall" weight="medium" color="#dc2626" className="flex-1">
                    {translate('cancelled_status')}
                  </AppText>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
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
  Ticket,
  Eye,
  CreditCard
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/common/Toast';
import { useTranslation } from '../../../hooks/useTranslation';
import { AppText } from '../../../components/common/AppText';
import { useTheme } from '../../../context/ThemeContext';
import { Booking, Trip, Station } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
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
  const { translate } = useTranslation();
  const { colors, isDark } = useTheme();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const parsedBookingIds = useMemo(() =>
    bookingIds ? JSON.parse(bookingIds) : (bookingId ? [bookingId] : []),
    [bookingIds, bookingId]
  );

  const fetchAllBookings = useCallback(async () => {
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
  }, [parsedBookingIds, getBookingById]);

  useEffect(() => {
    if (parsedBookingIds.length > 0 && !currentBooking) {
      fetchAllBookings();
    } else if (currentBooking) {
      setBookings([currentBooking]);
    }
  }, [parsedBookingIds, currentBooking, fetchAllBookings]);

  useEffect(() => {
    if (success === 'true' && bookings.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [success, bookings]);


  const handleCopyCode = async () => {
    const code = bookings[0]?.bookingNumber || bookings[0]?._id?.slice(-6).toUpperCase() || '';
    await setStringAsync(code);
    setCopySuccess(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopySuccess(false), 2000);
    showToast(translate('booking_code_copied'), 'success');
  };

  const handleViewTicketDetail = () => {
    if (booking && !isCancelled) {
      router.push(`/tabs/tickets/${String(booking._id)}`);
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
      } catch { }
    }

    const amount = booking.totalPrice || booking.amount || 0;

    const message =
      `${translate('cancel_booking_msg')}\n\n` +
      `${originData.stationName || translate('unknown')} → ${destData.stationName || translate('unknown')}\n` +
      `${dateStr}\n\n` +
      `${translate('refund_amount_label')}: ${formatCurrency(amount)}`;

    Alert.alert(
      translate('cancel_booking_confirm'),
      message,
      [
        { text: translate('keep_booking_btn'), style: 'cancel' },
        {
          text: translate('yes_cancel_btn'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const success = await cancelBooking(booking._id);
            setCancelling(false);
            if (success) {
              showToast(translate('booking_cancelled_success'), 'success');
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
      <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText color={colors.textSecondary} className="mt-4">{translate('loading')}</AppText>
      </SafeAreaView>
    );
  }

  if (bookings.length === 0) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1">
        <View className="p-4">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <XCircle size={60} color="#ef4444" />
          <AppText variant="h2" weight="bold" color={colors.text} className="mt-4">
            {translate('booking_not_found')}
          </AppText>
          <AppText color={colors.textSecondary} className="text-center mt-2">
            {translate('booking_not_found_desc')}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const booking = bookings[0];

  const isConfirmed = booking.status?.toLowerCase() === 'confirmed' ||
    (success === 'true' && booking.status?.toLowerCase() !== 'cancelled');
  const isPending = booking.status?.toLowerCase() === 'pending' && success !== 'true';
  const isCancelled = booking.status?.toLowerCase() === 'cancelled';
  const isPaymentPending = !booking.paymentStatus || booking.paymentStatus?.toLowerCase() === 'pending';
  const canCancel = canCancelBooking(booking) && !isCancelled && isPending;

  const trip = typeof booking.tripID === 'object' && booking.tripID !== null
    ? booking.tripID as Trip
    : {} as Trip;
  const origin = (trip.origin || {}) as Station;
  const destination = (trip.destination || {}) as Station;

  const seatNumbers = bookings.flatMap(booking =>
    booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : [])
  );

  const totalAmount = booking.totalPrice || booking.amount || 0;

  const cancelBtnClass = cancelling ? 'bg-gray-400' : 'bg-red-600';


  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }} className="px-4 py-3 border-b flex-row items-center">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <AppText variant="bodyLarge" weight="bold" color={colors.text}>
            {translate('share_booking_details')}
          </AppText>
        </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {success === 'true' && !isCancelled && (
          <View className={`mx-4 mt-4 p-4 ${isDark ? 'bg-green-900/20 border-green-800/30' : 'bg-green-50 border-green-200'} rounded-xl border`}>
          <View className="flex-row items-center gap-2">
            <CheckCircle size={24} color="#16a34a" />
            <View className="flex-1">
              <AppText weight="bold" color={isDark ? '#4ade80' : '#166534'}>
                {translate('payment_successful_title')}
              </AppText>
              <AppText variant="caption" color={isDark ? '#4ade80' : '#15803d'} style={{ opacity: 0.8 }}>
                {translate('booking_confirmed_desc')}
              </AppText>
            </View>
          </View>
          </View>
        )}

        <View style={{ backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }} className="mx-4 mt-4 rounded-2xl overflow-hidden border">
          <View className={`p-4 ${isCancelled ? (isDark ? 'bg-red-900/20' : 'bg-red-50') :
            isConfirmed ? (isDark ? 'bg-green-900/20' : 'bg-green-50') :
              isPending ? (isDark ? 'bg-yellow-900/20' : 'bg-yellow-50') :
                (isDark ? 'bg-gray-800' : 'bg-gray-50')}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {isCancelled && <XCircle size={24} color="#dc2626" />}
                {isConfirmed && !isCancelled && <CheckCircle size={24} color="#16a34a" />}
                {isPending && !isCancelled && <Clock size={24} color="#ca8a04" />}
                <View>
                  <AppText variant="h3" weight="bold" color={isCancelled ? (isDark ? '#f87171' : '#b91c1c') :
                    isConfirmed ? (isDark ? '#4ade80' : '#15803d') :
                      isPending ? (isDark ? '#fbbf24' : '#a16207') :
                        colors.text}>
                    {isCancelled ? translate('cancelled_status') :
                      isConfirmed ? translate('confirmed_status') :
                        booking.status?.toUpperCase()}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    #{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
                  </AppText>
                </View>
              </View>
              <TouchableOpacity onPress={handleCopyCode} className="p-2">
                <Copy size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {copySuccess && (
                <AppText variant="caption" color={isDark ? '#4ade80' : '#166534'} className="mt-1">{translate('copied_to_clipboard')}</AppText>
            )}
          </View>

          <View className="p-4">
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <MapPin size={16} color={isDark ? '#60a5fa' : colors.primary} />
                <AppText variant="caption" color={colors.textSecondary}>{translate('from')}</AppText>
              </View>
              <AppText variant="bodyLarge" weight="bold" color={colors.text} className="ml-6">
                {origin.stationName || translate('not_available')}
              </AppText>

              <View className="flex-row items-center ml-6 my-2">
                <View className={`w-2 h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
                <View className={`flex-1 h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />
                <Bus size={16} color={isDark ? '#60a5fa' : colors.primary} />
                <View className={`flex-1 h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />
                <View className={`w-2 h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
              </View>

              <View className="flex-row items-center gap-2 mb-2 ml-6">
                <MapPin size={16} color="#ef4444" />
                <AppText variant="caption" color={colors.textSecondary}>{translate('to')}</AppText>
              </View>
              <AppText variant="bodyLarge" weight="bold" color={colors.text} className="ml-12">
                {destination.stationName || translate('not_available')}
              </AppText>
            </View>

            <View className={`flex-row justify-between mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-lg`}>
              <View className="items-center flex-1">
                <Calendar size={16} color={isDark ? '#60a5fa' : colors.primary} />
                <AppText variant="caption" color={colors.textTertiary} className="mt-1">{translate('date')}</AppText>
                <AppText variant="bodySmall" weight="bold" color={colors.text}>
                  {formatDate(trip.departureTime)}
                </AppText>
              </View>
              <View className="items-center flex-1">
                <Clock size={16} color={isDark ? '#60a5fa' : colors.primary} />
                <AppText variant="caption" color={colors.textTertiary} className="mt-1">{translate('departure')}</AppText>
                <AppText variant="bodySmall" weight="bold" color={colors.text}>
                  {formatTime(trip.departureTime)}
                </AppText>
              </View>
              <View className="items-center flex-1">
                <Clock size={16} color="#10b981" />
                <AppText variant="caption" color={colors.textTertiary} className="mt-1">{translate('arrival')}</AppText>
                <AppText variant="bodySmall" weight="bold" color={colors.text}>
                  {formatTime(trip.arrivalTime)}
                </AppText>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <AppText color={colors.textSecondary}>{translate('seat_label', { number: '1' })}</AppText>
              <View className="flex-row gap-1">
                {seatNumbers.length > 0 ? (
                  seatNumbers.map((seat: number, index: number) => (
                    <View key={index} className="bg-blue-600 px-3 py-1 rounded-full">
                      <AppText variant="bodySmall" weight="bold" color="white">{seat}</AppText>
                    </View>
                  ))
                ) : (
                  <View className={`${isDark ? 'bg-gray-700' : 'bg-gray-300'} px-3 py-1 rounded-full`}>
                    <AppText variant="bodySmall" weight="bold" color="white">{translate('not_assigned')}</AppText>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row items-center mb-3">
              <User size={16} color={colors.textTertiary} />
              <AppText color={colors.textSecondary} className="ml-2">
                {booking.passengerDetails?.fullName || user?.fullName}
              </AppText>
            </View>

            <View style={{ borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb' }} className="flex-row justify-between items-center pt-3 border-t">
              <View>
                <AppText weight="medium" color={colors.textSecondary}>
                  {translate('total_amount')}
                </AppText>
                {seatNumbers.length > 1 && (
                  <AppText variant="caption" color={colors.textTertiary}>
                    {translate('passenger_count', { count: seatNumbers.length })}
                  </AppText>
                )}
              </View>
              <View className="items-end">
                <AppText variant="h2" weight="bold" color={isDark ? '#60a5fa' : colors.primary}>
                  {formatCurrency(totalAmount)}
                </AppText>
                {seatNumbers.length > 1 && (
                  <AppText variant="caption" color={colors.textTertiary}>
                    {translate('price_per_seat')}
                  </AppText>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 pb-4 gap-3 mt-6">
          {isPending && (!booking.paymentStatus || booking.paymentStatus === 'pending') && (
            <TouchableOpacity
              onPress={handleMakePayment}
              className="flex-row items-center justify-center py-4 bg-amber-500 rounded-xl gap-2"
            >
              <CreditCard size={20} color="white" />
              <AppText variant="bodyLarge" weight="bold" color="white">{translate('complete_payment')}</AppText>
            </TouchableOpacity>
          )}

          {isPending && booking.paymentStatus === 'success' && (
            <View className="flex-row items-center justify-center py-4 bg-green-600 rounded-xl gap-2">
              <CheckCircle size={20} color="white" />
              <AppText variant="bodyLarge" weight="bold" color="white">{translate('payment_completed_awaiting')}</AppText>
            </View>
          )}

          {isConfirmed && !isCancelled && (
            <TouchableOpacity
              onPress={handleViewTicketDetail}
              className="flex-row items-center justify-center py-4 bg-blue-600 rounded-xl gap-2"
            >
              <Ticket size={20} color="white" />
              <AppText variant="bodyLarge" weight="bold" color="white">{translate('view_ticket_details_btn')}</AppText>
            </TouchableOpacity>
          )}



          {canCancel && (
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
                  <AppText variant="bodyLarge" weight="medium" color="white">{translate('cancel_booking_btn')}</AppText>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleViewAllBookings}
            className={`flex-row items-center justify-center py-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-700'} border rounded-xl gap-2`}
          >
            <Eye size={20} color="white" />
              <AppText variant="bodyLarge" weight="medium" color="white">{translate('view_all_bookings_btn')}</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
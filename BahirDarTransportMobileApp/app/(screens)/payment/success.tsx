import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  CheckCircle,
  Ticket,
  Home,
  Receipt,
  ArrowRight,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useBooking } from '../../../hooks/useBooking';
import { usePayment } from '../../../hooks/usePayment';
import { useTranslation } from '../../../hooks/useTranslation';
import { Booking, Trip, Station } from '../../../types';
import { formatCurrency, formatDate, formatTime } from '../../../utils/helpers';
import { AppText } from '../../../components/common/AppText';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { txRef, bookingIds, amount } = useLocalSearchParams<{
    txRef: string;
    bookingIds: string;
    amount: string;
  }>();
  
  const { getBookingById, fetchMyBookings } = useBooking();
  const { verifyPayment, loading: paymentLoading } = usePayment();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  const parsedBookingIds = bookingIds ? JSON.parse(bookingIds) : [];
  const totalAmount = parseFloat(amount || '0');

  const verifyPaymentStatus = React.useCallback(async () => {
    try {
      if (txRef) {
        const payment = await verifyPayment(txRef);
        if (payment && payment.payment && payment.payment.bookingID) {
          const bookingId = typeof payment.payment.bookingID === 'string' 
            ? payment.payment.bookingID 
            : payment.payment.bookingID._id;
          
          const booking = await getBookingById(bookingId);
          if (booking) {
            setPaymentBooking(booking);
          }
        }
      }
      await fetchMyBookings();
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setLoading(false);
    }
  }, [txRef, verifyPayment, getBookingById, fetchMyBookings]);

  useEffect(() => {
    if (txRef) {
      verifyPaymentStatus();
    } else {
      setLoading(false);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [txRef, verifyPaymentStatus]);

  const handleViewTickets = () => {
    if (parsedBookingIds.length > 0) {
      router.replace({
        pathname: '/tabs/tickets',
        params: { highlight: parsedBookingIds[0] }
      });
    } else if (paymentBooking) {
      router.replace({
        pathname: '/tabs/tickets',
        params: { highlight: paymentBooking._id }
      });
    } else {
      router.replace('/tabs/tickets');
    }
  };

  const handleGoHome = () => {
    router.replace('/tabs/home');
  };

  const handleViewBooking = () => {
    const ids = parsedBookingIds.length > 0 
      ? parsedBookingIds 
      : paymentBooking ? [paymentBooking._id] : [];
      
    if (ids.length > 0) {
      router.replace({
        pathname: '/(screens)/booking/confirmation',
        params: { 
          bookingIds: JSON.stringify(ids),
          success: 'true'
        }
      });
    }
  };
  const trip = paymentBooking?.tripID as Trip;
  const origin = trip?.origin as Station;
  const destination = trip?.destination as Station;

  if (loading || paymentLoading) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText color={colors.textSecondary} className="mt-4">{translate('verifying_payment')}</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1" edges={['top', 'left', 'right']}>
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: -20 }}
          fadeOut={true}
          autoStart={true}
        />
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center px-6 py-12">
          <LinearGradient
            colors={['#16a34a', '#15803d']}
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
          >
            <CheckCircle size={48} color="white" />
          </LinearGradient>

          <AppText variant="h1" weight="bold" color={colors.text} className="text-center">
            {translate('payment_successful_title')}
          </AppText>
          
          <AppText color={colors.textSecondary} className="text-center mt-2 text-lg">
            {translate('thank_you_payment')}
          </AppText>
          <LinearGradient
            colors={isDark ? ['#1e1e1e', '#2d2d2d'] : ['#3b82f6', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className={`w-full p-6 rounded-3xl mt-8 shadow-xl ${isDark ? 'border border-gray-700' : ''}`}
          >
            <AppText color="white" className="text-center text-sm" style={{ opacity: 0.8 }}>
              {translate('total_amount_paid')}
            </AppText>
            <AppText color="white" variant="h1" weight="bold" className="text-center mt-2">
              {formatCurrency(totalAmount)}
            </AppText>
            <View className="flex-row justify-center mt-4">
              <View className="bg-white/20 px-4 py-2 rounded-full">
                <AppText color="white" weight="medium">
                  {parsedBookingIds.length || 1} {parsedBookingIds.length === 1 ? translate('booking_singular') : translate('booking_plural')}
                </AppText>
              </View>
            </View>
            {trip && (
              <View className="mt-4 pt-4 border-t border-white/20">
                <View className="flex-row items-center justify-center mb-2">
                  <MapPin size={14} color="white" />
                <AppText color="white" className="text-sm ml-1" style={{ opacity: 0.9 }}>
                  {origin?.stationName} → {destination?.stationName}
                </AppText>
                </View>
                <View className="flex-row items-center justify-center">
                  <Calendar size={14} color="white" />
                  <AppText color="white" className="text-sm ml-1" style={{ opacity: 0.9 }}>
                    {formatDate(trip.departureTime)}
                  </AppText>
                  <Clock size={14} color="white" className="ml-3" />
                  <AppText color="white" className="text-sm ml-1" style={{ opacity: 0.9 }}>
                    {formatTime(trip.departureTime)}
                  </AppText>
                </View>
              </View>
            )}
          </LinearGradient>
          <View className="w-full mt-8 gap-3">
            <TouchableOpacity
              onPress={handleViewTickets}
              className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            >
              <Ticket size={20} color="white" />
              <AppText color="white" weight="semibold" className="ml-2 text-base">
                {translate('view_my_tickets')}
              </AppText>
              <ArrowRight size={20} color="white" className="ml-2" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewBooking}
              className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-700'} py-4 rounded-xl border flex-row items-center justify-center shadow-lg`}
            >
              <Receipt size={20} color="white" />
              <AppText color="white" weight="semibold" className="ml-2 text-base">
                {translate('view_booking_details')}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoHome}
              className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100'} py-4 rounded-xl flex-row items-center justify-center`}
            >
              <Home size={20} color={isDark ? colors.textSecondary : "#4b5563"} />
              <AppText color={isDark ? colors.text : colors.gray700} weight="semibold" className="ml-2 text-base">
                {translate('go_to_home')}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Transaction Note */}
          <AppText variant="caption" color={colors.textTertiary} className="text-center mt-8">
            {translate('confirmation_sent')}
          </AppText>

          {txRef && (
          <AppText variant="caption" color={colors.textTertiary} className="text-center mt-2">
            {translate('transaction_ref')}: {txRef}
          </AppText>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
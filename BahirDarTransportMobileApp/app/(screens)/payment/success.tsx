// app/(screens)/payment/success.tsx
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
  MapPin,
  Bus
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useBooking } from '../../../hooks/useBooking';
import { usePayment } from '../../../hooks/usePayment';
import { Booking, Trip, Station } from '../../../types';
import { formatCurrency, formatDate, formatTime } from '../../../utils/helpers';

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
  
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  const parsedBookingIds = bookingIds ? JSON.parse(bookingIds) : [];
  const totalAmount = parseFloat(amount || '0');

  useEffect(() => {
    if (txRef) {
      verifyPaymentStatus();
    } else {
      setLoading(false);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [txRef]);

  const verifyPaymentStatus = async () => {
    try {
      if (txRef) {
        const payment = await verifyPayment(txRef);
        if (payment && payment.bookingID) {
          const bookingId = typeof payment.bookingID === 'string' 
            ? payment.bookingID 
            : payment.bookingID._id;
          
          const booking = await getBookingById(bookingId);
          if (booking) {
            setPaymentBooking(booking);
          }
          setVerified(true);
        }
      }
      
      // Refresh bookings to get updated status
      await fetchMyBookings();
    } catch (error) {
      console.error('Payment verification error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Get trip details for display
  const trip = paymentBooking?.tripID as Trip;
  const origin = trip?.origin as Station;
  const destination = trip?.destination as Station;

  if (loading || paymentLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Verifying payment...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
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
          {/* Success Icon */}
          <LinearGradient
            colors={['#16a34a', '#15803d']}
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
          >
            <CheckCircle size={48} color="white" />
          </LinearGradient>

          <Text className="text-3xl font-bold text-gray-800 text-center">
            Payment Successful!
          </Text>
          
          <Text className="text-gray-500 text-center mt-2 text-lg">
            Thank you for your payment
          </Text>

          {/* Amount Card */}
          <LinearGradient
            colors={['#3b82f6', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="w-full p-6 rounded-3xl mt-8 shadow-xl"
          >
            <Text className="text-blue-100 text-center text-sm">
              Total Amount Paid
            </Text>
            <Text className="text-white text-4xl font-bold text-center mt-2">
              {formatCurrency(totalAmount)}
            </Text>
            
            {/* Booking Summary */}
            <View className="flex-row justify-center mt-4">
              <View className="bg-white/20 px-4 py-2 rounded-full">
                <Text className="text-white font-medium">
                  {parsedBookingIds.length || 1} {parsedBookingIds.length === 1 ? 'Booking' : 'Bookings'}
                </Text>
              </View>
            </View>

            {/* Trip Details if available */}
            {trip && (
              <View className="mt-4 pt-4 border-t border-white/20">
                <View className="flex-row items-center justify-center mb-2">
                  <MapPin size={14} color="white" />
                  <Text className="text-white text-sm ml-1">
                    {origin?.stationName} → {destination?.stationName}
                  </Text>
                </View>
                <View className="flex-row items-center justify-center">
                  <Calendar size={14} color="white" />
                  <Text className="text-white text-sm ml-1">
                    {formatDate(trip.departureTime)}
                  </Text>
                  <Clock size={14} color="white" className="ml-3" />
                  <Text className="text-white text-sm ml-1">
                    {formatTime(trip.departureTime)}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Action Buttons */}
          <View className="w-full mt-8 gap-3">
            <TouchableOpacity
              onPress={handleViewTickets}
              className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            >
              <Ticket size={20} color="white" />
              <Text className="text-white font-semibold ml-2 text-base">
                View My Tickets
              </Text>
              <ArrowRight size={20} color="white" className="ml-2" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewBooking}
              className="bg-gray-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
            >
              <Receipt size={20} color="white" />
              <Text className="text-white font-semibold ml-2 text-base">
                View Booking Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoHome}
              className="bg-gray-100 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Home size={20} color="#4b5563" />
              <Text className="text-gray-700 font-semibold ml-2 text-base">
                Go to Home
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Note */}
          <Text className="text-xs text-gray-400 text-center mt-8">
            A confirmation has been sent to your email and phone.
            You can also view your tickets in the Tickets tab.
          </Text>

          {txRef && (
            <Text className="text-xs text-gray-400 text-center mt-2">
              Transaction Ref: {txRef}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
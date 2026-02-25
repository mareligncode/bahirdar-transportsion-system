import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Receipt
} from 'lucide-react-native';
import { usePayment } from '../../../hooks/usePayment';
import { Payment, Booking, Trip } from '../../../types';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { payments, getPaymentHistory, loading } = usePayment();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    await getPaymentHistory();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#16a34a" />;
      case 'pending':
        return <Clock size={20} color="#ca8a04" />;
      case 'processing':
        return <Clock size={20} color="#3b82f6" />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={20} color="#dc2626" />;
      default:
        return <AlertCircle size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed':
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Helper function to safely get booking details
  const getBookingDetails = (payment: Payment) => {
    // Check if bookingID is an object or a string
    const booking = typeof payment.bookingID === 'object' && payment.bookingID !== null
      ? payment.bookingID as Booking
      : null;

    // If booking exists and tripID is an object, get trip details
    const trip = booking && typeof booking.tripID === 'object' && booking.tripID !== null
      ? booking.tripID as Trip
      : null;

    return { booking, trip };
  };

  const renderPaymentItem = (payment: Payment) => {
    const { booking, trip } = getBookingDetails(payment);

    // Safely access properties with optional chaining
    const originName = trip?.origin?.stationName || 'N/A';
    const destinationName = trip?.destination?.stationName || 'N/A';
    const bookingId = booking?._id;

    return (
      <TouchableOpacity
        key={payment._id}
        onPress={() => {
          if (bookingId) {
            router.push({
              pathname: '/(screens)/booking/confirmation',
              params: { bookingId }
            });
          }
        }}
        disabled={!bookingId}
        className="bg-white p-4 mb-3 rounded-xl border border-gray-200"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">
              {originName} → {destinationName}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {formatDate(payment.createdAt)}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full flex-row items-center gap-1 ${getStatusColor(payment.paymentStatus)}`}>
            {getStatusIcon(payment.paymentStatus)}
            <Text className="text-xs font-medium">
              {payment.paymentStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <View className="flex-row items-center gap-1">
            <CreditCard size={14} color="#6b7280" />
            <Text className="text-xs text-gray-500">
              {payment.paymentMethod || 'Mobile Money'}
            </Text>
          </View>
          <Text className="font-bold text-blue-600">
            ETB {payment.amount?.toLocaleString()}
          </Text>
        </View>

        {payment.gatewayTransactionID && (
          <Text className="text-xs text-gray-400 mt-1">
            Ref: {payment.gatewayTransactionID.slice(-8)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-6">
      <Receipt size={60} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-800 mt-4">
        No Payment History
      </Text>
      <Text className="text-gray-500 text-center mt-2">
        You haven't made any payments yet. Book a trip to get started!
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/tabs/trips')}
        className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
      >
        <Text className="text-white font-semibold">Book a Trip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/tabs/home')} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          Payment History
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Loading payment history...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {payments.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <Text className="text-sm text-gray-500 mb-3">
                {payments.length} payment(s) found
              </Text>
              {payments.map(renderPaymentItem)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
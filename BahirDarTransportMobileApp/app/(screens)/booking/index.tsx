// app/(screens)/booking/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bus,
  Clock,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  ChevronRight
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { Booking, Trip } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';

export default function BookingsListScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { bookings, fetchMyBookings, loading } = useBooking();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchMyBookings();
      } else {
        router.replace('/auth/Login');
      }
    }, [isAuthenticated])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyBookings();
    setRefreshing(false);
  };

  const getTripDetails = (booking: Booking) => {
    const trip = typeof booking.tripID === 'object' && booking.tripID !== null
      ? booking.tripID as Trip
      : null;
    return trip;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircle size={14} color="#16a34a" />;
      case 'pending': return <Clock size={14} color="#ca8a04" />;
      case 'cancelled': return <XCircle size={14} color="#dc2626" />;
      case 'completed': return <CheckCircle size={14} color="#2563eb" />;
      default: return <AlertCircle size={14} color="#6b7280" />;
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const trip = getTripDetails(item);
    const originName = trip?.origin?.stationName || 'Unknown';
    const destinationName = trip?.destination?.stationName || 'Unknown';
    const departureTime = trip?.departureTime;
    const seatNumbers = item.seatNumber ? [item.seatNumber] : (item.seatNumbers || []);
    const totalAmount = item.totalPrice || item.amount || 0;
    const needsPayment = item.status?.toLowerCase() === 'pending' &&
      (!item.paymentStatus || item.paymentStatus === 'pending');

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(screens)/booking/${item._id}`)}
        activeOpacity={0.7}
        className="bg-white mb-3 rounded-xl border border-gray-200 overflow-hidden"
      >
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                <Bus size={16} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">
                  {originName} → {destinationName}
                </Text>
                <Text className="text-xs text-gray-500">
                  #{item.bookingNumber || item._id?.slice(-6).toUpperCase()}
                </Text>
              </View>
            </View>
            <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
              <Text className="text-xs font-medium">
                {item.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mb-2">
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color="#6b7280" />
              <Text className="text-xs text-gray-600">
                {departureTime ? formatDate(departureTime) : 'N/A'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#6b7280" />
              <Text className="text-xs text-gray-600">
                {departureTime ? formatTime(departureTime) : 'N/A'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text className="text-xs text-gray-500">Seats:</Text>
              <Text className="text-xs font-medium text-gray-700">
                {seatNumbers.join(', ')}
              </Text>
            </View>
            <Text className="font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          {needsPayment && (
            <View className="mt-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
              <Text className="text-yellow-700 text-xs text-center">
                Payment required - Tap to complete
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-6">
      <Receipt size={60} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-800 mt-4">
        No Bookings Found
      </Text>
      <Text className="text-gray-500 text-center mt-2">
        You haven't made any bookings yet.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/tabs/trips')}
        className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
      >
        <Text className="text-white font-semibold">Book a Trip</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Redirecting...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#4b5563" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-800">
          My Bookings
        </Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Loading your bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
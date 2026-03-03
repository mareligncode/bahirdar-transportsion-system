// app/(screens)/booking/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { Booking, Trip } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';

export default function BookingsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { bookings, fetchMyBookings, loading } = useBooking();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('all');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchMyBookings();
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        router.replace('/auth/Login');
      }
    }, [isAuthenticated])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchMyBookings();
    setRefreshing(false);
  };

  const getFilteredBookings = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => {
          const departureTime = getDepartureTime(b);
          return departureTime && new Date(departureTime) > now && b.status !== 'cancelled';
        });
      case 'past':
        return bookings.filter(b => {
          const departureTime = getDepartureTime(b);
          return departureTime && new Date(departureTime) < now && b.status !== 'cancelled';
        });
      case 'pending':
        return bookings.filter(b => b.status === 'pending');
      default:
        return bookings;
    }
  };

  const getTripDetails = (booking: Booking) => {
    return typeof booking.tripID === 'object' && booking.tripID !== null
      ? booking.tripID as Trip
      : null;
  };

  const getDepartureTime = (booking: Booking): string | null => {
    const trip = getTripDetails(booking);
    return trip?.departureTime || null;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700', icon: '#16a34a' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '#ca8a04' };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', icon: '#dc2626' };
      case 'completed': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '#2563eb' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '#6b7280' };
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

  const renderBookingCard = ({ item, index }: { item: Booking; index: number }) => {
    const trip = getTripDetails(item);
    const originName = trip?.origin?.stationName || 'Unknown';
    const destinationName = trip?.destination?.stationName || 'Unknown';
    const departureTime = trip?.departureTime;
    const seatNumbers = item.seatNumbers || (item.seatNumber ? [item.seatNumber] : []);
    const totalAmount = item.totalPrice || item.amount || 0;
    const statusColors = getStatusColor(item.status);
    const needsPayment = item.status?.toLowerCase() === 'pending' &&
      (!item.paymentStatus || item.paymentStatus === 'pending');
    const isPaid = item.paymentStatus === 'success';
    
    const cardStyle = {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    };

    return (
      <Animated.View style={cardStyle}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/(screens)/booking/${item._id}`);
          }}
          activeOpacity={0.95}
          className="bg-white mb-3 rounded-xl overflow-hidden shadow-lg"
        >
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <LinearGradient
                  colors={['#3b82f6', '#1e40af']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                >
                  <Bus size={18} color="white" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800 text-base">
                    {originName} → {destinationName}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    #{item.bookingNumber || item._id?.slice(-6).toUpperCase()}
                  </Text>
                </View>
              </View>
              <View className={`px-3 py-1.5 rounded-full ${statusColors.bg}`}>
                <View className="flex-row items-center gap-1.5">
                  {getStatusIcon(item.status)}
                  <Text className={`text-xs font-bold ${statusColors.text}`}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-3">
              <View className="flex-row items-center">
                <Calendar size={14} color={COLORS.textSecondary} />
                <Text className="text-xs text-gray-600 ml-1.5">
                  {departureTime ? formatDate(departureTime) : 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color={COLORS.textSecondary} />
                <Text className="text-xs text-gray-600 ml-1.5">
                  {departureTime ? formatTime(departureTime) : 'N/A'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-500 mr-2">Seats:</Text>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat, idx) => (
                    <View key={idx} className="bg-blue-500 px-3 py-1 rounded-lg">
                      <Text className="text-white text-xs font-bold">{seat}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text className="font-bold text-blue-600 text-base">
                {formatCurrency(totalAmount)}
              </Text>
            </View>

            {needsPayment && (
              <View className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <Text className="text-yellow-700 text-xs font-bold text-center">
                  ⚡ Payment required - Tap to complete
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => {
    const filteredCount = getFilteredBookings().length;
    const totalCount = bookings.length;

    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-4 pt-2 pb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">My Bookings</Text>
            <View className="w-10" />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-blue-100 text-sm">Total Bookings</Text>
              <Text className="text-white text-3xl font-bold">{totalCount}</Text>
            </View>
            <View className="bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white font-medium">
                {filteredCount} {filter === 'all' ? 'total' : filter}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4 py-3 bg-white border-b border-gray-100"
        >
          <View className="flex-row gap-2">
            {(['all', 'upcoming', 'past', 'pending'] as const).map((filterType) => (
              <TouchableOpacity
                key={filterType}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(filterType);
                }}
                className={`
                  px-5 py-2.5 rounded-full
                  ${filter === filterType
                    ? 'bg-blue-600 shadow-md'
                    : 'bg-gray-100'
                  }
                `}
              >
                <Text className={`
                  text-sm font-medium capitalize
                  ${filter === filterType ? 'text-white' : 'text-gray-700'}
                `}>
                  {filterType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    const filteredBookings = getFilteredBookings();
    
    if (filteredBookings.length > 0) return null;

    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="flex-1 justify-center items-center px-6 mt-10"
      >
        <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
          <Receipt size={40} color={COLORS.textTertiary} />
        </View>
        <Text className="text-xl font-bold text-gray-800 text-center">
          No {filter !== 'all' ? filter : ''} Bookings
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          {filter !== 'all'
            ? `You don't have any ${filter} bookings.`
            : "You haven't made any bookings yet."}
        </Text>
        {filter !== 'all' ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFilter('all');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <Text className="text-white font-semibold">Show All Bookings</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/tabs/trips');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <Text className="text-white font-semibold">Book Your First Trip</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600 font-medium">Redirecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
      />

      {loading && !refreshing && filteredBookings.length === 0 && (
        <View className="absolute inset-0 bg-white/80 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600 font-medium">Loading your bookings...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
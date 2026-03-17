import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/common/AppText';
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
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';

export default function BookingsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { bookings, fetchMyBookings, loading } = useBooking();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();

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
    const s = status?.toLowerCase();
    switch (s) {
      case 'confirmed': return { bg: isDark ? 'rgba(22,163,74,0.1)' : 'bg-green-100', text: isDark ? '#4ade80' : 'text-green-700', icon: isDark ? '#4ade80' : '#16a34a' };
      case 'pending': return { bg: isDark ? 'rgba(202,138,4,0.1)' : 'bg-yellow-100', text: isDark ? '#fbbf24' : 'text-yellow-700', icon: isDark ? '#fbbf24' : '#ca8a04' };
      case 'cancelled': return { bg: isDark ? 'rgba(220,38,38,0.1)' : 'bg-red-100', text: isDark ? '#f87171' : 'text-red-700', icon: isDark ? '#f87171' : '#dc2626' };
      case 'completed': return { bg: isDark ? 'rgba(37,99,235,0.1)' : 'bg-blue-100', text: isDark ? '#60a5fa' : 'text-blue-700', icon: isDark ? '#60a5fa' : '#2563eb' };
      default: return { bg: isDark ? 'rgba(107,114,128,0.1)' : 'bg-gray-100', text: isDark ? '#9ca3af' : 'text-gray-700', icon: isDark ? '#9ca3af' : '#6b7280' };
    }
  };

  const getStatusIcon = (status?: string) => {
    const colors = getStatusColor(status);
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircle size={14} color={colors.icon} />;
      case 'pending': return <Clock size={14} color={colors.icon} />;
      case 'cancelled': return <XCircle size={14} color={colors.icon} />;
      case 'completed': return <CheckCircle size={14} color={colors.icon} />;
      default: return <AlertCircle size={14} color={colors.icon} />;
    }
  };

  const renderBookingCard = ({ item, index }: { item: Booking; index: number }) => {
    const trip = getTripDetails(item);
    const originName = trip?.origin?.stationName || translate('unknown');
    const destinationName = trip?.destination?.stationName || translate('unknown');
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
          style={isDark ? { elevation: 0, shadowOpacity: 0 } : {}}
          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} mb-3 rounded-xl overflow-hidden shadow-lg border`}>
        <View className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <LinearGradient
                  colors={isDark ? [colors.primary, '#1e3a8a'] : ['#3b82f6', '#1e40af']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                >
                  <Bus size={18} color="white" />
                </LinearGradient>
                <View className="flex-1">
                  <AppText className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'} text-base`}>
                    {originName} → {destinationName}
                  </AppText>
                  <AppText className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                    #{item.bookingNumber || item._id?.slice(-6).toUpperCase()}
                  </AppText>
                </View>
              </View>
              <View className={`px-3 py-1.5 rounded-full ${statusColors.bg}`}>
                <View className="flex-row items-center gap-1.5">
                  {getStatusIcon(item.status)}
                  <AppText className={`text-xs font-bold ${isDark ? '' : statusColors.text}`} style={isDark ? { color: statusColors.text } : {}}>
                    {translate(`ticket_status_${item.status?.toLowerCase()}` as any)}
                  </AppText>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-3">
              <View className="flex-row items-center">
                <Calendar size={14} color={colors.textSecondary} />
                <AppText className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} ml-1.5`}>
                  {departureTime ? formatDate(departureTime) : translate('not_available')}
                </AppText>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color={colors.textSecondary} />
                <AppText className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} ml-1.5`}>
                  {departureTime ? formatTime(departureTime) : translate('not_available')}
                </AppText>
              </View>
            </View>

            <View className={`flex-row items-center justify-between pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <View className="flex-row items-center">
                <AppText className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`}>{translate('seats_label')}</AppText>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat, idx) => (
                    <View key={idx} className="bg-blue-500 px-3 py-1 rounded-lg">
                      <AppText className="text-white text-xs font-bold">{seat}</AppText>
                    </View>
                  ))}
                </View>
              </View>
              <AppText className="font-bold text-blue-600 text-base">
                {formatCurrency(totalAmount)}
              </AppText>
            </View>

            {needsPayment && (
              <View style={{ backgroundColor: isDark ? 'rgba(234,179,8,0.1)' : '#fefce8', borderColor: isDark ? 'rgba(234,179,8,0.2)' : '#fef08a' }} className="mt-3 p-3 rounded-lg border">
                <AppText className={`${isDark ? 'text-yellow-500' : 'text-yellow-700'} text-xs font-bold text-center`}>
                  {translate('payment_required_tap')}
                </AppText>
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
          colors={isDark ? ['#1e1e1e', '#2d2d2d'] : ['#1e40af', '#3b82f6']}
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
            <AppText className="text-2xl font-bold text-white">{translate('my_bookings_title')}</AppText>
            <View className="w-10" />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-blue-100 text-sm">{translate('total_bookings')}</AppText>
              <AppText className="text-white text-3xl font-bold">{totalCount}</AppText>
            </View>
            <View className="bg-white/20 px-4 py-2 rounded-full">
              <AppText className="text-white font-medium">
                {filteredCount} {filter === 'all' ? translate('total_label') : translate(`${filter}_tickets` as any)}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className={`px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
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
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }
                `}
              >
                  <AppText className={filter === filterType ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'} weight={filter === filterType ? 'bold' : 'medium'}>
                    {translate(`${filterType}_tickets` as any)}
                  </AppText>
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
        <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-20 h-20 rounded-full items-center justify-center mb-4`}>
          <Receipt size={40} color={isDark ? colors.textTertiary : '#9CA3AF'} />
        </View>
        <AppText className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} text-center`}>
          {filter !== 'all' 
            ? translate('no_bookings_title', { filter: translate(`${filter}_tickets` as any) })
            : translate('no_bookings_general')}
        </AppText>
        <AppText className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center mt-2`}>
          {filter !== 'all'
            ? translate('no_bookings_desc', { filter: translate(`${filter}_tickets` as any) })
            : translate('no_bookings_general_desc')}
        </AppText>
        {filter !== 'all' ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFilter('all');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <AppText className="text-white font-semibold">{translate('show_all_bookings')}</AppText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/tabs/trips');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <AppText className="text-white font-semibold">{translate('book_first_trip')}</AppText>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`} edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>{translate('redirecting')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top', 'left', 'right']}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
      />

      {loading && !refreshing && filteredBookings.length === 0 && (
        <View className={`absolute inset-0 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'} items-center justify-center`}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>{translate('my_bookings_desc')}</AppText>
        </View>
      )}
    </SafeAreaView>
  );
}
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  Calendar,
  Filter
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePayment } from '../../../hooks/usePayment';
import { useAuth } from '../../../hooks/useAuth';
import { Payment, Booking, Trip } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { payments, getPaymentHistory, loading } = usePayment();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchHistory();
      } else {
        router.replace('/auth/Login');
      }
    }, [isAuthenticated])
  );

  const fetchHistory = async () => {
    await getPaymentHistory();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      case 'processing':
        return <Clock size={20} color="#ca8a04" />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={20} color="#dc2626" />;
      case 'refunded':
        return <Receipt size={20} color="#6b7280" />;
      default:
        return <AlertCircle size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'pending':
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'failed':
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'pending':
      case 'processing': return 'bg-yellow-50 border-yellow-200';
      case 'failed':
      case 'cancelled': return 'bg-red-50 border-red-200';
      case 'refunded': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getBookingDetails = (payment: Payment) => {
    const booking = typeof payment.bookingID === 'object' && payment.bookingID !== null
      ? payment.bookingID as Booking
      : null;

    const trip = booking && typeof booking.tripID === 'object' && booking.tripID !== null
      ? booking.tripID as Trip
      : null;

    return { booking, trip };
  };

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.paymentStatus === filter);
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const { booking, trip } = getBookingDetails(item);

    const originName = trip?.origin?.stationName || 'N/A';
    const destinationName = trip?.destination?.stationName || 'N/A';
    const bookingId = booking?._id;
    const statusColors = getStatusColor(item.paymentStatus);
    const badgeStyle = getStatusBadgeStyle(item.paymentStatus);

    return (
      <TouchableOpacity
        key={item._id}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (bookingId) {
            router.push({
              pathname: '/(screens)/booking/confirmation',
              params: { bookingId }
            });
          }
        }}
        disabled={!bookingId}
        className="bg-white p-4 mb-3 rounded-xl border border-gray-200 shadow-sm"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="font-semibold text-gray-800 text-base">
              {originName} → {destinationName}
            </Text>
            <View className="flex-row items-center mt-1">
              <Calendar size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <View className={`px-3 py-1.5 rounded-full border ${badgeStyle} flex-row items-center gap-1.5`}>
            {getStatusIcon(item.paymentStatus)}
            <Text className={`text-xs font-medium ${statusColors.split(' ')[1]}`}>
              {item.paymentStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <View className="flex-row items-center gap-2">
            <CreditCard size={14} color="#6b7280" />
            <Text className="text-xs text-gray-500">
              {item.paymentMethod === 'mobile_money' ? 'Mobile Money' : 
               item.paymentMethod === 'card' ? 'Card' : 'Cash'}
            </Text>
          </View>
          <Text className="font-bold text-blue-600 text-lg">
            {formatCurrency(item.amount)}
          </Text>
        </View>

        {item.gatewayTransactionID && (
          <Text className="text-xs text-gray-400 mt-2">
            Ref: {item.gatewayTransactionID}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const filteredPayments = getFilteredPayments();
    const totalSpent = filteredPayments
      .filter(p => p.paymentStatus === 'success')
      .reduce((sum, p) => sum + p.amount, 0);

    return (
      <View>
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 pt-2 pb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Payments</Text>
            <View className="w-10" />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-blue-100 text-sm">Total Spent</Text>
              <Text className="text-white text-3xl font-bold">
                {formatCurrency(totalSpent)}
              </Text>
            </View>
            <View className="bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white font-medium">
                {filteredPayments.length} transactions
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
            {(['all', 'success', 'pending', 'failed'] as const).map((filterType) => (
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
      </View>
    );
  };

  const renderEmptyState = () => {
    const filteredPayments = getFilteredPayments();
    
    if (filteredPayments.length > 0) return null;

    return (
      <View className="flex-1 justify-center items-center px-6 mt-10">
        <View className="bg-gray-100 w-24 h-24 rounded-full items-center justify-center mb-4">
          <Receipt size={48} color={COLORS.textTertiary} />
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center">
          No {filter !== 'all' ? filter : ''} Payments
        </Text>
        <Text className="text-gray-500 text-center mt-2 text-base">
          {filter !== 'all'
            ? `You don't have any ${filter} payments.`
            : "You haven't made any payments yet."}
        </Text>
        {filter !== 'all' ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFilter('all');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <Text className="text-white font-semibold text-base">Show All Payments</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/tabs/trips');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <Text className="text-white font-semibold text-base">Book Your First Trip</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const filteredPayments = getFilteredPayments();

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
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
        initialNumToRender={10}
        maxToRenderPerBatch={15}
      />

      {loading && !refreshing && filteredPayments.length === 0 && (
        <View className="absolute inset-0 bg-white/80 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600 font-medium">Loading payment history...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
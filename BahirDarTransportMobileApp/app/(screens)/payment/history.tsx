import React, { useState, useCallback } from 'react';
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
  Calendar
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { usePayment } from '../../../hooks/usePayment';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../hooks/useTranslation';
import { Payment, Booking, Trip } from '../../../types';
import { formatCurrency } from '../../../utils/helpers';
import { AppText } from '../../../components/common/AppText';
import { useTheme } from '../../../context/ThemeContext';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { payments, getPaymentHistory, loading } = usePayment();
  const { translate } = useTranslation();
  const { isDark, colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');

  const fetchHistory = useCallback(async () => {
    await getPaymentHistory();
  }, [getPaymentHistory]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchHistory();
      } else {
        router.replace('/auth/Login');
      }
    }, [isAuthenticated, fetchHistory, router])
  );

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
        return <CheckCircle size={20} color={isDark ? '#4ade80' : "#16a34a"} />;
      case 'pending':
      case 'processing':
        return <Clock size={20} color={isDark ? '#fbbf24' : "#ca8a04"} />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={20} color={isDark ? '#f87171' : "#dc2626"} />;
      case 'refunded':
        return <Receipt size={20} color={colors.textSecondary} />;
      default:
        return <AlertCircle size={20} color={colors.textSecondary} />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'success': return {
        badge: isDark ? 'bg-green-900/20 border-green-800/30' : 'bg-green-50 border-green-200',
        text: isDark ? '#4ade80' : '#166534'
      };
      case 'pending':
      case 'processing': return {
        badge: isDark ? 'bg-yellow-900/20 border-yellow-800/30' : 'bg-yellow-50 border-yellow-200',
        text: isDark ? '#fbbf24' : '#92400e'
      };
      case 'failed':
      case 'cancelled': return {
        badge: isDark ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50 border-red-200',
        text: isDark ? '#f87171' : '#b91c1c'
      };
      case 'refunded':
      case 'default': return {
        badge: isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
        text: isDark ? colors.textSecondary : colors.textSecondary
      };
      default: return {
        badge: isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
        text: colors.textSecondary
      };
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
    const statusStyles = getStatusStyles(item.paymentStatus);
    const bookingId = booking?._id;

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
        style={{ backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border }}
        className="p-4 mb-3 rounded-xl border shadow-sm"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <AppText variant="bodyMedium" weight="bold" color={colors.text}>
              {originName} → {destinationName}
            </AppText>
            <View className="flex-row items-center mt-1">
              <Calendar size={12} color={colors.textTertiary} />
              <AppText variant="caption" color={colors.textSecondary} className="ml-1">
                {formatDate(item.createdAt)}
              </AppText>
            </View>
          </View>
          <View className={`px-3 py-1.5 rounded-full border ${statusStyles.badge} flex-row items-center gap-1.5`}>
            {getStatusIcon(item.paymentStatus)}
            <AppText variant="caption" weight="bold" style={{ color: statusStyles.text }}>
              {translate(`status_${item.paymentStatus?.toLowerCase()}` as any).toUpperCase()}
            </AppText>
          </View>
        </View>

        <View style={{ borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : colors.borderLight }} className="flex-row justify-between items-center mt-2 pt-2 border-t">
          <View className="flex-row items-center gap-2">
            <CreditCard size={14} color={colors.textSecondary} />
            <AppText variant="caption" color={colors.textSecondary}>
              {item.paymentMethod === 'mobile_money' ? translate('mobile_money') : 
               item.paymentMethod === 'card' ? translate('card_payment') : translate('cash_payment')}
            </AppText>
          </View>
          <AppText variant="bodyLarge" weight="bold" color={isDark ? '#60a5fa' : colors.primary}>
            {formatCurrency(item.amount)}
          </AppText>
        </View>

        {item.gatewayTransactionID && (
          <AppText variant="caption" color={colors.textTertiary} className="mt-2">
            {translate('reference_label') || 'Ref'}: {item.gatewayTransactionID}
          </AppText>
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
          colors={isDark ? ['#1e1e1e', '#2d2d2d'] : ['#1e40af', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 pt-2 pb-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white/20'} items-center justify-center`}
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <AppText color="white" variant="h2" weight="bold">{translate('payments')}</AppText>
            <View className="w-10" />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <AppText color="white" variant="caption" style={{ opacity: 0.8 }}>{translate('total_spent_label')}</AppText>
              <AppText color="white" variant="h1" weight="bold">
                {formatCurrency(totalSpent)}
              </AppText>
            </View>
            <View className={`${isDark ? 'bg-gray-700' : 'bg-white/20'} px-4 py-2 rounded-full`}>
              <AppText color="white" weight="medium">
                {translate('transactions_count', { count: filteredPayments.length })}
              </AppText>
            </View>
          </View>
        </LinearGradient>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ backgroundColor: colors.card, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
          className="px-4 py-3 border-b"
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
                    : isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }
                `}
              >
                <AppText weight="medium" style={{ 
                  color: filter === filterType ? 'white' : colors.textSecondary,
                  fontSize: 14,
                  textTransform: 'capitalize'
                }}>
                  {translate(`filter_${filterType}` as any)}
                </AppText>
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
        <View className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} w-24 h-24 rounded-full items-center justify-center mb-4`}>
          <Receipt size={48} color={colors.textTertiary} />
        </View>
        <AppText variant="h2" weight="bold" color={colors.text} className="text-center">
          {translate('no_payments_title', { filter: filter !== 'all' ? translate(`filter_${filter}` as any) : '' })}
        </AppText>
        <AppText color={colors.textSecondary} className="text-center mt-2">
          {filter !== 'all'
            ? translate('no_payments_desc', { filter: translate(`filter_${filter}` as any) })
            : translate('no_payments_general_desc')}
        </AppText>
        {filter !== 'all' ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFilter('all');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <Text className="text-white font-semibold text-base">{translate('show_all_payments')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/tabs/trips');
            }}
            className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
          >
            <AppText color="white" weight="semibold" className="text-base">{translate('book_first_trip')}</AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const filteredPayments = getFilteredPayments();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText color={colors.textSecondary} weight="medium" className="mt-4">{translate('redirecting_login')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1" edges={['top', 'left', 'right']}>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
      />

      {loading && !refreshing && filteredPayments.length === 0 && (
        <View className={`absolute inset-0 ${isDark ? 'bg-black/50' : 'bg-white/80'} items-center justify-center`}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText color={colors.textSecondary} weight="medium" className="mt-4">{translate('loading_payment_history')}</AppText>
        </View>
      )}
    </SafeAreaView>
  );
}
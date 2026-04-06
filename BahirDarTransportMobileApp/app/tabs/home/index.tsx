import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { useTrips } from '@/hooks/useTrips';
import { useBooking } from '@/hooks/useBooking';
import { usePayment } from '@/hooks/usePayment';
import { useUnreadCount } from '@/store/notificationStore';
import { CustomDrawerContent } from '@/components/layout/CustomDrawerContent';
import {
  Card,
  Badge,
  EmptyState,
  Button,
  Loader,
  AppText
} from '@/components/common';
import {
  Calendar,
  Ticket,
  MapPin,
  Clock,
  Car,
  User,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  History,
  CreditCard,
  HelpCircle,
  Search,
  Bell,
  LogOut,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Shield,
  Menu,
  Star,
  Award,
  Gift,
  Timer,
  Wallet,
  Percent,
  Zap,
  Compass,
  Coffee,
  Wifi,
  Thermometer,
  Battery,
} from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Trip } from '@/types/trip';
import { Booking } from '@/types';
import { APP_CONSTANTS } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

const getTripFromBooking = (booking: Booking): Trip | null => {
  if (!booking.tripID) return null;
  return typeof booking.tripID === 'object' && booking.tripID !== null
    ? booking.tripID as Trip
    : null;
};

const getBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'success':
      return 'success';
    case 'pending':
    case 'warning':
      return 'warning';
    case 'cancelled':
    case 'error':
      return 'error';
    case 'info':
      return 'info';
    default:
      return 'primary';
  }
};

export default function PassengerDashboard() {
  const { translate } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { trips, loading: tripsLoading, fetchAllTrips } = useTrips();
  const { bookings, fetchMyBookings, loading: bookingsLoading } = useBooking();
  const { payments, getPaymentHistory } = usePayment();
  const { colors, isDark } = useTheme();

  const [menuVisible, setMenuVisible] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<Trip[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/Login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyBookings(),
        getPaymentHistory(),
        fetchAllTrips({ limit: 10 })
      ]);
      const userBookingsList = bookings.filter((b: Booking) =>
        (typeof b.passengerID === 'string' && b.passengerID === user?._id) ||
        (typeof b.passengerID === 'object' && b.passengerID?._id === user?._id)
      );
      setUserBookings(userBookingsList);

      const spent = payments
        ?.filter(p => p.paymentStatus === 'success')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      setTotalSpent(spent);

      const now = new Date();
      const upcoming = trips
        .filter(trip =>
          new Date(trip.departureTime) > now &&
          trip.tripStatus === 'scheduled' &&
          (trip.availableSeats ?? 0) > 0
        )
        .slice(0, 5);
      setUpcomingTrips(upcoming);

      const popular = trips
        .filter(trip =>
          new Date(trip.departureTime) > now &&
          trip.tripStatus === 'scheduled'
        )
        // sort by most booked (least available relative to total) or just fallback to least available
        .sort((a, b) => (a.availableSeats ?? 0) - (b.availableSeats ?? 0))
        .slice(0, 5);
      setPopularRoutes(popular.length > 0 ? popular : upcoming);

    } catch (error) {
      setError(translate('something_went_wrong'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return translate('greeting_morning');
    if (hour < 18) return translate('greeting_afternoon');
    return translate('greeting_evening');
  };

  const formatTimeStr = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateStr = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) return translate('today');
      if (date.toDateString() === tomorrow.toDateString()) return translate('tomorrow');
      return date.toLocaleDateString(translate('language_code' as any) === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDateStr(dateString)} ${translate('at')} ${formatTimeStr(dateString)}`;
  };

  const navigationActions = {
    bookTrip: () => router.push('/tabs/trips/search'),
    myBookings: () => router.push('/(screens)/booking'),
    paymentHistory: () => router.push('/(screens)/payment/history'),
    helpCenter: () => router.push('/menu/support'),
    notifications: () => router.push('/(screens)/notification'),
    profile: () => router.push('/tabs/profile'),

    viewTrip: (tripId: string) => router.push(`/tabs/trips/${tripId}`),
    searchTrips: () => router.push('/tabs/trips/search'),
    viewAllTrips: () => router.push('/tabs/trips'),

    viewBooking: (bookingId: string) => router.push(`/(screens)/booking/${bookingId}`),
    payNow: (bookingId: string) => router.push({
      pathname: '/(screens)/payment/checkout',
      params: { bookingId }
    }),
    viewBookingConfirmation: (bookingId: string) => router.push({
      pathname: '/(screens)/booking/confirmation',
      params: { bookingId }
    }),
    paymentSuccess: (bookingId: string) => router.push({
      pathname: '/(screens)/payment/success',
      params: { bookingId }
    }),

    settings: () => router.push('/menu/settings'),
    about: () => router.push('/menu/about'),
    contact: () => router.push('/menu/support/contact'),
    feedback: () => router.push('/menu/support/feedback'),
  };

  const quickActions = [
    {
      title: translate('book_trip'),
      description: translate('book_trip_desc'),
      icon: PlusCircle,
      onPress: navigationActions.bookTrip,
      bgColor: 'bg-blue-500',
    },
    {
      title: translate('my_bookings'),
      description: translate('my_bookings_desc'),
      icon: History,
      onPress: navigationActions.myBookings,
      bgColor: 'bg-green-500',
    },
    {
      title: translate('payment_history'),
      description: translate('payment_history_desc'),
      icon: CreditCard,
      onPress: navigationActions.paymentHistory,
      bgColor: 'bg-purple-500',
    },
    {
      title: translate('help_center'),
      description: translate('help_center_desc'),
      icon: HelpCircle,
      onPress: navigationActions.helpCenter,
      bgColor: 'bg-pink-500',
    },
  ];

  const featureActions = [
    {
      title: translate('search_trips'),
      icon: Search,
      onPress: navigationActions.searchTrips,
      color: '#3b82f6',
    },
    {
      title: translate('popular_routes'),
      icon: Compass,
      onPress: navigationActions.viewAllTrips,
      color: '#10b981',
    },
    {
      title: translate('special_offers'),
      icon: Percent,
      onPress: navigationActions.bookTrip,
      color: '#f59e0b',
    },
    {
      title: translate('quick_book'),
      icon: Zap,
      onPress: navigationActions.bookTrip,
      color: '#8b5cf6',
    },
  ];
  const now = new Date();

  const { activeBookings, pendingCount, completedCount } = React.useMemo(() => {
    const now = new Date();
    const active = userBookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      const trip = getTripFromBooking(b);
      return trip && new Date(trip.departureTime) > now;
    }).length;

    const pending = userBookings.filter(b => b.status === 'pending').length;

    const completed = userBookings.filter(b => {
      if (b.status === 'completed') return true;
      const trip = getTripFromBooking(b);
      return trip && new Date(trip.departureTime) < now;
    }).length;

    return { activeBookings: active, pendingCount: pending, completedCount: completed };
  }, [userBookings]);

  const memoizedStats = React.useMemo(() => [
    {
      icon: Calendar,
      value: activeBookings.toString(),
      label: translate('stats_active'),
      color: colors.primary,
      onPress: navigationActions.myBookings,
    },
    {
      icon: Timer,
      value: pendingCount.toString(),
      label: translate('stats_pending'),
      color: colors.warning,
      onPress: navigationActions.paymentHistory,
    },
    {
      icon: Award,
      value: completedCount.toString(),
      label: translate('status_completed_dashboard'),
      color: colors.success,
      onPress: navigationActions.myBookings,
    },
    {
      icon: Wallet,
      value: formatCurrency(totalSpent),
      label: translate('total_spent_label'),
      color: colors.accent,
      onPress: navigationActions.paymentHistory,
    },
  ], [activeBookings, pendingCount, completedCount, totalSpent, translate]);

  const amenities = [
    { icon: Wifi, label: translate('amenity_wifi'), color: '#3b82f6' },
    { icon: Coffee, label: translate('amenity_refreshments'), color: '#10b981' },
    { icon: Thermometer, label: translate('amenity_ac'), color: '#f59e0b' },
    { icon: Battery, label: translate('amenity_charging'), color: '#8b5cf6' },
  ];

  const HeaderRightActions = () => {
    const unreadCount = useUnreadCount();
    
    return (
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={navigationActions.notifications}
          className="relative"
          activeOpacity={0.7}
        >
          <View className={`w-10 h-10 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full items-center justify-center`}>
            <Bell size={20} color={colors.primary} />
          </View>
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full px-1 min-w-[18px] h-5 items-center justify-center">
              <AppText variant="caption" weight="bold" color="white">{unreadCount}</AppText>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            logout();
            router.replace('/auth/Login');
          }}
          className={`w-10 h-10 ${isDark ? 'bg-red-900/30' : 'bg-red-100'} rounded-full items-center justify-center`}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  const CustomHeader = () => (
    <View className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} px-4 pb-4 border-b`}>
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className="mr-3 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <Menu size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View>
            <AppText variant="h2" color={colors.primary}>
              {translate('app_name')}
            </AppText>
          </View>
        </View>
        <HeaderRightActions />
      </View>

      <View className="mt-4">
        <AppText variant="h1" color={isDark ? 'white' : 'black'}>
          {getGreeting()}
        </AppText>
        <AppText variant="bodyLarge" color={isDark ? colors.gray400 : colors.gray600} className="mt-1">
          {user?.fullName?.split(' ')[0] || translate('passenger_label')}! 👋
        </AppText>
      </View>
      {showWelcome && pendingCount > 0 && (
        <View className="mt-4 bg-yellow-50 p-3 rounded-xl border border-yellow-200">
          <AppText variant="bodySmall" color="#B45309">
            {translate('pending_payment_warn', { count: pendingCount })}
          </AppText>
        </View>
      )}
    </View>
  );

  const renderUpcomingTripCard = ({ item }: { item: Trip }) => {
    const availableSeats = item.availableSeats ?? 0;

    return (
      <TouchableOpacity
        onPress={() => navigationActions.viewTrip(item._id)}
        activeOpacity={0.9}
        className="mr-4 w-72"
      >
        <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
          <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 flex-row items-center">
            <Sparkles size={14} color="white" />
            <AppText variant="label" color="white" className="ml-1">{translate('featured_trip_badge')}</AppText>
          </View>

          <View className="p-4">
            <View className="flex-row items-center mb-3">
              <View className={`${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} p-2 rounded-full mr-3`}>
                <Car size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <AppText variant="bodyMedium" weight="bold" color={isDark ? 'white' : 'black'} numberOfLines={1}>
                  {item.origin?.stationName}
                </AppText>
                <View className="flex-row items-center my-1">
                  <View className={`w-1 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
                  <View className={`w-8 h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} mx-1`} />
                  <ArrowRight size={12} color={colors.textTertiary} />
                  <View className={`w-8 h-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} mx-1`} />
                  <View className={`w-1 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'} rounded-full`} />
                </View>
                <AppText variant="bodyMedium" weight="bold" color={isDark ? 'white' : 'black'} numberOfLines={1}>
                  {item.destination?.stationName}
                </AppText>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Calendar size={14} color={colors.textSecondary} />
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600} className="ml-1">
                  {formatDateStr(item.departureTime)}
                </AppText>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color={colors.textSecondary} />
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600} className="ml-1">
                  {formatTimeStr(item.departureTime)}
                </AppText>
              </View>
            </View>

            <View className={`flex-row justify-between items-center pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <View>
                <AppText variant="caption" color={colors.textSecondary}>{translate('from')}</AppText>
                <AppText variant="h3" color={colors.primary}>
                  {formatCurrency(item.price || 0)}
                </AppText>
              </View>
              <Badge
                text={translate('seats_count', { count: availableSeats })}
                variant={availableSeats > 5 ? 'success' : 'warning'}
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading || authLoading || bookingsLoading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Loader message={translate('dashboard_loading')} fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <CustomHeader />
        <View className="flex-1 justify-center items-center px-6">
          <AlertCircle size={48} color={colors.danger} />
          <AppText variant="h2" weight="semibold" color={isDark ? 'white' : colors.gray900} className="mt-4 text-center">
            {translate('oops_error')}
          </AppText>
          <AppText color={isDark ? colors.gray400 : colors.gray600} className="text-center mt-2 mb-6">{error}</AppText>
          <Button title={translate('try_again')} onPress={fetchUserData} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <CustomHeader />

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View className="flex-1 bg-black/50">
            <Animated.View
              style={{
                transform: [{ translateX: slideAnim }],
                width: MENU_WIDTH,
                height: '100%',
                backgroundColor: isDark ? '#111827' : 'white',
              }}
            >
              <CustomDrawerContent onClose={() => setMenuVisible(false)} />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        <View className="px-4 mt-4">
          <TouchableOpacity
            onPress={navigationActions.searchTrips}
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-xl flex-row items-center border shadow-sm`}
            activeOpacity={0.8}
          >
            <Search size={20} color={colors.textSecondary} />
            <AppText variant="bodyMedium" color={isDark ? colors.gray400 : colors.gray500} className="ml-3 flex-1">
              {translate('where_to')}
            </AppText>
            <View className={`${isDark ? 'bg-blue-900/30' : 'bg-blue-100'} px-3 py-1 rounded-full`}>
              <AppText variant="label" color={colors.primary}>{translate('search')}</AppText>
            </View>
          </TouchableOpacity>
        </View>
        <View className="px-4 mt-4">
          <View className="flex-row flex-wrap -mx-1">
            {memoizedStats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                className="w-1/4 px-1"
                onPress={stat.onPress}
                activeOpacity={0.7}
              >
                <Card className={`border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200'} p-2 items-center`}>
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-1"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon size={20} color={stat.color} />
                  </View>
                  <AppText variant="bodyLarge" weight="bold" color={isDark ? 'white' : colors.gray900}>
                    {stat.value}
                  </AppText>
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600} className="text-center">
                    {stat.label}
                  </AppText>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View className="px-4 mt-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featureActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                className="mr-3 items-center"
                activeOpacity={0.7}
              >
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: `${action.color}20` }}
                >
                  <action.icon size={24} color={action.color} />
                </View>
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600} className="text-center">{action.title}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <AppText variant="h3">
              🔥 {translate('popular_trips')}
            </AppText>
            <TouchableOpacity onPress={navigationActions.viewAllTrips}>
              <AppText variant="bodySmall" color={colors.primary}>{translate('view_all')}</AppText>
            </TouchableOpacity>
          </View>

          {popularRoutes.length > 0 ? (
            <FlatList
              data={popularRoutes}
              renderItem={renderUpcomingTripCard}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          ) : (
            <Card className="p-6 items-center">
              <MapPin size={32} color={colors.textTertiary} />
              <AppText color={isDark ? colors.gray400 : colors.gray600} className="text-center mt-2">
                {translate('no_trips_now')}
              </AppText>
            </Card>
          )}
        </View>
        <View className="px-4 mt-6">
          <AppText variant="h3" className="mb-3">
            ✨ {translate('onboard_amenities')}
          </AppText>
          <View className="flex-row flex-wrap">
            {amenities.map((item, index) => (
              <View key={index} className="w-1/4 items-center mb-4">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon size={20} color={item.color} />
                </View>
                <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600} className="text-center">{item.label}</AppText>
              </View>
            ))}
          </View>
        </View>
        <View className="px-4 mt-6">
          <AppText variant="h3" className="mb-3">
            🚀 {translate('quick_actions')}
          </AppText>
          <View className="flex-row flex-wrap -mx-1">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className="w-1/2 px-1 mb-2"
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Card className="p-3">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full ${action.bgColor} items-center justify-center mr-2`}>
                      <action.icon size={18} color="white" />
                    </View>
                    <View className="flex-1">
                      <AppText weight="semibold" color={isDark ? 'white' : colors.gray900} variant="bodySmall">
                        {action.title}
                      </AppText>
                      <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500}>
                        {action.description}
                      </AppText>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4 mt-6">
          <TouchableOpacity
            onPress={navigationActions.bookTrip}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4"
            activeOpacity={0.9}
          >
            <View className="flex-row items-center">
              <Gift size={24} color="white" />
              <View className="ml-3 flex-1">
                <AppText variant="h3" weight="bold" color="white">{translate('promo_first_trip')}</AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.9)">{translate('promo_desc')}</AppText>
              </View>
              <ArrowRight size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
        <View className="px-4 mt-6 mb-8">
          <Card className={`${isDark ? 'bg-green-900/20 border-green-900/50' : 'bg-green-50 border-green-200'}`}>
            <View className="p-3 flex-row items-center">
              <Shield size={20} color={colors.success} />
              <AppText variant="bodySmall" color={isDark ? '#4ade80' : colors.gray700} className="ml-2 flex-1">
                {translate('safety_priority')}
              </AppText>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
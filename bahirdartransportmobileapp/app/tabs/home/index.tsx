import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '../../../utils/helpers';
import { useTrips } from '@/hooks/useTrips';
import { useBooking } from '@/hooks/useBooking';
import { usePayment } from '@/hooks/usePayment';
import { useUnreadCount } from '@/store/notificationStore';
import { CustomDrawerContent } from '@/components/layout/CustomDrawerContent';
import {
  Card,
  Badge,
  Button,
  Loader,
  AppText
} from '@/components/common';
import {
  Calendar,
  MapPin,
  Clock,
  Car,
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
  Award,
  Gift,
  Timer,
  Wallet,
} from 'lucide-react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { Trip } from '@/types/trip';
import { Booking } from '@/types';
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
  const { fetchAllTrips } = useTrips();
  const { getMyBookings, loading: bookingsLoading } = useBooking();
  const { getPaymentHistory } = usePayment();
  const { colors, isDark } = useTheme();

  const [menuVisible, setMenuVisible] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
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
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [bookingsData, , tripsData] = await Promise.all([
        getMyBookings(true),
        getPaymentHistory(),
        fetchAllTrips({
          limit: 20,
          _t: Date.now() // Cache busting
        })
      ]);

      if (bookingsData) {
        setUserBookings(bookingsData);

        // Calculate total spent
        const spent = bookingsData
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        setTotalSpent(spent);
      }

      const tripsToFilter = tripsData || [];

      const upcoming = tripsToFilter
        .filter(trip => {
          const status = trip.tripStatus?.toLowerCase();
          // Be inclusive: show any trip that the backend says is available
          return (status === 'scheduled' || status === 'boarding') && (trip.availableSeats ?? 0) > 0;
        })
        .slice(0, 5);

      // Improved popular logic: Sort by occupancy (how many seats are taken)
      const popular = tripsToFilter
        .map(trip => ({ ...trip }))
        .sort((a, b) => {
          const aTotal = a.totalSeats || 50;
          const bTotal = b.totalSeats || 50;
          const aOcc = aTotal - (a.availableSeats ?? aTotal);
          const bOcc = bTotal - (b.availableSeats ?? bTotal);
          return bOcc - aOcc;
        })
        .slice(0, 5);

      setPopularRoutes(popular.length > 0 ? popular : upcoming);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(translate('failed_to_load_dashboard'));
    } finally {
      setLoading(false);
    }
  }, [getMyBookings, getPaymentHistory, fetchAllTrips, translate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, fetchUserData]);

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
  }, [menuVisible, slideAnim]);

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

  const navigationActions = React.useMemo(() => ({
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
  }), []);

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
  ], [activeBookings, pendingCount, completedCount, totalSpent, translate, colors, navigationActions]);

  const HeaderRightActions = () => {
    const unreadCount = useUnreadCount();

    return (
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={navigationActions.notifications}
          className="relative"
          activeOpacity={0.7}
        >
          <View className={`w-11 h-11 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full items-center justify-center`}>
            <Bell size={22} color={colors.textPrimary} />
          </View>
          {unreadCount > 0 && (
            <View className="absolute top-0 right-0 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center border-2 border-white dark:border-gray-900">
              <AppText variant="caption" weight="bold" color="white" className="text-[9px]">{unreadCount}</AppText>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            logout();
            router.replace('/auth/Login');
          }}
          className={`w-11 h-11 ${isDark ? 'bg-red-900/20' : 'bg-red-50'} rounded-full items-center justify-center`}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  const CustomHeader = () => (
    <View className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} px-4 pb-4 border-b`}>
      <View className="flex-row justify-between items-center py-2">
        <View className="flex-row items-center flex-1 pr-4">
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className={`mr-3 w-10 h-10 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-full items-center justify-center`}
            activeOpacity={0.7}
          >
            <Menu size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1">
            <AppText variant="h3" color={colors.primary} weight="bold" numberOfLines={2}>
              {translate('app_name')}
            </AppText>
          </View>
        </View>
        <HeaderRightActions />
      </View>

      <View className="mt-6 flex-row items-end justify-between">
        <View className="flex-1 mr-4 flex-row items-center flex-wrap">
          <AppText variant="h3" color={isDark ? 'white' : 'black'} weight="bold" className="mr-1">
            {getGreeting()},
          </AppText>
          <AppText variant="h3" color={isDark ? colors.gray400 : colors.gray600} weight="medium">
            {user?.fullName || translate('passenger_label')}! 👋
          </AppText>
        </View>


      </View>

      {showWelcome && (pendingCount ?? 0) > 0 && (
        <View className="mt-5 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex-row items-center shadow-sm">
          <View className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full">
            <AlertCircle size={18} color={isDark ? '#fbbf24' : '#b45309'} />
          </View>
          <AppText variant="bodySmall" color={isDark ? '#fbbf24' : '#b45309'} weight="medium" className="ml-3 flex-1">
            {translate('pending_payment_warn', { count: pendingCount })}
          </AppText>
          <ChevronRight size={16} color={isDark ? '#fbbf24' : '#b45309'} />
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

        {/* Promo Banner Section */}
        <View className="px-4 mt-6">
          <TouchableOpacity
            onPress={navigationActions.bookTrip}
            activeOpacity={0.9}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <View className="relative h-44">
              <Image
                source={require('../../../assets/images/banner.png')}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/30 p-5 justify-end">
                <View className="bg-blue-600 self-start px-2 py-1 rounded-md mb-2">
                  <AppText variant="caption" weight="bold" color="white" className="uppercase tracking-widest">
                    {translate('limited_offer')}
                  </AppText>
                </View>
                <AppText variant="h2" color="white" weight="bold">
                  {translate('explore_bahirdar')}
                </AppText>
                <AppText variant="bodySmall" color="white" className="mt-1">
                  {translate('explore_bahirdar_desc')}
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Section Moved to Top */}
        <View className="px-4 mt-4">
          <View className="flex-row -mx-1">
            {memoizedStats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                className="flex-1 px-1"
                onPress={stat.onPress}
                activeOpacity={0.7}
              >
                <Card className={`border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200'} p-1.5 items-center justify-center h-[95px]`}>
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mb-1"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon size={18} color={stat.color} />
                  </View>
                  <AppText variant="bodyMedium" weight="bold" color={isDark ? 'white' : colors.gray900} numberOfLines={1}>
                    {stat.value}
                  </AppText>
                  <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray600} className="text-center text-[10px] mt-0.5" numberOfLines={1}>
                    {stat.label}
                  </AppText>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <AppText variant="h2" weight="bold">
              🚌 {translate('available_trips')}
            </AppText>
            <TouchableOpacity onPress={navigationActions.viewAllTrips} className="flex-row items-center">
              <AppText variant="bodyMedium" weight="semibold" color={colors.primary}>{translate('view_all')}</AppText>
              <ChevronRight size={16} color={colors.primary} />
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
            <Card className="p-8 items-center bg-gray-50 dark:bg-gray-800/50 border-dashed border-2 border-gray-200 dark:border-gray-700">
              <MapPin size={40} color={colors.textTertiary} className="mb-2" />
              <AppText color={isDark ? colors.gray400 : colors.gray600} className="text-center font-medium">
                {translate('no_trips_now')}
              </AppText>
              <AppText variant="caption" color={colors.textTertiary} className="text-center mt-1">
                {translate('no_trips_general_desc')}
              </AppText>
            </Card>
          )}
        </View>

        {/* Recent Bookings Section - to match website */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <AppText variant="h2" weight="bold">
              🕒 {translate('recent_bookings')}
            </AppText>
            <TouchableOpacity onPress={navigationActions.myBookings} className="flex-row items-center">
              <AppText variant="bodyMedium" weight="semibold" color={colors.primary}>{translate('view_all')}</AppText>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Card className={`p-0 overflow-hidden border ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            {userBookings.length === 0 ? (
              <View className="p-8 items-center">
                <History size={40} color={colors.textTertiary} className="mb-2" />
                <AppText color={isDark ? colors.gray400 : colors.gray600}>{translate('no_bookings_general')}</AppText>
              </View>
            ) : (
              <View>
                {userBookings.slice(0, 3).map((booking, index) => {
                  const trip = getTripFromBooking(booking);
                  return (
                    <TouchableOpacity
                      key={booking._id}
                      onPress={() => navigationActions.viewBooking(booking._id)}
                      className={`p-4 flex-row items-center justify-between ${index !== 2 && index !== userBookings.length - 1 ? (isDark ? 'border-b border-gray-800' : 'border-b border-gray-100') : ''}`}
                    >
                      <View className="flex-1">
                        <AppText weight="bold" color={isDark ? 'white' : colors.gray900}>
                          {trip?.origin?.stationName} → {trip?.destination?.stationName}
                        </AppText>
                        <AppText variant="caption" color={colors.textSecondary} className="mt-1">
                          {formatDateStr(trip?.departureTime || '')} • {formatCurrency(booking.totalPrice || 0)}
                        </AppText>
                      </View>
                      <Badge
                        text={booking.status?.toUpperCase()}
                        variant={getBadgeVariant(booking.status || '')}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>
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
                <Card className="p-3 h-[85px] justify-center">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full ${action.bgColor} items-center justify-center mr-3`}>
                      <action.icon size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <AppText weight="bold" color={isDark ? 'white' : colors.gray900} variant="bodySmall" numberOfLines={1}>
                        {action.title}
                      </AppText>
                      <AppText variant="caption" color={isDark ? colors.gray400 : colors.gray500} numberOfLines={2} className="mt-0.5">
                        {action.description}
                      </AppText>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-4 mt-2">
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
        <View className="px-4 mt-2 mb-8">
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
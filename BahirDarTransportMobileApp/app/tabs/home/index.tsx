import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import { CustomDrawerContent } from '@/components/layout/CustomDrawerContent';
import {
  Card,
  Badge,
  EmptyState,
  Button,
  Loader
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
import { Trip } from '@/types/trip';
import { Booking } from '@/types';
import { APP_CONSTANTS } from '@/constants/routes';
import { COLORS } from '@/constants/colors';

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
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { trips, loading: tripsLoading, fetchAllTrips } = useTrips();
  const { bookings, fetchMyBookings, loading: bookingsLoading } = useBooking();
  const { payments, getPaymentHistory } = usePayment();

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
      const userBookingsList = bookings.filter(b =>
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
      setError('Failed to load dashboard data');
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
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const navigationActions = {
    bookTrip: () => router.push('/tabs/trips/search'),
    myBookings: () => router.push('/(screens)/booking'),
    paymentHistory: () => router.push('/(screens)/payment/history'),
    helpCenter: () => router.push('/menu/support/help'),
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
      title: 'Book Trip',
      description: 'Find your next journey',
      icon: PlusCircle,
      onPress: navigationActions.bookTrip,
      bgColor: 'bg-blue-500',
    },
    {
      title: 'My Bookings',
      description: 'View all your trips',
      icon: History,
      onPress: navigationActions.myBookings,
      bgColor: 'bg-green-500',
    },
    {
      title: 'Payments',
      description: 'History & pending',
      icon: CreditCard,
      onPress: navigationActions.paymentHistory,
      bgColor: 'bg-purple-500',
    },
    {
      title: 'Help',
      description: 'Support & FAQs',
      icon: HelpCircle,
      onPress: navigationActions.helpCenter,
      bgColor: 'bg-pink-500',
    },
  ];

  const featureActions = [
    {
      title: 'Search Trips',
      icon: Search,
      onPress: navigationActions.searchTrips,
      color: '#3b82f6',
    },
    {
      title: 'Popular Routes',
      icon: Compass,
      onPress: navigationActions.viewAllTrips,
      color: '#10b981',
    },
    {
      title: 'Special Offers',
      icon: Percent,
      onPress: navigationActions.bookTrip,
      color: '#f59e0b',
    },
    {
      title: 'Quick Book',
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
      label: 'Active',
      color: COLORS.primary,
      onPress: navigationActions.myBookings,
    },
    {
      icon: Timer,
      value: pendingCount.toString(),
      label: 'Pending',
      color: COLORS.warning,
      onPress: navigationActions.paymentHistory,
    },
    {
      icon: Award,
      value: completedCount.toString(),
      label: 'Completed',
      color: COLORS.success,
      onPress: navigationActions.myBookings,
    },
    {
      icon: Wallet,
      value: formatCurrency(totalSpent),
      label: 'Total Spent',
      color: COLORS.accent,
      onPress: navigationActions.paymentHistory,
    },
  ], [activeBookings, pendingCount, completedCount, totalSpent]);

  const amenities = [
    { icon: Wifi, label: 'Free WiFi', color: '#3b82f6' },
    { icon: Coffee, label: 'Refreshments', color: '#10b981' },
    { icon: Thermometer, label: 'AC', color: '#f59e0b' },
    { icon: Battery, label: 'Charging', color: '#8b5cf6' },
  ];

  const HeaderRightActions = () => (
    <View className="flex-row items-center gap-3">
      <TouchableOpacity
        onPress={navigationActions.notifications}
        className="relative"
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
          <Bell size={20} color={COLORS.primary} />
        </View>
        <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          logout();
          router.replace('/auth/Login');
        }}
        className="w-10 h-10 bg-red-100 rounded-full items-center justify-center"
        activeOpacity={0.7}
      >
        <LogOut size={20} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  const CustomHeader = () => (
    <View className="bg-white px-4 pb-4 border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className="mr-3 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <Menu size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View>
            <Text className="text-2xl font-bold" style={{ color: COLORS.primary }}>
              {APP_CONSTANTS.APP_NAME}
            </Text>
          </View>
        </View>
        <HeaderRightActions />
      </View>

      <View className="mt-4">
        <Text className="text-3xl font-bold text-gray-900">
          {getGreeting()}
        </Text>
        <Text className="text-lg text-gray-600 mt-1">
          {user?.fullName?.split(' ')[0] || 'Passenger'}! 👋
        </Text>
      </View>
      {showWelcome && pendingCount > 0 && (
        <View className="mt-4 bg-yellow-50 p-3 rounded-xl border border-yellow-200">
          <Text className="text-yellow-700 text-sm">
            ⚠️ You have {pendingCount} pending payment{pendingCount !== 1 ? 's' : ''}. Complete them to confirm your bookings.
          </Text>
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
        <Card className="border border-gray-200 overflow-hidden">
          <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 flex-row items-center">
            <Sparkles size={14} color="white" />
            <Text className="text-white text-xs font-medium ml-1">Featured Trip</Text>
          </View>

          <View className="p-4">
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-100 p-2 rounded-full mr-3">
                <Car size={20} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {item.origin?.stationName}
                </Text>
                <View className="flex-row items-center my-1">
                  <View className="w-1 h-1 bg-gray-300 rounded-full" />
                  <View className="w-8 h-0.5 bg-gray-300 mx-1" />
                  <ArrowRight size={12} color={COLORS.textTertiary} />
                  <View className="w-8 h-0.5 bg-gray-300 mx-1" />
                  <View className="w-1 h-1 bg-gray-300 rounded-full" />
                </View>
                <Text className="font-bold text-gray-900" numberOfLines={1}>
                  {item.destination?.stationName}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Calendar size={14} color={COLORS.textSecondary} />
                <Text className="text-xs text-gray-600 ml-1">
                  {formatDate(item.departureTime)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={14} color={COLORS.textSecondary} />
                <Text className="text-xs text-gray-600 ml-1">
                  {formatTime(item.departureTime)}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
              <View>
                <Text className="text-xs text-gray-500">From</Text>
                <Text className="text-lg font-bold text-blue-600">
                  {formatCurrency(item.price || 0)}
                </Text>
              </View>
              <Badge
                text={`${availableSeats} seats`}
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
      <SafeAreaView className="flex-1 bg-white">
        <Loader message="Loading your dashboard..." fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <CustomHeader />
        <View className="flex-1 justify-center items-center px-6">
          <AlertCircle size={48} color={COLORS.danger} />
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
            Oops! Something went wrong
          </Text>
          <Text className="text-gray-600 text-center mt-2 mb-6">{error}</Text>
          <Button title="Try Again" onPress={fetchUserData} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
                backgroundColor: 'white',
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
            className="bg-white p-4 rounded-xl flex-row items-center border border-gray-200 shadow-sm"
            activeOpacity={0.8}
          >
            <Search size={20} color={COLORS.textSecondary} />
            <Text className="text-gray-500 ml-3 flex-1">
              Where would you like to go?
            </Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-600 text-xs font-medium">Search</Text>
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
                <Card className="border border-gray-200 p-2 items-center">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-1"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon size={20} color={stat.color} />
                  </View>
                  <Text className="text-base font-bold text-gray-900">
                    {stat.value}
                  </Text>
                  <Text className="text-xs text-gray-600 text-center">
                    {stat.label}
                  </Text>
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
                <Text className="text-xs text-gray-600">{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">
              🔥 Popular Trips
            </Text>
            <TouchableOpacity onPress={navigationActions.viewAllTrips}>
              <Text className="text-sm text-blue-600">View All</Text>
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
            <Card className="border border-gray-200 p-6 items-center">
              <MapPin size={32} color={COLORS.textTertiary} />
              <Text className="text-gray-600 text-center mt-2">
                No trips available at the moment
              </Text>
            </Card>
          )}
        </View>
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            ✨ Onboard Amenities
          </Text>
          <View className="flex-row flex-wrap">
            {amenities.map((item, index) => (
              <View key={index} className="w-1/4 items-center mb-4">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <item.icon size={20} color={item.color} />
                </View>
                <Text className="text-xs text-gray-600">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            🚀 Quick Actions
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className="w-1/2 px-1 mb-2"
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Card className="border border-gray-200 p-3">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full ${action.bgColor} items-center justify-center mr-2`}>
                      <action.icon size={18} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 text-sm">
                        {action.title}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {action.description}
                      </Text>
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
                <Text className="text-white font-bold text-lg">First Trip Special!</Text>
                <Text className="text-white/90 text-sm">Get 15% off your first booking</Text>
              </View>
              <ArrowRight size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
        <View className="px-4 mt-6 mb-8">
          <Card className="bg-green-50 border border-green-200">
            <View className="p-3 flex-row items-center">
              <Shield size={20} color={COLORS.success} />
              <Text className="ml-2 text-sm text-gray-700 flex-1">
                🛡️ Your safety is our priority. All vehicles are sanitized.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
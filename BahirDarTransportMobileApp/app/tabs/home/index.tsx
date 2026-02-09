import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loader, Card, Badge, EmptyState, Button } from '@/components/common';
import { ScreenLayout } from '@/components/layout';
import { 
  Search, 
  Ticket, 
  Bell, 
  HelpCircle,
  Calendar,
  CreditCard,
  LogOut,
  Clock,
  Shield,
  Star,
  TrendingUp,
  ArrowRight,
  Bus,
  ChevronRight,
  Sparkles,
  Users,
  Wallet,
  User,
  Car,
  Settings,
  MapPin
} from 'lucide-react-native';

// Mock data
const MOCK_UPCOMING_TRIPS = [
  {
    id: '1',
    busNumber: 'BD-101',
    route: 'Bahir Dar → Gondar',
    departureTime: '08:30 AM',
    date: 'Today',
    seat: 'A12',
    status: 'Confirmed',
    price: '250 ETB',
  },
  {
    id: '2',
    busNumber: 'BD-205',
    route: 'Bahir Dar → Addis Ababa',
    departureTime: '02:00 PM',
    date: 'Tomorrow',
    seat: 'B07',
    status: 'Confirmed',
    price: '450 ETB',
  },
];

const MOCK_POPULAR_ROUTES = [
  {
    id: '1',
    from: 'Bahir Dar',
    to: 'Gondar',
    duration: '2h 30m',
    price: '250 ETB',
    departureTimes: ['06:00', '08:30', '12:00', '15:30'],
    availableSeats: 12,
  },
  {
    id: '2',
    from: 'Bahir Dar',
    to: 'Addis Ababa',
    duration: '10h',
    price: '450 ETB',
    departureTimes: ['06:00', '14:00', '22:00'],
    availableSeats: 8,
  },
  {
    id: '3',
    from: 'Bahir Dar',
    to: 'Debre Markos',
    duration: '3h',
    price: '180 ETB',
    departureTimes: ['07:00', '10:00', '13:00', '16:00'],
    availableSeats: 15,
  },
];

export default function HomeScreen() {
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);
  const [upcomingTrips] = useState(MOCK_UPCOMING_TRIPS);
  const [popularRoutes] = useState(MOCK_POPULAR_ROUTES);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Updated routes for tab navigation
  const quickActions = [
    {
      title: 'Book a Trip',
      description: 'Find and book your next journey',
      icon: Search,
      route: '/tabs/trips', // Tab screen
      bgColor: 'bg-blue-500',
      iconColor: 'text-white',
    },
    {
      title: 'My Rides',
      description: 'Tickets, bookings & payments',
      icon: Car,
      route: '/tabs/tickets', // Tab screen
      bgColor: 'bg-green-500',
      iconColor: 'text-white',
    },
    {
      title: 'Notifications',
      description: 'Check your alerts and updates',
      icon: Bell,
      route: '/(screens)/notification', // Screen (not in tab)
      bgColor: 'bg-yellow-500',
      iconColor: 'text-white',
      badge: notificationCount,
    },
    {
      title: 'My Bookings',
      description: 'View and manage bookings',
      icon: Calendar,
      route: '/(screens)/booking', // Screen (not in tab)
      bgColor: 'bg-orange-500',
      iconColor: 'text-white',
    },
    {
      title: 'Payment History',
      description: 'View your transactions',
      icon: CreditCard,
      route: '/(screens)/payment/history', // Screen (not in tab)
      bgColor: 'bg-indigo-500',
      iconColor: 'text-white',
    },
    {
      title: 'Help & Support',
      description: 'Get assistance when needed',
      icon: HelpCircle,
      route: '/(screens)/support/help', // Screen (not in tab)
      bgColor: 'bg-pink-500',
      iconColor: 'text-white',
    },
    {
      title: 'Settings',
      description: 'App preferences',
      icon: Settings,
      route: '/(screens)/settings', // Screen (not in tab)
      bgColor: 'bg-gray-500',
      iconColor: 'text-white',
    },
    {
      title: 'Find Stations',
      description: 'Locate nearby bus stations',
      icon: MapPin,
      route: '/tabs/trips/search', // Tab screen (trips tab)
      bgColor: 'bg-teal-500',
      iconColor: 'text-white',
    },
  ];

  // Updated stats paths
  const stats = [
    { 
      icon: Ticket, 
      value: upcomingTrips.length, 
      label: 'Upcoming Trips', 
      color: '#3B82F6',
      route: '/tabs/tickets' // Tab screen
    },
    { 
      icon: Calendar, 
      value: upcomingTrips.length, 
      label: 'Active Bookings', 
      color: '#10B981',
      route: '/(screens)/booking' // Screen
    },
    { 
      icon: Star, 
      value: '4.8', 
      label: 'Your Rating', 
      color: '#F59E0B',
      route: '/tabs/profile' // Tab screen
    },
    { 
      icon: Clock, 
      value: '95%', 
      label: 'On Time', 
      color: '#8B5CF6',
      route: '/tabs/trips' // Tab screen
    },
  ];

  const HeaderRightActions = () => (
    <View className="flex-row items-center space-x-2">
      <TouchableOpacity
        onPress={() => router.push('/(screens)/notification')}
        className="relative"
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
          <Bell size={20} color="#3B82F6" />
        </View>
        {notificationCount > 0 && (
          <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center border-2 border-white">
            <Text className="text-white text-xs font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={handleLogout}
        className="w-10 h-10 bg-red-100 rounded-full items-center justify-center"
        activeOpacity={0.7}
      >
        <LogOut size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading || authLoading) {
    return <Loader message="Loading dashboard..." />;
  }

  return (
    <ScreenLayout
      showHeader={true}
      headerTitle={`${greeting()}, ${user?.fullName?.split(' ')[0] || 'Traveler'}!`}
      showBackButton={false}
      rightAction={<HeaderRightActions />}
      className="bg-gray-50"
      showBottomTab={true} // Show bottom tab
    >
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Welcome Message */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-gray-600 text-sm">
            Welcome to Bahir Dar Transport
          </Text>
        </View>
        
        {/* Search Bar */}
        <View className="px-4 pb-4">
          <TouchableOpacity
            onPress={() => router.push('/tabs/trips')}
            className="bg-gray-50 p-4 rounded-xl flex-row items-center border border-gray-200"
            activeOpacity={0.8}
          >
            <Search size={20} color="#6B7280" />
            <Text className="text-gray-500 ml-3 flex-1">
              Search destinations, buses, routes...
            </Text>
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {/* User Info Card */}
        <View className="px-4 pb-4">
          <Card
            onPress={() => router.push('/tabs/profile')}
            variant="outline"
            className="bg-blue-50 border-blue-100"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                <User size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-800">{user?.fullName || 'User Account'}</Text>
                <Text className="text-gray-600 text-sm mt-1">
                  {user?.email || 'Welcome to Bahir Dar Transport'}
                </Text>
              </View>
              <Badge text="Active" variant="success" />
            </View>
          </Card>
        </View>

        {/* Stats Overview */}
        <View className="px-4 pt-2">
          <Text className="text-lg font-bold text-gray-900 mb-4">Dashboard Overview</Text>
          <Card variant="elevated">
            <View className="flex-row flex-wrap -mx-1">
              {stats.map((stat, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/2 px-1 mb-4"
                  onPress={() => router.push(stat.route)}
                  activeOpacity={0.7}
                >
                  <Card variant="outline">
                    <View className="flex-row items-center">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <stat.icon size={20} color={stat.color} />
                      </View>
                      <View>
                        <Text className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </Text>
                        <Text className="text-gray-600 text-sm">{stat.label}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* Quick Actions Grid */}
        <View className="px-4 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Quick Access</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/trips')}>
              <Text className="text-blue-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap -mx-1">
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                className="w-1/2 px-1 mb-3"
                onPress={() => router.push(action.route)}
                activeOpacity={0.8}
              >
                <Card>
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-full ${action.bgColor} items-center justify-center mr-3 relative`}>
                      <action.icon size={24} className={action.iconColor} />
                      {action.badge && (
                        <Badge 
                          text={action.badge.toString()} 
                          variant="danger" 
                          size="small"
                          className="absolute -top-1 -right-1"
                        />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800 mb-1">
                        {action.title}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {action.description}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 ? (
          <View className="px-4 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Upcoming Trips</Text>
              <TouchableOpacity onPress={() => router.push('/tabs/tickets')}>
                <Text className="text-blue-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingTrips.map((trip) => (
                <Card
                  key={trip.id}
                  onPress={() => router.push(`/tabs/tickets/${trip.id}`)}
                  className="mr-4 w-72"
                >
                  <View className="flex-row items-center mb-2">
                    <Bus size={16} color="#3B82F6" />
                    <Text className="ml-2 font-semibold text-gray-700">
                      {trip.busNumber}
                    </Text>
                    <View className="ml-auto">
                      <Badge 
                        text={trip.status} 
                        variant="success"
                        size="small"
                      />
                    </View>
                  </View>
                  <Text className="text-gray-800 font-bold text-lg">{trip.route}</Text>
                  <View className="flex-row items-center mt-2">
                    <Clock size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                      {trip.departureTime}
                    </Text>
                    <Text className="mx-2 text-gray-400">•</Text>
                    <Text className="text-gray-600 text-sm">{trip.date}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-4">
                    <View>
                      <Text className="text-gray-700 font-medium">
                        Seat: {trip.seat}
                      </Text>
                      <Text className="text-gray-900 font-bold mt-1">
                        {trip.price}
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#9CA3AF" />
                  </View>
                </Card>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="px-4 mt-6">
            <Card variant="outline" className="items-center py-8">
              <Ticket size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 mb-2">No upcoming trips</Text>
              <Text className="text-gray-400 text-sm text-center mb-4">
                Book your next adventure today
              </Text>
              <Button
                title="Book a Trip"
                onPress={() => router.push('/tabs/trips')}
                variant="primary"
                size="small"
              />
            </Card>
          </View>
        )}

        {/* Popular Routes */}
        {popularRoutes.length > 0 && (
          <View className="px-4 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Popular Routes</Text>
              <TouchableOpacity onPress={() => router.push('/tabs/trips')}>
                <Text className="text-blue-600 font-semibold">Explore More</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {popularRoutes.map((route) => (
                <Card
                  key={route.id}
                  onPress={() => router.push(`/tabs/trips/${route.id}`)}
                  className="mr-4 w-72"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-lg font-bold text-gray-900">
                        {route.from} → {route.to}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1">{route.duration}</Text>
                    </View>
                    <Badge 
                      text={route.price} 
                      variant="primary"
                      className="bg-blue-50"
                    />
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">
                        {route.departureTimes[0]} - {route.departureTimes[route.departureTimes.length - 1]}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Users size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">
                        {route.availableSeats} seats
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Promotional Banner */}
        <View className="px-4 mt-6">
          <Card
            onPress={() => router.push('/tabs/trips/search?promo=weekend20')}
            className="bg-gradient-to-r from-green-500 to-teal-500 border-0"
          >
            <View className="flex-row items-center">
              <Sparkles size={24} color="white" />
              <View className="ml-4 flex-1">
                <Text className="text-white text-xl font-bold">Weekend Special!</Text>
                <Text className="text-white/90 mt-1">
                  Get 20% off on all weekend trips
                </Text>
              </View>
              <TrendingUp size={24} color="white" />
            </View>
            <View className="flex-row items-center mt-4">
              <Text className="text-white font-semibold">Book Now</Text>
              <ArrowRight size={16} color="white" className="ml-2" />
            </View>
          </Card>
        </View>

        {/* Safety Reminder */}
        <View className="px-4 my-6">
          <Card variant="outline" className="bg-blue-50 border-blue-200">
            <View className="flex-row items-start">
              <Shield size={24} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-gray-900">Travel Safety Tips</Text>
                <Text className="text-gray-600 mt-1">
                  Always verify your bus number, driver details, and wear your mask. Your safety is our priority.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(screens)/support/help?topic=safety')}
              className="mt-4"
            >
              <Text className="text-blue-600 font-semibold">Read Safety Guidelines →</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Recent Activity */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(screens)/payment/history')}>
              <Text className="text-blue-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          
          <Card>
            {upcomingTrips.length > 0 ? (
              upcomingTrips.map((trip, index) => (
                <View key={index} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Ticket size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">{trip.route}</Text>
                    <Text className="text-gray-500 text-sm">{trip.date} • {trip.departureTime}</Text>
                  </View>
                  <Badge text={trip.price} variant="primary" />
                </View>
              ))
            ) : (
              <EmptyState
                icon={Wallet}
                title="No recent activity"
                description="Your trip bookings and payments will appear here"
                buttonText="Book Your First Trip"
                onButtonPress={() => router.push('/tabs/trips/search')}
              />
            )}
          </Card>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
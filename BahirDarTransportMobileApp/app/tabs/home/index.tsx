import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  Badge, 
  EmptyState, 
  Button, 
  Loader 
} from '@/components/common';
import { ScreenLayout } from '@/components/layout';
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
} from 'lucide-react-native';

// Define types for the data
interface Trip {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  seats: string[];
  vehicleType: string;
  busNumber: string;
  date: string;
}

interface PassengerStats {
  upcomingTrips: number;
  totalSpent: number;
  completedTrips: number;
  nextTripDate: Date | null;
}

export default function PassengerDashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [passengerStats, setPassengerStats] = useState<PassengerStats>({
    upcomingTrips: 0,
    totalSpent: 0,
    completedTrips: 0,
    nextTripDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const mockTrips: Trip[] = [
    {
      id: '1',
      from: 'Bahir Dar',
      to: 'Addis Ababa',
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      price: 1200,
      status: 'confirmed',
      seats: ['A1', 'A2'],
      vehicleType: 'luxury_bus',
      busNumber: 'BD-101',
      date: 'Today',
    },
    {
      id: '2',
      from: 'Bahir Dar',
      to: 'Gondar',
      departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      price: 350,
      status: 'confirmed',
      seats: ['B3'],
      vehicleType: 'minibus',
      busNumber: 'BD-205',
      date: 'Tomorrow',
    },
  ];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    fetchPassengerData();
  }, []);

  const fetchPassengerData = async () => {
    try {
      setLoading(true);
      
      setUpcomingTrips(mockTrips);
      
      // Calculate statistics
      const totalSpent = mockTrips.reduce((sum, trip) => 
        sum + (trip.price * trip.seats.length), 0
      );
      
      const nextTrip = mockTrips.length > 0 
        ? new Date(mockTrips[0].departureTime)
        : null;
      
      const stats: PassengerStats = {
        upcomingTrips: mockTrips.length,
        totalSpent: totalSpent,
        completedTrips: 5,
        nextTripDate: nextTrip,
      };
      
      setPassengerStats(stats);

    } catch (error) {
      console.error('Failed to fetch passenger data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPassengerData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No upcoming trips';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString('en-ET')}`;
  };

  const getStatusColor = (status: string): { bg: string; text: string } => {
    const colors = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };
    return colors[status as keyof typeof colors] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getVehicleIcon = (vehicleType: string): string => {
    const icons: Record<string, string> = {
      luxury_bus: '🚌',
      coaster: '🚎',
      minibus: '🚐',
    };
    return icons[vehicleType] || '🚗';
  };

  const quickActions = [
    {
      title: 'Book New Trip',
      description: 'Find and book your next journey',
      icon: PlusCircle,
      route: '/tabs/trips',
      bgColor: 'bg-blue-500',
    },
    {
      title: 'Booking History',
      description: 'See all your past trips',
      icon: History,
      route: '/tabs/tickets',
      bgColor: 'bg-green-500',
    },
    {
      title: 'Payment Methods',
      description: 'Manage your payment options',
      icon: CreditCard,
      route: '/(screens)/payment/methods',
      bgColor: 'bg-purple-500',
    },
    {
      title: 'Help Center',
      description: 'Get assistance and support',
      icon: HelpCircle,
      route: '/(screens)/support/help',
      bgColor: 'bg-pink-500',
    },
  ];

  const stats = [
    {
      icon: Calendar,
      value: passengerStats.upcomingTrips.toString(),
      label: 'Upcoming Trips',
      color: '#3B82F6',
      route: '/tabs/tickets',
    },
    {
      icon: Ticket,
      value: formatCurrency(passengerStats.totalSpent),
      label: 'Total Spent',
      color: '#10B981',
      route: '/(screens)/payment/history',
    },
    {
      icon: Car,
      value: passengerStats.completedTrips.toString(),
      label: 'Completed Trips',
      color: '#8B5CF6',
      route: '/tabs/tickets',
    },
    {
      icon: Clock,
      value: formatDate(passengerStats.nextTripDate?.toISOString() || null),
      label: 'Next Trip',
      color: '#F59E0B',
      route: upcomingTrips.length > 0 ? `/tabs/tickets/${upcomingTrips[0].id}` : '/tabs/trips',
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
        <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => {
          logout();
          router.replace('/auth/login');
        }}
        className="w-10 h-10 bg-red-100 rounded-full items-center justify-center"
        activeOpacity={0.7}
      >
        <LogOut size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading || authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Loader message="Loading passenger dashboard..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScreenLayout
          showHeader={true}
          headerTitle="Passenger Dashboard"
          showBackButton={false}
          className="flex-1"
        >
          <View className="flex-1 items-center justify-center px-4">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <AlertCircle size={32} color="#DC2626" />
            </View>
            <Text className="text-lg font-semibold text-gray-800 mb-2 text-center">
              Error Loading Dashboard
            </Text>
            <Text className="text-gray-600 mb-4 text-center">{error}</Text>
            <Button
              title="Try Again"
              onPress={fetchPassengerData}
              variant="primary"
              className="mt-4"
            />
          </View>
        </ScreenLayout>
      </SafeAreaView>
    );
  }

  const safeUser = user || { fullName: 'Passenger', _id: 'guest-id' };
  const userName = safeUser.fullName?.split(' ')[0] || 'Passenger';
  const userId = safeUser._id?.slice(-8) || 'N/A';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenLayout
        showHeader={true}
        headerTitle={`${getGreeting()}, ${userName}`}
        showBackButton={false}
        rightAction={<HeaderRightActions />}
        className="flex-1"
        showBottomTab={true}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerClassName="pb-6"
        >
          {/* Welcome Section */}
          <View className="px-4 pt-4">
            <Text className="text-gray-600 text-sm mb-2">
              Here's what's happening with your trips today
            </Text>
          </View>

          {/* Passenger Info */}
          <View className="px-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <User size={14} color="#2563EB" />
                <Text className="text-sm font-medium text-blue-700">
                  Passenger ID: {userId}
                </Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View className="px-4 mb-4">
            <TouchableOpacity
              onPress={() => router.push('/tabs/trips')}
              className="bg-white p-4 rounded-xl flex-row items-center border border-gray-200"
              activeOpacity={0.8}
            >
              <Search size={20} color="#6B7280" />
              <Text className="text-gray-500 ml-3 flex-1">
                Search destinations, buses, routes...
              </Text>
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View className="px-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Dashboard Overview</Text>
            <View className="flex-row flex-wrap -mx-1">
              {stats.map((stat, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/2 px-1 mb-3"
                  onPress={() => router.push(stat.route)}
                  activeOpacity={0.7}
                >
                  <Card className="border border-gray-200">
                    <View className="flex-row items-center p-3">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <stat.icon size={20} color={stat.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                          {stat.value}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-1">{stat.label}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upcoming Trips */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Upcoming Trips</Text>
              <TouchableOpacity onPress={() => router.push('/tabs/tickets')}>
                <Text className="text-sm text-blue-600">View All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingTrips.length === 0 ? (
              <Card className="py-8 border border-gray-200">
                <EmptyState
                 icon={<MapPin size={48} color="#9CA3AF" />}
                  title="No Upcoming Trips"
                  description="You don't have any trips scheduled yet."
                  buttonText="Book Your First Trip"
                  onButtonPress={() => router.push('/tabs/trips')}
                />
              </Card>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="pr-4"
              >
                {upcomingTrips.map((trip) => {
                  const statusColor = getStatusColor(trip.status);
                  return (
                    <Card
                      key={trip.id}
                      onPress={() => router.push(`/tabs/tickets/${trip.id}`)}
                      className="w-80 mr-4 border border-gray-200"
                    >
                      <View className="p-4">
                        <View className="flex-row items-start justify-between mb-3">
                          <View className="flex-row items-start gap-2 flex-1">
                            <Text className="text-2xl">{getVehicleIcon(trip.vehicleType)}</Text>
                            <View className="flex-1">
                              <Text className="font-semibold text-lg text-gray-900">
                                {trip.from} → {trip.to}
                              </Text>
                              <View className="flex-row items-center gap-3 mt-1">
                                <View className="flex-row items-center gap-1">
                                  <Calendar size={14} color="#6B7280" />
                                  <Text className="text-sm text-gray-600">
                                    {new Date(trip.departureTime).toLocaleDateString()}
                                  </Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                  <Clock size={14} color="#6B7280" />
                                  <Text className="text-sm text-gray-600">
                                    {formatTime(trip.departureTime)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                          <Badge
                            text={trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                            variant={trip.status === 'confirmed' ? 'success' : 'warning'}
                            className={statusColor.bg}
                            textClassName={statusColor.text}
                          />
                        </View>
                        
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row flex-wrap gap-2">
                            <Text className="text-sm text-gray-600">
                              Seats: {trip.seats.join(', ')}
                            </Text>
                            <Text className="text-sm text-gray-600">
                              Bus: {trip.busNumber}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-xl font-bold text-gray-900">
                              {formatCurrency(trip.price * trip.seats.length)}
                            </Text>
                            <Text className="text-sm text-gray-600">
                              {trip.seats.length} seat{trip.seats.length !== 1 ? 's' : ''} × {formatCurrency(trip.price)}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row gap-2 mt-4">
                          <Button
                            title="View Details"
                            onPress={() => router.push(`/tabs/tickets/${trip.id}`)}
                            variant="secondary"
                            size="small"
                            className="flex-1"
                          />
                          <Button
                            title="Check In"
                            onPress={() => router.push(`/tabs/tickets/${trip.id}/checkin`)}
                            variant="primary"
                            size="small"
                            className="flex-1"
                          />
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Quick Actions */}
          <View className="px-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap -mx-1">
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/2 px-1 mb-3"
                  onPress={() => router.push(action.route)}
                  activeOpacity={0.8}
                >
                  <Card className="border border-gray-200">
                    <View className="p-4">
                      <View className="flex-row items-center">
                        <View className={`w-12 h-12 rounded-full ${action.bgColor} items-center justify-center mr-3`}>
                          <action.icon size={24} color="white" />
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
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Development Note */}
          <View className="px-4 mb-6">
            <Card className="bg-blue-50 border border-blue-200">
              <View className="flex-row items-start p-4">
                <AlertCircle size={20} color="#2563EB" />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-blue-800">Development Note</Text>
                  <Text className="text-blue-700 text-sm mt-1">
                    Trip booking APIs are not yet implemented. This dashboard currently shows mock data.
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Promotional Banner */}
          <View className="px-4 mb-6">
            <TouchableOpacity
              onPress={() => router.push('/tabs/trips?promo=firsttrip')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4"
              activeOpacity={0.9}
            >
              <View className="flex-row items-center">
                <Sparkles size={24} color="white" />
                <View className="ml-4 flex-1">
                  <Text className="text-white text-lg font-bold">First Trip Special!</Text>
                  <Text className="text-white/90 mt-1">
                    Get 15% off on your first booking
                  </Text>
                </View>
                <TrendingUp size={24} color="white" />
              </View>
              <View className="flex-row items-center mt-4">
                <Text className="text-white font-semibold">Book Now</Text>
                <ArrowRight size={16} color="white" className="ml-2" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Safety Reminder */}
          <View className="px-4 mb-6">
            <Card className="bg-blue-50 border border-blue-200">
              <View className="p-4">
                <View className="flex-row items-start">
                  <Shield size={24} color="#3B82F6" />
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-gray-900">Travel Safety Tips</Text>
                    <Text className="text-gray-600 mt-2">
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
              </View>
            </Card>
          </View>
        </ScrollView>
      </ScreenLayout>
    </SafeAreaView>
  );
}
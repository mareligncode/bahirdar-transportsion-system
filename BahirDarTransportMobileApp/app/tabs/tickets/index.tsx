import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bus,
  Clock,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket,
  Search,
  Download,
  Share2,
  X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { Booking, Trip } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';
import { Loader } from '../../../components/common/Loader';

const { width } = Dimensions.get('window');

export default function TicketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { bookings, fetchMyBookings, loading } = useBooking();

  const [refreshing, setRefreshing] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
    filterBookings();
  }, [bookings, filter, searchQuery]);

  const filterBookings = () => {
    const now = new Date();

    let filtered = [...bookings];
    if (searchQuery) {
      filtered = filtered.filter(b => {
        const originName = getOriginName(b).toLowerCase();
        const destName = getDestinationName(b).toLowerCase();
        const bookingNumber = (b.bookingNumber || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return originName.includes(query) || 
               destName.includes(query) || 
               bookingNumber.includes(query);
      });
    }
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(b => {
          const departureTime = getDepartureTime(b);
          return departureTime && new Date(departureTime) > now && b.status !== 'cancelled';
        });
        break;
      case 'past':
        filtered = filtered.filter(b => {
          const departureTime = getDepartureTime(b);
          return departureTime && new Date(departureTime) < now && b.status !== 'cancelled';
        });
        break;
      case 'cancelled':
        filtered = filtered.filter(b => b.status === 'cancelled');
        break;
      default:
        filtered = filtered;
    }
    filtered.sort((a, b) => {
      const dateA = getDepartureTime(a) ? new Date(getDepartureTime(a)!).getTime() : 0;
      const dateB = getDepartureTime(b) ? new Date(getDepartureTime(b)!).getTime() : 0;
      return dateB - dateA;
    });

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchMyBookings();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
  };

  const getTripFromBooking = (booking: Booking): Trip | null => {
    if (!booking.tripID) return null;
    return typeof booking.tripID === 'object' && booking.tripID !== null
      ? booking.tripID as Trip
      : null;
  };

  const getOriginName = (booking: Booking): string => {
    const trip = getTripFromBooking(booking);
    return trip?.origin?.stationName || 'Unknown';
  };

  const getDestinationName = (booking: Booking): string => {
    const trip = getTripFromBooking(booking);
    return trip?.destination?.stationName || 'Unknown';
  };

  const getDepartureTime = (booking: Booking): string | null => {
    const trip = getTripFromBooking(booking);
    return trip?.departureTime || null;
  };

  const getArrivalTime = (booking: Booking): string | null => {
    const trip = getTripFromBooking(booking);
    return trip?.arrivalTime || null;
  };

  const getVehicleInfo = (booking: Booking): { carType?: string; plateNumber?: string } => {
    const trip = getTripFromBooking(booking);
    return {
      carType: trip?.vehicle?.carType,
      plateNumber: trip?.vehicle?.plateNumber,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: '#16a34a' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: '#ca8a04' };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '#dc2626' };
      case 'completed': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '#2563eb' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: '#6b7280' };
    }
  };

  const getStatusIcon = (status: string, size: number = 16) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircle size={size} color="#16a34a" />;
      case 'pending': return <Clock size={size} color="#ca8a04" />;
      case 'cancelled': return <XCircle size={size} color="#dc2626" />;
      case 'completed': return <CheckCircle size={size} color="#2563eb" />;
      default: return <AlertCircle size={size} color="#6b7280" />;
    }
  };

  const getTimeStatus = (departureTime: string | null) => {
    if (!departureTime) return { label: 'Unknown', color: 'text-gray-500' };
    
    const now = new Date();
    const departure = new Date(departureTime);
    const diffHours = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      return { label: 'Departed', color: 'text-gray-500' };
    } else if (diffHours < 2) {
      return { label: 'Boarding soon', color: 'text-orange-500 font-bold' };
    } else if (diffHours < 24) {
      return { label: `${Math.round(diffHours)}h left`, color: 'text-green-600' };
    } else {
      return { label: `${Math.round(diffHours / 24)}d left`, color: 'text-blue-600' };
    }
  };

  const renderTicketCard = ({ item, index }: { item: Booking; index: number }) => {
    const trip = getTripFromBooking(item);
    const originName = getOriginName(item);
    const destinationName = getDestinationName(item);
    const departureTime = getDepartureTime(item);
    const arrivalTime = getArrivalTime(item);
    const vehicle = getVehicleInfo(item);
    const seatNumbers = item.seatNumbers || (item.seatNumber ? [item.seatNumber] : []);
    const totalAmount = item.totalPrice || item.amount || ((trip?.price || 0) * seatNumbers.length);
    const statusColors = getStatusColor(item.status || 'pending');
    const timeStatus = getTimeStatus(departureTime);
    
    const isUpcoming = departureTime && new Date(departureTime) > new Date();
    const needsPayment = item.status === 'pending' && (!item.paymentStatus || item.paymentStatus === 'pending');
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
            router.push(`/tabs/tickets/${item._id}`);
          }}
          activeOpacity={0.95}
          className="bg-white mb-4 rounded-2xl overflow-hidden shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <LinearGradient
            colors={isUpcoming ? ['#3b82f6', '#1e40af'] : ['#6b7280', '#4b5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                  <Bus size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xs opacity-80">From → To</Text>
                  <Text className="text-white font-bold text-base" numberOfLines={1}>
                    {originName} → {destinationName}
                  </Text>
                </View>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-medium">
                  #{item.bookingNumber?.slice(-8) || item._id?.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>
          </LinearGradient>
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center bg-blue-50 px-3 py-2 rounded-xl">
                <Calendar size={16} color={COLORS.primary} />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {departureTime ? formatDate(departureTime) : 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center bg-purple-50 px-3 py-2 rounded-xl">
                <Clock size={16} color="#8b5cf6" />
                <Text className="text-sm font-medium text-gray-700 ml-2">
                  {departureTime ? formatTime(departureTime) : 'N/A'}
                </Text>
              </View>
            </View>

            {isUpcoming && (
              <View className="mb-4">
                <View className={`bg-orange-50 px-4 py-2 rounded-xl border border-orange-200 flex-row items-center`}>
                  <Clock size={16} color="#f97316" />
                  <Text className={`ml-2 font-medium ${timeStatus.color}`}>
                    {timeStatus.label}
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xs text-gray-500 mb-1">Seats</Text>
                <View className="flex-row gap-1">
                  {seatNumbers.map((seat, idx) => (
                    <View key={idx} className="bg-blue-500 px-3 py-1.5 rounded-lg">
                      <Text className="text-white text-sm font-bold">{seat}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500 mb-1">Bus</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {vehicle.carType || 'Standard'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {vehicle.plateNumber || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Status and Amount */}
            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
              <View className="flex-row gap-2">
                <View className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${statusColors.bg} border ${statusColors.border}`}>
                  {getStatusIcon(item.status || 'pending', 14)}
                  <Text className={`text-xs font-bold ${statusColors.text}`}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
                {needsPayment && (
                  <View className="bg-yellow-100 px-3 py-1.5 rounded-full">
                    <Text className="text-yellow-700 text-xs font-bold">PAYMENT DUE</Text>
                  </View>
                )}
              </View>
              <Text className="text-xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View className="flex-row border-t border-gray-100 bg-gray-50">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/tabs/tickets/${item._id}?action=download`);
              }}
              className="flex-1 flex-row items-center justify-center py-3 border-r border-gray-200"
            >
              <Download size={16} color={COLORS.primary} />
              <Text className="text-sm font-medium text-gray-700 ml-2">Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/tabs/tickets/${item._id}?action=share`);
              }}
              className="flex-1 flex-row items-center justify-center py-3"
            >
              <Share2 size={16} color={COLORS.primary} />
              <Text className="text-sm font-medium text-gray-700 ml-2">Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
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
        <Text className="text-3xl font-bold text-white mb-1">My Tickets</Text>
        <Text className="text-blue-100 text-sm">
          {filteredBookings.length} {filteredBookings.length === 1 ? 'ticket' : 'tickets'} found
        </Text>
      </LinearGradient>

      {/* Search Bar */}
      <View className="px-4 -mt-5 mb-3">
        <View className="bg-white rounded-xl shadow-lg flex-row items-center px-4 py-3">
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            placeholder="Search by route or booking #"
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-800 text-base"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="px-4 pb-3"
      >
        <View className="flex-row gap-2">
          {(['all', 'upcoming', 'past', 'cancelled'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(filterType);
              }}
              className={`
                px-5 py-2.5 rounded-full mr-2
                ${filter === filterType
                  ? 'bg-blue-600 shadow-md'
                  : 'bg-gray-100 border border-gray-200'
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

  const renderEmptyState = () => (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
      className="flex-1 justify-center items-center px-6 mt-10"
    >
      <View className="bg-gray-100 w-24 h-24 rounded-full items-center justify-center mb-4">
        <Ticket size={48} color={COLORS.textTertiary} />
      </View>
      <Text className="text-2xl font-bold text-gray-800 text-center">
        No Tickets Found
      </Text>
      <Text className="text-gray-500 text-center mt-2 text-base">
        {filter !== 'all'
          ? `You don't have any ${filter} tickets.`
          : "You haven't booked any trips yet."}
      </Text>
      {filter !== 'all' ? (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setFilter('all');
          }}
          className="mt-6 bg-blue-600 py-3 px-8 rounded-xl shadow-lg"
        >
          <Text className="text-white font-semibold text-base">Show All Tickets</Text>
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
    </Animated.View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <Loader message="Checking authentication..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <FlatList
        data={filteredBookings}
        renderItem={renderTicketCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
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
        windowSize={10}
      />

      {loading && !refreshing && (
        <View className="absolute inset-0 bg-white/80 items-center justify-center">
          <Loader message="Loading your tickets..." />
        </View>
      )}
    </SafeAreaView>
  );
}
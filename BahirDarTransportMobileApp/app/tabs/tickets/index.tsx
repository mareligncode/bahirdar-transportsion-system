// app/tabs/tickets/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bus,
  Clock,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket,
  Search,
  QrCode,
  Download,
  Share2,
} from 'lucide-react-native';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { Booking, Trip } from '../../../types';
import { formatDate, formatTime, formatCurrency } from '../../../utils/helpers';
import { COLORS } from '../../../constants/colors';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { Badge } from '../../../components/common/Badge';

export default function TicketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { bookings, fetchMyBookings, loading } = useBooking();

  const [refreshing, setRefreshing] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchMyBookings();
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
    filterBookings();
  }, [bookings, filter]);

  const filterBookings = () => {
    const now = new Date();

    let filtered = [...bookings];

    switch (filter) {
      case 'upcoming':
        filtered = bookings.filter(b => {
          const departureTime = getDepartureTime(b);
          return departureTime && new Date(departureTime) > now && b.status !== 'cancelled';
        });
        break;
      case 'past':
        filtered = bookings.filter(b => {
          const departureTime = getDepartureTime(b);
          return departureTime && new Date(departureTime) < now && b.status !== 'cancelled';
        });
        break;
      case 'cancelled':
        filtered = bookings.filter(b => b.status === 'cancelled');
        break;
      default:
        filtered = bookings;
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => {
      const dateA = getDepartureTime(a) ? new Date(getDepartureTime(a)!).getTime() : 0;
      const dateB = getDepartureTime(b) ? new Date(getDepartureTime(b)!).getTime() : 0;
      return dateB - dateA;
    });

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyBookings();
    setRefreshing(false);
  };

  // Helper functions to safely get data
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
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <CheckCircle size={16} color="#16a34a" />;
      case 'pending': return <Clock size={16} color="#ca8a04" />;
      case 'cancelled': return <XCircle size={16} color="#dc2626" />;
      case 'completed': return <CheckCircle size={16} color="#2563eb" />;
      default: return <AlertCircle size={16} color="#6b7280" />;
    }
  };

  const renderTicketCard = ({ item }: { item: Booking }) => {
    const trip = getTripFromBooking(item);
    const originName = getOriginName(item);
    const destinationName = getDestinationName(item);
    const departureTime = getDepartureTime(item);
    const arrivalTime = getArrivalTime(item);
    const vehicle = getVehicleInfo(item);
    const seatNumbers = item.seatNumber ? [item.seatNumber] : (item.seatNumbers || []);
    const totalAmount = item.totalPrice || item.amount || ((trip?.price || 0) * seatNumbers.length);
    const statusColor = getStatusColor(item.status || 'pending');

    const isUpcoming = departureTime && new Date(departureTime) > new Date();
    const needsPayment = item.status === 'pending' && (!item.paymentStatus || item.paymentStatus === 'pending');

    return (
      <TouchableOpacity
        onPress={() => router.push(`/tabs/tickets/${item._id}`)}
        activeOpacity={0.7}
        className="bg-white mb-4 rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        {/* Ticket Header with Route */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-100 p-2 rounded-full mr-2">
                  <Bus size={16} color={COLORS.primary} />
                </View>
                <Text className="font-bold text-lg text-gray-800" numberOfLines={1}>
                  {originName}
                </Text>
              </View>

              <View className="flex-row items-center ml-6">
                <View className="w-2 h-2 bg-gray-300 rounded-full" />
                <View className="flex-1 h-0.5 bg-gray-300 mx-1" />
                <Bus size={12} color={COLORS.primary} />
                <View className="flex-1 h-0.5 bg-gray-300 mx-1" />
                <View className="w-2 h-2 bg-gray-300 rounded-full" />
              </View>

              <View className="flex-row items-center mt-2 ml-6">
                <Text className="font-bold text-lg text-gray-800" numberOfLines={1}>
                  {destinationName}
                </Text>
              </View>
            </View>

            {/* QR Code Mini Preview */}
            <TouchableOpacity
              onPress={() => router.push(`/tabs/tickets/${item._id}`)}
              className="bg-gray-100 p-2 rounded-lg"
            >
              <QrCode size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ticket Details */}
        <View className="p-4">
          {/* Date and Time */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
              <Calendar size={14} color={COLORS.textSecondary} />
              <Text className="text-xs text-gray-600 ml-1">
                {departureTime ? formatDate(departureTime) : 'N/A'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color={COLORS.textSecondary} />
              <Text className="text-xs text-gray-600 ml-1">
                {departureTime ? formatTime(departureTime) : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Seat Numbers */}
          <View className="flex-row items-center mb-3">
            <Text className="text-xs text-gray-500 mr-2">Seats:</Text>
            <View className="flex-row gap-1">
              {seatNumbers.map((seat, index) => (
                <View key={index} className="bg-blue-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-medium">{seat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Vehicle Info */}
          <View className="flex-row items-center mb-3">
            <Text className="text-xs text-gray-500 mr-2">Bus:</Text>
            <Text className="text-xs text-gray-700">
              {vehicle.carType || 'Standard'} • {vehicle.plateNumber || 'N/A'}
            </Text>
          </View>

          {/* Status and Amount */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2">
              <View className={`px-2 py-1 rounded-full border flex-row items-center gap-1 ${statusColor}`}>
                {getStatusIcon(item.status || 'pending')}
                <Text className="text-xs font-medium">
                  {item.status?.toUpperCase()}
                </Text>
              </View>

              {needsPayment && (
                <View className="bg-yellow-100 px-2 py-1 rounded-full">
                  <Text className="text-yellow-700 text-xs font-medium">Payment Due</Text>
                </View>
              )}
            </View>

            <Text className="font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {/* Download/Share Quick Actions */}
        <View className="flex-row border-t border-gray-100">
          <TouchableOpacity
            onPress={() => {
              // Quick download
              router.push(`/tabs/tickets/${item._id}?action=download`);
            }}
            className="flex-1 flex-row items-center justify-center py-3 border-r border-gray-100"
          >
            <Download size={16} color={COLORS.primary} />
            <Text className="text-xs text-gray-600 ml-1">Download</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Quick share
              router.push(`/tabs/tickets/${item._id}?action=share`);
            }}
            className="flex-1 flex-row items-center justify-center py-3"
          >
            <Share2 size={16} color={COLORS.primary} />
            <Text className="text-xs text-gray-600 ml-1">Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="px-4 py-3 bg-white border-b border-gray-200">
      <Text className="text-2xl font-bold text-gray-800 mb-3">My Tickets</Text>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
        {(['all', 'upcoming', 'past', 'cancelled'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            onPress={() => setFilter(filterType)}
            className={`
              px-4 py-2 rounded-full mr-2
              ${filter === filterType
                ? 'bg-blue-600'
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
      </ScrollView>

      {/* Search Bar */}
      <TouchableOpacity
        onPress={() => router.push('/tabs/trips/search')}
        className="mt-3 bg-gray-100 p-3 rounded-xl flex-row items-center"
      >
        <Search size={18} color={COLORS.textSecondary} />
        <Text className="text-gray-500 ml-2 flex-1">Search your tickets...</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-6 mt-10">
      <Ticket size={80} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
        No Tickets Found
      </Text>
      <Text className="text-gray-500 text-center mt-2">
        {filter !== 'all'
          ? `No ${filter} tickets available.`
          : "You haven't booked any trips yet."}
      </Text>
      {filter !== 'all' ? (
        <TouchableOpacity
          onPress={() => setFilter('all')}
          className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
        >
          <Text className="text-white font-semibold">Show All Tickets</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/tabs/trips')}
          className="mt-6 bg-blue-600 py-3 px-6 rounded-xl"
        >
          <Text className="text-white font-semibold">Book Your First Trip</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Loader message="Checking authentication..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {renderHeader()}

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <Loader message="Loading your tickets..." />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 80,
          }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
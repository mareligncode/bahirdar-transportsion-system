// app/tabs/profile/bookings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bus,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  X,
  CheckCircle,
  AlertCircle,
  Clock as PendingIcon,
  XCircle,
  ChevronRight,
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react-native';

import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/common/Button';
import { BookingCard } from '../../../components/booking/BookingCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loader } from '../../../components/common/Loader';
import { COLORS, getBookingStatusColors } from '../../../constants/colors';
import { Booking } from '../../../types/booking';

export default function BookingsScreen() {
  const { user } = useAuth();
  const {
    getMyBookings,
    cancelBooking,
    loading
  } = useBooking();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    const data = await getMyBookings();
    setBookings(data || []);
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setIsCancelling(true);
    const success = await cancelBooking(selectedBooking._id);
    setIsCancelling(false);
    
    if (success) {
      setCancelModalVisible(false);
      setSelectedBooking(null);
      await loadBookings(); // Reload bookings after cancellation
    }
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelModalVisible(true);
  };

  // 🟢 FIX: Handle view ticket with proper validation
  const handleViewTicket = (booking: Booking) => {
    console.log('🔍 ===== VIEW TICKET CLICKED =====');
    console.log('🔍 Booking:', {
      id: booking._id,
      tripId: booking.tripID?._id,
      tripIdType: typeof booking.tripID?._id,
      tripIdLength: booking.tripID?._id?.length
    });

    // Check if booking has a valid trip
    if (!booking.tripID) {
      console.error('❌ No tripID in booking');
      Alert.alert('Error', 'Trip details not available');
      return;
    }

    // Handle both populated trip object and string ID
    let tripId: string | null = null;
    
    if (typeof booking.tripID === 'object' && booking.tripID !== null) {
      tripId = booking.tripID._id;
      console.log('🔍 Extracted trip ID from object:', tripId);
    } else if (typeof booking.tripID === 'string') {
      tripId = booking.tripID;
      console.log('🔍 Trip ID is a string:', tripId);
    }

    // Validate the trip ID
    if (!tripId) {
      console.error('❌ No trip ID found');
      Alert.alert('Error', 'Trip ID not found');
      return;
    }

    if (tripId === 'index') {
      console.error('❌ Trip ID is "index" - invalid');
      Alert.alert('Error', 'Invalid trip data');
      return;
    }

    if (tripId.length !== 24) {
      console.error('❌ Trip ID has wrong length:', tripId.length);
      Alert.alert('Error', 'Invalid trip ID format');
      return;
    }

    // Valid trip ID - navigate to trip details
    console.log('✅ Navigating to trip details with ID:', tripId);
    router.push({
      pathname: '/tabs/trips/[id]',
      params: { id: tripId }
    });
  };

  // Filter bookings based on active filter
  const getFilteredBookings = () => {
    if (activeFilter === 'all') return bookings;
    return bookings.filter(b => b.status?.toLowerCase() === activeFilter.toLowerCase());
  };

  // Calculate booking summary
  const getBookingSummary = () => {
    return {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };
  };

  const filteredBookings = getFilteredBookings();
  const summary = getBookingSummary();

  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Filter Bookings</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-700 font-medium mb-3">Status</Text>
            <View className="flex-row flex-wrap mb-6">
              {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map((status) => {
                const statusColors = getBookingStatusColors(status);
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => {
                      setActiveFilter(status);
                      setFilterModalVisible(false);
                    }}
                    style={{
                      backgroundColor: activeFilter === status ? COLORS.primary : COLORS.gray100,
                    }}
                    className="px-4 py-2 rounded-full mr-2 mb-2"
                  >
                    <Text
                      style={{
                        color: activeFilter === status ? COLORS.white : COLORS.gray700,
                      }}
                      className="font-medium"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeFilter !== 'all' && (
              <TouchableOpacity
                onPress={() => {
                  setActiveFilter('all');
                  setFilterModalVisible(false);
                }}
                className="py-3"
              >
                <Text style={{ color: COLORS.primary }} className="text-center font-medium">
                  Clear Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const CancelModal = () => (
    <Modal
      visible={cancelModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCancelModalVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-2xl w-full max-w-sm p-6">
          <View className="items-center mb-4">
            <View className="bg-red-100 p-3 rounded-full">
              <XCircle size={32} color={COLORS.danger} />
            </View>
          </View>
          
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Cancel Booking
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            Are you sure you want to cancel this booking?
          </Text>

          {selectedBooking && (
            <View className="bg-gray-50 p-4 rounded-xl mb-6">
              <Text className="font-semibold text-gray-900 mb-1">
                {typeof selectedBooking.tripID === 'object' 
                  ? `${selectedBooking.tripID?.origin?.stationName || 'Unknown'} → ${selectedBooking.tripID?.destination?.stationName || 'Unknown'}`
                  : 'Trip details unavailable'}
              </Text>
              <Text className="text-gray-500 text-sm">
                {typeof selectedBooking.tripID === 'object' && selectedBooking.tripID?.departureTime
                  ? new Date(selectedBooking.tripID.departureTime).toLocaleString()
                  : 'Date unavailable'}
              </Text>
              <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
                <Text className="text-gray-600">Refund Amount</Text>
                <Text className="font-bold text-blue-600">
                  ETB {selectedBooking.totalPrice || 0}
                </Text>
              </View>
            </View>
          )}

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => setCancelModalVisible(false)}
              className="flex-1 bg-gray-100 py-3 rounded-lg mr-2"
            >
              <Text className="text-gray-700 font-medium text-center">Keep</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCancelBooking}
              disabled={isCancelling}
              className="flex-1 bg-red-500 py-3 rounded-lg ml-2"
            >
              <Text className="text-white font-medium text-center">
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Loader fullScreen message="Loading your bookings..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Custom Header */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={COLORS.gray900} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-gray-900">
            My Bookings
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={onRefresh}
              className="p-2 mr-2"
              disabled={refreshing}
            >
              <RefreshCw 
                size={20} 
                color={COLORS.gray600} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(true)}
              className="p-2"
            >
              <Filter size={20} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FilterModal />
      <CancelModal />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View className="flex-row justify-between px-4 mt-4">
          <View className="bg-white flex-1 mr-2 p-4 rounded-xl shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-xs">Total</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {summary.total}
            </Text>
          </View>
          <View className="bg-green-50 flex-1 mx-2 p-4 rounded-xl border border-green-100">
            <Text className="text-green-600 text-xs">Confirmed</Text>
            <Text className="text-2xl font-bold text-green-700">
              {summary.confirmed}
            </Text>
          </View>
          <View className="bg-yellow-50 flex-1 ml-2 p-4 rounded-xl border border-yellow-100">
            <Text className="text-yellow-600 text-xs">Pending</Text>
            <Text className="text-2xl font-bold text-yellow-700">
              {summary.pending}
            </Text>
          </View>
        </View>

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <View className="flex-row items-center mx-4 mt-4">
            <Text className="text-gray-600 mr-2">Filtered by:</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full flex-row items-center">
              <Text className="text-blue-600 font-medium mr-1 capitalize">
                {activeFilter}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
              >
                <X size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bookings List */}
        <View className="px-4 mt-4 pb-8">
          {filteredBookings.length === 0 ? (
            <EmptyState
              icon={<Bus size={48} color={COLORS.gray400} />}
              title="No Bookings Found"
              message={
                activeFilter !== 'all'
                  ? "No bookings match your current filter."
                  : "You haven't made any bookings yet. Start your journey by booking a trip!"
              }
              buttonTitle={activeFilter !== 'all' ? "Clear Filters" : "Book a Trip"}
              onButtonPress={() => {
                if (activeFilter !== 'all') {
                  setActiveFilter('all');
                } else {
                  router.push('/tabs/trips');
                }
              }}
            />
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={() => openCancelModal(booking)}
                onViewTicket={() => handleViewTicket(booking)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
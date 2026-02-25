 // app/(screens)/booking/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBooking } from '../../../hooks/useBooking';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { BookingCard } from '../../../components/booking/BookingCard';
import { Booking } from '../../../types/booking';
import { COLORS, getBookingStatusColors } from '../../../constants/colors';

export default function BookingListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getMyBookings, cancelBooking, loading } = useBooking();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const statusFilters = [
    { id: 'all', label: 'All', icon: 'apps-outline', color: COLORS.gray600 },
    { id: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline', color: COLORS.booking.confirmedText },
    { id: 'pending', label: 'Pending', icon: 'time-outline', color: COLORS.booking.pendingText },
    { id: 'completed', label: 'Completed', icon: 'checkmark-done-circle-outline', color: COLORS.booking.completedText },
    { id: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline', color: COLORS.booking.cancelledText },
  ];

  const fetchBookings = async () => {
    setIsLoading(true);
    const data = await getMyBookings();
    setBookings(data || []);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchBookings();
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelling(true);
    const success = await cancelBooking(selectedBooking._id);
    setCancelling(false);
    
    if (success) {
      setCancelModalVisible(false);
      setSelectedBooking(null);
      fetchBookings();
      Alert.alert('Success', 'Booking cancelled successfully');
    }
  };

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelModalVisible(true);
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  const getActiveFilterLabel = () => {
    const filter = statusFilters.find(f => f.id === filterStatus);
    return filter?.label || 'All';
  };

  const getStatusSummary = () => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    return { total, confirmed, pending, cancelled };
  };

  const summary = getStatusSummary();

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-blue-100 p-4 rounded-full mb-6">
            <Ionicons name="ticket-outline" size={48} color={COLORS.primary} />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Sign in to View Bookings
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            Please login to view and manage your trip bookings
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/auth/Login')}
            className="px-8"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b" style={{ borderColor: COLORS.border }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mr-3 p-2"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                My Bookings
              </Text>
              <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity 
              onPress={onRefresh}
              className="p-2 rounded-full mr-2"
              style={{ backgroundColor: COLORS.gray100 }}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? COLORS.gray400 : COLORS.gray700} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(true)}
              className="p-2 rounded-full"
              style={{ backgroundColor: COLORS.gray100 }}
            >
              <Ionicons 
                name="options-outline" 
                size={20} 
                color={filterStatus !== 'all' ? COLORS.primary : COLORS.gray700} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Summary Cards */}
        <View className="flex-row mt-4 space-x-3">
          <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: COLORS.infoLight }}>
            <Text className="text-xs" style={{ color: COLORS.textSecondary }}>Total</Text>
            <Text className="text-xl font-bold" style={{ color: COLORS.primary }}>{summary.total}</Text>
          </View>
          <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: COLORS.successLight }}>
            <Text className="text-xs" style={{ color: COLORS.textSecondary }}>Confirmed</Text>
            <Text className="text-xl font-bold" style={{ color: COLORS.booking.confirmedText }}>{summary.confirmed}</Text>
          </View>
          <View className="flex-1 p-3 rounded-lg" style={{ backgroundColor: COLORS.warningLight }}>
            <Text className="text-xs" style={{ color: COLORS.textSecondary }}>Pending</Text>
            <Text className="text-xl font-bold" style={{ color: COLORS.booking.pendingText }}>{summary.pending}</Text>
          </View>
        </View>

        {/* Active Filter Chip */}
        {filterStatus !== 'all' && (
          <View className="flex-row items-center mt-3">
            <View className="px-3 py-1.5 rounded-full flex-row items-center" style={{ backgroundColor: COLORS.primaryLight + '20' }}>
              <Text className="text-sm mr-2" style={{ color: COLORS.primary }}>
                Filter: {getActiveFilterLabel()}
              </Text>
              <TouchableOpacity onPress={() => setFilterStatus('all')}>
                <Ionicons name="close-circle" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bookings List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4" style={{ color: COLORS.textSecondary }}>Loading your bookings...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View className="flex-1 px-4">
          <EmptyState
            icon={<Ionicons name="ticket-outline" size={48} color={COLORS.gray400} />}
            title="No Bookings Found"
            description={
              filterStatus !== 'all'
                ? `You don't have any ${filterStatus} bookings. Try adjusting your filter.`
                : "You haven't made any bookings yet. Start your journey by booking a trip!"
            }
            actionLabel={filterStatus !== 'all' ? "Clear Filter" : "Book a Trip"}
            onAction={() => {
              if (filterStatus !== 'all') {
                setFilterStatus('all');
              } else {
                router.push('/tabs/trips/search');
              }
            }}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onViewTicket={() => {
                router.push({
                  pathname: '/tabs/tickets/[id]',
                  params: { id: booking._id }
                });
              }}
              onCancel={() => openCancelModal(booking)}
            />
          ))}
          <View className="h-20" />
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>Filter Bookings</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium mb-3" style={{ color: COLORS.gray700 }}>
              Booking Status
            </Text>
            
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => {
                  setFilterStatus(filter.id);
                  setFilterModalVisible(false);
                }}
                className={`flex-row items-center justify-between p-4 rounded-lg mb-2`}
                style={{ 
                  backgroundColor: filterStatus === filter.id ? COLORS.primaryLight + '20' : COLORS.gray100,
                  borderWidth: filterStatus === filter.id ? 1 : 0,
                  borderColor: filterStatus === filter.id ? COLORS.primary : undefined,
                }}
              >
                <View className="flex-row items-center">
                  <View 
                    className="p-2 rounded-full mr-3"
                    style={{ backgroundColor: filter.color + '20' }}
                  >
                    <Ionicons 
                      name={filter.icon as any} 
                      size={20} 
                      color={filter.color} 
                    />
                  </View>
                  <View>
                    <Text className={`font-medium ${
                      filterStatus === filter.id ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {filter.label}
                    </Text>
                    <Text className="text-xs" style={{ color: COLORS.textSecondary }}>
                      {bookings.filter(b => 
                        filter.id === 'all' ? true : b.status === filter.id
                      ).length} bookings
                    </Text>
                  </View>
                </View>
                {filterStatus === filter.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Button
              title="Apply Filter"
              onPress={() => setFilterModalVisible(false)}
              className="mt-4"
            />
          </View>
        </View>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl w-full max-w-sm p-6">
            <View className="items-center mb-4">
              <View className="p-3 rounded-full mb-3" style={{ backgroundColor: COLORS.dangerLight }}>
                <Ionicons name="close-circle" size={40} color={COLORS.danger} />
              </View>
              <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>Cancel Booking</Text>
              <Text className="text-center mt-1" style={{ color: COLORS.textSecondary }}>
                This action cannot be undone
              </Text>
            </View>

            {selectedBooking && (
              <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: COLORS.gray50 }}>
                <Text className="font-semibold" style={{ color: COLORS.textPrimary }}>
                  {typeof selectedBooking.tripID === 'object' && selectedBooking.tripID
                    ? `${selectedBooking.tripID?.origin?.stationName || 'Unknown'} → ${selectedBooking.tripID?.destination?.stationName || 'Unknown'}`
                    : 'Trip details unavailable'}
                </Text>
                <Text className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
                  {selectedBooking.tripID && typeof selectedBooking.tripID === 'object' && selectedBooking.tripID?.departureTime
                    ? new Date(selectedBooking.tripID.departureTime).toLocaleString()
                    : 'Date unavailable'}
                </Text>
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
                  <Text style={{ color: COLORS.textSecondary }}>Seat{selectedBooking.seatNumbers?.length > 1 ? 's' : ''}:</Text>
                  <Text className="font-medium" style={{ color: COLORS.textPrimary }}>
                    {selectedBooking.seatNumbers?.join(', ')}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <Text style={{ color: COLORS.textSecondary }}>Refund Amount:</Text>
                  <Text className="font-bold" style={{ color: COLORS.primary }}>
                    ETB {selectedBooking.totalPrice || 0}
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row space-x-3 mt-2">
              <Button
                title="Keep Booking"
                onPress={() => setCancelModalVisible(false)}
                variant="outline"
                className="flex-1"
              />
              <Button
                title={cancelling ? "Cancelling..." : "Yes, Cancel"}
                onPress={handleCancelBooking}
                disabled={cancelling}
                loading={cancelling}
                className="flex-1"
                style={{ backgroundColor: COLORS.danger }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button for New Booking */}
      <TouchableOpacity
        onPress={() => router.push('/tabs/trips/search')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: COLORS.primary, elevation: 8 }}
      >
        <Ionicons name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}


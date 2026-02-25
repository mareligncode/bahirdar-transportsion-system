 // app/(screens)/booking/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBooking } from '../../../hooks/useBooking';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Booking } from '../../../types/booking';
import { Trip } from '../../../types/trip';
import { COLORS } from '../../../constants/colors';
import {
  formatDate,
  formatTime,
  formatCurrency,
  calculateDuration,
} from '../../../utils/helpers';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBookingById, cancelBooking, loading } = useBooking();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'trip' | 'passenger'>('details');

  useEffect(() => {
    if (id) {
      loadBookingDetails();
    }
  }, [id]);

  const loadBookingDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getBookingById(id);
      setBooking(data);
      
      // Extract trip data if it's populated
      if (data && typeof data.tripID === 'object') {
        setTrip(data.tripID as Trip);
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setCancelling(true);
    const success = await cancelBooking(booking._id);
    setCancelling(false);
    
    if (success) {
      setCancelModalVisible(false);
      loadBookingDetails(); // Refresh the data
      Alert.alert('Success', 'Booking cancelled successfully');
    }
  };

  const handleShareTicket = async () => {
    try {
      await Share.share({
        message: `Booking #${booking?.bookingNumber || booking?._id?.slice(-6).toUpperCase()}
Trip: ${trip?.origin?.stationName} → ${trip?.destination?.stationName}
Date: ${trip?.departureTime ? formatDate(trip.departureTime) : 'N/A'} at ${trip?.departureTime ? formatTime(trip.departureTime) : 'N/A'}
Seats: ${booking?.seatNumbers?.join(', ')}
Total: ETB ${booking?.totalPrice || 0}`,
        title: 'My Bus Ticket',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('tel:+251912345678');
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'cancelled': return 'close-circle';
      case 'completed': return 'checkmark-done-circle';
      default: return 'information-circle';
    }
  };

  const getStatusColor = (status: string): string => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return COLORS.booking.confirmedText;
      case 'pending': return COLORS.booking.pendingText;
      case 'cancelled': return COLORS.booking.cancelledText;
      case 'completed': return COLORS.booking.completedText;
      default: return COLORS.gray500;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
          <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">Booking Not Found</Text>
          <Text className="text-gray-500 text-center mb-6">
            The booking you're looking for doesn't exist or has been removed.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isCancellable = ['confirmed', 'pending'].includes(booking.status?.toLowerCase() || '');
  const statusColor = getStatusColor(booking.status);
  const statusIcon = getStatusIcon(booking.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3 p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">Booking Details</Text>
            <Text className="text-sm text-gray-500">
              #{booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleShareTicket} className="p-2">
            <Ionicons name="share-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View 
          className="mx-4 mt-4 p-4 rounded-xl flex-row items-center"
          style={{ backgroundColor: statusColor + '15' }}
        >
          <View 
            className="p-2 rounded-full mr-3"
            style={{ backgroundColor: statusColor + '30' }}
          >
            <Ionicons name={statusIcon} size={24} color={statusColor} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold" style={{ color: statusColor }}>
              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
            </Text>
            <Text className="text-sm text-gray-600">
              {booking.status === 'confirmed' && 'Your booking is confirmed and guaranteed'}
              {booking.status === 'pending' && 'Awaiting payment confirmation'}
              {booking.status === 'cancelled' && 'This booking has been cancelled'}
              {booking.status === 'completed' && 'Trip completed successfully'}
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row bg-white mt-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab('details')}
            className={`flex-1 py-3 ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'details' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Booking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('trip')}
            className={`flex-1 py-3 ${activeTab === 'trip' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'trip' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Trip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('passenger')}
            className={`flex-1 py-3 ${activeTab === 'passenger' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-medium ${
              activeTab === 'passenger' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Passenger
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View className="px-4 py-4">
          {activeTab === 'details' && (
            <View className="space-y-4">
              {/* Booking Information */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Booking Information
                </Text>
                
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-500">Booking Number</Text>
                  <Text className="font-medium text-gray-800">
                    {booking.bookingNumber || booking._id?.slice(-6).toUpperCase()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-500">Ticket Number</Text>
                  <Text className="font-medium text-gray-800">
                    {booking.ticketNumber || 'TKT-' + booking._id?.slice(-8).toUpperCase()}
                  </Text>
                </View>
                
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-500">Booking Date</Text>
                  <Text className="font-medium text-gray-800">
                    {booking.bookingDate ? formatDate(booking.bookingDate) : 'N/A'}
                  </Text>
                </View>
                
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-500">Payment Status</Text>
                  <View className="flex-row items-center">
                    <View 
                      className={`w-2 h-2 rounded-full mr-2 ${
                        booking.paymentStatus === 'paid' ? 'bg-green-500' :
                        booking.paymentStatus === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} 
                    />
                    <Text className="font-medium text-gray-800 capitalize">
                      {booking.paymentStatus || 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Seat Information */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-semibold text-gray-800">
                    Seats
                  </Text>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 font-medium">
                      {booking.seatNumbers?.length || 1} seat(s)
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row flex-wrap">
                  {booking.seatNumbers?.map((seat, index) => (
                    <View key={index} className="bg-gray-100 px-4 py-2 rounded-lg mr-2 mb-2">
                      <Text className="font-bold text-gray-800">Seat {seat}</Text>
                    </View>
                  ))}
                </View>

                {booking.specialRequests && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-gray-500 mb-1">Special Requests</Text>
                    <Text className="text-gray-800">{booking.specialRequests}</Text>
                  </View>
                )}
              </View>

              {/* Price Breakdown */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Price Details
                </Text>
                
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">
                    Ticket Price ({booking.seatNumbers?.length || 1} × ETB {booking.pricePerSeat || trip?.price || 0})
                  </Text>
                  <Text className="text-gray-800">
                    ETB {(booking.pricePerSeat || trip?.price || 0) * (booking.seatNumbers?.length || 1)}
                  </Text>
                </View>
                
                <View className="flex-row justify-between pt-2 mt-2 border-t border-gray-200">
                  <Text className="font-bold text-gray-800">Total Amount</Text>
                  <Text className="font-bold text-blue-600 text-lg">
                    ETB {booking.totalPrice || 0}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'trip' && trip && (
            <View className="space-y-4">
              {/* Trip Information */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Trip Details
                </Text>
                
                {/* Route */}
                <View className="flex-row items-start mb-4">
                  <View className="items-center mr-3">
                    <View className="w-3 h-3 bg-green-500 rounded-full" />
                    <View className="w-0.5 h-10 bg-gray-300 my-1" />
                    <View className="w-3 h-3 bg-red-500 rounded-full" />
                  </View>
                  <View className="flex-1">
                    <View className="mb-3">
                      <Text className="text-sm text-gray-500">Departure</Text>
                      <Text className="font-semibold text-gray-800">
                        {trip.origin?.stationName || 'Unknown'}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {trip.departureTime ? formatDate(trip.departureTime) : 'N/A'} at {trip.departureTime ? formatTime(trip.departureTime) : 'N/A'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-sm text-gray-500">Arrival</Text>
                      <Text className="font-semibold text-gray-800">
                        {trip.destination?.stationName || 'Unknown'}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {trip.arrivalTime ? formatDate(trip.arrivalTime) : 'N/A'} at {trip.arrivalTime ? formatTime(trip.arrivalTime) : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Duration */}
                <View className="flex-row justify-between pt-3 border-t border-gray-100">
                  <Text className="text-gray-500">Duration</Text>
                  <Text className="font-medium text-gray-800">
                    {trip.departureTime && trip.arrivalTime 
                      ? calculateDuration(trip.departureTime, trip.arrivalTime)
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Vehicle Information */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Vehicle Details
                </Text>
                
                <View className="flex-row items-center mb-3">
                  <View className="bg-blue-100 p-2 rounded-full mr-3">
                    <Ionicons name="bus" size={24} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-800">
                      {trip.vehicle?.carType || 'Bus'}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {trip.vehicle?.plateNumber || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Capacity</Text>
                  <Text className="font-medium text-gray-800">
                    {trip.vehicle?.totalCapacity || trip.totalSeats || 52} seats
                  </Text>
                </View>
              </View>

              {/* Driver Information */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Driver Details
                </Text>
                
                <View className="flex-row items-center">
                  <View className="bg-purple-100 p-2 rounded-full mr-3">
                    <Ionicons name="person" size={24} color="#8b5cf6" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-800">
                      {trip.driver?.fullName || 'Not Assigned'}
                    </Text>
                    {trip.driver?.phoneNumber && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(`tel:${trip.driver.phoneNumber}`)}
                        className="flex-row items-center mt-1"
                      >
                        <Ionicons name="call-outline" size={14} color={COLORS.primary} />
                        <Text className="text-blue-600 text-sm ml-1">
                          {trip.driver.phoneNumber}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'passenger' && (
            <View className="space-y-4">
              {/* Passenger Information */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Passenger Details
                </Text>
                
                <View className="flex-row items-center mb-4">
                  <View className="bg-blue-100 p-3 rounded-full mr-3">
                    <Ionicons name="person-circle" size={32} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-800 text-lg">
                      {booking.passengerID?.fullName || booking.passengerDetails?.fullName}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Passenger
                    </Text>
                  </View>
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Phone Number</Text>
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(`tel:${booking.passengerID?.phoneNumber || booking.passengerDetails?.phoneNumber}`)}
                      className="flex-row items-center"
                    >
                      <Text className="text-blue-600 font-medium mr-1">
                        {booking.passengerID?.phoneNumber || booking.passengerDetails?.phoneNumber || 'N/A'}
                      </Text>
                      <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Email</Text>
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(`mailto:${booking.passengerID?.email || booking.passengerDetails?.email}`)}
                      className="flex-row items-center"
                    >
                      <Text className="text-blue-600 font-medium mr-1">
                        {booking.passengerID?.email || booking.passengerDetails?.email || 'N/A'}
                      </Text>
                      <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  {booking.passengerDetails?.emergencyContact && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Emergency Contact</Text>
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(`tel:${booking.passengerDetails.emergencyContact}`)}
                        className="flex-row items-center"
                      >
                        <Text className="text-blue-600 font-medium mr-1">
                          {booking.passengerDetails.emergencyContact}
                        </Text>
                        <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Support Actions */}
              <View className="bg-white p-4 rounded-xl border border-gray-200">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Need Help?
                </Text>
                
                <TouchableOpacity
                  onPress={handleContactSupport}
                  className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
                >
                  <View className="flex-row items-center">
                    <View className="bg-blue-100 p-2 rounded-full mr-3">
                      <Ionicons name="headset" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text className="font-medium text-gray-800">Contact Support</Text>
                      <Text className="text-xs text-gray-500">Available 24/7</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </TouchableOpacity>

                
                <TouchableOpacity
                   onPress={() => router.push(`/(screens)/booking/cancel?bookingId=${booking._id}`)}
                   className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                   <View className="flex-row items-center">
                   <View className="bg-purple-100 p-2 rounded-full mr-3">
                   <Ionicons name="close-circle-outline" size={20} color="#8b5cf6" />
                  </View>
                  <View>
                  <Text className="font-medium text-gray-800">Cancel Booking</Text>
                  <Text className="text-xs text-gray-500">Request cancellation</Text>
                  </View>
              </View>
               <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

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
              <View className="bg-red-100 p-3 rounded-full mb-3">
                <Ionicons name="close-circle" size={40} color={COLORS.danger} />
              </View>
              <Text className="text-xl font-bold text-gray-800">Cancel Booking</Text>
              <Text className="text-gray-600 text-center mt-1">
                Are you sure you want to cancel this booking?
              </Text>
            </View>

            <View className="bg-gray-50 p-4 rounded-lg mb-4">
              <Text className="font-semibold text-gray-800">
                {trip?.origin?.stationName} → {trip?.destination?.stationName}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {trip?.departureTime ? formatDate(trip.departureTime) : 'N/A'} at {trip?.departureTime ? formatTime(trip.departureTime) : 'N/A'}
              </Text>
              <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <Text className="text-gray-600">Refund Amount:</Text>
                <Text className="font-bold text-blue-600">
                  ETB {booking.totalPrice || 0}
                </Text>
              </View>
            </View>

            <View className="flex-row space-x-3">
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
                className="flex-1 bg-red-500"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

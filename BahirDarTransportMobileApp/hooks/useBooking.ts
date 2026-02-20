// hooks/useBooking.ts - Remove the searchTrips function entirely

import { useState } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useBookingStore } from '../store/bookingStore';
import { bookingApi } from '../lib/api/bookings';
import { useAuth } from './useAuth';
import { CreateBookingPayload } from '../types/booking';

export const useBooking = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    selectedTrip,
    selectedSeats,
    selectTrip,
    selectSeats,
    resetBooking,
  } = useBookingStore();

  // ============ CREATE BOOKING ============
  const createBooking = async () => {
    if (!selectedTrip) {
      Alert.alert('Error', 'No trip selected');
      throw new Error('No trip selected');
    }
    
    if (selectedSeats.length === 0) {
      Alert.alert('Error', 'Please select at least one seat');
      throw new Error('No seats selected');
    }

    if (!user?._id) {
      Alert.alert('Error', 'Please login to continue');
      router.push('/auth/Login');
      throw new Error('User not authenticated');
    }

    // Get trip ID safely
    const tripId = selectedTrip._id || selectedTrip.id;
    if (!tripId) {
      Alert.alert('Error', 'Invalid trip ID');
      throw new Error('Invalid trip ID');
    }

    // Calculate total price with validation
    const pricePerSeat = selectedTrip.price || 0;
    if (pricePerSeat <= 0) {
      Alert.alert('Error', 'Invalid trip price');
      throw new Error('Invalid trip price');
    }
    
    const totalPrice = selectedSeats.length * pricePerSeat;

    setLoading(true);
    try {
      const bookingData: CreateBookingPayload = {
        tripID: tripId,
        seatNumbers: selectedSeats,
        passengerDetails: {
          fullName: user.fullName || '',
          phoneNumber: user.phoneNumber || '',
          email: user.email || '',
        },
      };

      const response = await bookingApi.createBooking(bookingData);

      if (response.data?.success || response.success) {
        const bookingData = response.data?.data || response.data;
        Alert.alert(
          'Booking Successful! 🎉',
          `Your booking has been created.\nBooking #${bookingData?.bookingNumber || bookingData?._id?.slice(-6).toUpperCase() || ''}\nTotal: ETB ${totalPrice}`,
          [
            {
              text: 'View My Bookings',
              onPress: () => {
                resetBooking();
                router.push('/tabs/profile/bookings');
              }
            },
            {
              text: 'Done',
              style: 'cancel'
            }
          ]
        );
        return bookingData;
      } else {
        throw new Error(response.data?.message || 'Booking creation failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to book trip';
      Alert.alert('Booking Failed', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============ CANCEL BOOKING ============
  const cancelBooking = async (bookingId: string, reason?: string) => {
    setLoading(true);
    try {
      const response = await bookingApi.cancelBooking(bookingId);

      if (response.data?.success || response.success) {
        Alert.alert('Success', 'Booking cancelled successfully');
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel booking';
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============ GET MY BOOKINGS ============
  const getMyBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getMyBookings();
      
      let bookings = [];
      if (response?.data?.data) {
        bookings = response.data.data;
      } else if (Array.isArray(response?.data)) {
        bookings = response.data;
      } else if (response?.data) {
        bookings = response.data;
      }
      
      return bookings;
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ============ GET BOOKING BY ID ============
  const getBookingById = async (bookingId: string) => {
    setLoading(true);
    try {
      const response = await bookingApi.getBookingById(bookingId);
      
      let booking = null;
      if (response?.data?.data) {
        booking = response.data.data;
      } else if (response?.data) {
        booking = response.data;
      }
      
      return booking;
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load booking details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============ RETURN ALL METHODS ============
  return {
    // State
    selectedTrip,
    selectedSeats,
    loading,
    
    // Actions - Core Booking
    selectTrip,
    selectSeats,
    createBooking,
    cancelBooking,
    getMyBookings,
    getBookingById,
    resetBooking,
  };
};
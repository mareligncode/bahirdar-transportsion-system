import { useState, useCallback } from 'react';
import { bookingsApi } from '../lib/api/bookings';
import { useBookingStore } from '../store/bookingStore';
import { useAuth } from './useAuth';
import { Booking, BookingCreateData, Trip } from '../types';
import { useToast } from '../components/common/Toast';

export const useBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    bookings,
    selectedTrip,
    selectedSeats,
    currentBooking,
    setBookings,
    addBooking,
    setSelectedTrip,
    setSelectedSeats,
    setCurrentBooking,
    clearBookingState
  } = useBookingStore();

  const fetchMyBookings = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success) {
        setBookings(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
      showToast(err.message || 'Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, setBookings, showToast]);

  const createBooking = useCallback(async (trip: Trip, seatNumbers: number[]): Promise<Booking[] | null> => {
    if (!user) {
      showToast('Please login to continue', 'error');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingsCreated: Booking[] = [];

      for (const seatNumber of seatNumbers) {
        const bookingData: BookingCreateData = {
          tripID: trip._id,
          seatNumber,
          passengerDetails: {
            fullName: user.fullName || '',
            phoneNumber: user.phoneNumber || '',
            email: user.email || '',
            emergencyContact: user.emergencyContact || ''
          }
        };

        const response = await bookingsApi.createBooking(bookingData);

        if (response.success && response.data) {
          bookingsCreated.push(response.data);
        }
      }

      if (bookingsCreated.length > 0) {
        // Add to store
        bookingsCreated.forEach(booking => addBooking(booking));

        // Set current booking for payment
        setCurrentBooking(bookingsCreated[0]);

        showToast(`${bookingsCreated.length} seat(s) booked successfully!`, 'success');

        return bookingsCreated;
      }

      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
      showToast(err.message || 'Failed to create booking', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, addBooking, setCurrentBooking, showToast]);

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.cancelBooking(bookingId);

      if (response.success) {
        // Update in store
        setBookings(
          bookings.map(booking =>
            booking._id === bookingId
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        );

        // Also update current booking if it's the one being cancelled
        if (currentBooking?._id === bookingId) {
          setCurrentBooking({ ...currentBooking, status: 'cancelled' as const });
        }

        showToast('Booking cancelled successfully', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
      showToast(err.message || 'Failed to cancel booking', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookings, currentBooking, setBookings, setCurrentBooking, showToast]);

  const getBookingById = useCallback(async (id: string): Promise<Booking | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.getBookingById(id);

      if (response.success && response.data) {
        setCurrentBooking(response.data);
        return response.data;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch booking');
      showToast(err.message || 'Failed to fetch booking', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setCurrentBooking, showToast]);

  const selectTrip = useCallback((trip: Trip | null) => {
    setSelectedTrip(trip);
  }, [setSelectedTrip]);

  const selectSeats = useCallback((seats: number[]) => {
    setSelectedSeats(seats);
  }, [setSelectedSeats]);

  const clearBooking = useCallback(() => {
    clearBookingState();
  }, [clearBookingState]);

  const canCancelBooking = useCallback((booking: Booking): boolean => {
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status?.toLowerCase())) {
      return false;
    }

    // Handle case where tripID might be a string or object
    let departureTime: Date | null = null;

    if (booking.tripID && typeof booking.tripID === 'object') {
      departureTime = booking.tripID.departureTime
        ? new Date(booking.tripID.departureTime)
        : null;
    }

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return departureTime ? departureTime > twoHoursFromNow : false;
  }, []);

  const getMyBookings = useCallback(async (): Promise<Booking[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success) {
        setBookings(response.data);
        return response.data;
      }
      return [];
    } catch (err: any) {
      const message = err.message || 'Failed to fetch bookings';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setBookings]);

  return {
    // State
    bookings,
    selectedTrip,
    selectedSeats,
    currentBooking,
    loading,
    error,

    // Actions
    fetchMyBookings,
    getMyBookings,
    createBooking,
    cancelBooking,
    getBookingById,
    selectTrip,
    selectSeats,
    clearBooking,
    canCancelBooking
  };
};
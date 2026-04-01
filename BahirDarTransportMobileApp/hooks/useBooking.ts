import { useState, useCallback } from 'react';
import { bookingsApi } from '../lib/api/bookings';
import { useBookingStore } from '../store/bookingStore';
import { useAuth } from './useAuth';
import { Booking, BookingCreateData, Trip } from '../types';
import { useToast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';

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

  const isBackendRoutingIssue = (err: any): boolean => {
    const errorString = JSON.stringify(err?.response?.data || err?.message || '');
    return errorString.includes('Cast to ObjectId') &&
      errorString.includes('my-bookings');
  };

  const fetchMyBookings = useCallback(async (): Promise<void> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success) {
        const enhancedBookings = response.data.map(booking => ({
          ...booking,
          seatNumbers: booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []),
          totalPrice: booking.totalPrice || booking.amount ||
            (typeof booking.tripID === 'object' && booking.tripID?.price
              ? booking.tripID.price * (booking.seatNumbers?.length || booking.seatNumber ? 1 : 0)
              : 0)
        }));
        setBookings(enhancedBookings);
      }
    } catch (err: any) {
      if (isBackendRoutingIssue(err)) {       // Don't show error toast, just set empty bookings
        setBookings([]);
      } else {
        const message = err.response?.data?.message || err.message || 'Failed to fetch bookings';
        setError(message);
        // Only show toast for non-routing errors
        if (!isBackendRoutingIssue(err)) {
          showToast(message, 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, setBookings, showToast]);

  const getMyBookings = useCallback(async (refresh: boolean = false): Promise<Booking[]> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return [];

    // If we already have bookings and don't need refresh, return them
    if (bookings.length > 0 && !refresh) {
      return bookings;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success) {
        const enhancedBookings = response.data.map(booking => ({
          ...booking,
          seatNumbers: booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []),
          totalPrice: booking.totalPrice || booking.amount ||
            (typeof booking.tripID === 'object' && booking.tripID?.price
              ? booking.tripID.price * (booking.seatNumbers?.length || (booking.seatNumber ? 1 : 0))
              : 0)
        }));
        setBookings(enhancedBookings);
        return enhancedBookings;
      }
      return [];
    } catch (err: any) {
      // Check if it's the backend routing issue
      if (isBackendRoutingIssue(err)) {
        console.log('⚠️ Backend routing issue detected for my-bookings. Returning empty array.');
        // Return empty array but don't set error state
        return [];
      }

      const message = err.response?.data?.message || err.message || 'Failed to fetch bookings';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setBookings, bookings.length]);

  const createBooking = useCallback(async (trip: Trip, seatNumbers: number[]): Promise<Booking[] | null> => {
    if (!user) {
      showToast('Please login to continue', 'error');
      return null;
    }

    if (!trip || !trip._id) {
      showToast('Invalid trip data', 'error');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await bookingsApi.createMultipleBookings({
        tripID: trip._id,
        seatNumbers,
        passengerDetails: {
          fullName: user?.fullName || '',
          phoneNumber: user?.phoneNumber || '',
          email: user?.email || '',
          emergencyContact: user?.emergencyContact || ''
        }
      });

      if (result.success && result.data && result.data.length > 0) {

        // Add each booking to the store
        result.data.forEach(booking => {
          addBooking(booking);
        });

        setCurrentBooking(result.data[0]);
        showToast(
          result.data.length === seatNumbers.length
            ? `Successfully booked ${result.data.length} seat(s)!`
            : `Booked ${result.data.length} of ${seatNumbers.length} seat(s).`,
          'success'
        );

        return result.data;
      } else {
        console.error('❌ Batch booking failed:', result.message);
        setError(result.message || 'Failed to create bookings');
        showToast(result.message || 'Failed to create bookings', 'error');
        return null;
      }
    } catch (err: any) {
      console.error('❌ Batch Booking error:', err);

      if (err.response?.data) {
        const errorMessage = err.response.data.message || 'Failed to create booking';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } else {
        const errorMessage = err.message || 'Failed to create booking';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [user, addBooking, setCurrentBooking, showToast]);

  const cancelBooking = useCallback(async (bookingId: string, options?: { silent?: boolean }): Promise<boolean> => {

    if (!bookingId || bookingId === 'undefined' || bookingId === 'null' || typeof bookingId !== 'string') {
      console.warn('⚠️ [useBooking.cancelBooking] Prevention: Invalid Booking ID format:', bookingId);
      if (!options?.silent) {
        showToast('Invalid booking ID provided for cancellation', 'error');
      }
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.deleteBooking(bookingId);

      if (response.success) {

        setBookings(bookings.filter(booking => booking._id !== bookingId));

        if (currentBooking?._id === bookingId) {
          setCurrentBooking(null);
        }

        if (!options?.silent) {
          showToast('Booking cancelled successfully', 'success');
        }

        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel booking';

      if (!options?.silent) {
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }

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
        const data = response.data;

        if (!data.seatNumbers && data.seatNumber) {
          data.seatNumbers = [data.seatNumber];
        } else if (!data.seatNumbers) {
          data.seatNumbers = [];
        }

        let totalPrice = data.totalPrice || data.amount || 0;
        if (!totalPrice && typeof data.tripID === 'object' && data.tripID?.price) {
          totalPrice = data.tripID.price * (data.seatNumbers?.length || 1);
        }

        const enhancedBooking = {
          ...data,
          seatNumbers: data.seatNumbers,
          totalPrice: totalPrice,
          pricePerSeat: data.pricePerSeat || (totalPrice / (data.seatNumbers?.length || 1))
        };

        console.log('📋 Enhanced booking:', {
          id: enhancedBooking._id,
          seatNumbers: enhancedBooking.seatNumbers,
          totalPrice: enhancedBooking.totalPrice
        });

        setCurrentBooking(enhancedBooking);
        return enhancedBooking;
      }
      return null;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }

      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch booking';

      const cachedBooking = bookings.find(b => b._id === id);
      if (cachedBooking) {
        const enhancedCached = {
          ...cachedBooking,
          seatNumbers: cachedBooking.seatNumbers || (cachedBooking.seatNumber ? [cachedBooking.seatNumber] : []),
        };
        setCurrentBooking(enhancedCached);
        return enhancedCached;
      }

      setError(errorMessage);
      showToast(errorMessage, 'error');
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

  const getTripBookings = useCallback(async (tripId: string): Promise<Booking[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.getTripBookings(tripId);
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      const status = err.response?.status;

      if (status === 403) {
        return [];
      }

      const message = err.response?.data?.message || err.message || 'Failed to fetch trip bookings';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookings,
    selectedTrip,
    selectedSeats,
    currentBooking,
    loading,
    error,
    fetchMyBookings,
    getMyBookings,
    getTripBookings,
    createBooking,
    cancelBooking,
    getBookingById,
    selectTrip,
    selectSeats,
    clearBooking,
    canCancelBooking
  };
};
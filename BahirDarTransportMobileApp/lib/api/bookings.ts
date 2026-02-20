// lib/api/bookings.ts - Passenger Only API (Existing Backend Endpoints Only)
import { api, API_ENDPOINTS } from '../../config/api';
import { CreateBookingPayload } from '../../types/booking';

export const bookingApi = {
  // Create new booking - POST /bookings
  createBooking: async (bookingData: CreateBookingPayload) => {
    console.log('📝 Creating booking:', {
      tripId: bookingData.tripID,
      seats: bookingData.seatNumbers.length,
    });
    
    try {
      const response = await api.post(API_ENDPOINTS.BOOKINGS.BASE, {
        tripID: bookingData.tripID,
        seatNumbers: bookingData.seatNumbers,
        passengerDetails: bookingData.passengerDetails,
        specialRequests: bookingData.specialRequests,
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      throw error;
    }
  },

  // Get my bookings - GET /bookings/my-bookings (Passenger's own bookings)
  getMyBookings: async () => {
    console.log('📚 Fetching my bookings');
    
    try {
      const response = await api.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch bookings:', error);
      throw error;
    }
  },

  // Get booking by ID - GET /bookings/:id (Passenger's own booking details)
  getBookingById: async (bookingId: string) => {
    console.log('🔍 Fetching booking:', bookingId);
    
    try {
      const response = await api.get(API_ENDPOINTS.BOOKINGS.BY_ID(bookingId));
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch booking:', error);
      throw error;
    }
  },

  // Update booking - PUT /bookings/:id (Update own booking details)
  updateBooking: async (bookingId: string, updateData: any) => {
    console.log('✏️ Updating booking:', bookingId);
    
    try {
      const response = await api.put(API_ENDPOINTS.BOOKINGS.UPDATE(bookingId), updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update booking:', error);
      throw error;
    }
  },

  // Cancel booking - DELETE /bookings/:id (Backend: ✅)
  cancelBooking: async (bookingId: string) => {
    console.log('❌ Cancelling booking:', bookingId);
    
    try {
      const response = await api.delete(API_ENDPOINTS.BOOKINGS.BY_ID(bookingId));
      return response.data;
    } catch (error) {
      console.error('❌ Failed to cancel booking:', error);
      throw error;
    }
  },
};

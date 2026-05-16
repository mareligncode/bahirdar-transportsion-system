import { api as apiClient, API_ENDPOINTS } from '../../config/api';
import { Booking, BookingCreateData, ApiResponse } from '../../types';

interface BulkBookingData {
  tripID: string;
  seatNumbers: number[];
  passengerDetails: {
    fullName: string;
    phoneNumber: string;
    email: string;
    emergencyContact?: string;
  };
}

export const bookingsApi = {
  createBooking: async (bookingData: BookingCreateData): Promise<ApiResponse<Booking>> => {
    try {
      console.log('Creating booking with data:', bookingData);
      const response = await apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE, bookingData);
      return response.data;
    } catch (error: any) {
      console.error('Create booking error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  createMultipleBookings: async (bulkData: BulkBookingData): Promise<ApiResponse<Booking[]>> => {
    try {
      const payload = {
        tripID: bulkData.tripID,
        seats: bulkData.seatNumbers.map(seatNumber => ({
          seatNumber,
          specialRequests: ''
        })),
        passengerDetails: bulkData.passengerDetails
      };

      const response = await apiClient.post(API_ENDPOINTS.BOOKINGS.BATCH, payload);

      if (response.data && response.data.success === true) {
        console.log('✅ Batch booking successful:', response.data.message);

        let bookingsData = [];

        if (response.data.data && Array.isArray(response.data.data)) {
          bookingsData = response.data.data;
        }

        const enhancedData = bookingsData.map((booking: any) => ({
          ...booking,
          seatNumbers: booking.seatNumbers || (booking.seatNumber ? [booking.seatNumber] : []),
          totalPrice: booking.totalPrice || booking.amount || 0,
          pricePerSeat: booking.pricePerSeat || (booking.totalPrice / (booking.seatNumbers?.length || 1)),
          ticketNumber: booking.groupTicketNumber || booking.ticketNumber,
          isGroupBooking: booking.isGroupBooking || booking.seatNumbers?.length > 1
        }));

        return {
          success: true,
          data: enhancedData,
          message: response.data.message || `${enhancedData.length} booking(s) created successfully`
        };
      } else {
        const errorMessage = response.data?.message || 'Failed to create batch booking';
        throw new Error(errorMessage);
      }
    } catch (error: any) {

      if (error.response?.data) {
        return {
          success: false,
          data: [],
          message: error.response.data.message || 'Failed to create bookings'
        };
      }

      throw error;
    }
  },

  getMyBookings: async (): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getTripBookings: async (tripId: string): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.TRIP_BOOKINGS(tripId));
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      if (status !== 403) {
      }
      throw error;
    }
  },

  getBookedSeatsForTrip: async (tripId: string): Promise<number[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.BOOKED_SEATS(tripId));

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      return [];
    }
  },

  getBookingById: async (id: string): Promise<ApiResponse<Booking>> => {
    try {
      const stack = new Error().stack;
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateBooking: async (id: string, updates: Partial<Booking>): Promise<ApiResponse<Booking>> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), updates);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  deleteBooking: async (id: string): Promise<ApiResponse<Booking>> => {
    try {
      const stack = new Error().stack;
      if (!id || id === 'undefined' || id === 'null' || id === '[object Object]') {
        console.warn('⚠️ [bookingsApi.deleteBooking] Invalid ID prevented:', id);
        return { success: false, message: 'Invalid booking ID', data: {} as any };
      }

      const response = await apiClient.delete(API_ENDPOINTS.BOOKINGS.DELETE(id));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateBookingStatus: async (id: string, status: string, data?: any): Promise<ApiResponse<Booking>> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), { status, ...data });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};

// lib/api/bookings.ts
import { apiClient } from './index';
import { API_ENDPOINTS } from '../../config/api';
import { Booking, BookingCreateData, ApiResponse } from '../../types';

export const bookingsApi = {
  createBooking: async (bookingData: BookingCreateData): Promise<ApiResponse<Booking>> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE, bookingData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getMyBookings: async (): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getBookingById: async (id: string): Promise<ApiResponse<Booking>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  cancelBooking: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.BOOKINGS.DELETE(id));
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  updateBookingStatus: async (id: string, status: string, data?: any): Promise<ApiResponse<Booking>> => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), { status, ...data });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};
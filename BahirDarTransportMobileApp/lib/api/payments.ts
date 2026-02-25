// lib/api/payments.ts
import { apiClient } from './index';
import { API_ENDPOINTS } from '../../config/api';
import { Payment, PaymentInitializeData, ApiResponse } from '../../types';

export const paymentsApi = {
  initializePayment: async (data: PaymentInitializeData): Promise<ApiResponse<{
    checkoutUrl: string;
    paymentId: string;
    bookingId: string;
    amount: number;
    tx_ref: string;
    paymentStatus: string;
  }>> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.INITIALIZE, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getPaymentStatus: async (params: { bookingId?: string; paymentId?: string }): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.STATUS, { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getPaymentHistory: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Payment[]>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.HISTORY, { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  verifyPayment: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.BY_ID(paymentId));
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  verifyChapaTransaction: async (txRef: string): Promise<ApiResponse<{ payment: Payment; booking: any; redirectUrl: string }>> => {
    try {
      // The backend expects GET /payment/verify/:tx_ref
      const response = await apiClient.get(`/payment/verify/${txRef}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};
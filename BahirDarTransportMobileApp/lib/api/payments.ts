// lib/api/payments.ts
import { api as apiClient, API_ENDPOINTS } from '../../config/api';
import { 
  Payment, 
  PaymentInitializeRequest,
  PaymentInitializeResponse,
  PaymentVerifyResponse,
  PaymentVerifyResult,
  PaymentHistoryResponse,
  ApiResponse 
} from '../../types';

interface RefundData {
  amount?: number;
  reason?: string;
}

export const paymentsApi = {
  initializePayment: async (
    bookingId: string, 
    paymentMethod: 'mobile_money' | 'card' | 'cash' = 'mobile_money'
  ): Promise<PaymentInitializeResponse> => {
    try {
      console.log('💰 Initializing payment for booking:', bookingId);
      
      const requestData: PaymentInitializeRequest = {
        bookingId,
        paymentMethod
      };
      
      const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.INITIALIZE, requestData);
      
      if (response.data?.success && response.data?.data) {
        console.log('✅ Payment initialized successfully');
        return response.data;
      }
      
      throw new Error(response.data?.message || 'Failed to initialize payment');
    } catch (error: any) {
      console.error('❌ Initialize payment error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  verifyPayment: async (txRef: string): Promise<PaymentVerifyResponse> => {
    try {
      console.log('🔍 Verifying payment with tx_ref:', txRef);
      
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.VERIFY(txRef));
      
      console.log('✅ Verify response status:', response.status);
      console.log('📥 Verify response data:', response.data);

      // Check if the response has the expected structure
      if (response.data) {
        // If it has success and data properties
        if (response.data.success !== undefined) {
          return {
            success: response.data.success,
            message: response.data.message || 'Payment verification completed',
            data: response.data.data || {
              payment: response.data.payment,
              booking: response.data.booking,
              redirectUrl: response.data.redirectUrl
            }
          };
        }
        
        // If the response is directly the data (no wrapper)
        if (response.data.payment || response.data.booking) {
          return {
            success: true,
            message: 'Payment verified successfully',
            data: {
              payment: response.data.payment,
              booking: response.data.booking,
              redirectUrl: response.data.redirectUrl || ''
            }
          };
        }
      }
      
      // Default fallback
      return {
        success: false,
        message: 'Failed to verify payment',
        data: {
          payment: null as any,
          booking: null as any,
          redirectUrl: ''
        }
      };
    } catch (error: any) {
      console.error('❌ Verify payment error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // If we got a response but with error status, still return the data if available
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Payment verification failed',
          data: error.response.data.data || {
            payment: null,
            booking: null,
            redirectUrl: ''
          }
        };
      }
      
      throw error;
    }
  },

  getPaymentHistory: async (): Promise<PaymentHistoryResponse> => {
    try {
      console.log('📋 Fetching payment history');
      
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.HISTORY);
      
      if (response.data?.success) {
        return response.data;
      }
      
      return {
        success: false,
        data: [],
        summary: {
          totalPayments: 0,
          successfulPayments: 0,
          totalAmountSpent: 0
        }
      };
    } catch (error: any) {
      console.error('❌ Get payment history error:', error.response?.data || error.message);
      throw error;
    }
  },

  getPaymentStatus: async (bookingId: string): Promise<ApiResponse<Payment>> => {
    try {
      console.log('🔍 Checking payment status for booking:', bookingId);
      
      const response = await apiClient.get(`${API_ENDPOINTS.PAYMENTS.STATUS}?bookingId=${bookingId}`);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Get payment status error:', error.response?.data || error.message);
      throw error;
    }
  },

  getPaymentById: async (id: string): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.BY_ID(id));
      return response.data;
    } catch (error: any) {
      console.error('❌ Get payment by ID error:', error.response?.data || error.message);
      throw error;
    }
  },

  processRefund: async (id: string, data: RefundData): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.post(`${API_ENDPOINTS.PAYMENTS.BY_ID(id)}/refund`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Process refund error:', error.response?.data || error.message);
      throw error;
    }
  }
};
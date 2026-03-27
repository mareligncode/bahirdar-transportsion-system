// hooks/usePayment.ts
import { useState, useCallback } from 'react';
import { paymentsApi } from '../lib/api/payments';
import { usePaymentStore } from '../store/paymentStore';
import { useAuth } from './useAuth';
import { useToast } from '../components/common/Toast';
import { Payment, PaymentStatus, PaymentVerifyResult } from '../types';
import { useAuthStore } from '../store/authStore';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    payments,
    currentPayment,
    setPayments,
    addPayment,
    setCurrentPayment,
    clearPaymentState
  } = usePaymentStore();

  const initializePayment = useCallback(async (
    bookingId: string,
    amount: number,
    method: 'mobile_money' | 'card' | 'cash' = 'mobile_money'
  ): Promise<{ checkoutUrl: string; txRef: string; amount: number } | null> => {
    if (!user) {
      showToast('Please login to continue', 'error');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💰 Initializing payment for booking:', bookingId, 'amount:', amount, 'method:', method);
      
      const response = await paymentsApi.initializePayment(bookingId, method);

      if (response.success && response.data) {
        const { checkoutUrl, tx_ref, amount: backendAmount } = response.data;
        
        console.log('✅ Payment initialized successfully with tx_ref:', tx_ref);
        
        return {
          checkoutUrl,
          txRef: tx_ref,
          amount: backendAmount || amount
        };
      }
      
      showToast('Failed to initialize payment', 'error');
      return null;
    } catch (err: any) {
      console.error('❌ Initialize payment error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to initialize payment';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const verifyPayment = useCallback(async (txRef: string): Promise<PaymentVerifyResult> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Verifying payment with txRef:', txRef);
      
      const response = await paymentsApi.verifyPayment(txRef);

      console.log('📥 Verify payment response:', response);

      // Check if we have payment data in the response
      if (response.data?.payment) {
        const { payment, booking, redirectUrl } = response.data;
        
        console.log('✅ Payment verified successfully:', payment.paymentStatus);
        
        // Add payment to store
        addPayment(payment);
        setCurrentPayment(payment);
        
        if (payment.paymentStatus === 'success') {
          showToast('Payment confirmed!', 'success');
        } else if (payment.paymentStatus === 'processing') {
          showToast('Payment is still processing', 'info');
        } else {
          showToast(`Payment status: ${payment.paymentStatus}`, 'info');
        }
        
        return {
          payment,
          booking,
          redirectUrl,
          success: true,
          paymentStatus: payment.paymentStatus
        };
      } 
      
      // If no payment data but response.success is true
      if (response.success) {
        console.log('✅ Payment verification successful (no payment data)');
        showToast('Payment verified successfully!', 'success');
        return {
          payment: null,
          booking: null,
          success: true
        };
      }
      
      // If verification failed
      console.log('❌ Payment verification failed');
      return {
        payment: null,
        booking: null,
        success: false,
        message: response.message || 'Payment verification failed'
      };
      
    } catch (err: any) {
      console.error('❌ Verify payment error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to verify payment';
      setError(message);
      
      // Don't show toast for every error, as it might be called automatically
      return {
        payment: null,
        booking: null,
        success: false,
        message
      };
    } finally {
      setLoading(false);
    }
  }, [addPayment, setCurrentPayment, showToast]);

  const getPaymentHistory = useCallback(async (): Promise<Payment[]> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return [];

    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.getPaymentHistory();

      if (response.success && response.data) {
        setPayments(response.data);
        return response.data;
      }
      
      return [];
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch payment history';
      setError(message);
      showToast(message, 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [setPayments, showToast]);

  const checkPaymentStatus = useCallback(async (bookingId: string): Promise<PaymentStatus | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.getPaymentStatus(bookingId);

      if (response.success && response.data) {
        return response.data.paymentStatus;
      }
      
      return null;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to check payment status';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentById = useCallback(async (id: string): Promise<Payment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.getPaymentById(id);

      if (response.success && response.data) {
        setCurrentPayment(response.data);
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch payment';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setCurrentPayment, showToast]);

  const clearPayment = useCallback(() => {
    clearPaymentState();
  }, [clearPaymentState]);

  return {
    payments,
    currentPayment,
    loading,
    error,
    initializePayment,
    verifyPayment,
    getPaymentHistory,
    checkPaymentStatus,
    getPaymentById,
    clearPayment
  };
};
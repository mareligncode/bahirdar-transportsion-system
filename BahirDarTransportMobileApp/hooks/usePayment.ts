import { useState, useCallback } from 'react';
import { paymentsApi } from '../lib/api/payments';
import { usePaymentStore } from '../store/paymentStore';
import { useAuth } from './useAuth';
import {
  Payment,
  PaymentStatus,
  PaymentInitializeData,
  PaymentInitializeResponse
} from '../types';
import { useToast } from '../components/common/Toast';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    payments,
    currentPayment,
    setPayments,
    setCurrentPayment,
    updatePaymentStatus
  } = usePaymentStore();

  const verifyPayment = useCallback(async (bookingId: string): Promise<Payment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.getPaymentStatus({ bookingId });

      if (response.success && response.data) {
        const payment = response.data;

        // Update store with proper type
        updatePaymentStatus(payment._id, payment.paymentStatus);

        if (payment.paymentStatus === 'success') {
          showToast('Payment successful!', 'success');

          // Navigate to confirmation
          router.push({
            pathname: '/(screens)/booking/confirmation',
            params: { bookingId, success: 'true' }
          });
        } else if (payment.paymentStatus === 'failed') {
          showToast('Payment failed. Please try again.', 'error');
        } else if (payment.paymentStatus === 'processing') {
          showToast('Payment is being processed...', 'info');
        } else if (payment.paymentStatus === 'cancelled') {
          showToast('Payment was cancelled', 'warning');
        }

        return payment;
      }

      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment');
      showToast(err.message || 'Failed to verify payment', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [updatePaymentStatus, showToast]);

  const initializePayment = useCallback(async (
    bookingId: string,
    amount: number,
    paymentMethod: string = 'mobile_money',
    returnUrl?: string
  ): Promise<PaymentInitializeResponse['data'] | null> => {
    if (!user) {
      showToast('Please login to continue', 'error');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const data: PaymentInitializeData = {
        bookingId,
        paymentMethod: paymentMethod as 'mobile_money' | 'card' | 'cash',
        returnUrl
      };

      const response = await paymentsApi.initializePayment(data);

      if (response.success && response.data) {
        const { checkoutUrl, paymentId, bookingId: returnedBookingId, amount: responseAmount, tx_ref, paymentStatus } = response.data;

        const paymentData: Payment = {
          _id: paymentId,
          bookingID: returnedBookingId,
          passengerID: user._id,
          amount: amount || responseAmount,
          currency: 'ETB',
          paymentMethod: paymentMethod as 'mobile_money' | 'card' | 'cash',
          paymentGateway: 'chapa',
          paymentStatus: (paymentStatus as PaymentStatus) || 'pending',
          checkoutUrl,
          gatewayTransactionID: tx_ref,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setCurrentPayment(paymentData);
        return response.data;
      }

      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
      showToast(err.message || 'Failed to initialize payment', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, setCurrentPayment, showToast, verifyPayment]);

  const getPaymentHistory = useCallback(async (): Promise<Payment[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.getPaymentHistory();

      if (response.success) {
        setPayments(response.data);
        return response.data;
      }

      return [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment history');
      showToast(err.message || 'Failed to fetch payment history', 'error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [setPayments, showToast]);

  const retryPayment = useCallback(async (bookingId: string, amount: number) => {
    return initializePayment(bookingId, amount);
  }, [initializePayment]);

  const clearCurrentPayment = useCallback(() => {
    setCurrentPayment(null);
  }, [setCurrentPayment]);

  return {
    // State
    payments,
    currentPayment,
    loading,
    error,

    // Actions
    initializePayment,
    verifyPayment,
    getPaymentHistory,
    retryPayment,
    clearCurrentPayment
  };
};
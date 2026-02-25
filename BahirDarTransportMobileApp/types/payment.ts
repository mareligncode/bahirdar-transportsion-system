// types/payment.ts

import { Booking } from './booking';
import { User } from './auth';

// Define a single, consistent PaymentStatus type
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';

export interface Payment {
  _id: string;
  bookingID: string | Booking;
  passengerID: string | User;
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card' | 'cash';
  paymentGateway: 'chapa' | 'cash';
  paymentStatus: PaymentStatus; // Use the type alias
  gatewayTransactionID?: string;
  chapaReference?: string;
  checkoutUrl?: string;
  paymentDate?: string;
  verifiedAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  reasonForFailure?: string;
  metadata?: Record<string, any>;
  gatewayResponse?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitializeData {
  bookingId: string;
  paymentMethod?: 'mobile_money' | 'card' | 'cash';
  returnUrl?: string;
}

export interface PaymentInitializeRequest {
  bookingId: string;
  paymentMethod?: 'mobile_money' | 'card' | 'cash';
}

export interface PaymentInitializeResponse {
  success: boolean;
  message: string;
  data: {
    checkoutUrl: string;
    paymentId: string;
    bookingId: string;
    amount: number;
    tx_ref: string;
    paymentStatus: string;
  };
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  data: {
    payment: Payment;
    booking: Booking;
    redirectUrl: string;
  };
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: Payment[];
  summary: {
    totalPayments: number;
    successfulPayments: number;
    totalAmountSpent: number;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: Payment;
}

export interface PaymentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
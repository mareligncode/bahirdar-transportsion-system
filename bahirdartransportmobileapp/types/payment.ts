import { Booking } from './booking';
import { User } from './auth';

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';

export interface Payment {
  _id: string;
  bookingID: string | Booking;
  passengerID: string | User;
  amount: number;
  currency: string;
  paymentMethod: 'mobile_money' | 'card' | 'cash' | 'bank_transfer';
  paymentGateway: 'chapa' | 'cash';
  paymentStatus: PaymentStatus;
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
  paymentMethod?: 'mobile_money' | 'card' | 'cash' | 'bank_transfer';
  returnUrl?: string;
}

export interface PaymentInitializeRequest {
  bookingId: string;
  paymentMethod?: 'mobile_money' | 'card' | 'cash' | 'bank_transfer';
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

export interface PaymentVerifyResult {
  payment: Payment | null;
  booking: Booking | null;
  redirectUrl?: string;
  paymentStatus?: string;
  success: boolean;
  message?: string;
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
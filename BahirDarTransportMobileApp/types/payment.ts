export interface PaymentMethod {
  id: string;
  type: 'chapa' | 'telebirr' | 'card' | 'bank';
  name: string;
  icon: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: 'ETB';
  method: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  transactionId?: string;
  referenceNumber?: string;
  paymentDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret?: string;
  paymentMethods: PaymentMethod[];
}

export interface ChapaPaymentData {
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  txRef: string;
  callbackUrl?: string;
  returnUrl?: string;
}

export interface TelebirrPaymentData {
  amount: number;
  subject: string;
  outTradeNo: string;
  timeoutExpress: string;
  notifyUrl?: string;
  returnUrl?: string;
}
export interface PaymentVerification {
  payment_id: string;
  transaction_id: string;
}
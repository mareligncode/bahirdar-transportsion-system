// // BahirDarTransportMobileApp/lib/api/payments.ts
// import { get, post } from './index';
// import type {
//   Payment,
//   PaymentInitiation,
//   PaymentVerification,
//   PaginatedResponse,
// } from '../../types/payment';

// export const paymentsApi = {
//   // Initiate payment
//   initiatePayment: async (paymentData: PaymentInitiation): Promise<Payment> => {
//     const response = await post<{ data: Payment }>('/payments/initiate', paymentData);
//     return response.data;
//   },

//   // Verify payment
//   verifyPayment: async (verificationData: PaymentVerification): Promise<Payment> => {
//     const response = await post<{ data: Payment }>('/payments/verify', verificationData);
//     return response.data;
//   },

//   // Get payment by ID
//   getPayment: async (id: string): Promise<Payment> => {
//     const response = await get<{ data: Payment }>(`/payments/${id}`);
//     return response.data;
//   },

//   // Get user payment history
//   getPaymentHistory: async (params?: {
//     status?: string;
//     startDate?: string; // Changed from start_date
//     endDate?: string; // Changed from end_date
//     page?: number;
//     limit?: number;
//   }): Promise<PaginatedResponse<Payment>> => {
//     const response = await get<PaginatedResponse<Payment>>('/payments/history', params);
//     return response;
//   },

//   // Get booking payments
//   getBookingPayments: async (bookingId: string): Promise<Payment[]> => {
//     const response = await get<{ data: Payment[] }>(`/bookings/${bookingId}/payments`);
//     return response.data;
//   },

//   // Refund payment
//   requestRefund: async (paymentId: string, reason: string): Promise<Payment> => {
//     const response = await post<{ data: Payment }>(
//       `/payments/${paymentId}/refund`, 
//       { reason }
//     );
//     return response.data;
//   },
// };
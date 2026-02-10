// // BahirDarTransportMobileApp/lib/api/bookings.ts
// import { get, post, put, del } from './index';
// import type {
//   Booking,
//   CreateBookingData,
//   CancelBookingData,
//   RescheduleBookingData,
//   PaginatedResponse,
// } from '../../types/booking';

// export const bookingsApi = {
//   // Create booking
//   createBooking: async (bookingData: CreateBookingData): Promise<Booking> => {
//     const response = await post<{ data: Booking }>('/bookings', bookingData);
//     return response.data;
//   },

//   // Get user bookings
//   getUserBookings: async (params?: {
//     status?: string;
//     page?: number;
//     limit?: number;
//   }): Promise<PaginatedResponse<Booking>> => {
//     const response = await get<PaginatedResponse<Booking>>('/bookings', params);
//     return response;
//   },

//   // Get single booking
//   getBooking: async (id: string): Promise<Booking> => {
//     const response = await get<{ data: Booking }>(`/bookings/${id}`);
//     return response.data;
//   },

//   // Cancel booking
//   cancelBooking: async (data: CancelBookingData): Promise<Booking> => {
//     const response = await put<{ data: Booking }>(
//       `/bookings/${data.bookingId}/cancel`, 
//       { reason: data.reason }
//     );
//     return response.data;
//   },

//   // Reschedule booking
//   rescheduleBooking: async (data: RescheduleBookingData): Promise<Booking> => {
//     const response = await put<{ data: Booking }>(
//       `/bookings/${data.bookingId}/reschedule`, 
//       { 
//         newTripId: data.newTripId, 
//         reason: data.reason 
//       }
//     );
//     return response.data;
//   },

//   // Delete booking (if allowed)
//   deleteBooking: async (id: string): Promise<{ message: string }> => {
//     const response = await del<{ message: string }>(`/bookings/${id}`);
//     return response;
//   },

//   // Get booking history
//   getBookingHistory: async (params?: {
//     startDate?: string; // Changed from start_date
//     endDate?: string; // Changed from end_date
//     page?: number;
//     limit?: number;
//   }): Promise<PaginatedResponse<Booking>> => {
//     const response = await get<PaginatedResponse<Booking>>('/bookings/history', params);
//     return response;
//   },
// };
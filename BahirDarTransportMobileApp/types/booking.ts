import { Trip, Seat } from './trip';

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  seats: Seat[];
  totalPrice: number;
  currency: 'ETB';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingDate: string;
  travelDate: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  specialRequests?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  tripId: string;
  seats: string[]; // seat numbers
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  specialRequests?: string;
}

export interface CancelBookingData {
  bookingId: string;
  reason?: string;
}

export interface RescheduleBookingData {
  bookingId: string;
  newTripId: string;
  newSeats: string[];
}
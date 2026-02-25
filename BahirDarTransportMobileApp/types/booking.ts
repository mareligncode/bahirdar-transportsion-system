// types/booking.ts

import { Trip } from './trip';
import { User } from './auth';
import { PaymentStatus } from './payment'; // Import from payment

export interface PassengerDetails {
  fullName: string;
  phoneNumber: string;
  email: string;
  emergencyContact?: string;
  idNumber?: string;
  idType?: 'passport' | 'national_id' | 'drivers_license';
}

// Booking status type
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  bookingNumber: string;
  ticketNumber?: string;
  passengerID: User | string;
  tripID: Trip | string;
  seatNumber: number;
  seatNumbers?: number[];
  totalPrice: number;
  totalAmount?: number;
  amount?: number;
  pricePerSeat: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus; // Use the imported type
  paymentID?: string;
  paymentMethod?: string;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
  passengerDetails?: PassengerDetails;
  specialRequests?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  qrCode?: string;
}

export interface BookingCreateData {
  tripID: string;
  seatNumber: number;
  passengerDetails: PassengerDetails;
  specialRequests?: string;
}

export interface BookingResponse {
  success: boolean;
  data?: Booking;
  message?: string;
}

export interface BookingsListResponse {
  success: boolean;
  data?: Booking[];
  count?: number;
  message?: string;
}
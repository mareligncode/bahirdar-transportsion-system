import { Trip, Vehicle } from './trip';
import { User } from './auth';
import { PaymentStatus } from './payment';

export interface PassengerDetails {
  fullName: string;
  phoneNumber: string;
  email: string;
  emergencyContact?: string;
  idNumber?: string;
  idType?: 'passport' | 'national_id' | 'drivers_license';
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'refunded';
export type BookingPaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';

export interface Booking {
  _id: string;
  bookingNumber?: string;
  ticketNumber?: string;
  passengerID: string | User;
  tripID: string | Trip;
  vehicleID?: string | Vehicle;
  seatNumber?: number;
  seatNumbers?: number[];
  totalPrice?: number;
  amount?: number;
  pricePerSeat?: number;
  status: BookingStatus;
  paymentStatus?: BookingPaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  bookingDate?: string;
  createdAt?: string;
  updatedAt?: string;
  specialRequests?: string;
  passengerDetails?: {
    fullName: string;
    phoneNumber: string;
    email: string;
    emergencyContact?: string;
  };
  checkedIn?: boolean;
  checkedInAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdBy?: string | User;
  
  isGroupBooking?: boolean;
  groupBookingId?: string;
  groupTicketNumber?: string;
  seatCount?: number;
  batchTotalPrice?: number;
  checkedInSeats?: Array<{
    seatNumber: number;
    checkedInAt: string;
  }>;
}

export interface BookingCreateData {
  tripID: string;
  seatNumber: number;
  passengerDetails: PassengerDetails;
  specialRequests?: string;
  isTemporaryReservation?: boolean;
  reservationExpiry?: string;
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
import { Trip } from './trip';
export interface Booking {
  _id: string;
  bookingNumber: string;
  ticketNumber: string;
  passengerID: {
    _id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
  };
  tripID: Trip | string;
  vehicleID: {
    _id: string;
    plateNumber: string;
    carType: string;
    totalCapacity: number;
    color?: string;
  };
  seatNumbers: string[];
  seatNumber?: number; // For backward compatibility
  totalPrice: number;
  pricePerSeat?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingDate: string;
  passengerDetails: {
    fullName: string;
    phoneNumber: string;
    email: string;
    emergencyContact?: string;
  };
  specialRequests?: string;
  cancellationReason?: string;
  refundAmount?: number;
  checkedIn: boolean;
  checkedInAt?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  tripID: string;
  seatNumbers: string[];
  passengerDetails?: {
    fullName: string;
    phoneNumber: string;
    email: string;
    emergencyContact?: string;
  };
  specialRequests?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking;
}

export interface BookingsListResponse {
  success: boolean;
  count: number;
  total?: number;
  data: Booking[];
}

export interface CancelBookingPayload {
  cancellationReason?: string;
}

export interface BookingFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
}


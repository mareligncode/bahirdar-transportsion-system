export interface Trip {
  id: string;
  origin: {
    _id: string;
    stationName: string;
    city: string;
    location?: string;
  };
  destination: {
    _id: string;
    stationName: string;
    city: string;
    location?: string;
  };
  departureTime: string;
  arrivalTime: string;
  vehicle: {
    _id: string;
    plateNumber: string;
    carType: string;
    totalCapacity: number;
    color?: string;
  };
  driver: {
    _id: string;
    fullName: string;
    phoneNumber?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
  };
  price: number;
  availableSeats: number;
  totalSeats: number;
  station: {
    _id: string;
    stationName: string;
    location?: string;
  };
  routePoints?: string[];
  estimatedDuration?: string;
  notes?: string;
  tripStatus: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  isActive: boolean;
  createdBy?: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SearchTripParams {
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
  vehicleType?: string;
  maxPrice?: number;
}

export interface CreateBookingParams {
  tripId: string;
  seats: string[];
  passengerId: string;
  passengerName?: string;
  passengerPhone?: string;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  seats: string[];
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingDate: string;
  trip: Trip;
  qrCode?: string;
  ticketNumber: string;
}
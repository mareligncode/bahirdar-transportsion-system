// types/trip.ts
export interface Trip {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  busType: 'Standard' | 'Premium' | 'VIP';
  busNumber: string;
  driverName?: string;
  status: 'scheduled' | 'departed' | 'arrived' | 'cancelled';
}

export interface Seat {
  number: string;
  status: 'available' | 'booked' | 'selected';
  type?: 'regular' | 'premium' | 'vip';
  price?: number;
}

export interface TripSearchParams {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
  sortBy?: 'price' | 'departure' | 'arrival';
  sortOrder?: 'asc' | 'desc';
}
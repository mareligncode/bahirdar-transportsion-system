export interface Station {
  _id: string;
  stationName: string;
  city: string;
  location?: string;
  contactPhone?: string;
}

export interface StationOption {
  value: string;
  label: string;
  fullLabel: string;
  city?: string;
  location?: string;
}

export interface Vehicle {
  _id: string;
  plateNumber: string;
  carType: string;
  totalCapacity: number;
  features?: string[];
  images?: string[];
  color?: string; // Add this for compatibility
}

export interface Driver {
  _id: string;
  fullName: string;
  phoneNumber?: string; // This exists
  profilePicture?: string;
  rating?: number;
  yearsOfExperience?: number;
  licenseNumber?: string; // Add for compatibility
}

export interface Trip {
  _id: string;
  id?: string;
  tripNumber?: string;
  origin: Station;
  destination: Station;
  departureTime: string;
  arrivalTime: string;
  vehicle: Vehicle;
  vehicleID?: Vehicle; // Add for backward compatibility
  driver: Driver;
  price: number;
  availableSeats: number;
  totalSeats: number;
  estimatedDuration?: string;
  notes?: string;
  tripStatus: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  isActive: boolean;
}

export interface SearchTripParams {
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
  vehicleType?: string;
  maxPrice?: number;
}

export interface TripSearchResponse {
  success: boolean;
  data?: Trip[];
  message?: string;
}

export interface TripDetailsResponse {
  success: boolean;
  data?: Trip;
  message?: string;
}
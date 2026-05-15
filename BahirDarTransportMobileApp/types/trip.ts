export interface Station {
  _id: string;
  stationName: string;
  city: string;
  location?: string;
  contactPhone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
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
  color?: string;
  associationName?: string;
}

export interface Driver {
  _id: string;
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  rating?: number;
  yearsOfExperience?: number;
  licenseNumber?: string;
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
  vehicleID?: Vehicle;
  driver: Driver;
  price: number;
  availableSeats: number;
  totalSeats: number;
  estimatedDuration?: string;
  notes?: string;
  tripStatus: 'scheduled' | 'boarding' | 'ongoing' | 'completed' | 'cancelled' | 'delayed';
  isActive: boolean;
  currentCoordinates?: {
    lat: number;
    lng: number;
  };
  isRealtimeTracking?: boolean;
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
import { api } from '../../config/api';
import { API_ENDPOINTS } from '../../config/api'; // Import endpoints
import { Trip, SearchTripParams, CreateBookingParams } from '../../types/trip';

export const tripsApi = {
  // Get all available trips for passengers
  getAllTrips: async (params?: {
    page?: number;
    limit?: number;
    origin?: string;
    destination?: string;
    date?: string;
    status?: string;
  }) => {
    // Default params for passengers
    const passengerParams = {
      limit: params?.limit || 20,
      page: params?.page || 1,
      status: params?.status || 'scheduled', // Default for passengers
      ...params,
    };
    
    console.log('📡 Fetching trips with params:', passengerParams);
    
    const response = await api.get(API_ENDPOINTS.TRIPS.BASE, { 
      params: passengerParams 
    });
    return response.data;
  },

  // Search trips for passengers
  searchTrips: async (params: SearchTripParams) => {
    console.log('🔍 Searching trips:', params);
    
    const response = await api.get(API_ENDPOINTS.TRIPS.SEARCH, { 
      params: {
        origin: params.origin,
        destination: params.destination,
        date: params.date,
        passengers: params.passengers || 1,
        vehicleType: params.vehicleType,
        maxPrice: params.maxPrice,
      }
    });
    return response.data;
  },

  // Get single trip by ID
  getTripById: async (id: string) => {
    console.log('📡 Fetching trip by ID:', id);
    
    const response = await api.get(API_ENDPOINTS.TRIPS.BY_ID(id));
    return response.data;
  },

  // Get booked seats for a trip
  getTripSeats: async (tripId: string) => {
    console.log('💺 Fetching seats for trip:', tripId);
    
    try {
      // Option 1: Try to get seats from bookings endpoint
      const response = await api.get(API_ENDPOINTS.BOOKINGS.BASE, {
        params: { tripId, status: 'confirmed' }
      });
      
      const bookings = response.data?.data || [];
      const bookedSeats = bookings.flatMap((booking: any) => booking.seats || []);
      
      console.log(`Found ${bookedSeats.length} booked seats`);
      return { data: { bookedSeats } };
      
    } catch (error) {
      console.warn('Could not fetch booked seats, using empty array');
      return { data: { bookedSeats: [] } };
    }
  },

  // Create booking
  createBooking: async (data: CreateBookingParams) => {
    console.log('📝 Creating booking:', {
      tripId: data.tripId,
      seats: data.seats.length,
      passengerId: data.passengerId,
    });
    
    const response = await api.post(API_ENDPOINTS.BOOKINGS.BASE, data);
    return response.data;
  },

  // Get user's booking history
  getMyBookings: async () => {
    console.log('📚 Fetching my bookings');
    
    const response = await api.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId: string) => {
    console.log('❌ Canceling booking:', bookingId);
    
    const response = await api.delete(API_ENDPOINTS.BOOKINGS.BY_ID(bookingId));
    return response.data;
  },
};
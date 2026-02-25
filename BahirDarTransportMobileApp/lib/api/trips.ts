import { api, API_ENDPOINTS } from '../../config/api';
import { SearchTripParams } from '../../types/trip';

export const tripsApi = {

  searchTrips: async (params: SearchTripParams) => {
    console.log('🔍 Searching trips with params:', params);
    
    try {
      const dateOnly = params.date?.includes('T') ? params.date.split('T')[0] : params.date;
      const response = await api.get(API_ENDPOINTS.TRIPS.SEARCH, { 
        params: {
          origin: params.origin,
          destination: params.destination,
          date: dateOnly,
          passengers: params.passengers || 1,
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  },

  // lib/api/trips.ts - Update getTripById
  getTripById: async (id: string) => {
    console.log('📡 tripsApi.getTripById called with ID:', id);
    console.log('📡 ID type:', typeof id);
    console.log('📡 ID length:', id?.length);
    
    try {
      const url = API_ENDPOINTS.TRIPS.BY_ID(id);
      console.log('📡 Making request to:', url);
      
      const response = await api.get(url);
      console.log('✅ tripsApi.getTripById response status:', response.status);
      console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('❌ tripsApi.getTripById error:', error.message);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },

  getAllTrips: async (filters?: { 
    status?: string;
    origin?: string;
    destination?: string;
    date?: string;
    limit?: number;
    // legacy param names
    fromStation?: string;
    toStation?: string;
  }) => {
    console.log('📅 Fetching trips with filters:', filters);
    const origin = filters?.origin ?? filters?.fromStation;
    const destination = filters?.destination ?? filters?.toStation;
    
    try {
      console.log('📅 Making API request to:', API_ENDPOINTS.TRIPS.BASE);
      console.log('📅 With params:', {
        status: filters?.status || 'scheduled',
        origin,
        destination,
        date: filters?.date,
        limit: filters?.limit || 20,
      });
      
      const response = await api.get(API_ENDPOINTS.TRIPS.BASE, {
        params: {
          status: filters?.status || 'scheduled',
          origin,
          destination,
          date: filters?.date,
          limit: filters?.limit || 20,
        }
      });
      
      console.log('✅ Trips API response status:', response.status);
      console.log('✅ Response headers:', response.headers);
      console.log('📦 RAW API RESPONSE DATA:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch trips:', error.message);
      if (error.response) {
        console.error('❌ Error status:', error.response.status);
        console.error('❌ Error data:', error.response.data);
      }
      throw error;
    }
  },

  getStations: async () => {
    console.log('📍 Fetching active stations');
    
    try {
      const response = await api.get(API_ENDPOINTS.STATIONS.ACTIVE);
      console.log('📍 API Response Status:', response.status);
      console.log('📍 Full response data:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching stations:', error.message);
      throw error;
    }
  },

  getStationById: async (stationId: string) => {
    console.log('📍 Fetching station:', stationId);
    
    try {
      const response = await api.get(API_ENDPOINTS.STATIONS.BY_ID(stationId));
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching station:', error);
      throw error;
    }
  },

  getBookedSeatsForTrip: async (tripId: string) => {
    console.log('💺 Fetching booked seats for trip:', tripId);
    
    try {
      const response = await api.get(API_ENDPOINTS.BOOKINGS.BASE, {
        params: { 
          tripId: tripId,
          status: 'confirmed,pending' 
        }
      });
      
      const bookings = response.data?.data || [];
      const bookedSeats = bookings.flatMap((booking: any) => {
        if (Array.isArray(booking.seatNumbers)) {
          return booking.seatNumbers;
        }
        if (booking.seatNumber) {
          return [booking.seatNumber.toString()];
        }
        return [];
      });
      
      return { data: { bookedSeats } };
    } catch (error) {
      console.warn('⚠️ Could not fetch booked seats:', error);
      return { data: { bookedSeats: [] } };
    }
  },

  getVehicleById: async (vehicleId: string | { _id: string }) => {
    console.log('🚌 Fetching vehicle:', vehicleId);

    let id: string;
    if (typeof vehicleId === 'object' && vehicleId !== null) {
      id = vehicleId._id;
      console.log('📦 Extracted ID from vehicle object:', id);
    } else if (typeof vehicleId === 'string') {
      id = vehicleId;
    } else {
      console.error('❌ Invalid vehicle ID format:', vehicleId);
      throw new Error('Invalid vehicle ID format');
    }
    
    if (!id) {
      console.error('❌ No vehicle ID found');
      throw new Error('No vehicle ID provided');
    }
    
    try {
      const response = await api.get(API_ENDPOINTS.VEHICLES.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicle:', error);
      throw error;
    }
  },

  getVehicleWithImages: async (vehicleId: string) => {
    console.log('🚌 Fetching vehicle with images:', vehicleId);
    
    try {
      const response = await api.get(API_ENDPOINTS.VEHICLES.GET_WITH_IMAGES(vehicleId));
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicle with images:', error);
      throw error;
    }
  },

  getVehicleImages: async (vehicleId: string) => {
    console.log('🖼️ Fetching vehicle images:', vehicleId);
    
    try {
      const response = await api.get(API_ENDPOINTS.VEHICLES.GET_IMAGES(vehicleId));
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicle images:', error);
      throw error;
    }
  }
};
// lib/api/trips.ts
import { apiClient } from './index';
import { API_ENDPOINTS } from '../../config/api';
import { SearchTripParams } from '../../types/trip';

export const tripsApi = {
  searchTrips: async (params: SearchTripParams) => {
    console.log('🔍 Searching trips with params:', params);

    try {
      const dateOnly = params.date?.includes('T') ? params.date.split('T')[0] : params.date;
      const response = await apiClient.get(API_ENDPOINTS.TRIPS.SEARCH, {
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

  getTripById: async (id: string) => {
    console.log('📡 tripsApi.getTripById called with ID:', id);

    try {
      const url = API_ENDPOINTS.TRIPS.BY_ID(id);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ tripsApi.getTripById error:', error.message);
      throw error;
    }
  },

  getAllTrips: async (filters?: {
    status?: string;
    origin?: string;
    destination?: string;
    date?: string;
    limit?: number;
    fromStation?: string;
    toStation?: string;
  }) => {
    console.log('📅 Fetching trips with filters:', filters);
    const origin = filters?.origin ?? filters?.fromStation;
    const destination = filters?.destination ?? filters?.toStation;

    try {
      const response = await apiClient.get(API_ENDPOINTS.TRIPS.BASE, {
        params: {
          status: filters?.status || 'scheduled',
          origin,
          destination,
          date: filters?.date,
          limit: filters?.limit || 20,
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch trips:', error.message);
      throw error;
    }
  },

  getStations: async () => {
    console.log('📍 Fetching active stations');
    console.log('🔍 API Base URL:', apiClient.defaults.baseURL);
    try {
      const response = await apiClient.get(API_ENDPOINTS.STATIONS.ACTIVE);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getStationById: async (stationId: string) => {
    console.log('📍 Fetching station:', stationId);

    try {
      const response = await apiClient.get(API_ENDPOINTS.STATIONS.BY_ID(stationId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBookedSeatsForTrip: async (tripId: string): Promise<{
    data?: { bookedSeats: string[] };
    bookedSeats?: string[];
  }> => {
    const toSeatId = (raw: any): string | null => {
      if (raw == null) return null;
      const n = typeof raw === 'string' ? parseInt(raw.trim(), 10) : Number(raw);
      if (!Number.isFinite(n) || n < 1) return null;
      return String(n);
    };

    const extractBookedSeatsFromBookings = (bookings: any[]): string[] =>
      bookings.flatMap((booking: any) => {
        const seats: string[] = [];
        if (Array.isArray(booking.seatNumbers)) {
          booking.seatNumbers.forEach((s: any) => {
            const id = toSeatId(s);
            if (id) seats.push(id);
          });
        } else if (booking.seatNumber != null) {
          const id = toSeatId(booking.seatNumber);
          if (id) seats.push(id);
        }
        return seats;
      });

    const tryBookings = async (bookings: any[]): Promise<{ bookedSeats: string[] }> => {
      const list = Array.isArray(bookings) ? bookings : [];
      const bookedSeats = extractBookedSeatsFromBookings(list);
      return { bookedSeats };
    };

    try {
      const res = await apiClient.get(API_ENDPOINTS.BOOKINGS.TRIP_BOOKINGS(tripId));
      const data = res.data?.data ?? res.data ?? [];
      const result = await tryBookings(Array.isArray(data) ? data : []);
      return { data: result };
    } catch (_) {
      try {
        const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.BASE, {
          params: { tripId, status: 'confirmed,pending' },
        });
        const bookings = response.data?.data ?? response.data ?? [];
        const result = await tryBookings(Array.isArray(bookings) ? bookings : []);
        return { data: result };
      } catch (__) {
        try {
          const response = await apiClient.get(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS);
          const allBookings = response.data?.data ?? response.data ?? [];
          const list = Array.isArray(allBookings) ? allBookings : [];
          const forTrip = list.filter((b: any) => {
            const tid = b.tripID?._id ?? b.tripID;
            return tid != null && String(tid) === String(tripId);
          });
          const result = await tryBookings(forTrip);
          return { data: result };
        } catch (err) {
          console.warn('Could not fetch booked seats for trip', tripId, err);
          return { data: { bookedSeats: [] } };
        }
      }
    }
  },

  getVehicleById: async (vehicleId: string | { _id: string }) => {

    let id: string;
    if (typeof vehicleId === 'object' && vehicleId !== null) {
      id = vehicleId._id;
    } else if (typeof vehicleId === 'string') {
      id = vehicleId;
    } else {
      throw new Error('Invalid vehicle ID format');
    }

    if (!id) {
      throw new Error('No vehicle ID provided');
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.VEHICLES.BY_ID(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getVehicleWithImages: async (vehicleId: string) => {

    try {
      const response = await apiClient.get(API_ENDPOINTS.VEHICLES.GET_WITH_IMAGES(vehicleId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getVehicleImages: async (vehicleId: string) => {
    console.log('🖼️ Fetching vehicle images:', vehicleId);

    try {
      const response = await apiClient.get(API_ENDPOINTS.VEHICLES.GET_IMAGES(vehicleId));
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicle images:', error);
      throw error;
    }
  }
};
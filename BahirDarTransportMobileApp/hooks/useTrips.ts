// hooks/useTrips.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { tripsApi } from '../lib/api/trips';
import {
  Trip,
  SearchTripParams,
  StationOption,
  Station,
  TripSearchResponse
} from '../types/trip';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);

  const searchTrips = useCallback(async (params: SearchTripParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await tripsApi.searchTrips(params);
      let tripsData: Trip[] = [];

      if (response?.data && Array.isArray(response.data)) {
        tripsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        tripsData = response.data.data;
      } else if (response?.trips && Array.isArray(response.trips)) {
        tripsData = response.trips;
      } else if (Array.isArray(response)) {
        tripsData = response;
      }

      setTrips(tripsData);
      return tripsData;
    } catch (err: any) {
      console.error('❌ Search failed:', err.message);
      console.error('Error response:', err.response?.data);
      const message = err.response?.data?.message || 'Failed to search trips';
      setError(message);
      Alert.alert('Search Failed', message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get trip by ID - using /trip/:id
  const getTripById = useCallback(async (id: string): Promise<Trip | null> => {
    try {
      setLoading(true);
      const response = await tripsApi.getTripById(id);

      // Extract trip data from response
      let tripData: Trip | null = null;

      if (response?.data?.data) {
        tripData = response.data.data;
      } else if (response?.data) {
        tripData = response.data;
      } else if (response) {
        tripData = response as unknown as Trip;
      }

      if (!tripData) {
        console.error('❌ No trip data found in response');
        Alert.alert('Error', 'Trip not found');
        return null;
      }

      return tripData;
    } catch (err: any) {
      console.error('❌ getTripById error:', err.message);

      let errorMessage = 'Failed to load trip details. Please try again.';
      if (err.response?.status === 404) {
        errorMessage = 'Trip not found. It may have been removed.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid trip ID. Please try searching again.';
      }

      Alert.alert('Error', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllTrips = useCallback(async (filters?: any): Promise<Trip[]> => {
    try {
      setLoading(true);
      const response = await tripsApi.getAllTrips(filters);
      let tripsData: Trip[] = [];

      if (response?.data && Array.isArray(response.data)) {
        tripsData = response.data;
      }
      else if (response?.data?.data && Array.isArray(response.data.data)) {
        tripsData = response.data.data;
      }
      else if (response?.trips && Array.isArray(response.trips)) {
        tripsData = response.trips;
      }
      else if (Array.isArray(response)) {
        tripsData = response;
      }

      setTrips(tripsData);
      return tripsData;
    } catch (err: any) {
      console.error('❌ Failed to fetch trips:', err.message);
      console.error('Error details:', err.response?.data);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStations = useCallback(async (forceRefresh = false): Promise<StationOption[]> => {
    if (stations.length > 0 && !forceRefresh) {
      console.log(`📍 Using ${stations.length} cached stations`);
      return stations;
    }

    setStationsLoading(true);
    try {
      console.log('📍 Fetching active stations from API...');
      const responseData = await tripsApi.getStations();

      console.log('📍 Response data type:', typeof responseData);
      console.log('📍 Response data keys:', Object.keys(responseData || {}));

      let stationsArray: Station[] = [];

      if (responseData?.stations && Array.isArray(responseData.stations)) {
        stationsArray = responseData.stations;
        console.log(`📍 Found ${stationsArray.length} stations in responseData.stations`);
      }
      else if (Array.isArray(responseData)) {
        stationsArray = responseData;
        console.log(`📍 Found ${stationsArray.length} stations in responseData array`);
      }
      else if (responseData?.data?.stations && Array.isArray(responseData.data.stations)) {
        stationsArray = responseData.data.stations;
        console.log(`📍 Found ${stationsArray.length} stations in responseData.data.stations`);
      }

      console.log(`📍 Processing ${stationsArray.length} stations`);

      if (stationsArray.length === 0) {
        console.warn('⚠️ No stations found in response');
        console.log('📦 Full response:', JSON.stringify(responseData, null, 2));
        return [];
      }

      const formattedStations: StationOption[] = stationsArray.map((station: Station) => ({
        value: station._id,
        label: station.stationName,
        fullLabel: `${station.stationName}${station.city ? ` (${station.city})` : ''}`,
        city: station.city,
        location: station.location
      }));

      formattedStations.sort((a: StationOption, b: StationOption) => a.label.localeCompare(b.label));

      setStations(formattedStations);
      return formattedStations;

    } catch (err: any) {
      console.error('❌ Error fetching stations:', err.message);
      return stations;
    } finally {
      setStationsLoading(false);
    }
  }, [stations]);

  const getBookedSeats = useCallback(async (tripId: string): Promise<string[]> => {
    try {
      const response = await tripsApi.getBookedSeatsForTrip(tripId);
      const seats = response?.data?.bookedSeats || [];
      setBookedSeats(seats);
      return seats;
    } catch (err) {
      console.warn('⚠️ Could not fetch booked seats:', err);
      setBookedSeats([]);
      return [];
    }
  }, []);

  // Get vehicle details
  const getVehicleById = useCallback(async (vehicleId: string) => {
    try {
      const response = await tripsApi.getVehicleById(vehicleId);
      return response?.data?.data || response?.data;
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      return null;
    }
  }, []);

  // Load stations on mount
  useEffect(() => {
    fetchStations();
  }, []);

  return {
    // State
    trips,
    loading,
    error,
    stations,
    stationsLoading,
    bookedSeats,

    // Actions
    searchTrips,
    getTripById,
    fetchAllTrips,
    fetchStations,
    getBookedSeats,
    getVehicleById,

    // Setters
    setTrips,
    setBookedSeats,
  };
};
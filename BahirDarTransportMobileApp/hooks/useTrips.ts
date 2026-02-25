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
      
      console.log('🔍 Searching trips with params:', params);
      const response = await tripsApi.searchTrips(params);
      
      console.log('📦 Search response:', JSON.stringify(response, null, 2));
      
      let tripsData: Trip[] = [];
      
      // Handle different response structures
      if (response?.data && Array.isArray(response.data)) {
        tripsData = response.data;
        console.log('📊 Found trips in response.data array:', tripsData.length);
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        tripsData = response.data.data;
        console.log('📊 Found trips in response.data.data:', tripsData.length);
      } else if (response?.trips && Array.isArray(response.trips)) {
        tripsData = response.trips;
        console.log('📊 Found trips in response.trips:', tripsData.length);
      } else if (Array.isArray(response)) {
        tripsData = response;
        console.log('📊 Found trips in response array:', tripsData.length);
      }
      
      console.log(`✅ Found ${tripsData.length} trips`);
      
      // Log each trip's ID for debugging
      if (tripsData.length > 0) {
        console.log('📋 Trip IDs from search:');
        tripsData.forEach((trip: Trip, index: number) => {
          console.log(`  Trip ${index + 1}:`, {
            _id: trip._id,
            from: trip.origin?.stationName,
            to: trip.destination?.stationName,
            departureTime: trip.departureTime
          });
        });
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
      console.log('📡 getTripById called with ID:', id);
      console.log('📡 ID type:', typeof id);
      console.log('📡 ID length:', id?.length);
      
      // Validate ID before making the request
      if (!id || id === 'index' || id === 'undefined' || id === 'null') {
        console.error('❌ Invalid trip ID format:', id);
        Alert.alert('Error', 'Invalid trip ID format');
        return null;
      }
      
      // MongoDB ObjectIds are 24 characters
      if (id.length !== 24) {
        console.error('❌ Trip ID has wrong length:', id.length);
        Alert.alert(
          'Invalid Trip ID',
          `The trip ID has incorrect format (length: ${id.length}, expected: 24).`
        );
        return null;
      }
      
      const response = await tripsApi.getTripById(id);
      console.log('✅ getTripById response status:', response?.status);
      
      // Extract trip data from response
      let tripData: Trip | null = null;
      
      if (response?.data?.data) {
        tripData = response.data.data;
        console.log('📋 Found trip in response.data.data');
      } else if (response?.data) {
        tripData = response.data;
        console.log('📋 Found trip in response.data');
      } else if (response) {
        tripData = response as unknown as Trip;
        console.log('📋 Found trip in response directly');
      }
      
      if (!tripData) {
        console.error('❌ No trip data found in response');
        Alert.alert('Error', 'Trip not found');
        return null;
      }
      
      console.log('✅ Trip loaded successfully:', {
        _id: tripData._id,
        from: tripData.origin?.stationName,
        to: tripData.destination?.stationName
      });
      
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
      console.log('🔍 Fetching all trips with filters:', filters);
      
      const response = await tripsApi.getAllTrips(filters);
      console.log('📥 API response received');
      
      let tripsData: Trip[] = [];
      
      if (response?.data && Array.isArray(response.data)) {
        tripsData = response.data;
        console.log('✅ Found trips in response.data array:', tripsData.length);
      }
      else if (response?.data?.data && Array.isArray(response.data.data)) {
        tripsData = response.data.data;
        console.log('✅ Found trips in response.data.data:', tripsData.length);
      }
      else if (response?.trips && Array.isArray(response.trips)) {
        tripsData = response.trips;
        console.log('✅ Found trips in response.trips:', tripsData.length);
      }
      else if (Array.isArray(response)) {
        tripsData = response;
        console.log('✅ Found trips in response array:', tripsData.length);
      }
      
      console.log(`✅ Processed ${tripsData.length} trips`);
      
      if (tripsData.length > 0) {
        console.log('📋 Trip IDs from API:');
        tripsData.forEach((trip: Trip, index: number) => {
          console.log(`  Trip ${index + 1}:`, {
            _id: trip._id,
            from: trip.origin?.stationName,
            to: trip.destination?.stationName,
            departureTime: trip.departureTime
          });
        });
      } else {
        console.log('⚠️ No trips found in response');
        console.log('📦 Response structure:', Object.keys(response || {}));
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
      
      console.log(`✅ Formatted ${formattedStations.length} stations:`, 
        formattedStations.map((s: StationOption) => s.label).join(', '));
      
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
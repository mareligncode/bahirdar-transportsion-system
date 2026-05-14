import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { tripsApi } from '../lib/api/trips';
import { useAuthStore } from '../store/authStore';
import {
  Trip,
  SearchTripParams,
  StationOption,
  Station,
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
      const message = err.response?.data?.message || 'Failed to search trips';
      setError(message);
      Alert.alert('Search Failed', message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTripById = useCallback(async (id: string): Promise<Trip | null> => {
    try {
      setLoading(true);
      const response = await tripsApi.getTripById(id);

      let tripData: Trip | null = null;

      if (response?.data?.data) {
        tripData = response.data.data;
      } else if (response?.data) {
        tripData = response.data;
      } else if (response) {
        tripData = response as unknown as Trip;
      }

      if (!tripData) {
        Alert.alert('Error', 'Trip not found');
        return null;
      }

      return tripData;
    } catch (err: any) {

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
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return [];

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
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStations = useCallback(async (forceRefresh = false): Promise<StationOption[]> => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      return [];
    }

    if (stations.length > 0 && !forceRefresh) {
      return stations;
    }

    setStationsLoading(true);
    try {
      const responseData = await tripsApi.getStations();

      let stationsArray: Station[] = [];

      if (responseData?.stations && Array.isArray(responseData.stations)) {
        stationsArray = responseData.stations;
      }
      else if (Array.isArray(responseData)) {
        stationsArray = responseData;
      }
      else if (responseData?.data?.stations && Array.isArray(responseData.data.stations)) {
        stationsArray = responseData.data.stations;
      }

      if (stationsArray.length === 0) {
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
  const getVehicleById = useCallback(async (vehicleId: string) => {
    try {
      const response = await tripsApi.getVehicleById(vehicleId);
      return response?.data?.data || response?.data;
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return {
    trips,
    loading,
    error,
    stations,
    stationsLoading,
    bookedSeats,

    searchTrips,
    getTripById,
    fetchAllTrips,
    fetchStations,
    getBookedSeats,
    getVehicleById,

    setTrips,
    setBookedSeats,
  };
};
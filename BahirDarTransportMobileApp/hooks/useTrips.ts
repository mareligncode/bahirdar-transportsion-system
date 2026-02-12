import { useState, useEffect, useCallback } from 'react';
import { tripsApi } from '../lib/api/trips';
import { Trip, SearchTripParams } from '../types/trip';
import { useAuth } from './useAuth';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTrips = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await tripsApi.getAllTrips(params);
      setTrips(response.data);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trips');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTrips = useCallback(async (params: SearchTripParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await tripsApi.searchTrips(params);
      setTrips(response.data);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to search trips');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTripById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await tripsApi.getTripById(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trip details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bookTrip = useCallback(async (tripId: string, seats: string[]) => {
    try {
      setLoading(true);
      const response = await tripsApi.createBooking({
        tripId,
        seats,
        passengerId: user?.id || '',
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to book trip');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    trips,
    loading,
    error,
    fetchTrips,
    searchTrips,
    getTripById,
    bookTrip,
    setTrips,
  };
};
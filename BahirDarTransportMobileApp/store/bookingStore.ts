// store/bookingStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip } from '../types/trip';
import { Booking } from '../types/booking';

interface BookingState {
  // Current booking flow state
  currentSearch: {
    origin: string;
    destination: string;
    date: Date | null;
    passengers?: number;
  } | null;
  availableTrips: Trip[];
  selectedTrip: Trip | null;
  selectedSeats: string[];
  
  // Active booking
  currentBooking: Partial<Booking> | null;
  
  // UI State
  step: 'search' | 'results' | 'seats' | 'payment' | 'confirmation';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSearchData: (search: BookingState['currentSearch']) => void;
  setAvailableTrips: (trips: Trip[]) => void;
  selectTrip: (trip: Trip | null) => void;
  selectSeats: (seats: string[]) => void;
  setStep: (step: BookingState['step']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetBooking: () => void;
  clearSearch: () => void;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSearch: null,
      availableTrips: [],
      selectedTrip: null,
      selectedSeats: [],
      currentBooking: null,
      step: 'search',
      isLoading: false,
      error: null,

      // Actions - WITHOUT IMMER
      setSearchData: (search) => set({ 
        currentSearch: search,
        error: null // Clear error when starting new search
      }),

      setAvailableTrips: (trips) => set({ 
        availableTrips: trips,
        step: trips.length > 0 ? 'results' : 'search',
        error: null // Clear error when trips loaded
      }),

      selectTrip: (trip) => set({ 
        selectedTrip: trip,
        step: trip ? 'seats' : 'search',
        selectedSeats: [], // Reset seats when new trip selected
        error: null // Clear error when trip selected
      }),

      selectSeats: (seats) => set({ 
        selectedSeats: seats,
        error: null // Clear error when seats selected
      }),

      setStep: (step) => set({ 
        step,
        error: null // Clear error when changing steps
      }),

      setLoading: (loading) => set({ 
        isLoading: loading 
      }),

      setError: (error) => set({ 
        error,
        isLoading: false // Stop loading when error occurs
      }),

      clearError: () => set({ 
        error: null 
      }),

      resetBooking: () => set({ 
        selectedTrip: null,
        selectedSeats: [],
        currentBooking: null,
        step: 'search',
        error: null,
        isLoading: false
      }),

      clearSearch: () => set({ 
        currentSearch: null,
        availableTrips: [],
        step: 'search',
        error: null
      }),
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSearch: state.currentSearch,
        selectedSeats: state.selectedSeats,
        step: state.step,
      }),
    }
  )
);


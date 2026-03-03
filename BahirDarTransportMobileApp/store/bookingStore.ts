// store/bookingStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, Trip } from '../types';

interface BookingState {
  bookings: Booking[];
  selectedTrip: Trip | null;
  selectedSeats: number[];
  currentBooking: Booking | null;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, booking: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setSelectedSeats: (seats: number[]) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  clearBookingState: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      bookings: [],
      selectedTrip: null,
      selectedSeats: [],
      currentBooking: null,

      setBookings: (bookings) => set({ bookings }),

      addBooking: (booking) => set((state) => ({
        bookings: [booking, ...state.bookings]
      })),

      updateBooking: (id, updatedBooking) => set((state) => ({
        bookings: state.bookings.map((booking) =>
          booking._id === id ? { ...booking, ...updatedBooking } : booking
        ),
        currentBooking: state.currentBooking?._id === id
          ? { ...state.currentBooking, ...updatedBooking }
          : state.currentBooking
      })),

      removeBooking: (id) => set((state) => ({
        bookings: state.bookings.filter((booking) => booking._id !== id),
        currentBooking: state.currentBooking?._id === id ? null : state.currentBooking
      })),

      setSelectedTrip: (trip) => set({ selectedTrip: trip }),

      setSelectedSeats: (seats) => set({ selectedSeats: seats }),

      setCurrentBooking: (booking) => set({ currentBooking: booking }),

      clearBookingState: () => set({
        selectedTrip: null,
        selectedSeats: [],
        currentBooking: null
      })
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookings: state.bookings,
        selectedTrip: state.selectedTrip,
        selectedSeats: state.selectedSeats,
        currentBooking: state.currentBooking
      })
    }
  )
);
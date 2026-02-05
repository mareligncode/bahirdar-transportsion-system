// store/bookingStore.ts - Create if missing
import { create } from 'zustand';

interface Booking {
  id: string;
  tripId: string;
  userId: string;
  seats: string[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  loading: boolean;
  
  // Actions
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => set((state) => ({ 
    bookings: [...state.bookings, booking] 
  })),
  updateBooking: (id, updates) => set((state) => ({
    bookings: state.bookings.map(booking =>
      booking.id === id ? { ...booking, ...updates } : booking
    )
  })),
  removeBooking: (id) => set((state) => ({
    bookings: state.bookings.filter(booking => booking.id !== id)
  })),
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  setLoading: (loading) => set({ loading }),
}));
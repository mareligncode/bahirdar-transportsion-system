export const COLORS = {
  primary: '#1a56db',
  primaryDark: '#1e3a8a',
  primaryLight: '#60a5fa',
  secondary: '#10b981',
  accent: '#f59e0b',
  
  // Status colors
  success: '#10b981',
  danger: '#ef4444',
  error: "#ef4444",
  warning: '#f59e0b',
  info: '#3b82f6',
  soldOut: '#6b7280', 
  available: '#10b981',

  // Status background colors (ADD THESE)
  successLight: '#d1fae5',
  dangerLight: '#fee2e2',
  warningLight: '#fef3c7',
  infoLight: '#dbeafe',

  seat: {
    available: '#ffffff',
    availableBorder: '#d1d5db',
    selected: '#10b981',
    selectedBorder: '#059669',
    booked: '#e5e7eb',
    bookedBorder: '#9ca3af',
    driver: '#fef3c7',
    driverBorder: '#f59e0b',
  },
  
  tripStatus: {
    scheduled: '#10b981',
    boarding: '#3b82f6',
    departed: '#f59e0b',
    arrived: '#6b7280',
    cancelled: '#ef4444',
  },
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Backgrounds
  background: '#f9fafb',
  cardBackground: '#ffffff',
  inputBackground: '#f9fafb',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Booking specific
  booking: {
    pending: '#fef3c7',
    pendingText: '#b45309',
    confirmed: '#d1fae5',
    confirmedText: '#065f46',
    cancelled: '#fee2e2',
    cancelledText: '#b91c1c',
    completed: '#dbeafe',
    completedText: '#1e40af',
  },
  
  // Farewell/Empty states
  overlay: 'rgba(0, 0, 0, 0.5)',
  highlight: '#fef3c7',
} as const;

export type ColorScheme = typeof COLORS;
export type SeatColorKey = keyof typeof COLORS.seat;
export type TripStatusColorKey = keyof typeof COLORS.tripStatus;
export type BookingStatusColorKey = keyof typeof COLORS.booking;

/**
 * Get seat status colors
 */
export const getSeatColors = (status: 'available' | 'selected' | 'booked' | 'driver') => {
  switch (status) {
    case 'available':
      return {
        bg: COLORS.seat.available,
        border: COLORS.seat.availableBorder,
        text: COLORS.gray700,
      };
    case 'selected':
      return {
        bg: COLORS.seat.selected,
        border: COLORS.seat.selectedBorder,
        text: COLORS.white,
      };
    case 'booked':
      return {
        bg: COLORS.seat.booked,
        border: COLORS.seat.bookedBorder,
        text: COLORS.gray500,
      };
    case 'driver':
      return {
        bg: COLORS.seat.driver,
        border: COLORS.seat.driverBorder,
        text: COLORS.gray700,
      };
  }
};

/**
 * Get booking status colors
 */
export const getBookingStatusColors = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return {
        bg: COLORS.booking.pending,
        text: COLORS.booking.pendingText,
      };
    case 'confirmed':
      return {
        bg: COLORS.booking.confirmed,
        text: COLORS.booking.confirmedText,
      };
    case 'cancelled':
      return {
        bg: COLORS.booking.cancelled,
        text: COLORS.booking.cancelledText,
      };
    case 'completed':
      return {
        bg: COLORS.booking.completed,
        text: COLORS.booking.completedText,
      };
    default:
      return {
        bg: COLORS.gray100,
        text: COLORS.gray700,
      };
  }
};

/**
 * Get trip status colors - ✅ FIXED VERSION
 */
export const getTripStatusColors = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return { 
        bg: COLORS.successLight || '#d1fae5', 
        text: COLORS.tripStatus.scheduled 
      };
    case 'boarding':
      return { 
        bg: COLORS.infoLight || '#dbeafe', 
        text: COLORS.tripStatus.boarding 
      };
    case 'departed':
      return { 
        bg: COLORS.warningLight || '#fef3c7', 
        text: COLORS.tripStatus.departed 
      };
    case 'arrived':
      return { 
        bg: COLORS.gray100, 
        text: COLORS.tripStatus.arrived 
      };
    case 'cancelled':
      return { 
        bg: COLORS.dangerLight || '#fee2e2', 
        text: COLORS.tripStatus.cancelled 
      };
    default:
      return { 
        bg: COLORS.gray100, 
        text: COLORS.gray700 
      };
  }
};


import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

/**
 * Extract ID from an object or string
 */
export const extractId = (item: any): string | null => {
  if (!item) return null;
  
  // If it's already a string, return it
  if (typeof item === 'string') return item;
  
  // If it's an object, try to get _id
  if (typeof item === 'object' && item !== null) {
    return item._id || null;
  }
  
  return null;
};

/**
 * Format date in readable format
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format short date (without weekday)
 */
export const formatShortDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format time in 12-hour format
 */
export const formatTime = (date: Date | string): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time together
 */
export const formatDateTime = (date: Date | string): string => {
  if (!date) return 'N/A';
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Format currency (ETB)
 */
export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null) return 'ETB 0.00';
  return `ETB ${amount.toFixed(2)}`;
};

/**
 * Calculate trip duration
 */
export const calculateDuration = (departure: string, arrival: string): string => {
  if (!departure || !arrival) return 'N/A';
  
  try {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diffMs = arr.getTime() - dep.getTime();
    
    if (diffMs < 0) return 'N/A';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Get status color configuration - DEPRECATED: Use getBookingStatusColors from constants/colors instead
 */
export const getStatusColor = (status: string) => {
  console.warn('Deprecated: Use getBookingStatusColors from constants/colors instead');
  switch(status?.toLowerCase()) {
    case 'confirmed':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    case 'completed':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    case 'scheduled':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    case 'boarding':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    case 'departed':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'arrived':
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
};

/**
 * Check if booking is cancellable
 */
export const isBookingCancellable = (status: string, departureTime?: string): boolean => {
  if (!['confirmed', 'pending'].includes(status?.toLowerCase())) {
    return false;
  }
  
  if (departureTime) {
    try {
      const departure = new Date(departureTime);
      const now = new Date();
      const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDeparture > 2; // Can cancel up to 2 hours before
    } catch (error) {
      return false;
    }
  }
  
  return true;
};

/**
 * Generate booking display number
 */
export const formatBookingNumber = (id: string): string => {
  if (!id) return '#N/A';
  return `#${id.slice(-6).toUpperCase()}`;
};

/**
 * Generate ticket number display
 */
export const formatTicketNumber = (ticketNumber: string): string => {
  if (!ticketNumber) return 'N/A';
  return ticketNumber;
};

/**
 * Format seat display
 */
export const formatSeats = (seats: string[]): string => {
  if (!seats || seats.length === 0) return 'No seats';
  if (seats.length === 1) return `Seat ${seats[0]}`;
  if (seats.length === 2) return `Seats ${seats.join(' & ')}`;
  return `Seats ${seats.join(', ')}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Validate search parameters
 */
export const validateSearchParams = (params: {
  origin: string;
  destination: string;
  date: Date | string;
}): { valid: boolean; error?: string } => {
  if (!params.origin) {
    return { valid: false, error: 'Please select departure station' };
  }
  if (!params.destination) {
    return { valid: false, error: 'Please select arrival station' };
  }
  if (params.origin === params.destination) {
    return { valid: false, error: 'Departure and arrival cannot be the same' };
  }
  if (!params.date) {
    return { valid: false, error: 'Please select travel date' };
  }
  
  try {
    const dateObj = typeof params.date === 'string' ? new Date(params.date) : params.date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj < today) {
      return { valid: false, error: 'Travel date cannot be in the past' };
    }
  } catch (error) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  return { valid: true };
};

/**
 * Calculate total price
 */
export const calculateTotalPrice = (pricePerSeat: number, numberOfSeats: number, serviceFee: number = 20): number => {
  return (pricePerSeat * numberOfSeats) + serviceFee;
};

/**
 * Get relative time (e.g., "in 2 hours", "tomorrow")
 */
export const getRelativeTime = (date: Date | string): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 0) return 'Departed';
    if (diffMins < 60) return `in ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `in ${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
    if (diffDays === 1) return 'tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;
    return formatShortDate(dateObj);
  } catch (error) {
    return '';
  }
};

/**
 * Delay function for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Group array by key
 */
export const groupBy = <T,>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, currentValue) => {
    const groupKey = String(currentValue[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
};
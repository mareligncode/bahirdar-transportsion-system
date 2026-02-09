// BahirDarTransportMobileApp/utils/helpers.tsx
import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

/**
 * Delay function for async operations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function to limit function calls
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
 * Throttle function to limit function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Calculate total price for booking
 */
export const calculateTotalPrice = (
  basePrice: number,
  seats: string[],
  seatPrices: Record<string, number> = {}
): number => {
  let total = 0;
  
  seats.forEach(seat => {
    const multiplier = seatPrices[seat] || 1.0;
    total += basePrice * multiplier;
  });
  
  return total;
};

/**
 * Format seat display
 */
export const formatSeatDisplay = (seats: string[]): string => {
  if (seats.length === 0) return 'No seats selected';
  if (seats.length === 1) return `Seat ${seats[0]}`;
  if (seats.length === 2) return `Seats ${seats.join(' and ')}`;
  return `Seats ${seats.slice(0, -1).join(', ')} and ${seats[seats.length - 1]}`;
};

/**
 * Get time difference in minutes
 */
export const getTimeDifference = (date1: Date, date2: Date): number => {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60));
};

/**
 * Format time difference in human-readable format
 */
export const formatTimeDifference = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Format date in a user-friendly way
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return dateObj.toLocaleDateString('en-ET', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time in 12-hour format
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-ET', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time together
 */
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Group array by key
//  */
// export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
//   return array.reduce((groups, item) => {
//     const groupKey = String(item[key]);
//     if (!groups[groupKey]) {
//       groups[groupKey] = [];
//     }
//     groups[groupKey].push(item);
//     return groups;
//   }, {} as Record<string, T[]>);
// };

// /**
//  * Sort trips by departure time
//  */
// export const sortTripsByDeparture = <T extends { departureTime: string }>(
//   trips: T[]
// ): T[] => {
//   return [...trips].sort(
//     (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
//   );
// };

// /**
//  * Filter trips by date
//  */
// export const filterTripsByDate = <T extends { departureTime: string }>(
//   trips: T[],
//   date: Date
// ): T[] => {
//   const targetDate = new Date(date);
//   targetDate.setHours(0, 0, 0, 0);
  
//   const nextDate = new Date(targetDate);
//   nextDate.setDate(nextDate.getDate() + 1);
  
//   return trips.filter(trip => {
//     const tripDate = new Date(trip.departureTime);
//     return tripDate >= targetDate && tripDate < nextDate;
//   });
// };

// /**
//  * Deep clone object
//  */
// export const deepClone = <T>(obj: T): T => {
//   return JSON.parse(JSON.stringify(obj));
// };

// /**
//  * Safe parse JSON
//  */
// export const safeParseJSON = <T>(jsonString: string, fallback: T): T => {
//   try {
//     return JSON.parse(jsonString) as T;
//   } catch {
//     return fallback;
//   }
// };

// /**
//  * Capitalize first letter of each word
//  */
// export const capitalizeWords = (text: string): string => {
//   return text
//     .split(' ')
//     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(' ');
// };

// /**
//  * Format currency (ETB)
//  */
// export const formatCurrency = (amount: number): string => {
//   return new Intl.NumberFormat('en-ET', {
//     style: 'currency',
//     currency: 'ETB',
//     minimumFractionDigits: 2,
//   }).format(amount);
// };

// /**
//  * Generate random color
//  */
// export const getRandomColor = (): string => {
//   const colors = [
//     '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
//     '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
//   ];
//   return colors[Math.floor(Math.random() * colors.length)];
// };

// /**
//  * Validate email
//  */
// export const isValidEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// /**
//  * Validate Ethiopian phone number
//  */
// export const isValidEthiopianPhone = (phone: string): boolean => {
//   const phoneRegex = /^(?:\+251|0)(9\d{8})$/;
//   return phoneRegex.test(phone.replace(/\s/g, ''));
// };

// /**
//  * Format Ethiopian phone number
//  */
// export const formatEthiopianPhone = (phone: string): string => {
//   const cleaned = phone.replace(/\D/g, '');
  
//   if (cleaned.startsWith('0')) {
//     return `+251${cleaned.substring(1)}`;
//   } else if (cleaned.startsWith('251')) {
//     return `+${cleaned}`;
//   } else if (cleaned.startsWith('9')) {
//     return `+251${cleaned}`;
//   }
  
//   return phone;
// };

// /**
//  * Get initials from name
//  */
// export const getInitials = (name: string): string => {
//   return name
//     .split(' ')
//     .map(word => word.charAt(0).toUpperCase())
//     .join('')
//     .substring(0, 2);
// };

// /**
//  * Calculate age from birth date
//  */
// export const calculateAge = (birthDate: Date | string): number => {
//   const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
//   const today = new Date();
//   let age = today.getFullYear() - birthDateObj.getFullYear();
//   const monthDiff = today.getMonth() - birthDateObj.getMonth();
  
//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
//     age--;
//   }
  
//   return age;
// };

// /**
//  * Check if object is empty
//  */
// export const isEmptyObject = (obj: object): boolean => {
//   return Object.keys(obj).length === 0;
// };

// /**
//  * Check if array is empty
//  */
// export const isEmptyArray = (arr: any[]): boolean => {
//   return arr.length === 0;
// };

// /**
//  * Remove duplicates from array
//  */
// export const removeDuplicates = <T>(arr: T[], key?: keyof T): T[] => {
//   if (!key) {
//     return [...new Set(arr)];
//   }
  
//   const seen = new Set();
//   return arr.filter(item => {
//     const value = item[key];
//     if (seen.has(value)) {
//       return false;
//     }
//     seen.add(value);
//     return true;
//   });
// };

// /**
//  * Get distance between two coordinates (Haversine formula)
//  */
// export const getDistance = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ): number => {
//   const R = 6371; // Earth's radius in km
//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) *
//     Math.cos(lat2 * (Math.PI / 180)) *
//     Math.sin(dLon / 2) *
//     Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in km
// };

// export default {
//   isAndroid,
//   isIOS,
//   delay,
//   debounce,
//   throttle,
//   truncateText,
//   generateId,
//   calculateTotalPrice,
//   formatSeatDisplay,
//   getTimeDifference,
//   formatTimeDifference,
//   isToday,
//   isTomorrow,
//   isYesterday,
//   formatDate,
//   formatTime,
//   formatDateTime,
//   groupBy,
//   sortTripsByDeparture,
//   filterTripsByDate,
//   deepClone,
//   safeParseJSON,
//   capitalizeWords,
//   formatCurrency,
//   getRandomColor,
//   isValidEmail,
//   isValidEthiopianPhone,
//   formatEthiopianPhone,
//   getInitials,
//   calculateAge,
//   isEmptyObject,
//   isEmptyArray,
//   removeDuplicates,
//   getDistance,
// };
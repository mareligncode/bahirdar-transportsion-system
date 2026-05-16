import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const extractId = (item: any): string | null => {
  if (!item) return null;

  if (typeof item === 'string') return item;

  if (typeof item === 'object' && item !== null) {
    return item._id || null;
  }

  return null;
};

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

export const formatShortDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (date: Date | string): string => {
  if (!date) return 'N/A';
  return `${formatDate(date)} at ${formatTime(date)}`;
};

export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'ETB 0.00';
  return `ETB ${amount.toFixed(2)}`;
};

export const formatCurrencyRaw = (amount: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  return amount.toFixed(2);
};

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

export const getStatusColor = (status: string) => {
  console.warn('Deprecated: Use getBookingStatusColors from constants/colors instead');
  switch (status?.toLowerCase()) {
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

export const mapPaymentStatus = (status: string): 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded' | 'disputed' => {
  const statusMap: Record<string, 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded' | 'disputed'> = {
    'pending': 'pending',
    'processing': 'processing',
    'success': 'success',
    'paid': 'success',
    'completed': 'success',
    'failed': 'failed',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'disputed': 'disputed',
  };

  const normalizedStatus = status?.toLowerCase() || 'pending';
  return statusMap[normalizedStatus] || 'pending';
};

export const getPaymentStatusConfig = (status: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  borderColor: string;
} => {
  const configs: Record<string, any> = {
    pending: {
      label: 'Pending',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#fcd34d',
      icon: '⏳'
    },
    processing: {
      label: 'Processing',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      borderColor: '#93c5fd',
      icon: '🔄'
    },
    success: {
      label: 'Success',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#6ee7b7',
      icon: '✅'
    },
    paid: {
      label: 'Paid',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#6ee7b7',
      icon: '✅'
    },
    failed: {
      label: 'Failed',
      color: '#ef4444',
      bgColor: '#fee2e2',
      borderColor: '#fca5a5',
      icon: '❌'
    },
    cancelled: {
      label: 'Cancelled',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db',
      icon: '🚫'
    },
    refunded: {
      label: 'Refunded',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      borderColor: '#c4b5fd',
      icon: '↩️'
    },
    disputed: {
      label: 'Disputed',
      color: '#ec4899',
      bgColor: '#fce7f3',
      borderColor: '#f9a8d4',
      icon: '⚠️'
    }
  };

  return configs[status?.toLowerCase()] || {
    label: status || 'Unknown',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: '❓'
  };
};

export const isPaymentSuccessful = (status: string): boolean => {
  return ['success', 'paid'].includes(status?.toLowerCase());
};

export const isPaymentPending = (status: string): boolean => {
  return ['pending', 'processing'].includes(status?.toLowerCase());
};

export const isPaymentFailed = (status: string): boolean => {
  return ['failed', 'cancelled'].includes(status?.toLowerCase());
};

export const isPaymentRefunded = (status: string): boolean => {
  return status?.toLowerCase() === 'refunded';
};

export const isPaymentFinal = (status: string): boolean => {
  return ['success', 'failed', 'cancelled', 'refunded'].includes(status?.toLowerCase());
};

export const getPaymentMethodIcon = (method: string): string => {
  const icons: Record<string, string> = {
    'mobile_money': 'smartphone',
    'card': 'credit-card',
    'cash': 'wallet',
  };
  return icons[method] || 'credit-card';
};

export const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    'mobile_money': 'Mobile Money',
    'card': 'Card Payment',
    'cash': 'Pay at Station',
  };
  return methods[method] || method || 'Unknown';
};

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

export const formatBookingNumber = (id: string): string => {
  if (!id) return '#N/A';
  return `#${id.slice(-6).toUpperCase()}`;
};

export const formatTicketNumber = (ticketNumber: string): string => {
  if (!ticketNumber) return 'N/A';
  return ticketNumber;
};

export const formatSeats = (seats: string[]): string => {
  if (!seats || seats.length === 0) return 'No seats';
  if (seats.length === 1) return `Seat ${seats[0]}`;
  if (seats.length === 2) return `Seats ${seats.join(' & ')}`;
  return `Seats ${seats.join(', ')}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

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

export const calculateTotalPrice = (pricePerSeat: number, numberOfSeats: number, serviceFee: number = 20): number => {
  return (pricePerSeat * numberOfSeats) + serviceFee;
};

export const calculateServiceFee = (amount: number, percentage: number = 0.02): number => {
  return amount * percentage;
};

export const formatPaymentReference = (ref: string): string => {
  if (!ref) return 'N/A';
  if (ref.length <= 8) return ref;
  return `...${ref.slice(-8)}`;
};
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

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

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
export const safeJsonParse = <T,>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export const generateTxRef = (prefix: string = 'TXN'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${random}`;
};
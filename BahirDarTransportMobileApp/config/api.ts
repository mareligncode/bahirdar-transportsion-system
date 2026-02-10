const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:5000/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    
    // Profile management
    PROFILE: `${API_BASE_URL}/auth/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`, // PUT
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    DELETE_ACCOUNT: `${API_BASE_URL}/auth/delete-account`,
  },
  
  // Passenger-specific endpoints
  PASSENGER: {
    TRIPS: `${API_BASE_URL}/passenger/trips`,
    BOOKINGS: `${API_BASE_URL}/passenger/bookings`,
    PAYMENTS: `${API_BASE_URL}/passenger/payments`,
    TICKETS: `${API_BASE_URL}/passenger/tickets`,
    NOTIFICATIONS: `${API_BASE_URL}/passenger/notifications`,
    FAVORITES: `${API_BASE_URL}/passenger/favorites`,
  },
  
  // Trips and booking
  TRIPS: `${API_BASE_URL}/trips`,
  STATIONS: `${API_BASE_URL}/stations`,
  VEHICLES: `${API_BASE_URL}/vehicles`,
  BOOKINGS: `${API_BASE_URL}/bookings`,
  SEATS: `${API_BASE_URL}/seats`,
  
  // Payments
  PAYMENTS: `${API_BASE_URL}/payments`,
  WALLET: `${API_BASE_URL}/wallet`,
  
  // Support
  SUPPORT: `${API_BASE_URL}/support`,
  FEEDBACK: `${API_BASE_URL}/feedback`,
};

// API configuration
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds for mobile connections
  retryAttempts: 3,
  retryDelay: 1000,
};

// Simple function to get base URL (for axios config)
export const getPlatformBaseUrl = (): string => {
  return API_BASE_URL;
};

// Export constants for axios
export const TIMEOUT = API_CONFIG.timeout;
export const HEADERS = API_CONFIG.headers;
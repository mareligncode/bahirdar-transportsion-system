const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:5000/api';

// All authentication endpoints
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

// Helper functions for API calls
export const apiHelpers = {
  // Build query string from object
  buildQueryString: (params: Record<string, any>): string => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  },
  
  // Handle API errors
  handleError: async (response: Response): Promise<Error> => {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    return new Error(errorMessage);
  },
  
  // Get auth headers
  getAuthHeaders: async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // You might want to get token from storage here
    // const token = await storage.getToken();
    // if (token) {
    //   headers['Authorization'] = `Bearer ${token}`;
    // }
    
    return headers;
  },
};
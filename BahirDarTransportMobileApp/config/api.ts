import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Use your actual backend URL - replace with your server IP/domain
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:5000/api';

console.log('🌐 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds for mobile connections
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        baseURL: config.baseURL,
      });
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Token attached to request');
      } else {
        console.log('⚠️ No token found');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    
    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔑 Token expired, attempting refresh...');
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await api.post('/auth/refresh-token', {
            refreshToken,
          });
          
          if (response.data.success) {
            const { token, refreshToken: newRefreshToken } = response.data.data;
            
            await AsyncStorage.setItem('auth_token', token);
            await AsyncStorage.setItem('refresh_token', newRefreshToken);
            
            originalRequest.headers.Authorization = `Bearer ${token}`;
            
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await clearAuthData();
        router.replace('/auth/login');
      }
    }
    
    // Handle 404 specifically
    if (error.response?.status === 404) {
      console.error('❌ 404 - Endpoint not found:', {
        endpoint: error.config?.url,
        suggestion: 'Check backend routes or API configuration',
      });
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - Check if backend is running');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to clear auth data
export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_data');
    console.log('🗑️ Auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Helper function to test API connection
export const testApiConnection = async () => {
  try {
    console.log('🔍 Testing API connection to:', API_BASE_URL);
    const response = await api.get('/health', { timeout: 5000 });
    console.log('✅ API Connection successful:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ API Connection failed:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
    });
    
    // Try a different endpoint if health doesn't exist
    try {
      const testResponse = await api.get('/trips', { 
        params: { limit: 1 },
        timeout: 5000 
      });
      console.log('✅ Alternative endpoint test successful');
      return true;
    } catch (secondError) {
      console.error('❌ All connection tests failed');
      return false;
    }
  }
};

export { api };

// Keep your existing exports (reusing the same API_BASE_URL)
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
  
   TRIPS: {
    BASE: '/trips',
    SEARCH: '/trips/search',
    BY_ID: (id: string) => `/trips/${id}`,
    DRIVER_TRIPS: '/trips/driver/assigned',
    UPDATE_STATUS: (id: string) => `/trips/${id}/status`,
    TOGGLE_ACTIVE: (id: string) => `/trips/${id}/toggle-active`,
  },
  
  // Bookings
  BOOKINGS: {
    BASE: '/bookings',
    MY_BOOKINGS: '/bookings/my-bookings',
    BY_ID: (id: string) => `/bookings/${id}`,
  },
  
  // Stations
  STATIONS: {
    BASE: '/stations',
    BY_ID: (id: string) => `/stations/${id}`,
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/payments',
    INITIATE: '/payments/initiate',
    VERIFY: '/payments/verify',
    HISTORY: '/payments/history',
  },
  
  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD: '/notifications/unread',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
};

// Helper function to build full URL
export const getFullUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export for backward compatibility
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
};

export const TIMEOUT = API_CONFIG.timeout;
export const HEADERS = API_CONFIG.headers;
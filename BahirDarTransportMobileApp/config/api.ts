import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, 
});

// Track refresh state
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`);
      
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh for auth endpoints (prevent infinite loop)
    if (originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    // Check if we have a refresh token
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    
    // If no refresh token, clear auth and redirect
    if (!refreshToken) {
      console.log('🔑 No refresh token available');
      await clearAuthData();
      router.replace('/auth/Login');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log('🔄 Attempting to refresh token...');
      
      // IMPORTANT: Use direct axios instance without interceptor
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data?.success && response.data?.data?.token) {
        const newToken = response.data.data.token;
        const newRefreshToken = response.data.data.refreshToken || refreshToken;
        
        await AsyncStorage.setItem('auth_token', newToken);
        await AsyncStorage.setItem('refresh_token', newRefreshToken);
        
        console.log('✅ Token refreshed successfully');
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process queued requests
        processQueue(null, newToken);
        
        // Retry original request
        return api(originalRequest);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      
      await clearAuthData();
      processQueue(refreshError, null);
      
      // Only redirect for user-initiated actions
      if (!originalRequest.url?.includes('/station/active') && 
          !originalRequest.url?.includes('/trip')) {
        Alert.alert(
          'Session Expired',
          'Please login again',
          [{ text: 'OK', onPress: () => router.replace('/auth/Login') }]
        );
      } else {
        router.replace('/auth/Login');
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

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

export { api };

export const API_ENDPOINTS = {

  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    VALIDATE_RESET_TOKEN: `${API_BASE_URL}/auth/validate-reset-token`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    
    
    PROFILE: `${API_BASE_URL}/auth/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`, 
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    DELETE_ACCOUNT: `${API_BASE_URL}/auth/delete-account`,
  },
  
  PASSENGER: {
    TRIPS: `${API_BASE_URL}/passenger/trips`,
    BOOKINGS: `${API_BASE_URL}/passenger/bookings`,
    PAYMENTS: `${API_BASE_URL}/passenger/payments`,
    TICKETS: `${API_BASE_URL}/passenger/tickets`,
    NOTIFICATIONS: `${API_BASE_URL}/passenger/notifications`,
    FAVORITES: `${API_BASE_URL}/passenger/favorites`,
  },
  
   TRIPS: {
    BASE: '/trip', 
    SEARCH: '/trip/search',
    BY_ID: (id: string) => `/trip/${id}`,
  },
  
  BOOKINGS: {
    BASE: '/booking',
     CREATE: '/booking/', 
    MY_BOOKINGS: '/booking/my-bookings', 
    BY_ID: (id: string) => `/booking/${id}`, 
    UPDATE: (id: string) => `/booking/${id}`,
    DELETE: (id: string) => `/booking/${id}`, 
  },
  
  
  STATIONS: {
    BASE: '/station',
     ACTIVE: '/station/active',
    BY_ID: (id: string) => `/station/${id}`,
  },
   
  
  VEHICLES: {
    BY_ID: (id: string) => `/vehicles/${id}`,
    GET_IMAGES: (vehicleId: string) => `/vehicles/${vehicleId}/images`,
    GET_WITH_IMAGES: (id: string) => `/vehicles/${id}/images-details`,
  },

  PAYMENTS: {
    BASE: '/payment',
    INITIATE: '/payment/initiate',
    VERIFY: '/payment/verify',
    HISTORY: '/payment/history',
    BY_ID: (id: string) => `/payment/${id}`, 
  },
  

  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD: '/notifications/unread',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
   
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile', 
    CHANGE_PASSWORD: '/user/change-password', 
  }
};


export const getFullUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};


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

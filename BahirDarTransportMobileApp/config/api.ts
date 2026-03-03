// config/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { Platform } from 'react-native';

export const getPlatformBaseUrl = (): string => {
  let url = '';
  if (process.env.EXPO_PUBLIC_API_URL) {
    url = process.env.EXPO_PUBLIC_API_URL;
  } else {
    // Use your actual backend IP address
    url = 'http://10.161.142.191:5000/api';
  }
  return url;
};

export const API_BASE_URL = getPlatformBaseUrl(); // Make sure this is exported

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

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

api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`➡️ ${config.method?.toUpperCase()} ${config.url}`);

      if (config.method?.toUpperCase() === 'DELETE') {
        console.log('🗑️ DELETE request triggered from:', new Error().stack);
      }

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

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    const refreshToken = await AsyncStorage.getItem('refresh_token');

    if (!refreshToken) {
      console.log('🔑 No refresh token available');
      await clearAuthData();
      router.replace('/auth/Login');
      return Promise.reject(error);
    }

    if (isRefreshing) {
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

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return api(originalRequest);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);

      await clearAuthData();
      processQueue(refreshError, null);

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
    REGISTER: `/auth/register`,
    LOGIN: `/auth/login`,
    LOGOUT: `/auth/logout`,
    REFRESH_TOKEN: `/auth/refresh-token`,
    FORGOT_PASSWORD: `/auth/forgot-password`,
    VALIDATE_RESET_TOKEN: `/auth/validate-reset-token`,
    RESET_PASSWORD: `/auth/reset-password`,
    VERIFY_EMAIL: `/auth/verify-email`,
    PROFILE: `/auth/profile`,
    UPDATE_PROFILE: `/auth/profile`,
    CHANGE_PASSWORD: `/auth/change-password`,
    DELETE_ACCOUNT: `/auth/delete-account`,
  },

  PASSENGER: {
    TRIPS: `/passenger/trips`,
    BOOKINGS: `/passenger/bookings`,
    PAYMENTS: `/passenger/payments`,
    TICKETS: `/passenger/tickets`,
    NOTIFICATIONS: `/passenger/notifications`,
    FAVORITES: `/passenger/favorites`,
  },

  TRIPS: {
    BASE: '/trip',
    SEARCH: '/trip/search',
    BY_ID: (id: string) => `/trip/${id}`,
  },

  BOOKINGS: {
    BASE: '/booking',
    CREATE: '/booking/',
    BATCH: '/booking/batch',
    MY_BOOKINGS: '/booking/my-bookings',
    TRIP_BOOKINGS: (tripId: string) => `/booking/trip/${tripId}`,
    BOOKED_SEATS: (tripId: string) => `/booking/trip/${tripId}/booked-seats`,
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
    WEBHOOK: '/payment/webhook',
    VERIFY: (txRef: string) => `/payment/verify/${txRef}`,
    INITIALIZE: '/payment/initialize',
    STATUS: '/payment/status',
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
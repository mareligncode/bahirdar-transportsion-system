// lib/api/index.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getPlatformBaseUrl, api as apiClient } from '../../config/api';

// Re-export the apiClient
export { apiClient };

// Helper function for consistent API requests
export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<{ data: T; status: number; headers: any }> => {
  try {
    const response: AxiosResponse<T> = await apiClient(config);
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error: any) {
    console.error('API request failed:', error.message);
    throw error;
  }
};

// Generic HTTP methods with error handling
export const get = async <T>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiRequest<T>({
    method: 'GET',
    url,
    params,
    ...config,
  });
  return response.data;
};

export const post = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiRequest<T>({
    method: 'POST',
    url,
    data,
    ...config,
  });
  return response.data;
};

export const put = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiRequest<T>({
    method: 'PUT',
    url,
    data,
    ...config,
  });
  return response.data;
};

export const patch = async <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiRequest<T>({
    method: 'PATCH',
    url,
    data,
    ...config,
  });
  return response.data;
};

export const del = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiRequest<T>({
    method: 'DELETE',
    url,
    ...config,
  });
  return response.data;
};

// Export all API modules
export * from './auth';
export * from './trips';
export * from './bookings';
export * from './payments';
export * from './user';
export * from './notification';

// Utility functions
export const handleApiError = (error: any): {
  message: string;
  status?: number;
  code?: string
} => {
  if (error.response) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;

    switch (status) {
      case 400:
        return {
          message: serverMessage || 'Bad request. Please check your input.',
          status
        };
      case 401:
        return {
          message: 'Your session has expired. Please login again.',
          status
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          status
        };
      case 404:
        return {
          message: serverMessage || 'The requested resource was not found.',
          status
        };
      case 422:
        return {
          message: serverMessage || 'Validation error. Please check your input.',
          status
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          status
        };
      case 500:
        return {
          message: 'Internal server error. Please try again later.',
          status
        };
      case 503:
        return {
          message: 'Service temporarily unavailable. Please try again later.',
          status
        };
      default:
        return {
          message: serverMessage || `An error occurred (${status})`,
          status
        };
    }
  } else if (error.request) {
    return {
      message: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR'
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred.'
    };
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Test API connection
export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  latency?: number;
  url?: string;
}> => {
  const startTime = Date.now();
  const baseURL = getPlatformBaseUrl();
  const url = `${baseURL}/health`;

  try {
    const response = await apiClient.get('/health', {
      timeout: 5000,
    });

    const latency = Date.now() - startTime;

    return {
      success: response.status === 200,
      message: response.data?.message || 'API is reachable',
      latency,
      url,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to connect to API',
      url,
    };
  }
};

export default apiClient;
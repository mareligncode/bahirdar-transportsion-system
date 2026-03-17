import AsyncStorage from '@react-native-async-storage/async-storage';
import { api as apiClient, API_ENDPOINTS, getPlatformBaseUrl } from '../../config/api';

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
    // Use the apiClient (axios instance) instead of fetch
    const response = await apiClient.get('/health', {
      timeout: 5000,
    });

    const latency = Date.now() - startTime;

    return {
      success: response.status === 200,
      message: 'API is reachable',
      latency,
      url,
    };
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Request timed out. Please check your internet connection.',
        url,
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to connect to API',
      url,
    };
  }
};

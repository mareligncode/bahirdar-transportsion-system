// BahirDarTransportMobileApp/lib/api/index.ts
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse,
  InternalAxiosRequestConfig 
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getPlatformBaseUrl } from '../../config/api';

// Create axios instance with platform-specific URL
const apiClient: AxiosInstance = axios.create({
  baseURL: getPlatformBaseUrl(),
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Log request for debugging
    if (__DEV__) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        data: config.data,
      });
    }
    
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    // Log error details
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code,
    });
    
    // Special handling for connection errors
    if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to server. Please check:');
      console.error('1. Is the server running on port 5000?');
      console.error('2. Run: npm run dev in your backend folder');
      console.error('3. Check if port 5000 is not blocked');
    }
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401) {
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          // Call refresh token endpoint
          const refreshResponse = await axios.post(
            `${getPlatformBaseUrl()}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
          
          // Store new tokens
          await AsyncStorage.setItem('auth_token', accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refresh_token', newRefreshToken);
          }
          
          // Retry original request with new token
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(error.config);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
        // Dispatch logout action if you have one
      }
    }
    
    return Promise.reject(error);
  }
);

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

// Export the API client
export { apiClient };

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
  latency?: number 
}> => {
  const startTime = Date.now();
  
  try {
    const response = await apiClient.get('/health', {
      timeout: 5000,
    });
    
    const latency = Date.now() - startTime;
    
    return {
      success: response.status === 200,
      message: response.data?.message || 'API is reachable',
      latency,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to connect to API',
    };
  }
};

export default apiClient;
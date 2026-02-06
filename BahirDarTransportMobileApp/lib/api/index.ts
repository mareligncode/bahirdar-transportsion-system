// lib/api/index.ts - UPDATED FOR PORT 5000
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse,
  InternalAxiosRequestConfig 
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getPlatformBaseUrl } from '@/config/api';
import { AuthTokens } from '@/types/auth';

// Create axios instance with platform-specific URL
const apiClient: AxiosInstance = axios.create({
  baseURL: getPlatformBaseUrl(), // This now returns port 5000
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Log request
    console.log('📤 API Request to:', `${config.baseURL}${config.url}`);
    
    try {
      const token = await AsyncStorage.getItem('token');
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
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      baseURL: error.config?.baseURL,
    });
    
    // Special handling for connection errors
    if (error.code === 'ECONNREFUSED') {
      const errorMsg = `Cannot connect to server at ${error.config?.baseURL}. Please check:`;
      console.error(errorMsg);
      console.error('1. Is the server running on port 5000?');
      console.error('2. Run: npm run dev in your backend folder');
      console.error('3. Check if port 5000 is not blocked');
    }
    
    return Promise.reject(error);
  }
);

export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<{ data: T; status: number }> => {
  try {
    const response: AxiosResponse<T> = await apiClient(config);
    return {
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    console.error('API request failed:', error.message);
    throw error;
  }
};

// Test specific endpoints
export const testEndpoints = async () => {
  const tests = [];
  
  try {
    // Test 1: Health endpoint
    const healthRes = await fetch(`${getPlatformBaseUrl().replace('/api', '')}/health`);
    tests.push({
      name: 'Health Check',
      url: '/health',
      success: healthRes.ok,
      status: healthRes.status,
    });
    
    // Test 2: Auth test endpoint
    const authRes = await apiClient.get('/auth/test');
    tests.push({
      name: 'Auth Test',
      url: '/auth/test',
      success: true,
      status: authRes.status,
    });
    
    // Test 3: Test registration endpoint
    const testData = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      phone: "+251912345678",
      password: "Test@1234",
      confirmPassword: "Test@1234",
      termsAccepted: true
    };
    
    const registerRes = await apiClient.post('/auth/register', testData);
    tests.push({
      name: 'Register Endpoint',
      url: '/auth/register',
      success: registerRes.status === 201 || registerRes.status === 200,
      status: registerRes.status,
    });
    
    return { success: true, tests };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      tests 
    };
  }
};

export default apiClient;
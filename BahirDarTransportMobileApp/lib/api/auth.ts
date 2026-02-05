// BahirDarTransportMobileApp\lib\api\auth.ts - FIXED VERSION
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';
import { storage } from '../storage';
import { 
  LoginCredentials, 
  RegisterFormData, 
  AuthResponse,
  User
} from '../../types/auth';

export const authAPI = {
  async register(userData: RegisterFormData): Promise<AuthResponse> {
    try {
      // ✅ FIXED: Define payload with proper type
      const payload: Record<string, any> = {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName, // Backend expects fullName
        phoneNumber: userData.phoneNumber, // Backend expects phoneNumber
        role: 'passenger',
        emergencyContact: userData.emergencyContact,
      };
      
      console.log('📱 Registering passenger (CORRECT FORMAT):', payload);

      // ✅ FIXED: Define response with proper type
      const response: Response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔴 Registration error:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      // ✅ FIXED: Define data with proper type
      const data: any = await response.json();
      console.log('🟢 Registration successful:', data);
      
      // Create proper AuthResponse
      const authResponse: AuthResponse = {
        success: true,
        message: data.message || 'Registration successful',
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        user: data.user || data,
        token: data.accessToken || data.token,
        expiresIn: data.expiresIn,
      };
      
      // Store tokens
      if (authResponse.accessToken) {
        await storage.storeToken(authResponse.accessToken);
      }
      
      if (authResponse.refreshToken) {
        await storage.storeRefreshToken(authResponse.refreshToken);
      }
      
      if (authResponse.user) {
        await storage.storeUser(authResponse.user);
      }
      
      return authResponse;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('📱 Logging in:', credentials.email);

      const response: Response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data: any = await response.json();
      
      const authResponse: AuthResponse = {
        success: true,
        message: data.message || 'Login successful',
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        user: data.user || data,
        token: data.accessToken || data.token,
        expiresIn: data.expiresIn,
      };
      
      // Store tokens
      if (authResponse.accessToken) {
        await storage.storeToken(authResponse.accessToken);
      }
      
      if (authResponse.refreshToken) {
        await storage.storeRefreshToken(authResponse.refreshToken);
      }
      
      if (authResponse.user) {
        await storage.storeUser(authResponse.user);
      }
      
      return authResponse;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: Response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      const data: any = await response.json();
      return { success: true, message: data.message || 'Reset email sent' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send reset email' };
    }
  },

  async logout(): Promise<void> {
    try {
      const token = await storage.getToken();
      
      if (token) {
        await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          headers: {
            ...API_CONFIG.headers,
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await storage.clearAll();
    }
  },

  async getProfile(): Promise<User> {
    try {
      const token = await storage.getToken();
      
      if (!token) {
        throw new Error('No authentication token');
      }

      const response: Response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'GET',
        headers: {
          ...API_CONFIG.headers,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const user: User = await response.json();
      await storage.storeUser(user);
      
      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async refreshAccessToken(): Promise<{ accessToken: string }> {
    try {
      const refreshToken = await storage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: Response = await fetch(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data: any = await response.json();
      await storage.storeToken(data.accessToken);
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
};
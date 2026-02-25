// BahirDarTransportMobileApp\lib\api\auth.ts - REAL API VERSION
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
      // Define payload with proper type
      const payload: Record<string, any> = {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName, // Backend expects fullName
        phoneNumber: userData.phoneNumber, // Backend expects phoneNumber
        role: 'passenger',
        emergencyContact: userData.emergencyContact,
      };
      
      console.log('📱 Registering passenger:', payload);

      // Define response with proper type
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

      // Define data with proper type
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
      
      // Store tokens using storage utility
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
    console.log('🌐 Endpoint:', API_ENDPOINTS.AUTH.LOGIN);

    const response: Response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      }),
    });

    console.log('📥 Response status:', response.status);
    
    const data: any = await response.json();
    console.log('📊 Response data:', data);
    
    if (!response.ok) {
      // Ensure error has success: false
      throw new Error(data.message || data.error || 'Login failed');
    }

    // Ensure response matches AuthResponse interface
    const authResponse: AuthResponse = {
      success: true, // CRITICAL: Must have success property
      message: data.message || 'Login successful',
      accessToken: data.data?.tokens?.accessToken || data.accessToken || data.token,
      refreshToken: data.data?.tokens?.refreshToken || data.refreshToken,
      user: data.data?.user || data.user || data, // Backend might return user data directly
      token: data.data?.tokens?.accessToken || data.accessToken || data.token,
      expiresIn: data.expiresIn,
    };
    
    console.log('🟢 Auth response created:', authResponse);
    
    // Store tokens using storage utility
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
  } catch (error: any) {
    console.error('❌ Login error:', error);
    // Return error with success: false
    throw new Error(error.message || 'Login failed');
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

  // Validate reset token
  async validateResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    try {
      console.log('🔍 Validating reset token');
      
      const response: Response = await fetch(API_ENDPOINTS.AUTH.VALIDATE_RESET_TOKEN, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid reset token');
      }

      const data: any = await response.json();
      console.log('✅ Reset token validated:', data);
      
      return { valid: true, message: data.message };
    } catch (error: any) {
      console.error('❌ Validate token error:', error);
      return { valid: false, message: error.message || 'Invalid reset token' };
    }
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Resetting password');
      
      const response: Response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ 
          token, 
          password: newPassword 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const data: any = await response.json();
      console.log('✅ Password reset successful:', data);
      
      return { success: true, message: data.message || 'Password reset successful' };
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  },
};


import { API_ENDPOINTS, API_CONFIG, getFullUrl, api } from '../../config/api';
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
      const payload: Record<string, any> = {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        role: 'passenger',
        emergencyContact: userData.emergencyContact,
      };

      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const data: any = await response.json();

      const authResponse: AuthResponse = {
        success: true,
        message: data.message || 'Registration successful',
        accessToken: data.data?.tokens?.accessToken || data.accessToken || data.token,
        refreshToken: data.data?.tokens?.refreshToken || data.refreshToken,
        user: data.data?.user || data.user || data,
        token: data.data?.tokens?.accessToken || data.accessToken || data.token,
        expiresIn: data.expiresIn,
      };

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
      throw error;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      const authResponse: AuthResponse = {
        success: true,
        message: data.message || 'Login successful',
        accessToken: data.data?.tokens?.accessToken || data.accessToken || data.token,
        refreshToken: data.data?.tokens?.refreshToken || data.refreshToken,
        user: data.data?.user || data.user || data,
        token: data.data?.tokens?.accessToken || data.accessToken || data.token,
        expiresIn: data.expiresIn,
      };

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
      throw new Error(error.message || 'Login failed');
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD_MOBILE), {
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
        await fetch(getFullUrl(API_ENDPOINTS.AUTH.LOGOUT), {
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
      const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
      const data = response.data;
      const user: User = data.data?.user || data.user || data;
      await storage.storeUser(user);

      return user;
    } catch (error) {
      throw error;
    }
  },

  async refreshAccessToken(): Promise<{ accessToken: string }> {
    try {
      const refreshToken = await storage.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
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

  async validateResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.VALIDATE_RESET_TOKEN), {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid reset token');
      }

      const data: any = await response.json();
      return { valid: true, message: data.message };
    } catch (error: any) {
      return { valid: false, message: error.message || 'Invalid reset token' };
    }
  },
  async verifyResetCode(email: string, code: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.VERIFY_RESET_CODE), {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid verification code');
      }

      const data: any = await response.json();

      return { valid: true, message: data.message };
    } catch (error: any) {
      return { valid: false, message: error.message || 'Invalid verification code' };
    }
  },
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD_MOBILE), {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({
          email,
          code,
          newPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const data: any = await response.json();
      return { success: true, message: data.message || 'Password reset successful' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to reset password' };
    }
  },
  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const token = await storage.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }
      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.UPDATE_PROFILE), {
        method: 'PUT',
        headers: {
          ...API_CONFIG.headers,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data: any = await response.json();

      if (data.user) {
        await storage.storeUser(data.user);
      }

      return { success: true, message: data.message || 'Profile updated successfully', user: data.user };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update profile' };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const token = await storage.getToken();

      if (!token) {
        throw new Error('No authentication token');
      }

      const response: Response = await fetch(getFullUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'PUT',
        headers: {
          ...API_CONFIG.headers,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return { success: true, message: data.message || 'Password changed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to change password' };
    }
  },
};
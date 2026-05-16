import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, LoginCredentials, RegisterFormData } from '../types/auth';
import { authAPI } from '../lib/api/auth';
import { storage } from '../lib/storage';
import { API_ENDPOINTS, API_BASE_URL } from '@/config/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isRegistering: boolean;
  isLoggingIn: boolean;

  login: (credentials: LoginCredentials) => Promise<{
    success: boolean;
    message: string;
    user?: User;
    token?: string;
  }>;
  register: (data: RegisterFormData) => Promise<{
    success: boolean;
    message: string;
    user?: User;
    token?: string;
  }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  isRegistering: false,
  isLoggingIn: false,
};

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    ...initialState,

    initializeAuth: async () => {
      try {
        const token = await storage.getToken();
        const user = await storage.getUser();

        console.log('🔄 AuthStore: Initializing auth', {
          hasToken: !!token,
          hasUser: !!user,
        });

        if (token && user) {
          console.log('🔄 AuthStore: Both token and user exist, refreshing user data...');
          try {
            const profile = await authAPI.getProfile();
            set({
              user: profile,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (profileError) {
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: 'Failed to refresh user data, using cached data',
            });
          }
        } else if (token && !user) {
          console.log('🔄 AuthStore: Token exists but no user data, fetching profile...');
          try {
            const profile = await authAPI.getProfile();
            set({
              user: profile,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (profileError) {
            await storage.clearAll();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Failed to load user data',
            });
          }
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication initialization failed'
        });
      }
    },

    login: async (credentials) => {
      set({ isLoggingIn: true, error: null });
      try {
        const response = await authAPI.login(credentials);

        if (!response.success) {
          throw new Error(response.message || 'Login failed');
        }

        set({
          user: response.user || null,
          token: response.accessToken || null,
          isAuthenticated: true,
          isLoggingIn: false,
          error: null,
        });

        return {
          success: true,
          message: response.message || 'Login successful!',
          user: response.user,
          token: response.accessToken
        };
      } catch (error: any) {
        const message = error.message || 'Login failed';
        set({ error: message, isLoggingIn: false });
        return { success: false, message };
      }
    },

    register: async (data) => {
      set({ isRegistering: true, error: null });
      try {
        const response = await authAPI.register(data);

        if (!response.success) {
          throw new Error(response.message || 'Registration failed');
        }

        set({
          user: response.user || null,
          token: response.accessToken || null,
          isAuthenticated: true,
          isRegistering: false,
          error: null,
        });

        return {
          success: true,
          message: response.message || 'Registration successful!',
          user: response.user,
          token: response.accessToken
        };
      } catch (error: any) {
        const message = error.message || 'Registration failed';
        set({ error: message, isRegistering: false });
        return { success: false, message };
      }
    },

    logout: async () => {
      try {
        await authAPI.logout?.();
      } catch (e) {
      } finally {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isRegistering: false,
          isLoggingIn: false,
          isLoading: false,
        });
      }
    },

    forgotPassword: async (email: string) => {
      set({ error: null });
      try {
        const result = await authAPI.forgotPassword(email);
        return { success: true, message: result.message || 'Reset email sent' };
      } catch (error: any) {
        const message = error.message || 'Failed to send reset email';
        set({ error: message });
        return { success: false, message };
      }
    },

    updateUser: async (userData: Partial<User>) => {
      set({ error: null });
      try {
        const currentUser = get().user;
        if (!currentUser) throw new Error('No user found');

        const optimisticUser = { ...currentUser, ...userData };
        set({ user: optimisticUser });

        const response = await authAPI.updateProfile(userData);

        if (!response.success) {
          set({ user: currentUser, error: response.message || 'Update failed' });
          throw new Error(response.message || 'Update failed');
        }

        if (response.user) {
          set({ user: response.user });
        }

      } catch (error: any) {
        set({ error: error.message || 'Update failed' });
        throw error;
      }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      set({ error: null });
      try {
        const token = get().token;
        if (!token) throw new Error('No authentication token');
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
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


        return {
          success: true,
          message: data.message || 'Password changed successfully'
        };
      } catch (error: any) {
        set({ error: error.message });
        return { success: false, message: error.message };
      }
    },

    clearError: () => set({ error: null }),

    setLoading: (loading) => set({ isLoading: loading }),
  })
);
export const useUser = () => useAuthStore((s) => s.user);
export const useToken = () => useAuthStore((s) => s.token);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
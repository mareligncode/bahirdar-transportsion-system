// store/authStore.ts - FIXED
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, LoginCredentials, RegisterFormData } from '../types/auth';
import { authAPI } from '../lib/api/auth';
import { storage } from '@/lib/storage'; // ADD THIS IMPORT

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
  persist(
    (set, get) => ({
      ...initialState,

      initializeAuth: async () => {
        try {
          console.log('🔄 AuthStore: Initializing auth from storage...');
          // Use storage utility instead of AsyncStorage directly
          const token = await storage.getToken(); // FIXED: uses 'access_token'
          const user = await storage.getUser(); // FIXED: uses 'user_data'
          
          console.log('🔍 AuthStore: Loaded from storage:', {
            hasToken: !!token,
            hasUser: !!user
          });

          set({
            user,
            token,
            isAuthenticated: !!token && !!user,
            isLoading: false,
          });
        } catch (error) {
          console.error('❌ AuthStore: Failed to initialize auth:', error);
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      login: async (credentials) => {
        set({ isLoggingIn: true, error: null });
        try {
          console.log('🔄 AuthStore: Login attempt for:', credentials.email);
          const response = await authAPI.login(credentials);

          console.log('✅ AuthStore: API response:', {
            success: response.success,
            hasToken: !!response.accessToken,
            hasUser: !!response.user
          });
          
          if (!response.success) {
            throw new Error(response.message || 'Login failed');
          }

          // Use storage utility consistently
          if (response.accessToken) {
            await storage.storeToken(response.accessToken); // FIXED
          }
          if (response.refreshToken) {
            await storage.storeRefreshToken(response.refreshToken); // FIXED
          }
          if (response.user) {
            await storage.storeUser(response.user); // FIXED
          }

          set({
            user: response.user || null,
            token: response.accessToken || null,
            isAuthenticated: true,
            isLoggingIn: false,
            error: null,
          });

          console.log('🎉 AuthStore: Login successful, state updated');

          return { 
            success: true, 
            message: response.message || 'Login successful!', 
            user: response.user, 
            token: response.accessToken 
          };
        } catch (error: any) {
          const message = error.message || 'Login failed';
          console.error('❌ AuthStore: Login error:', message);
          set({ error: message, isLoggingIn: false });
          return { success: false, message };
        }
      },

      register: async (data) => {
        set({ isRegistering: true, error: null });
        try {
          console.log('🔄 AuthStore: Register attempt for:', data.email);
          const response = await authAPI.register(data);

          console.log('✅ AuthStore: API response:', {
            success: response.success,
            hasToken: !!response.accessToken,
            hasUser: !!response.user
          });

          if (!response.success) {
            throw new Error(response.message || 'Registration failed');
          }

          // Use storage utility consistently
          if (response.accessToken) {
            await storage.storeToken(response.accessToken); // FIXED
          }
          if (response.refreshToken) {
            await storage.storeRefreshToken(response.refreshToken); // FIXED
          }
          if (response.user) {
            await storage.storeUser(response.user); // FIXED
          }

          set({
            user: response.user || null,
            token: response.accessToken || null,
            isAuthenticated: true,
            isRegistering: false,
            error: null,
          });

          console.log('🎉 AuthStore: Register successful, state updated');

          return { 
            success: true, 
            message: response.message || 'Registration successful!', 
            user: response.user, 
            token: response.accessToken 
          };
        } catch (error: any) {
          const message = error.message || 'Registration failed';
          console.error('❌ AuthStore: Register error:', message);
          set({ error: message, isRegistering: false });
          return { success: false, message };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout?.();
        } catch (e) {
          console.error('Logout API error:', e);
        } finally {
          // Use storage utility
          await storage.removeTokens(); // FIXED
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            error: null, 
            isRegistering: false, 
            isLoggingIn: false 
          });
          console.log('🚪 AuthStore: Logout complete');
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
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;
          if (!currentUser) throw new Error('No user found');
          const updatedUser = { ...currentUser, ...userData };
          
          // Use storage utility
          await storage.storeUser(updatedUser); // FIXED
          
          set({ user: updatedUser, isLoading: false });
        } catch (error: any) {
          set({ error: error.message || 'Update failed', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Selectors remain the same
export const useUser = () => useAuthStore((s) => s.user);
export const useToken = () => useAuthStore((s) => s.token);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
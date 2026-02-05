import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { authAPI } from '../lib/api/auth';
import { storage } from '../lib/storage';
import { 
  LoginCredentials, 
  RegisterFormData, 
  AuthMutationResult,
  ApiResponse,
  User
} from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();
        
        console.log('🔍 Auth initialization:', {
          hasToken: !!storedToken,
          hasUser: !!storedUser
        });
        
        if (storedToken && storedUser) {
          setTokenState(storedToken);
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Helper to update token in both state and storage
  const updateToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await storage.storeToken(newToken); // storeToken not setToken
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthMutationResult> => {
    setIsLoggingIn(true);
    setError(null);

    try {
      console.log('🔑 Logging in user:', credentials.email);
      
      const response = await authAPI.login(credentials);
      
      console.log('✅ Login successful:', {
        userEmail: response.user?.email,
        hasToken: !!response.accessToken
      });
      
      // Update state
      setUser(response.user);
      await updateToken(response.accessToken);
      
      // Navigate
      setTimeout(() => {
        router.replace('/(main)/home');
      }, 500);
      
      return {
        success: true,
        message: 'Login successful!',
        user: response.user,
        token: response.accessToken
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (data: RegisterFormData): Promise<AuthMutationResult> => {
    setIsRegistering(true);
    setError(null);

    console.log('📝 Registration attempt:', {
      email: data.email,
      name: data.fullName,
      phone: data.phoneNumber
    });

    try {
      const response = await authAPI.register(data);
      
      console.log('✅ Registration successful:', {
        userEmail: response.user?.email,
        hasToken: !!response.accessToken
      });
      
      // Update state
      setUser(response.user);
      await updateToken(response.accessToken);
      
      // Navigate
      setTimeout(() => {
        router.replace('/(main)/home');
      }, 500);
      
      return {
        success: true,
        message: 'Account created successfully!',
        user: response.user,
        token: response.accessToken
      };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Make error messages more user-friendly
      if (errorMessage.includes('validation failed')) {
        errorMessage = 'Please check your information and try again.';
      } else if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please login instead.';
      }
      
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    } finally {
      setIsRegistering(false);
    }
  };

  const forgotPassword = async (email: string): Promise<ApiResponse> => {
    try {
      const result = await authAPI.forgotPassword(email);
      return { success: true, message: result.message || 'Reset email sent successfully' };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset email';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      setTokenState(null);
      setError(null);
      setTimeout(() => {
        router.replace('/auth/Login');
      }, 300);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser();
      return !!(token && user);
    } catch {
      return false;
    }
  };

  return {
    // State
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    error,
    
    // Actions
    register,
    login,
    logout,
    forgotPassword,
    checkAuthStatus,
    clearError,
    
    // Mutation status
    isRegistering,
    isLoggingIn,
  };
};
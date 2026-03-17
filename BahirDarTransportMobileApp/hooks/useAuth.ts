// hooks/useAuth.ts - COMPLETE FIXED VERSION
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/api/auth';

export const useAuth = () => {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    user,
    token,
    isLoading: storeLoading,
    isAuthenticated,
    error,
    isRegistering,
    isLoggingIn,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    updateUser,
    changePassword: storeChangePassword,
    clearError,
    initializeAuth,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      await initializeAuth();
      setIsInitializing(false);
    };

    initialize();
  }, []);

  const login = async (credentials: any) => {
    console.log('🔑 useAuth: Login called');
    return await storeLogin(credentials);
  };

  const register = async (data: any) => {
    console.log('📝 useAuth: Register called');
    return await storeRegister(data);
  };

  const logout = async () => {
    console.log('🚪 useAuth: Logout called');
    await storeLogout();
    router.replace('/');
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    return Boolean(isAuthenticated);
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    console.log('🔐 useAuth: Forgot password called for:', email);

    try {
      const result = await authAPI.forgotPassword(email);
      return result;
    } catch (error: any) {
      console.error('🔐 useAuth: Forgot password error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send reset email'
      };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    console.log('🔐 useAuth: Change password called');
    return await storeChangePassword(currentPassword, newPassword);
  };

  return {
    user,
    token,
    isLoading: storeLoading || isInitializing,
    isAuthenticated: Boolean(isAuthenticated),
    error,
    isRegistering,
    isLoggingIn,
    login,
    register,
    logout,
    forgotPassword,
    updateUser,
    changePassword,
    clearError,
    checkAuthStatus,
    setLoading,
  };
};
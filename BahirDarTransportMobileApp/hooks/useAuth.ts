// hooks/useAuth.ts - FIXED
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    forgotPassword,
    updateUser,
    clearError,
    initializeAuth,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      console.log('🔐 useAuth: Initializing...');
      await initializeAuth();
      setIsInitializing(false);
      console.log('🔐 useAuth: Initialization complete', {
        isAuthenticated,
        userEmail: user?.email,
        hasToken: !!token
      });
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
    router.replace('/auth/Login');
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    return Boolean(isAuthenticated);
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
    clearError,
    checkAuthStatus,
    setLoading,
  };
};
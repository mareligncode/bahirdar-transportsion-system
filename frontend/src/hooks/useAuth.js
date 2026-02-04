import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service'; // We'll create this service

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const userData = await authService.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      
      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      return { success: true };
    } catch (error) {
      logout();
      return { success: false };
    }
  }, [logout]);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken
  };
};
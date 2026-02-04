import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

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
        // Clear tokens on auth failure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - uses your authService
  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      // Store tokens
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error formats
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed';
      
      return { 
        success: false, 
        message: errorMessage 
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
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Registration failed';
      
      return { 
        success: false, 
        message: errorMessage 
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
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate to login
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
      console.error('Update profile error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Update failed';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Password change failed';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }, []);

  // Refresh token (already handled by axios interceptor in auth.service.js)
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      
      const response = await authService.refreshToken(refreshToken);
      
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      
      return { success: true };
    } catch (error) {
      console.error('Refresh token error:', error);
      logout();
      return { success: false };
    }
  }, [logout]);

  // Additional methods from your authService
  const getAllUsers = useCallback(async () => {
    try {
      const response = await authService.getAllUsers();
      return { success: true, data: response };
    } catch (error) {
      console.error('Get all users error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to get users';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }, []);

  const changeUserRole = useCallback(async (userId, newRole, licenseNumber = null, stationID = null) => {
    try {
      const response = await authService.changeUserRole(userId, newRole, licenseNumber, stationID);
      return { success: true, data: response };
    } catch (error) {
      console.error('Change user role error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to change user role';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }, []);

  const toggleUserStatus = useCallback(async (userId) => {
    try {
      const response = await authService.toggleUserStatus(userId);
      return { success: true, data: response };
    } catch (error) {
      console.error('Toggle user status error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to toggle user status';
      
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    getAllUsers,
    changeUserRole,
    toggleUserStatus,
    // Return the entire authService for other methods
    authService
  };
};
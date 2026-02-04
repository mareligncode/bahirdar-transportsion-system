import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authService from '../services/auth.service';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          
          set({
            user: response.user,
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true, user: response.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false 
          });
          return { success: false, message: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          
          set({
            user: response.user,
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true, user: response.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false 
          });
          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
          localStorage.removeItem('auth-storage');
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authService.updateProfile(profileData);
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });

          return { success: true, user: updatedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await authService.changePassword(currentPassword, newPassword);
          
          set({
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password change failed';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      checkAuth: async () => {
        const accessToken = get().accessToken;
        if (!accessToken) {
          return { isAuthenticated: false };
        }

        set({ isLoading: true });
        try {
          const userProfile = await authService.getProfile();
          
          set({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false
          });

          return { isAuthenticated: true, user: userProfile };
        } catch (error) {
          set({ 
            isAuthenticated: false,
            isLoading: false
          });
          return { isAuthenticated: false };
        }
      },

      // Admin functions
      getAllUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.getAllUsers();
          set({ isLoading: false });
          return { success: true, data: response };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch users';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      getStationUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.getStationUsers();
          set({ isLoading: false });
          return { success: true, data: response };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch station users';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      changeUserRole: async (userId, newRole, licenseNumber = null, stationID = null) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.changeUserRole(userId, newRole, licenseNumber, stationID);
          set({ isLoading: false });
          return { success: true, data: response };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to change user role';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      toggleUserStatus: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.toggleUserStatus(userId);
          set({ isLoading: false });
          return { success: true, data: response };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to toggle user status';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      assignDriver: async (passengerId, licenseNumber, stationID = null) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.assignDriver(passengerId, licenseNumber, stationID);
          set({ isLoading: false });
          return { success: true, data: response };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to assign driver';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          return { success: false, message: errorMessage };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Check user role
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'super_admin') return true;
        
        // Station admin can access station_admin routes
        if (role === 'station_admin' && user.role === 'station_admin') return true;
        
        // Exact role match
        return user.role === role;
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'super_admin') return true;
        
        return roles.includes(user.role);
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Export hook for easy access
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    
    // Actions
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateProfile: store.updateProfile,
    changePassword: store.changePassword,
    checkAuth: store.checkAuth,
    clearError: store.clearError,
    hasRole: store.hasRole,
    hasAnyRole: store.hasAnyRole,
    
    // Admin actions
    getAllUsers: store.getAllUsers,
    getStationUsers: store.getStationUsers,
    changeUserRole: store.changeUserRole,
    toggleUserStatus: store.toggleUserStatus,
    assignDriver: store.assignDriver
  };
};
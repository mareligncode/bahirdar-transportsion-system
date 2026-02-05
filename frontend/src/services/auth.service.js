 import api from './api';

 const authService = {
  // Keep simple returns for useAuth methods
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data.data;
  },

    login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data.data;
  },
   
  logout: async (refreshToken) => {
    await api.post('/api/auth/logout', { refreshToken });
  },
 
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data.data.user || response.data.data;
  },
 
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data.data.user || response.data.data;
  },
 
  changePassword: async (currentPassword, newPassword) => {
    await api.put('/api/auth/change-password', { currentPassword, newPassword });
  },
 
import api from './api'; // Import your centralized api instance


const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData); // Add /api/auth prefix
    return response.data.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data.data;
  },

  // Logout
  logout: async (refreshToken) => {
    await api.post('/api/auth/logout', { refreshToken });
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data.data.user;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data.data.user;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    await api.put('/api/auth/change-password', { currentPassword, newPassword });
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/refresh-token', { refreshToken });
    return response.data.data;
  },

  // Enhanced methods for RoleManagement
getAllUsers: async () => {
  try {
    console.log('🔄 Fetching FRESH user data (no cache)...');
    
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await api.get(`/api/auth/all-users`, {
      params: { _: timestamp },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('📊 API Response Status:', response.status);
    
    let users = [];
    
    // Direct extraction - no complex logic
    if (response.data?.data?.users) {
      users = response.data.data.users;
    } else if (response.data?.users) {
      users = response.data.users;
    } else if (Array.isArray(response.data)) {
      users = response.data;
    }
    
    console.log(`✅ Got ${users.length} users from backend`);
    
    return {
      success: true,
      data: { users },
      message: 'Users fetched'
    };
    
  } catch (error) {
    console.error('❌ Get users error:', error.message);
    return {
      success: false,
      data: { users: [] },
      message: 'Failed to fetch users'
    };
  }
},

  // Handle both parameter formats
  changeUserRole: async (userId, newRole, licenseNumber = null, stationID = null) => {
    try {
      console.log('Change role API call:', { userId, newRole, licenseNumber, stationID });
      
      // ✅ Send as plain object with all parameters
      const response = await api.post('/api/auth/change-role', { 
        userId, 
        newRole, 
        licenseNumber, 
        stationID 
      });
      
      console.log('Change role API response:', response.data);
      
      return {
        success: response.data.success !== false,
        data: response.data.data || response.data,
        message: response.data.message || 'Role changed successfully'
      };
      
    } catch (error) {
      console.error('Change role API error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change role'
      };
    }
  },

 toggleUserStatus: async (userId) => {
  try {
    console.log('🔄 Toggle status API call for user:', userId);
    
    const response = await api.post('/api/auth/toggle-status', { userId });
    
    console.log('📊 Toggle status API response:', response.data);
    
    return {
      success: response.data.success !== false,
      data: response.data.data || response.data,
      message: response.data.message || 'Status updated successfully'
    };
    
  } catch (error) {
    console.error('❌ Toggle status error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update status'
    };
  }
},

  // Get all users (super admin only)
// auth.service.js - Update getAllUsers method
getAllUsers: async () => {
  try {
    const response = await api.get('/api/auth/all-users');
    
    // Check different response formats
    if (response.data.success !== undefined) {
      // Format: { success: true, data: { users: [...] } }
      return response.data;
    } else if (response.data.users) {
      // Format: { users: [...] }
      return { 
        success: true, 
        data: response.data 
      };
    } else if (response.data.data?.users) {
      // Format: { data: { users: [...] } }
      return { 
        success: true, 
        data: response.data.data 
      };
    }
    
    throw new Error('Unexpected API response format');
    
  } catch (error) {
    console.error('Get all users API error:', error);
    // Re-throw with proper format
    throw {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch users'
    };
  }
},





  // Get station users (station admin only)
  getStationUsers: async () => {
    const response = await api.get('/api/auth/station-users');
    return response.data.data;
  },

  // Change user role (super admin only)
  changeUserRole: async (userId, newRole, licenseNumber = null, stationID = null) => {
    const response = await api.post('/api/auth/change-role', { 
      userId, 
      newRole, 
      licenseNumber, 
      stationID 
    });
    return response.data.data;
  },

  // Toggle user status (admin only)
  toggleUserStatus: async (userId) => {
    const response = await api.post('/api/auth/toggle-status', { userId });
    return response.data.data;
  },

  // Assign passenger to driver (station admin only)
  assignDriver: async (passengerId, licenseNumber, stationID = null) => {
    const response = await api.post('/api/auth/assign-driver', { 
      passengerId, 
      licenseNumber, 
      stationID 
    });
    return response.data.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/api/auth/user/${userId}`);
    return response.data.data.user || response.data.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/api/auth/user/${userId}`);
    return response.data.data.user;
  },

  // ✅ ADD DRIVER (super admin)
  createDriver: async (driverData) => {
    const response = await api.post('/api/auth/create-driver', driverData);
    return response.data.data;
  }
};

export default authService;
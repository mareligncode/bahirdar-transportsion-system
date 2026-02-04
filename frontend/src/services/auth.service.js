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
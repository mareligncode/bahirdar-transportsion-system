import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data.tokens;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data.data;
  },

  // Logout
  logout: async (refreshToken) => {
    await api.post('/logout', { refreshToken });
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data.data.user;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data.data.user;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    await api.put('/change-password', { currentPassword, newPassword });
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/refresh-token', { refreshToken });
    return response.data.data;
  },

  // Get all users (super admin only)
  getAllUsers: async () => {
    const response = await api.get('/all-users');
    return response.data.data;
  },

  // Get station users (station admin only)
  getStationUsers: async () => {
    const response = await api.get('/station-users');
    return response.data.data;
  },

  // Change user role (super admin only)
  changeUserRole: async (userId, newRole, licenseNumber = null, stationID = null) => {
    const response = await api.post('/change-role', { 
      userId, 
      newRole, 
      licenseNumber, 
      stationID 
    });
    return response.data.data;
  },

  // Toggle user status (admin only)
  toggleUserStatus: async (userId) => {
    const response = await api.post('/toggle-status', { userId });
    return response.data.data;
  },

  // Assign passenger to driver (station admin only)
  assignDriver: async (passengerId, licenseNumber, stationID = null) => {
    const response = await api.post('/assign-driver', { 
      passengerId, 
      licenseNumber, 
      stationID 
    });
    return response.data.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/user/${userId}`);
    return response.data.data.user;
  },

  // ✅ ADD DRIVER (super admin)
  createDriver: async (driverData) => {
    const response = await api.post('/create-driver', driverData);
    return response.data.data;
  }
};

export default authService;

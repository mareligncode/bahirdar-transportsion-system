// BahirDarTransportMobileApp/lib/api/user.ts
import { api as apiClient } from '../../config/api';
import type { User } from '../../types/auth';

export const userApi = {
  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<{ data: User }>('/user/profile');
    return response.data.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<{ data: User }>('/user/profile', userData);
    return response.data.data;
  },

  // Change password
  changePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>('/user/change-password', data);
    return response.data;
  },

  // Update profile picture
  updateProfilePicture: async (formData: FormData): Promise<{ profile_picture: string }> => {
    const response = await apiClient.post<{ profile_picture: string }>('/user/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async (password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/user/delete-account', { password });
    return response.data;
  },

  // Get account activity
  getAccountActivity: async (params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    const response = await apiClient.get<any>('/user/activity', { params });
    return response.data;
  },
};
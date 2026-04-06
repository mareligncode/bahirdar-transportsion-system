import { api as apiClient } from '../../config/api';
import type { Notification as MobileNotification } from '../../types/notification';
import type { ApiResponse } from '../../types/auth';

type BackendNotification = {
  _id: string;
  userID: string;
  title: string;
  message: string;
  type: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'archived';
  createdAt: string;
  metadata?: Record<string, any>;
};

type GetNotificationsResponse = {
  success: boolean;
  data: BackendNotification[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
};

type UnreadCountResponse = {
  success: boolean;
  data: {
    unreadCount: number;
  };
};

const mapTypeToMobile = (backendType: string): MobileNotification['type'] => {
  if (
    backendType === 'booking_confirmation' ||
    backendType === 'booking_cancellation'
  ) return 'booking';

  if (
    backendType === 'payment_success' ||
    backendType === 'payment_failed' ||
    backendType === 'refund_processed'
  ) return 'payment';

  if (
    backendType === 'trip_update' ||
    backendType === 'trip_cancellation' ||
    backendType === 'trip_delay' ||
    backendType === 'trip_reminder' ||
    backendType === 'driver_assignment' ||
    backendType === 'driver_update'
  ) return 'trip';

  if (
    backendType === 'system_alert' ||
    backendType === 'station_update' ||
    backendType === 'station_announcement'
  ) return 'system';

  return 'promotion';
};

const toMobileNotification = (n: BackendNotification): MobileNotification => ({
  id: n._id,
  user_id: n.userID,
  title: n.title,
  message: n.message,
  type: mapTypeToMobile(n.type),
  is_read: n.status === 'read',
  data: n.metadata || {},
  created_at: n.createdAt,
});

export const notificationsApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    priority?: string;
  }): Promise<GetNotificationsResponse & { mobile: MobileNotification[] }> => {
    const response = await apiClient.get('/notifications', {
      params,
    });
    const data: GetNotificationsResponse = response.data;
    const mobile = Array.isArray(data.data) ? data.data.map(toMobileNotification) : [];
    return { ...data, mobile };
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data as UnreadCountResponse;
  },

  markAsRead: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data as ApiResponse;
  },

  deleteNotification: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/notifications/${id}/archive`);
    return response.data as ApiResponse;
  },
};
// services/notificationService.js
import api from './api';

class NotificationService {
  async getUserNotifications() {
    try {
      // Add /api prefix to match backend routes
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      throw error;
    }
  }

  async getNotificationStats() {
    try {
      const response = await api.get('/api/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Error in getNotificationStats:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await api.get('/api/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      const response = await api.get(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in getNotificationById:', error);
      throw error;
    }
  }

  async markAsRead(id) {
    try {
      const response = await api.put(`/api/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  async deleteNotification(id) {
    try {
      const response = await api.delete(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw error;
    }
  }

  async retryFailedNotification(id) {
    try {
      const response = await api.post(`/api/notifications/${id}/retry`);
      return response.data;
    } catch (error) {
      console.error('Error in retryFailedNotification:', error);
      throw error;
    }
  }

  // Admin routes
  async sendBulkNotifications(data) {
    try {
      const response = await api.post('/api/notifications/bulk', data);
      return response.data;
    } catch (error) {
      console.error('Error in sendBulkNotifications:', error);
      throw error;
    }
  }

  async archiveOldNotifications(days) {
    try {
      const response = await api.post('/api/notifications/archive', { days });
      return response.data;
    } catch (error) {
      console.error('Error in archiveOldNotifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();
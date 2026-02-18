import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications();
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => n.status !== 'read').length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, user]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !token) return;

    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('join-user-room', user._id);
    });

    socketInstance.on('notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Add to state
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      if (notification.status !== 'read') {
        setUnreadCount(prev => prev + 1);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user, token]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, status: 'read' } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Note: You might need to implement a bulk mark as read endpoint
      const unreadNotifications = notifications.filter(n => n.status !== 'read');
      
      // Mark each unread notification as read
      await Promise.all(
        unreadNotifications.map(n => notificationService.markAsRead(n._id))
      );
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(prev => {
          const filtered = prev.filter(n => n._id !== notificationId);
          return filtered;
        });
        
        // Recalculate unread count
        setUnreadCount(prev => {
          const deleted = notifications.find(n => n._id === notificationId);
          return deleted?.status !== 'read' ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  const retryFailedNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationService.retryFailedNotification(notificationId);
      if (response.success) {
        // Show success message or update UI
        console.log('Retry initiated successfully');
      }
    } catch (error) {
      console.error('Error retrying notification:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      retryFailedNotification,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
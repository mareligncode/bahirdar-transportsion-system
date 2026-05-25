import { io, Socket } from 'socket.io-client';
import { getPlatformBaseUrl } from '../config/api';
import { useNotificationStore } from '../store/notificationStore';
import { presentLocalNotification } from './notifications';
import { storage } from './storage';
import type { Notification as MobileNotification } from '../types/notification';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  async connect() {
    if (this.socket?.connected || this.isConnecting) return;

    try {
      this.isConnecting = true;
      const user = await storage.getUser();
      const token = await storage.getToken();

      if (!user?._id || !token) {
        this.isConnecting = false;
        return;
      }

      const baseUrl = getPlatformBaseUrl();
      
      this.socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket connected successfully');
        // Join user-specific room
        this.socket?.emit('join-user-room', user._id);
      });

      this.socket.on('connect_error', (error) => {
        console.log('🔌 Socket connection error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      this.socket.on('notification', this.handleNotification);

    } catch (error) {
      console.error('🔌 Socket initialization error:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  private handleNotification = (data: any) => {
    console.log('📩 Received real-time notification:', data);

    const mapTypeToMobile = (backendType: string): MobileNotification['type'] => {
      if (backendType === 'booking_confirmation' || backendType === 'booking_cancellation' || backendType === 'booking_modification') return 'booking';
      if (backendType === 'payment_success' || backendType === 'payment_failed' || backendType === 'refund_processed') return 'payment';
      if (backendType === 'trip_update' || backendType === 'trip_cancellation' || backendType === 'trip_delay' || backendType === 'trip_reminder' || backendType === 'driver_assignment' || backendType === 'driver_update') return 'trip';
      if (backendType === 'system_alert' || backendType === 'station_update' || backendType === 'station_announcement') return 'system';
      return 'promotion';
    };

    const newNotification: MobileNotification = {
      id: data.id || Math.random().toString(36),
      user_id: data.userID || '',
      title: data.title || 'New Notification',
      message: data.message || '',
      type: mapTypeToMobile(data.type),
      is_read: false,
      created_at: data.createdAt || new Date().toISOString(),
      data: data.metadata || {},
    };

    // Add to store
    useNotificationStore.getState().addNotification(newNotification);

    // Show local push notification
    presentLocalNotification(newNotification.title, newNotification.message, newNotification.data);
  };

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

export const socketService = new SocketService();

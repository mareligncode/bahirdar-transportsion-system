// BahirDarTransportMobileApp/store/notificationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification, NotificationPreferences } from '../types/notification';
import { getMyBookings } from '../lib/api/bookings';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
  clearAllNotifications: () => void;
}

const defaultPreferences: NotificationPreferences = {
  booking_updates: true,
  payment_updates: true,
  trip_updates: true,
  promotions: true,
  push_enabled: true,
  email_enabled: true,
};

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      fetchNotifications: async (unreadOnly?: boolean) => {
        set({ isLoading: true, error: null });
        try {
          // Get real bookings to generate notifications from
          const bookingsResponse = await getMyBookings();
          
          if (bookingsResponse.success && bookingsResponse.data) {
            // Generate notifications from real booking data
            const notifications: Notification[] = bookingsResponse.data.map((booking: any, index: number) => ({
              id: `notification_${booking._id}`,
              type: 'booking',
              title: 'Booking Confirmed',
              message: `Your booking for seat ${booking.seatNumber || booking.seatNumbers?.join(', ')} has been confirmed.`,
              is_read: false,
              created_at: booking.createdAt || new Date().toISOString(),
              data: {
                bookingId: booking._id,
                tripId: booking.tripID,
                seatNumber: booking.seatNumber,
                seatNumbers: booking.seatNumbers,
              }
            }));

            set({ 
              notifications: unreadOnly ? notifications : notifications.filter((n: any) => !n.is_read),
              unreadCount: notifications.filter((n: any) => !n.is_read).length 
            });
          }
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          set({ error: error.message || 'Failed to fetch notifications' });
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          const { notifications, unreadCount } = get();
          const notification = notifications.find((n: any) => n.id === notificationId);
          
          if (notification) {
            const updatedNotifications = notifications.map((n: any) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            );

            const newUnreadCount = Math.max(0, unreadCount - 1);

            set({
              notifications: updatedNotifications,
              unreadCount: newUnreadCount,
            });
          }
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
        }
      },

      markAllAsRead: async () => {
        try {
          const { notifications } = get();
          const updatedNotifications = notifications.map((notification: any) => ({
            ...notification,
            is_read: true,
          }));

          set({
            notifications: updatedNotifications,
            unreadCount: 0,
          });
        } catch (error: any) {
          console.error('Error marking all notifications as read:', error);
        }
      },

      deleteNotification: async (notificationId: string) => {
        try {
          const { notifications, unreadCount } = get();
          const notificationToDelete = notifications.find((n: any) => n.id === notificationId);
          
          if (notificationToDelete) {
            const updatedNotifications = notifications.filter(
              (notification: any) => notification.id !== notificationId
            );

            const newUnreadCount = notificationToDelete?.is_read 
              ? unreadCount 
              : Math.max(0, unreadCount - 1);

            set({
              notifications: updatedNotifications,
              unreadCount: newUnreadCount,
            });
          }
        } catch (error: any) {
          console.error('Error deleting notification:', error);
        }
      },

      fetchPreferences: async () => {
        try {
          set({ preferences: defaultPreferences });
        } catch (error: any) {
          console.error('Error fetching notification preferences:', error);
        }
      },

      updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
        try {
          const currentPreferences = get().preferences;
          const updatedPreferences = { ...currentPreferences, ...preferences };
          
          set({ preferences: updatedPreferences });
        } catch (error: any) {
          console.error('Error updating notification preferences:', error);
        }
      },

      addNotification: (notification: Notification) => {
        const { notifications, unreadCount } = get();
        const newUnreadCount = (notification as any).is_read ? unreadCount : unreadCount + 1;
        
        set({
          notifications: [notification, ...notifications],
          unreadCount: newUnreadCount,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// ✅ Export selectors for better performance
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useNotificationPreferences = () => useNotificationStore((state) => state.preferences);
export const useNotificationLoading = () => useNotificationStore((state) => state.isLoading);
export const useNotificationError = () => useNotificationStore((state) => state.error);
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification, NotificationPreferences } from '../types/notification';
import { notificationsApi } from '../lib/api/notification';

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
          const res = await notificationsApi.getNotifications({ page: 1, limit: 50 });
          const items = res.mobile || [];
          const filtered = unreadOnly ? items.filter((n: any) => !n.is_read) : items;
          const unreadRes = await notificationsApi.getUnreadCount();
          const unreadCount = unreadRes?.data?.unreadCount ?? filtered.filter((n: any) => !n.is_read).length;

          set({
            notifications: filtered,
            unreadCount,
          });
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          set({ error: error.message || 'Failed to fetch notifications' });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshOnLogin: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await notificationsApi.getNotifications({ page: 1, limit: 50 });
          const items = res.mobile || [];
          const unreadRes = await notificationsApi.getUnreadCount();
          const unreadCount = unreadRes?.data?.unreadCount ?? items.filter((n: any) => !n.is_read).length;

          set({
            notifications: items,
            unreadCount,
          });
        } catch (error: any) {
          console.error('Error refreshing notifications on login:', error);
          set({ error: error.message || 'Failed to refresh notifications' });
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          await notificationsApi.markAsRead(notificationId);
          const { notifications, unreadCount } = get();
          const updated = notifications.map((n: any) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          );
          set({
            notifications: updated,
            unreadCount: Math.max(0, unreadCount - 1),
          });
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
        }
      },

      markAllAsRead: async () => {
        try {
          const { notifications } = get();
          const unread = notifications.filter((n: any) => !n.is_read);
          await Promise.all(unread.map((n: any) => notificationsApi.markAsRead(n.id)));
          const updated = notifications.map((n: any) => ({ ...n, is_read: true }));
          set({ notifications: updated, unreadCount: 0 });
        } catch (error: any) {
          console.error('Error marking all notifications as read:', error);
        }
      },

      deleteNotification: async (notificationId: string) => {
        try {
          await notificationsApi.deleteNotification(notificationId);
          const { notifications, unreadCount } = get();
          const toDelete = notifications.find((n: any) => n.id === notificationId);
          const updated = notifications.filter((n: any) => n.id !== notificationId);
          const newUnread = toDelete?.is_read ? unreadCount : Math.max(0, unreadCount - 1);
          set({ notifications: updated, unreadCount: newUnread });
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

export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useNotificationPreferences = () => useNotificationStore((state) => state.preferences);
export const useNotificationLoading = () => useNotificationStore((state) => state.isLoading);
export const useNotificationError = () => useNotificationStore((state) => state.error);

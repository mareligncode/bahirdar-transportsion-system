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
  refreshOnLogin: () => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  booking_updates: true,
  payment_updates: true,
  trip_updates: true,
  promotions: true,
  push_enabled: true,
  email_enabled: true,
};

/** Helper: count unread from a notification list */
const countUnread = (items: Notification[]): number =>
  items.filter((n) => !n.is_read).length;

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      /**
       * Fetch all notifications from the server.
       * Always stores the FULL list — the UI filters for the "unread" tab.
       */
      fetchNotifications: async (_unreadOnly?: boolean) => {
        set({ isLoading: true, error: null });
        try {
          const res = await notificationsApi.getNotifications({ page: 1, limit: 50 });
          const items: Notification[] = res.mobile || [];

          // Always store the complete list; compute unread locally
          set({
            notifications: items,
            unreadCount: countUnread(items),
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
          const items: Notification[] = res.mobile || [];

          set({
            notifications: items,
            unreadCount: countUnread(items),
          });
        } catch (error: any) {
          if (error.response?.status !== 401) {
            console.error('Error refreshing notifications on login:', error);
          }
          set({ error: error.message || 'Failed to refresh notifications' });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Mark a single notification as read.
       * Guards against already-read notifications to prevent negative counts.
       */
      markAsRead: async (notificationId: string) => {
        const { notifications } = get();
        const target = notifications.find((n) => n.id === notificationId);

        // Skip if already read or not found
        if (!target || target.is_read) return;

        // Optimistic update
        const updated = notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        set({
          notifications: updated,
          unreadCount: countUnread(updated),
        });

        // Fire API in background — don't revert on failure
        try {
          await notificationsApi.markAsRead(notificationId);
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
        }
      },

      /**
       * Mark ALL notifications as read.
       * Uses optimistic local update first, then marks each unread one
       * via the existing per-notification API endpoint.
       */
      markAllAsRead: async () => {
        const { notifications } = get();
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

        if (unreadIds.length === 0) return;

        // Optimistic update — UI reflects immediately
        const updated = notifications.map((n) => ({ ...n, is_read: true }));
        set({ notifications: updated, unreadCount: 0 });

        // Try the bulk endpoint first (may not exist on backend)
        try {
          await notificationsApi.markAllAsRead();
        } catch {
          // Bulk endpoint unavailable — fall back to individual calls
          await Promise.allSettled(
            unreadIds.map((id) =>
              notificationsApi.markAsRead(id).catch(() => {})
            )
          );
        }
      },

      /**
       * Delete a notification.
       * Only decrements unread count if the deleted notification was actually unread.
       */
      deleteNotification: async (notificationId: string) => {
        try {
          await notificationsApi.deleteNotification(notificationId);
          const { notifications } = get();
          const toDelete = notifications.find((n) => n.id === notificationId);
          const updated = notifications.filter((n) => n.id !== notificationId);
          const wasUnread = toDelete && !toDelete.is_read;

          set({
            notifications: updated,
            unreadCount: wasUnread
              ? Math.max(0, get().unreadCount - 1)
              : get().unreadCount,
          });
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
        const { notifications } = get();

        // Prevent duplicate notifications (e.g. from socket + push)
        if (notifications.some((n) => n.id === notification.id)) return;

        const newList = [notification, ...notifications];
        set({
          notifications: newList,
          unreadCount: countUnread(newList),
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

// BahirDarTransportMobileApp/store/notificationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notification, NotificationPreferences } from '../types/notification';

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

// const defaultPreferences: NotificationPreferences = {
//  bookingUpdates: true,
//   paymentUpdates: true,
//   tripUpdates: true,
//   promotions: true,
//   pushEnabled: true,
//   emailEnabled: true,
// };

// const initialState: NotificationState = {
//   notifications: [],
//   unreadCount: 0,
//   preferences: defaultPreferences,
//   isLoading: false,
//   error: null,
// };

// // ✅ Make sure this is exported as useNotificationStore
// export const useNotificationStore = create<NotificationState & NotificationActions>()(
//   persist(
//     (set, get) => ({
//       ...initialState,

//       fetchNotifications: async (unreadOnly = false) => {
//         set({ isLoading: true, error: null });

//         try {
//           // TODO: Replace with actual API call
//           // For now, use mock data
//           const mockNotifications: Notification[] = [
//             {
//               id: '1',
//               userId: 'user1',
//               title: 'Booking Confirmed',
//               message: 'Your trip from Bahir Dar to Addis Ababa has been confirmed',
//               type: 'booking',
//               isRead: false,
//               createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
//             },
//             {
//               id: '2',
//               userId: 'user1',
//               title: 'Payment Successful',
//               message: 'Your payment of 450 ETB has been processed',
//               type: 'payment',
//               isRead: true,
//               createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
//             },
//             {
//               id: '3',
//               userId: 'user1',
//               title: 'System Update',
//               message: 'New features added to the app. Update now!',
//               type: 'system',
//               isRead: false,
//               createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
//             },
//           ];

//           const filteredNotifications = unreadOnly
//             ? mockNotifications.filter(n => !n.isRead)
//             : mockNotifications;

//           const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

//           set({
//             notifications: filteredNotifications,
//             unreadCount,
//             isLoading: false,
//           });
//         } catch (error: any) {
//           set({
//             error: error.message || 'Failed to fetch notifications',
//             isLoading: false,
//           });
//         }
//       },

//       markAsRead: async (notificationId: string) => {
//         try {
//           const { notifications, unreadCount } = get();
//           const updatedNotifications = notifications.map(notification =>
//             notification.id === notificationId
//               ? { ...notification, isRead: true }
//               : notification
//           );

//           const newUnreadCount = Math.max(0, unreadCount - 1);

//           set({
//             notifications: updatedNotifications,
//             unreadCount: newUnreadCount,
//           });
//         } catch (error: any) {
//           console.error('Error marking notification as read:', error);
//         }
//       },

//       markAllAsRead: async () => {
//         try {
//           const { notifications } = get();
//           const updatedNotifications = notifications.map(notification => ({
//             ...notification,
//             isRead: true,
//           }));

//           set({
//             notifications: updatedNotifications,
//             unreadCount: 0,
//           });
//         } catch (error: any) {
//           console.error('Error marking all notifications as read:', error);
//         }
//       },

//       deleteNotification: async (notificationId: string) => {
//         try {
//           const { notifications, unreadCount } = get();
//           const notificationToDelete = notifications.find(n => n.id === notificationId);
          
//           const updatedNotifications = notifications.filter(
//             notification => notification.id !== notificationId
//           );

//           const newUnreadCount = notificationToDelete?.isRead 
//             ? unreadCount 
//             : Math.max(0, unreadCount - 1);

//           set({
//             notifications: updatedNotifications,
//             unreadCount: newUnreadCount,
//           });
//         } catch (error: any) {
//           console.error('Error deleting notification:', error);
//         }
//       },

//       fetchPreferences: async () => {
//         try {
//           // TODO: Replace with actual API call
//           set({ preferences: defaultPreferences });
//         } catch (error: any) {
//           console.error('Error fetching notification preferences:', error);
//         }
//       },

//       updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
//         try {
//           const currentPreferences = get().preferences;
//           const updatedPreferences = { ...currentPreferences, ...preferences };
          
//           set({ preferences: updatedPreferences });
//         } catch (error: any) {
//           console.error('Error updating notification preferences:', error);
//         }
//       },

//       addNotification: (notification: Notification) => {
//         const { notifications, unreadCount } = get();
//         const newUnreadCount = notification.isRead ? unreadCount : unreadCount + 1;
        
//         set({
//           notifications: [notification, ...notifications],
//           unreadCount: newUnreadCount,
//         });
//       },

//       clearError: () => {
//         set({ error: null });
//       },

//       clearAllNotifications: () => {
//         set({
//           notifications: [],
//           unreadCount: 0,
//         });
//       },
//     }),
//     {
//       name: 'notification-storage',
//       storage: createJSONStorage(() => AsyncStorage),
//       partialize: (state) => ({
//         preferences: state.preferences,
//       }),
//     }
//   )
// );

// // ✅ Export selectors for better performance
// export const useNotifications = () => useNotificationStore((state) => state.notifications);
// export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
// export const useNotificationPreferences = () => useNotificationStore((state) => state.preferences);
// export const useNotificationLoading = () => useNotificationStore((state) => state.isLoading);
// export const useNotificationError = () => useNotificationStore((state) => state.error);
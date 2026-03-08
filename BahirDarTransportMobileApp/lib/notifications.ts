import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification as MobileNotification } from '../types/notification';

// Check if running in Expo Go or development build
const isExpoGo = Constants.executionEnvironment !== 'bare';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    if (isExpoGo) {
      console.warn('Push notifications not available in Expo Go. Use a development build for push notifications.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Only attempt to get push token if not in Expo Go
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn('Project ID not found. Push notifications may not work properly.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData?.data ?? null;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const setupNotificationListeners = () => {
  // Only set up listeners if not running in Expo Go to avoid warnings
  if (isExpoGo) {
    console.log('Notification listeners not set up in Expo Go (local notifications only)');
    return () => {};
  }

  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as any;
    const item: MobileNotification = {
      id: (data?.id as string) ?? Math.random().toString(36),
      user_id: (data?.user_id as string) ?? '',
      title: notification.request.content.title ?? 'Notification',
      message: notification.request.content.body ?? '',
      type: (data?.type as MobileNotification['type']) ?? 'system',
      is_read: false,
      created_at: new Date().toISOString(),
      data,
    };
    useNotificationStore.getState().addNotification(item);
    
    // Handle critical notifications with immediate action
    if (data?.type === 'trip_delay' || data?.type === 'trip_cancellation') {
      // Show immediate alert for critical trip changes
      presentLocalNotification(
        'Important Trip Update',
        data?.message || 'Your trip has been updated',
        { type: 'critical', tripId: data?.tripId }
      );
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    
    // Handle notification actions
    if (data?.action === 'view_trip') {
      // Navigate to trip details
      console.log('Navigating to trip:', data.tripId);
    } else if (data?.action === 'view_booking') {
      // Navigate to booking details  
      console.log('Navigating to booking:', data.bookingId);
    }
  });

  return () => {
    subscription.remove();
    responseSub.remove();
  };
};

// Schedule trip reminders
export const scheduleTripReminders = async (tripId: string, departureTime: string, userId: string) => {
  try {
    const departureDate = new Date(departureTime);
    const reminderTime = new Date(departureDate.getTime() - (60 * 60 * 1000)); // 1 hour before
    
    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Trip Reminder',
          body: 'Your trip is scheduled to depart in 1 hour',
          data: {
            type: 'trip_reminder',
            tripId,
            action: 'view_trip'
          },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });
      
      console.log(`Trip reminder scheduled for ${reminderTime.toLocaleString()}`);
    }
  } catch (error) {
    console.error('Error scheduling trip reminder:', error);
  }
};

// Schedule booking confirmation reminder
export const scheduleBookingConfirmation = async (bookingId: string, bookingTime: string, userId: string) => {
  try {
    const bookingDate = new Date(bookingTime);
    const confirmationTime = new Date(bookingDate.getTime() + (5 * 60 * 1000)); // 5 minutes after booking
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Confirmation',
        body: 'Please check your booking details and complete payment',
        data: {
          type: 'booking_confirmation',
          bookingId,
          action: 'view_booking'
        },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: confirmationTime,
      },
    });
    
    console.log(`Booking confirmation reminder scheduled for ${confirmationTime.toLocaleString()}`);
  } catch (error) {
    console.error('Error scheduling booking confirmation:', error);
  }
};

// Cancel scheduled notifications
export const cancelScheduledNotifications = async (identifier: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`Cancelled scheduled notification: ${identifier}`);
  } catch (error) {
    console.error('Error cancelling scheduled notification:', error);
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

export const presentLocalNotification = async (title: string, body: string, data?: Record<string, any>) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: Platform.OS === 'ios' ? 'default' : undefined,
    },
    trigger: null, // null means show immediately
  });
};
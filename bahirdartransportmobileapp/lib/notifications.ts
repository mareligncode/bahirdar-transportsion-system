import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification as MobileNotification } from '../types/notification';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {

  try {
    Notifications = require('expo-notifications');
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('expo-notifications not available:', e);
  }
}

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    if (isExpoGo || !Notifications) {
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

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData?.data ?? null;
  } catch (error) {
    return null;
  }
};

export const setupNotificationListeners = () => {
  if (isExpoGo || !Notifications) {
    return () => { };
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

    if (data?.type === 'trip_delay' || data?.type === 'trip_cancellation') {
      presentLocalNotification(
        'Important Trip Update',
        data?.message || 'Your trip has been updated',
        { type: 'critical', tripId: data?.tripId }
      );
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    if (data?.action === 'view_trip') {
      console.log('Navigating to trip:', data.tripId);
    } else if (data?.action === 'view_booking') {
      console.log('Navigating to booking:', data.bookingId);
    }
  });

  return () => {
    subscription.remove();
    responseSub.remove();
  };
};

export const scheduleTripReminders = async (tripId: string, departureTime: string, userId: string) => {
  if (isExpoGo || !Notifications) return;
  try {
    const departureDate = new Date(departureTime);
    const reminderTime = new Date(departureDate.getTime() - (60 * 60 * 1000));

    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Trip Reminder',
          body: 'Your trip is scheduled to depart in 1 hour',
          data: { type: 'trip_reminder', tripId, action: 'view_trip' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });
    }
  } catch (error) {
  }
};

export const scheduleBookingConfirmation = async (bookingId: string, bookingTime: string, userId: string) => {
  if (isExpoGo || !Notifications) return;
  try {
    const bookingDate = new Date(bookingTime);
    const confirmationTime = new Date(bookingDate.getTime() + (5 * 60 * 1000));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Booking Confirmation',
        body: 'Please check your booking details and complete payment',
        data: { type: 'booking_confirmation', bookingId, action: 'view_booking' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: confirmationTime,
      },
    });
  } catch (error) {
  }
};

export const cancelScheduledNotifications = async (identifier: string) => {
  if (isExpoGo || !Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
  }
};

export const getScheduledNotifications = async () => {
  if (isExpoGo || !Notifications) return [];
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled;
  } catch (error) {
    return [];
  }
};

export const presentLocalNotification = async (title: string, body: string, data?: Record<string, any>) => {
  if (isExpoGo || !Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: Platform.OS === 'ios' ? 'default' : undefined,
      },
      trigger: null,
    });
  } catch (error) {
  }
};
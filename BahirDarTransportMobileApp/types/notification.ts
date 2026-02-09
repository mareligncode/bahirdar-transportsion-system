// BahirDarTransportMobileApp/types/notification.ts
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'trip' | 'system' | 'promotion';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface NotificationPreferences {
  booking_updates: boolean;
  payment_updates: boolean;
  trip_updates: boolean;
  promotions: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}
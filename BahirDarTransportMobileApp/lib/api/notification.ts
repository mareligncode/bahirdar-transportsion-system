// BahirDarTransportMobileApp/types/notification.ts
export interface Notification {
  id: string;
  userId: string; // Changed from user_id
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'trip' | 'system' | 'promotion';
  isRead: boolean; // Changed from is_read
  data?: Record<string, any>;
  createdAt: string; // Changed from created_at
}

export interface NotificationPreferences {
  bookingUpdates: boolean; // Changed from booking_updates
  paymentUpdates: boolean; // Changed from payment_updates
  tripUpdates: boolean; // Changed from trip_updates
  promotions: boolean;
  pushEnabled: boolean; // Changed from push_enabled
  emailEnabled: boolean; // Changed from email_enabled
}

// Add PaginatedResponse
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number; // Changed from current_page
    totalPages: number; // Changed from total_pages
    totalItems: number; // Changed from total_items
    itemsPerPage: number; // Changed from items_per_page
  };
}
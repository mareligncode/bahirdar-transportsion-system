import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClick }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmation':
      case 'payment_success':
        return '✅';
      case 'payment_failed':
      case 'trip_cancellation':
        return '❌';
      case 'trip_delay':
        return '⏱️';
      case 'trip_reminder':
        return '⏰';
      case 'driver_assignment':
        return '👨‍✈️';
      case 'station_announcement':
        return '📢';
      default:
        return '🔔';
    }
  };

  const isUnread = notification.status !== 'read';

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start p-4 border-b border-gray-200 last:border-b-0
        hover:bg-gray-50 cursor-pointer transition-colors
        ${isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
    >
      <div className="flex-shrink-0 mr-3 text-xl">
        {getIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-sm font-medium ${
            isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {notification.title}
          </p>
          {notification.priority === 'urgent' && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
              Urgent
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
          {notification.message}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
          <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
          {notification.metadata?.actionText && (
            <>
              <span className="mx-1">•</span>
              <span className="text-blue-600 dark:text-blue-400">{notification.metadata.actionText}</span>
            </>
          )}
        </div>
      </div>
      
      {isUnread && (
        <div className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}
    </div>
  );
};

export default NotificationItem;
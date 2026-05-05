import React from 'react';
import NotificationItem from './NotificationItem';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const NotificationList = ({ notifications, loading, onNotificationClick }) => {
  const { t } = useTranslation();
  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-gray-500 dark:text-gray-400">{t('no_notifications', 'No notifications')}</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onClick={() => onNotificationClick(notification)}
        />
      ))}
    </div>
  );
};

export default NotificationList;
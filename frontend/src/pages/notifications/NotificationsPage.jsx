import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, CheckCheck, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useTranslation } from '../../hooks/useTranslation';

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    retryFailedNotification,
    loading
  } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [retrying, setRetrying] = useState(null);

  const filtered = notifications.filter(n =>
    filter === 'all' ? true : filter === 'unread' ? n.status !== 'read' : true
  );

  const getIcon = (type) => {
    const icons = {
      booking_confirmation: '✅',
      payment_success: '✅',
      payment_failed: '❌',
      trip_cancellation: '❌',
      trip_delay: '⏱️',
      trip_reminder: '⏰',
      driver_assignment: '👨‍✈️',
      station_announcement: '📢',
      queue_update: '🔢',
      vehicle_ready: '🚀'
    };
    return icons[type] || '🔔';
  };

  const handleRetry = async (e, notificationId) => {
    e.stopPropagation();
    setRetrying(notificationId);
    await retryFailedNotification(notificationId);
    setRetrying(null);
  };

  const isFailed = (notification) => {
    return notification.status === 'failed' || notification.metadata?.error;
  };

  const getDateLocale = () => {
    // Falls back to enUS as date-fns doesn't have Amharic locale in current version
    return enUS;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/80 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-white">{t('notifications_page_title', 'Notifications')}</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                  {unreadCount} {t('new', 'new')}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-white/80 hover:text-white flex items-center gap-2"
              >
                <CheckCheck className="w-5 h-5" />
                {t('mark_all_read', 'Mark all read')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {t('all', 'All')} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            {t('unread', 'Unread')} ({unreadCount})
          </button>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading_notifications', 'Loading notifications...')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>{t('no_notifications', 'No notifications')}</p>
            </div>
          ) : (
            filtered.map(n => (
              <div
                key={n._id}
                onClick={() => n.status !== 'read' && markAsRead(n._id)}
                className={`p-4 border-b last:border-0 flex gap-3 transition-colors ${n.status !== 'read'
                  ? 'bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isFailed(n) ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <span className="text-2xl">{getIcon(n.type)}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-medium ${n.status !== 'read'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400'
                        }`}>
                        {t(n.title)}
                      </h3>
                      {isFailed(n) && (
                        <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">
                          {t('failed_to_deliver', 'Failed to deliver')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isFailed(n) && (
                        <button
                          onClick={(e) => handleRetry(e, n._id)}
                          disabled={retrying === n._id}
                          className="text-gray-400 hover:text-blue-500 disabled:opacity-50"
                          title={t('retry', 'Retry')}
                        >
                          <RefreshCw className={`w-4 h-4 ${retrying === n._id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                        className="text-gray-400 hover:text-red-500"
                        title={t('delete', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {n.message?.includes('<') ? (
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400 mt-1 notification-content"
                      dangerouslySetInnerHTML={{ __html: n.message }}
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t(n.message)}</p>
                  )}



                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                      locale: getDateLocale()
                    })}
                  </p>
                  {n.metadata?.error && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {t('error_label', 'Error: ')} {n.metadata.error}
                    </p>
                  )}
                </div>
                {n.status !== 'read' && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
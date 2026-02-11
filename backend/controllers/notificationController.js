import Notification from '../models/Notification.js';
import User from '../models/Users.js';
import NotificationService from '../services/notificationService.js';
class NotificationController {
    
    /**
     * Create a new notification
     */
    static async createNotification(req, res) {
        try {
            const {
                userID,
                title,
                message,
                type,
                channel = 'in_app',
                priority = 'medium',
                metadata = {}
            } = req.body;

            // Validate required fields
            if (!userID || !title || !message || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'userID, title, message, and type are required'
                });
            }

            // Validate user exists
            const user = await User.findById(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Validate notification type
            const validTypes = [
                'booking_confirmation',
                'payment_success',
                'payment_failed',
                'trip_update',
                'trip_cancellation',
                'trip_delay',
                'trip_reminder',
                'booking_cancellation',
                'refund_processed',
                'driver_assignment',
                'driver_update',
                'station_announcement',
                'system_alert',
                'promotional'
            ];

            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            // Validate priority
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
                });
            }

            // Validate channel
            const validChannels = ['email', 'sms', 'in_app', 'push', 'all'];
            if (!validChannels.includes(channel)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid channel. Must be one of: ${validChannels.join(', ')}`
                });
            }

            // Create notification
            const notificationData = {
                userID,
                title,
                message,
                type,
                channel,
                priority,
                metadata,
                createdBy: req.user._id
            };

            const notification = await NotificationService.createNotification(notificationData);

            res.status(201).json({
                success: true,
                message: 'Notification created successfully',
                data: notification
            });

        } catch (error) {
            console.error('Create notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create notification',
                error: error.message
            });
        }
    }
    static async getUserNotifications(req, res) {
        try {
            const userID = req.user._id;
            const {
                page = 1,
                limit = 20,
                type,
                status,
                priority
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                type,
                status,
                priority
            };

            const result = await NotificationService.getUserNotifications(userID, options);

            res.json({
                success: true,
                data: result.notifications,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('Get user notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications',
                error: error.message
            });
        }
    }
    static async getNotificationById(req, res) {
        try {
            const { id } = req.params;
            const userID = req.user._id;

            const notification = await Notification.findOne({
                _id: id,
                userID: userID
            }).populate('userID', 'fullName email');

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.json({
                success: true,
                data: notification
            });

        } catch (error) {
            console.error('Get notification by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notification',
                error: error.message
            });
        }
    }
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userID = req.user._id;

            const notification = await NotificationService.markAsRead(id, userID);

            res.json({
                success: true,
                message: 'Notification marked as read',
                data: notification
            });

        } catch (error) {
            console.error('Mark notification as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    }
    static async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const userID = req.user._id;

            const notification = await Notification.findOne({
                _id: id,
                userID: userID
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            await Notification.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });

        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }
    }
    static async getNotificationStats(req, res) {
        try {
            const userID = req.user._id;

            const stats = await Notification.aggregate([
                { $match: { userID } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        unread: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
                            }
                        },
                        read: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'read'] }, 1, 0]
                            }
                        },
                        byType: {
                            $push: '$type'
                        },
                        byPriority: {
                            $push: '$priority'
                        }
                    }
                }
            ]);

            const typeStats = await Notification.aggregate([
                { $match: { userID } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            const priorityStats = await Notification.aggregate([
                { $match: { userID } },
                {
                    $group: {
                        _id: '$priority',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            res.json({
                success: true,
                data: {
                    total: stats[0]?.total || 0,
                    unread: stats[0]?.unread || 0,
                    read: stats[0]?.read || 0,
                    byType: typeStats,
                    byPriority: priorityStats
                }
            });

        } catch (error) {
            console.error('Get notification stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notification statistics',
                error: error.message
            });
        }
    }
    static async sendBulkNotifications(req, res) {
        try {
            if (req.user.role !== 'super_admin' && req.user.role !== 'station_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can send bulk notifications'
                });
            }

            const {
                title,
                message,
                type,
                channel = 'in_app',
                priority = 'medium',
                metadata = {},
                targetUsers = []
            } = req.body;
            if (!title || !message || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'title, message, and type are required'
                });
            }
            const validTypes = [
                'booking_confirmation',
                'payment_success',
                'payment_failed',
                'trip_update',
                'trip_cancellation',
                'trip_delay',
                'trip_reminder',
                'booking_cancellation',
                'refund_processed',
                'driver_assignment',
                'driver_update',
                'station_announcement',
                'system_alert',
                'promotional'
            ];

            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
                });
            }
            let userIds = targetUsers;
            if (userIds.length === 0 && req.user.role === 'super_admin') {
                const users = await User.find({}).select('_id');
                userIds = users.map(user => user._id);
            }

            if (userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No target users specified'
                });
            }

            // Create notification data
            const notificationData = {
                title,
                message,
                type,
                channel,
                priority,
                metadata,
                createdBy: req.user._id
            };
            const notifications = await NotificationService.sendToMultipleUsers(notificationData, userIds);

            res.status(201).json({
                success: true,
                message: `Notifications sent to ${notifications.length} users`,
                data: {
                    sentCount: notifications.length,
                    notifications
                }
            });

        } catch (error) {
            console.error('Send bulk notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send bulk notifications',
                error: error.message
            });
        }
    }
    static async retryFailedNotifications(req, res) {
        try {
            const { id } = req.params;
            const userID = req.user._id;

            const notification = await Notification.findOne({
                _id: id,
                userID: userID,
                status: 'failed'
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Failed notification not found'
                });
            }

            if (!notification.canRetry) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot retry this notification (max attempts reached)'
                });
            }

            await notification.retry();

            res.json({
                success: true,
                message: 'Notification retry initiated',
                data: notification
            });

        } catch (error) {
            console.error('Retry failed notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retry notification',
                error: error.message
            });
        }
    }
    static async getUnreadCount(req, res) {
        try {
            const userID = req.user._id;

            const count = await Notification.countDocuments({
                userID,
                status: { $in: ['pending', 'sent'] }
            });

            res.json({
                success: true,
                data: {
                    unreadCount: count
                }
            });

        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: error.message
            });
        }
    }
    static async archiveOldNotifications(req, res) {
        try {
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admin can archive notifications'
                });
            }

            const { days = 30 } = req.body;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const result = await Notification.updateMany(
                {
                    createdAt: { $lt: cutoffDate },
                    status: { $in: ['read', 'delivered'] }
                },
                {
                    $set: { status: 'archived' }
                }
            );

            res.json({
                success: true,
                message: `Archived ${result.modifiedCount} old notifications`,
                data: {
                    archivedCount: result.modifiedCount
                }
            });

        } catch (error) {
            console.error('Archive old notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive notifications',
                error: error.message
            });
        }
    }
}

export default NotificationController;
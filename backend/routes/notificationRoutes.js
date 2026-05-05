import express from 'express';
import NotificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware());        // no role restriction

// User notification routes
router.get('/', NotificationController.getUserNotifications);
router.get('/stats', NotificationController.getNotificationStats);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/:id', NotificationController.getNotificationById);
router.put('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.deleteNotification);
router.post('/:id/retry', NotificationController.retryFailedNotifications);

// Admin routes
router.post('/bulk', NotificationController.sendBulkNotifications);
router.post('/archive', NotificationController.archiveOldNotifications);

export default router;
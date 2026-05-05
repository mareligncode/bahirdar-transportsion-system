import express from 'express';
import {
    getDashboardStats,
    getRevenueReport,
    getBookingStats,
    getStationPerformance,
    getRecentActivity,
    getStationsControl
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin', 'station_admin'));

router.get('/stations-list', getStationsControl);
router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueReport);
router.get('/bookings', getBookingStats);
router.get('/stations', getStationPerformance);
router.get('/activity', getRecentActivity);

export default router;

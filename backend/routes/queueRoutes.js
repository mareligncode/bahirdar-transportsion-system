import express from 'express';
import {
    joinQueue,
    getQueueByStation,
    leaveQueue,
    getNextVehicle,
    reorderQueue
} from '../controllers/queueController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Driver can join a station's queue
router.post('/join', authorize(['driver', 'station_admin', 'super_admin']), joinQueue);

// Leave/Cancel from queue
router.post('/leave/:queueID', authorize(['driver', 'station_admin', 'super_admin']), leaveQueue);

// View queue for a specific station
router.get('/station/:stationID', authorize(['driver', 'station_admin', 'super_admin', 'passenger']), getQueueByStation);

// Get the next in line
router.get('/next/:stationID', authorize(['station_admin', 'super_admin']), getNextVehicle);

// Admin reordering
router.put('/reorder/:queueID', authorize(['station_admin', 'super_admin']), reorderQueue);

export default router;

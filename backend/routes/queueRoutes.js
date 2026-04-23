import express from 'express';
import {
    joinQueue,
    getQueueByStation,
    leaveQueue,
    getNextVehicle,
    dispatchNextVehicle,
    reorderQueue,
    getMyQueueStatus
} from '../controllers/queueController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Driver can join a station's queue
router.get('/my-status', authorize(['driver']), getMyQueueStatus);
router.post('/join', authorize(['driver', 'station_admin', 'super_admin']), joinQueue);

// Leave/Cancel from queue
router.post('/leave/:queueID', authorize(['driver', 'station_admin', 'super_admin']), leaveQueue);

// View queue for a specific station
router.get('/station/:stationID', authorize(['driver', 'station_admin', 'super_admin', 'passenger']), getQueueByStation);

// Get the next in line
router.get('/next/:stationID', authorize(['station_admin', 'super_admin']), getNextVehicle);

// ACTUALLY Dispatch the next vehicle (trigger Trip creation)
router.post('/dispatch/:stationID', authorize(['station_admin', 'super_admin']), dispatchNextVehicle);

// Admin reordering
router.put('/reorder/:queueID', authorize(['station_admin', 'super_admin']), reorderQueue);

export default router;

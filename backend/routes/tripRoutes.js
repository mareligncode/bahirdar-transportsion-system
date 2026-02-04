import express from 'express';
import {
    createTrip,
    getAllTrips,
    getTripById,
    updateTrip,
    deleteTrip,
    searchTrips,
    updateTripStatus,
    getDriverTrips,
    toggleTripActive
} from '../controllers/tripController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/search', authorize(['passenger']), searchTrips);

router.get('/driver/assigned', authorize(['driver']), getDriverTrips);
router.patch('/:id/status', authorize(['driver', 'station_admin', 'super_admin']), updateTripStatus);

router.get('/', authorize(['passenger', 'driver', 'station_admin', 'super_admin']), getAllTrips);

router.get('/:id', authorize(['passenger', 'driver', 'station_admin', 'super_admin']), getTripById);

router.post('/', authorize(['station_admin', 'super_admin']), createTrip);

router.put('/:id', authorize(['station_admin', 'super_admin']), updateTrip);

router.patch('/:id/toggle-active', authorize(['station_admin', 'super_admin']), toggleTripActive);

router.delete('/:id', authorize(['station_admin', 'super_admin']), deleteTrip);

export default router;
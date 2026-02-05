import express from 'express';
import {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    checkInPassenger,
    getPassengerBookings,
    getTripBookings
} from '../controllers/bookingController.js'
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Passenger routes
router.get('/my-bookings', authorize(['passenger']), getPassengerBookings);
router.post('/', authorize(['passenger']), createBooking);
router.get('/:id', authorize(['passenger', 'driver', 'station_admin', 'super_admin']), getBookingById);
router.put('/:id', authorize(['passenger', 'station_admin', 'super_admin']), updateBooking);
router.delete('/:id', authorize(['passenger', 'station_admin', 'super_admin']), deleteBooking);

// Station admin and super admin routes
router.get('/', authorize(['station_admin', 'super_admin']), getAllBookings);
router.patch('/:id/status', authorize(['station_admin', 'super_admin']), updateBookingStatus);
router.patch('/:id/checkin', authorize(['station_admin']), checkInPassenger);

// Driver routes
router.get('/trip/:tripId', authorize(['driver', 'station_admin', 'super_admin']), getTripBookings);

export default router;
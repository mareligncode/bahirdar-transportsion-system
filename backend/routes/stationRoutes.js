import express from 'express';
import { body } from 'express-validator';
import {
    createStation,
    getStations,
    getStationById,
    updateStation,
    deleteStation,
    deactivateStation,
    activateStation,
    getActiveStations,
    createStationAnnouncement,
    getStationAnnouncements,
    deleteStationAnnouncement

} from '../controllers/stationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const stationValidationRules = [
    body('stationCode').notEmpty().withMessage('Station code is required'),
    body('stationName').notEmpty().withMessage('Station name is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('contactPhone').notEmpty().withMessage('Contact phone is required'),
    body('contactEmail').isEmail().withMessage('Valid email is required'),
    body('manager').optional().isMongoId().withMessage('Valid manager ID is required')
];

// All routes require authentication
router.use(protect);

// Public routes (authenticated users can view)
router.get('/', getStations);
router.get('/active', getActiveStations);
router.get('/:id', getStationById);

// Admin routes
router.post('/register', authorize(['super_admin']), stationValidationRules, createStation);

router.put( '/:id',authorize(['super_admin', 'station_admin']), stationValidationRules,  updateStation);

router.delete( '/:id', authorize(['super_admin']), deleteStation);

router.patch( '/:id/deactivate',  authorize(['super_admin']),  deactivateStation);

router.patch('/:id/activate', authorize(['super_admin']), activateStation);
router.post('/:id/announcements', authorize(['super_admin', 'station_admin']), createStationAnnouncement);
router.get('/:id/announcements', getStationAnnouncements);
router.delete('/:id/announcements/:announcementId', authorize(['super_admin', 'station_admin']), deleteStationAnnouncement);

export default router;
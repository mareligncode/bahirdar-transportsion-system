import express from 'express';
import {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    getAvailableVehicles,
    assignDriver,
    removeDriver,
    updateVehicleStatus,
    addMaintenanceRecord,
    getInsuranceExpiring,
    uploadVehicleImages,
    setPrimaryImage,
    removeVehicleImage,
    getVehicleImages,
    getVehicleWithImages,
    getPublicLiveVehicles,
    getMyVehicle
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (No login required)
router.get('/public-locations', getPublicLiveVehicles);

router.use(protect);

router.get('/my-vehicle', authorize(['driver']), getMyVehicle);
router.post('/register', authorize(['station_admin', 'super_admin']), createVehicle);
router.get('/', authorize(['driver', 'station_admin', 'super_admin']), getAllVehicles);
router.get('/available', authorize(['station_admin', 'super_admin']), getAvailableVehicles);
router.get('/insurance-expiring', authorize(['station_admin', 'super_admin']), getInsuranceExpiring);
router.get('/:id', authorize(['passenger', 'driver', 'station_admin', 'super_admin']), getVehicleById);
router.put('/:id', authorize(['station_admin', 'super_admin']), updateVehicle);
router.delete('/:id', authorize(['station_admin', 'super_admin']), deleteVehicle);

router.post('/:vehicleId/assign-driver/:driverId', authorize(['station_admin', 'super_admin']), assignDriver);
router.post('/:vehicleId/remove-driver', authorize(['station_admin', 'super_admin']), removeDriver);

router.post('/:vehicleId/status', authorize(['station_admin', 'super_admin']), updateVehicleStatus);
router.post('/:vehicleId/maintenance', authorize(['station_admin', 'super_admin']), addMaintenanceRecord);

router.post('/:vehicleId/upload-images', authorize(['station_admin', 'super_admin']), uploadVehicleImages);
router.post('/:vehicleId/set-primary-image', authorize(['station_admin', 'super_admin']), setPrimaryImage);
router.delete('/:vehicleId/images/:imageUrl', authorize(['station_admin', 'super_admin']), removeVehicleImage);
router.get('/:vehicleId/images', authorize(['passenger', 'driver', 'station_admin', 'super_admin']), getVehicleImages);
// Add this route
router.get('/:id/images-details', authorize(['passenger', 'driver', 'station_admin', 'super_admin']), getVehicleWithImages);

export default router;
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
    getInsuranceExpiring
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/register', authorize(['station_admin', 'super_admin']), createVehicle);
router.get('/', authorize([ 'driver', 'station_admin', 'super_admin']), getAllVehicles);
router.get('/available', authorize(['station_admin', 'super_admin']), getAvailableVehicles);
router.get('/insurance-expiring', authorize(['station_admin', 'super_admin']), getInsuranceExpiring);
router.get('/:id', authorize(['driver', 'station_admin', 'super_admin']), getVehicleById);
router.put('/:id', authorize(['station_admin', 'super_admin']), updateVehicle);
router.delete('/:id', authorize(['station_admin', 'super_admin']), deleteVehicle);

router.post('/:vehicleId/assign-driver/:driverId', authorize(['station_admin', 'super_admin']), assignDriver);
router.post('/:vehicleId/remove-driver', authorize(['station_admin', 'super_admin']), removeDriver);

router.post('/:vehicleId/status', authorize(['station_admin', 'super_admin']), updateVehicleStatus);
router.post('/:vehicleId/maintenance', authorize(['station_admin', 'super_admin']), addMaintenanceRecord);

export default router;
import express from 'express';
import {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute
} from '../controllers/routeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAllRoutes)
    .post(authorize('admin', 'station_admin'), createRoute);

router.route('/:id')
    .get(getRouteById)
    .put(authorize('admin', 'station_admin'), updateRoute)
    .delete(authorize('admin', 'station_admin'), deleteRoute);

export default router;

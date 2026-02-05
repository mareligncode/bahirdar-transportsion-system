import express from 'express';
import {
    register,
    login,
    refreshToken,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    validateResetToken,
    resetPassword
} from '../controllers/authController.js';
import {
    changeUserRole,
    assignPassengerToDriver,
    getAllUsers,
    getStationUsers,
    toggleUserStatus,
    getUserById
} from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected routes - All authenticated users
router.get('/profile', authMiddleware(), getProfile);
router.put('/profile', authMiddleware(), updateProfile);
router.put('/change-password', authMiddleware(), changePassword);

// Super Admin routes
router.post('/change-role', authMiddleware(['super_admin']), changeUserRole);
router.get('/all-users', authMiddleware(['super_admin']), getAllUsers);
router.get('/user/:id', authMiddleware(['super_admin']), getUserById);

// Station Admin routes
router.post('/assign-driver', authMiddleware(['station_admin']), assignPassengerToDriver);
router.get('/station-users', authMiddleware(['station_admin']), getStationUsers);
router.post('/toggle-status', authMiddleware(['station_admin',' super_admin']), toggleUserStatus);
router.get('/station-user/:id', authMiddleware(['station_admin']), getUserById);

// User self-view
router.get('/user-profile/:id', authMiddleware(), getUserById);
router.post('/forgot-password', forgotPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

export default router;
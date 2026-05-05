// routes/paymentRoutes.js
import express from 'express';
import {
    initializePayment,
    verifyPayment,
    manualVerifyPayment,
    getPaymentStatus,
    getPaymentHistory,
    handleWebhook,
    refundPayment,
    recordCashPayment,
    verifyBankReceipt,
    getPaymentInstructions
} from '../controllers/paymentController.js';
import upload from '../utils/multerConfig.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Registration of OCR route
router.post('/verify-receipt', protect, authorize(['passenger']), upload.single('receipt'), verifyBankReceipt);

router.post('/webhook', handleWebhook);

router.get('/verify/:tx_ref', verifyPayment);

router.use(protect);

router.post('/initialize', authorize(['passenger']), initializePayment);
router.get('/status', authorize(['passenger', 'station_admin', 'super_admin']), getPaymentStatus);
router.get('/history', authorize(['passenger']), getPaymentHistory);
router.get('/:bookingId/instructions', authorize(['passenger']), getPaymentInstructions);

router.post('/:paymentId/verify', authorize(['super_admin', 'station_admin']), manualVerifyPayment);
router.post('/cash-payment', authorize(['super_admin', 'station_admin']), recordCashPayment);
router.post('/:paymentId/refund', authorize(['super_admin']), refundPayment);

export default router;
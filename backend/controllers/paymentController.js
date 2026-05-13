import axios from 'axios';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import User from '../models/Users.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js'; // Added Station support
import OCRProcessor from '../utils/ocrProcessor.js';
import NotificationService from '../services/notificationService.js';
import cloudinary from '../config/cloudinary.js';
import { getPublicApiBaseUrl } from '../utils/publicApiBaseUrl.js';

export const initializePayment = async (req, res) => {
    try {
        console.log('=== PAYMENT INITIALIZATION STARTED ===');

        const bookingId = req.body.bookingId || req.body.bookingID;
        const { paymentMethod = 'mobile_money' } = req.body;
        const userId = req.user._id;
        if (req.user.role !== 'passenger') {
            return res.status(403).json({
                success: false,
                message: 'Only passengers can make payments'
            });
        }

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID is required'
            });
        }

        const mongoose = await import('mongoose');
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: `Invalid booking ID format: ${bookingId}`
            });
        }

        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'tripID',
                select: 'price origin destination departureTime tripNumber',
                populate: [
                    { path: 'origin', select: 'stationName' },
                    { path: 'destination', select: 'stationName' }
                ]
            })
            .populate('passengerID', 'fullName email phoneNumber');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        if (!booking.passengerID || !booking.passengerID._id.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'This booking does not belong to you'
            });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already paid'
            });
        }

        const existingPayment = await Payment.findOne({
            bookingID: bookingId,
            paymentStatus: { $in: ['pending', 'processing'] }
        });

        if (existingPayment && existingPayment.checkoutUrl) {
            return res.json({
                success: true,
                message: 'Payment already initialized',
                data: {
                    checkoutUrl: existingPayment.checkoutUrl,
                    paymentId: existingPayment._id,
                    bookingId: booking._id
                }
            });
        }

        console.log('🚀 Starting payment process...');

        const trip = booking.tripID;
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found for this booking'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const batchBookings = await Booking.find({
            tripID: booking.tripID,
            passengerID: userId,
            paymentStatus: { $in: ['pending', null, ''] },
            status: { $in: ['pending', 'confirmed'] },
            _id: { $ne: bookingId }
        });

        const isLegacyBatchBooking = batchBookings.length > 0;

        let amount = booking.totalPrice;

        if (!amount || amount === 0) {
            const seatCount = booking.seatCount || (booking.seatNumbers && booking.seatNumbers.length > 0 ? booking.seatNumbers.length : 1);
            if (isLegacyBatchBooking) {
                amount = booking.batchTotalPrice || (trip.price * (batchBookings.length + 1));
            } else {
                amount = trip.price * seatCount;
            }
        }


        const tx_ref = `CHAPA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const originStation = trip.origin?.stationName || 'Origin';
        const destStation = trip.destination?.stationName || 'Destination';

        const cleanOrigin = originStation.replace(/[^a-zA-Z0-9\s\-_\.]/g, ' ').trim();
        const cleanDest = destStation.replace(/[^a-zA-Z0-9\s\-_\.]/g, ' ').trim();

        let description = `Trip from ${cleanOrigin} to ${cleanDest}`;

        description = description.replace(/[^a-zA-Z0-9\s\-_\.]/g, ' ');
        description = description.replace(/\s+/g, ' ').trim();

        if (description.length > 50) {
            description = description.substring(0, 47) + '...';
        }

        if (!description || description.length < 5) {
            description = 'Transport Booking Payment';
        }

        const publicApiBase = getPublicApiBaseUrl(req);

        const chapaRequest = {
            amount: amount.toString(),
            currency: 'ETB',
            email: user.email || "maru@gmail.com",
            first_name: user.fullName.split(' ')[0] || 'Customer',
            last_name: user.fullName.split(' ').slice(1).join(' ') || 'User',
            tx_ref: tx_ref,
            callback_url: `${publicApiBase}/api/payment/webhook`,
            return_url: `${publicApiBase}/api/payment/verify/${tx_ref}`,
            customization: {
                title: 'BD Transport',
                description: description
            }
        };

        console.log('📤 Calling Chapa API...');
        console.log('Request details:', {
            amount: amount,
            email: user.email,
            tx_ref: tx_ref,
            title: chapaRequest.customization.title,
            titleLength: chapaRequest.customization.title.length,
            description: chapaRequest.customization.description,
            descLength: chapaRequest.customization.description.length,
            descValid: /^[a-zA-Z0-9\s\-_\.]*$/.test(chapaRequest.customization.description) ? '✅' : '❌'
        });

        let chapaResponse;
        try {
            chapaResponse = await axios.post(
                `${process.env.CHAPA_TEST_URL}/transaction/initialize`,
                chapaRequest,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            console.log(' Chapa API responded successfully');
        } catch (chapaError) {
            console.error(' Chapa API error:', chapaError.response?.data || chapaError.message);

            try {
                const failedPayment = new Payment({
                    bookingID: bookingId,
                    passengerID: userId,
                    amount: amount,
                    paymentGateway: 'chapa',
                    paymentStatus: 'failed',
                    reasonForFailure: JSON.stringify(chapaError.response?.data?.message) || chapaError.message,
                    gatewayResponse: chapaError.response?.data,
                    createdBy: userId
                });
                await failedPayment.save();
            } catch (dbError) {
                console.error('Failed to save error record:', dbError.message);
            }

            return res.status(400).json({
                success: false,
                message: 'Payment gateway error',
                error: chapaError.response?.data?.message || chapaError.message,
                details: chapaError.response?.data
            });
        }

        if (!chapaResponse.data || !chapaResponse.data.data || !chapaResponse.data.data.checkout_url) {
            console.error('Invalid Chapa response:', chapaResponse.data);
            return res.status(500).json({
                success: false,
                message: 'Invalid response from payment gateway',
                error: 'No checkout URL received'
            });
        }

        console.log('💰 Payment initialized successfully');
        console.log('🔗 Checkout URL:', chapaResponse.data.data.checkout_url);

        const payment = new Payment({
            bookingID: bookingId,
            passengerID: userId,
            amount: amount,
            paymentGateway: 'chapa',
            gatewayTransactionID: tx_ref,
            chapaReference: chapaResponse.data.data.checkout_url?.split('/').pop(),
            paymentMethod: paymentMethod,
            paymentStatus: 'pending',
            checkoutUrl: chapaResponse.data.data.checkout_url,
            gatewayResponse: chapaResponse.data,
            createdBy: userId
        });

        await payment.save();
        console.log('💾 Payment record saved');

        try {
            const notificationData = {
                userID: user._id,
                title: 'Booking Confirmed - Payment Pending',
                message: `Your booking ${booking.bookingNumber} has been confirmed. Please complete payment to secure your seat.`,
                type: 'booking_confirmation',
                channel: 'all',
                priority: 'medium',
                metadata: {
                    userName: user.fullName,
                    booking: {
                        _id: booking._id,
                        bookingNumber: booking.bookingNumber,
                        ticketNumber: booking.ticketNumber,
                        seatNumber: booking.seatNumber,
                        totalPrice: booking.totalPrice
                    },
                    trip: {
                        tripNumber: trip.tripNumber,
                        origin: trip.origin?.stationName,
                        destination: trip.destination?.stationName,
                        departureTime: trip.departureTime,
                        arrivalTime: trip.arrivalTime
                    },
                    payment: {
                        paymentID: payment._id,
                        amount: booking.totalPrice,
                        currency: 'ETB',
                        status: 'pending',
                        paymentURL: chapaResponse.data.data.checkout_url
                    },
                    vehicle: {
                        plateNumber: trip.vehicle?.plateNumber,
                        carType: trip.vehicle?.carType
                    },
                    driver: {
                        fullName: trip.driver?.fullName,
                        phoneNumber: trip.driver?.phoneNumber
                    },
                    actionURL: chapaResponse.data.data.checkout_url,
                    actionText: 'Complete Payment Now'
                }
            };

            await NotificationService.createNotification(notificationData);
            console.log(`✅ Booking confirmation notification sent for booking ${booking.bookingNumber}`);
        } catch (notificationError) {
            console.error(` Failed to send booking confirmation notification:`, notificationError.message);
        }

        booking.paymentID = payment._id;
        booking.paymentStatus = 'pending';
        await booking.save();
        console.log('📝 Booking updated');

        res.json({
            success: true,
            message: 'Payment initialized successfully',
            data: {
                checkoutUrl: chapaResponse.data.data.checkout_url,
                paymentId: payment._id,
                bookingId: booking._id,
                amount: amount,
                tx_ref: tx_ref,
                paymentStatus: 'pending'
            }
        });

    } catch (error) {
        console.error('❌ Payment initialization failed:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment',
            error: error.message
        });
    }
};
export const verifyPayment = async (req, res) => {
    try {
        const { tx_ref } = req.params;
        const io = req.app.get('io');
        const payment = await Payment.findOne({ gatewayTransactionID: tx_ref })
            .populate('bookingID')
            .populate('passengerID');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        if (payment.paymentStatus === 'success' || payment.paymentStatus === 'failed' || payment.paymentStatus === 'cancelled') {
            const bookingIdStr = payment.bookingID?._id || payment.bookingID;
            const redirectUrl = payment.paymentStatus === 'success'
                ? `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&success=true`
                : `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&error=payment_${payment.paymentStatus}`;

            if (req.headers.accept?.includes('text/html')) {
                return res.redirect(redirectUrl);
            }

            return res.json({
                success: payment.paymentStatus === 'success',
                message: `Payment already ${payment.paymentStatus}`,
                data: {
                    payment,
                    booking: payment.bookingID,
                    redirectUrl
                }
            });
        }
        let verifyResponse;
        try {
            verifyResponse = await axios.get(
                `${process.env.CHAPA_TEST_URL}/transaction/verify/${tx_ref}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.CHAPA_TEST_SECRET_KEY}`
                    },
                    timeout: 10000
                }
            );
        } catch (chapaError) {
            console.error('Chapa API verification failed:', chapaError.response?.data || chapaError.message);

            return res.status(500).json({
                success: false,
                message: 'Failed to verify with payment gateway',
                error: chapaError.response?.data?.message || chapaError.message
            });
        }
        if (!verifyResponse.data || !verifyResponse.data.data) {
            console.error('Invalid Chapa response structure:', verifyResponse.data);
            return res.status(500).json({
                success: false,
                message: 'Invalid response from payment gateway'
            });
        }

        const chapaData = verifyResponse.data.data;
        if (!chapaData.status) {
            console.error('Missing status in Chapa response:', chapaData);
            return res.status(500).json({
                success: false,
                message: 'Missing payment status in gateway response'
            });
        }
        let newPaymentStatus;
        let shouldReleaseSeat = false;

        switch (chapaData.status.toLowerCase()) {
            case 'success':
                newPaymentStatus = 'success';
                break;
            case 'failed':
            case 'cancelled':
                newPaymentStatus = 'failed';
                shouldReleaseSeat = true;
                break;
            case 'pending':
            case 'processing':
                newPaymentStatus = 'pending';
                break;
            default:
                console.warn(`Unknown Chapa status: ${chapaData.status}`);
                newPaymentStatus = 'failed';
                shouldReleaseSeat = true;
        }
        payment.paymentStatus = newPaymentStatus;
        payment.gatewayResponse = verifyResponse.data;
        payment.verifiedAt = new Date();
        if (newPaymentStatus === 'success' && chapaData.created_at) {
            payment.paymentDate = new Date(chapaData.created_at);
            payment.gatewayTransactionID = chapaData.id || payment.gatewayTransactionID;
        }

        await payment.save();

        const booking = payment.bookingID;
        if (booking) {
            booking.paymentStatus = newPaymentStatus === 'success' ? 'paid' : newPaymentStatus;
            if (newPaymentStatus === 'success') {
                booking.status = 'confirmed';
                booking.checkedIn = false; // Reset for new confirmed booking
            } else if (newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled') {
                booking.status = 'cancelled';
            }
            await booking.save();
            if (shouldReleaseSeat) {
                const trip = await Trip.findById(booking.tripID);
                if (trip) {
                    trip.availableSeats += 1;
                    await trip.save();
                }
            }
        }

        // Send notification using notification service
        try {
            if (payment.passengerID) {
                const notificationData = {
                    userID: payment.passengerID._id,
                    title: newPaymentStatus === 'success'
                        ? 'Payment Successful - Booking Confirmed'
                        : newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled'
                            ? 'Payment Failed - Please Try Again'
                            : 'Payment Status Updated',
                    message: newPaymentStatus === 'success'
                        ? `Your payment of ETB ${payment.amount} has been processed successfully. Your booking ${booking?.bookingNumber || ''} is now confirmed.`
                        : newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled'
                            ? `Your payment of ETB ${payment.amount} has ${newPaymentStatus === 'failed' ? 'failed' : 'been cancelled'}. Please try again or contact support.`
                            : `Your payment of ETB ${payment.amount} is still being processed. Please check back later.`,
                    type: newPaymentStatus === 'success' ? 'payment_success' : 'payment_failed',
                    channel: 'all', // Send both email and in-app notification
                    priority: newPaymentStatus === 'success' ? 'medium' : 'high',
                    metadata: {
                        userName: payment.passengerID.fullName,
                        booking: booking ? {
                            bookingNumber: booking.bookingNumber,
                            ticketNumber: booking.ticketNumber,
                            seatNumber: booking.seatNumber
                        } : null,
                        trip: booking?.tripID ? {
                            origin: booking.tripID.origin?.stationName,
                            destination: booking.tripID.destination?.stationName,
                            departureTime: booking.tripID.departureTime,
                            arrivalTime: booking.tripID.arrivalTime
                        } : null,
                        payment: {
                            amount: payment.amount,
                            paymentDate: new Date(),
                            gatewayTransactionID: tx_ref,
                            paymentMethod: payment.paymentMethod
                        },
                        actionURL: newPaymentStatus === 'success'
                            ? `${process.env.CLIENT_URL}/dashboard/bookings/${booking?._id}`
                            : newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled'
                                ? `${process.env.CLIENT_URL}/booking/${booking?._id}/pay`
                                : `${process.env.CLIENT_URL}/dashboard/bookings`,
                        actionText: newPaymentStatus === 'success' ? 'View Booking' : 'Retry Payment'
                    }
                };

                await NotificationService.createNotification(notificationData);
            }
        } catch (notificationError) {
            console.error('Failed to send payment notification:', notificationError);
        }

        // Send real-time notification via Socket.io
        if (io && payment.passengerID) {
            io.to(`user-${payment.passengerID._id}`).emit('payment-updated', {
                paymentId: payment._id,
                bookingId: payment.bookingID,
                status: newPaymentStatus,
                amount: payment.amount,
                timestamp: new Date()
            });
        }

        const bookingIdStr = payment.bookingID?._id || payment.bookingID;

        // Return response
        if (req.headers.accept?.includes('text/html')) {
            // For browser redirect
            let redirectUrl;
            if (newPaymentStatus === 'success') {
                redirectUrl = `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&success=true`;
            } else if (newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled') {
                redirectUrl = `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&error=payment_failed`;
            } else {
                redirectUrl = `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&status=${newPaymentStatus}`;
            }

            return res.redirect(redirectUrl);
        }

        // For API response
        res.json({
            success: newPaymentStatus === 'success',
            message: newPaymentStatus === 'success'
                ? 'Payment verified successfully'
                : newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled'
                    ? 'Payment verification failed'
                    : 'Payment status updated',
            data: {
                payment,
                booking,
                redirectUrl: newPaymentStatus === 'success'
                    ? `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&success=true`
                    : newPaymentStatus === 'failed' || newPaymentStatus === 'cancelled'
                        ? `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&error=payment_failed`
                        : `${process.env.CLIENT_URL}/booking/confirmation?bookingId=${bookingIdStr}&status=${newPaymentStatus}`
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error.response?.data || error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.response?.data?.message || error.message
        });
    }
};

export const manualVerifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)
            .populate('bookingID')
            .populate('passengerID');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (!payment.gatewayTransactionID) {
            return res.status(400).json({
                success: false,
                message: 'No transaction ID found for this payment'
            });
        }

        // Call verify function
        req.params.tx_ref = payment.gatewayTransactionID;
        return verifyPayment(req, res);

    } catch (error) {
        console.error('Manual verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

export const getPaymentStatus = async (req, res) => {
    try {
        const { bookingId, paymentId } = req.query;

        let query = {};

        if (paymentId) {
            query._id = paymentId;
        } else if (bookingId) {
            query.bookingID = bookingId;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either bookingId or paymentId is required'
            });
        }

        // For passengers, only allow viewing their own payments
        if (req.user.role === 'passenger') {
            query.passengerID = req.user._id;
        }

        // For station admin, only allow payments from their station
        if (req.user.role === 'station_admin') {
            // Find station managed by this admin
            if (!req.user.stationID) {
                return res.status(403).json({
                    success: false,
                    message: 'No station assigned to this admin'
                });
            }

            // We'll need to join with booking and trip to check station
            const payment = await Payment.findOne(query)
                .populate({
                    path: 'bookingID',
                    populate: {
                        path: 'tripID',
                        match: { station: station._id }
                    }
                });

            if (!payment || !payment.bookingID || !payment.bookingID.tripID) {
                return res.status(403).json({
                    success: false,
                    message: 'Payment not found or access denied'
                });
            }

            return res.json({
                success: true,
                data: payment
            });
        }

        const payment = await Payment.findOne(query)
            .populate('bookingID')
            .populate('passengerID', 'fullName email phoneNumber')
            .populate('tripID', 'origin destination departureTime price');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payment
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: error.message
        });
    }
};

export const getPaymentHistory = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        let query = { passengerID: userId };

        // Apply filters
        if (status && status !== 'all') {
            query.paymentStatus = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const payments = await Payment.find(query)
            .populate('bookingID', 'bookingNumber ticketNumber seatNumber')
            .populate('tripID', 'origin destination departureTime')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);
        const totalAmount = await Payment.aggregate([
            { $match: { ...query, paymentStatus: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: payments,
            summary: {
                totalPayments: total,
                successfulPayments: await Payment.countDocuments({ ...query, paymentStatus: 'success' }),
                totalAmountSpent: totalAmount[0]?.total || 0
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment history',
            error: error.message
        });
    }
};

export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['chapa-signature'];
        const payload = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', process.env.CHAPA_TEST_SECRET_KEY)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('Invalid webhook signature');
            return res.status(400).send('Invalid signature');
        }

        const event = req.body;
        const txRef = event.tx_ref;

        // Find payment by transaction reference
        const payment = await Payment.findOne({ gatewayTransactionID: txRef });

        if (!payment) {
            console.warn(`Payment not found for tx_ref: ${txRef}`);
            return res.status(404).send('Payment not found');
        }

        // Update payment based on webhook event
        switch (event.event) {
            case 'charge.completed':
                payment.paymentStatus = 'success';
                payment.paymentDate = new Date();
                break;

            case 'charge.failed':
                payment.paymentStatus = 'failed';
                payment.reasonForFailure = event.data?.failure_message || 'Payment failed';
                break;

            case 'charge.dispute.created':
                payment.paymentStatus = 'disputed';
                break;

            default:
                console.log(`Unhandled webhook event: ${event.event}`);
        }

        payment.gatewayResponse = event;
        payment.verifiedAt = new Date();
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.bookingID);
        if (booking) {
            booking.paymentStatus = payment.paymentStatus === 'success' ? 'paid' : payment.paymentStatus;
            if (payment.paymentStatus === 'success') {
                booking.status = 'confirmed';
            }
            await booking.save();

            // Update trip seats if payment failed
            if (payment.paymentStatus === 'failed') {
                const trip = await Trip.findById(booking.tripID);
                if (trip) {
                    trip.availableSeats += 1;
                    await trip.save();
                }
            }
        }

        // Send real-time notification
        const io = req.app.get('io');
        if (io && payment.passengerID) {
            io.to(`user-${payment.passengerID}`).emit('payment-webhook', {
                paymentId: payment._id,
                status: payment.paymentStatus,
                event: event.event,
                timestamp: new Date()
            });
        }

        res.status(200).send('Webhook received');

    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).send('Internal server error');
    }
};

export const refundPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { refundAmount, reason } = req.body;

        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can issue refunds'
            });
        }

        const payment = await Payment.findById(paymentId)
            .populate('bookingID')
            .populate('passengerID');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.paymentStatus !== 'success') {
            return res.status(400).json({
                success: false,
                message: 'Can only refund successful payments'
            });
        }

        if (payment.paymentStatus === 'refunded') {
            return res.status(400).json({
                success: false,
                message: 'Payment already refunded'
            });
        }

        const amountToRefund = refundAmount || payment.amount;

        if (amountToRefund > payment.amount) {
            return res.status(400).json({
                success: false,
                message: `Refund amount cannot exceed original payment (${payment.amount})`
            });
        }

        // In real implementation, you would call Chapa refund API here
        // For now, we'll just update the status

        payment.paymentStatus = 'refunded';
        payment.refundAmount = amountToRefund;
        payment.refundedAt = new Date();
        payment.metadata.refundReason = reason;
        payment.metadata.refundedBy = req.user._id;
        await payment.save();

        // Update booking
        const booking = await Booking.findById(payment.bookingID);
        if (booking) {
            booking.status = 'cancelled';
            booking.refundAmount = amountToRefund;
            booking.cancellationReason = `Refund: ${reason}`;
            await booking.save();
        }

        // Update trip seats
        const trip = await Trip.findById(booking?.tripID);
        if (trip) {
            trip.availableSeats += 1;
            await trip.save();
        }

        // Send refund notification using notification service
        try {
            if (payment.passengerID) {
                const notificationData = {
                    userID: payment.passengerID._id,
                    title: 'Refund Processed Successfully',
                    message: `Your refund of ETB ${amountToRefund} has been processed successfully. The amount will be credited back to your original payment method within 3-5 business days.`,
                    type: 'refund_processed',
                    channel: 'all', // Send both email and in-app notification
                    priority: 'medium',
                    metadata: {
                        userName: payment.passengerID.fullName,
                        booking: booking ? {
                            bookingNumber: booking.bookingNumber,
                            ticketNumber: booking.ticketNumber,
                            seatNumber: booking.seatNumber
                        } : null,
                        payment: {
                            amount: payment.amount,
                            refundAmount: amountToRefund,
                            refundedAt: new Date(),
                            gatewayTransactionID: payment.gatewayTransactionID,
                            refundReason: reason
                        },
                        actionURL: `${process.env.CLIENT_URL}/dashboard/bookings/${booking?._id}`,
                        actionText: 'View Booking Details'
                    }
                };

                await NotificationService.createNotification(notificationData);
            }
        } catch (notificationError) {
            console.error('Failed to send refund notification:', notificationError);
        }

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: {
                payment,
                refundAmount: amountToRefund,
                booking: booking ? {
                    id: booking._id,
                    status: booking.status
                } : null
            }
        });

    } catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message
        });
    }
};

/**
 * Record a manual cash payment (Station Admin / Super Admin only)
 */
export const recordCashPayment = async (req, res) => {
    try {
        const { bookingId, amount, notes } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'Booking ID is required' });
        }

        const booking = await Booking.findById(bookingId).populate('tripID');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'Booking is already paid' });
        }

        // Verify station admin has permission for this station
        if (req.user.role === 'station_admin') {
            const Station = (await import('../models/Station.js')).default;
            if (!req.user.stationID || !booking.tripID.station.equals(req.user.stationID)) {
                return res.status(403).json({ success: false, message: 'Not authorized for this station' });
            }
        }

        // Create Payment record
        const payment = new Payment({
            bookingID: bookingId,
            passengerID: booking.passengerID,
            tripID: booking.tripID._id,
            amount: amount || booking.totalPrice,
            paymentGateway: 'cash',
            paymentMethod: 'cash',
            paymentStatus: 'success',
            paymentDate: new Date(),
            verifiedAt: new Date(),
            metadata: {
                notes,
                recordedBy: req.user.id,
                recordedByRole: req.user.role
            },
            createdBy: req.user.id
        });

        await payment.save();

        // Update Booking
        booking.paymentID = payment._id;
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        await booking.save();

        // Notify Passenger
        try {
            await NotificationService.createNotification({
                userID: booking.passengerID,
                title: 'Payment Received (Cash)',
                message: `Your cash payment of ETB ${payment.amount} for booking ${booking.bookingNumber} has been recorded. Your ticket is now confirmed.`,
                type: 'payment_success',
                priority: 'medium',
                channel: 'all',
                metadata: {
                    bookingNumber: booking.bookingNumber,
                    amount: payment.amount,
                    method: 'cash'
                }
            });
        } catch (notifyErr) {
            console.error('Failed to notify passenger of cash payment:', notifyErr);
        }

        res.status(200).json({
            success: true,
            message: 'Cash payment recorded successfully',
            data: payment
        });

    } catch (error) {
        console.error('Cash payment recording failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record cash payment',
            error: error.message
        });
    }
};
/**
 * Verify CBE Bank Receipt Screenshot using OCR (Smart Review)
 */
export const verifyBankReceipt = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a receipt screenshot' });
        }

        const booking = await Booking.findById(bookingId).populate('tripID');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const vehicle = await Vehicle.findById(booking.tripID?.vehicle);

        // 1. OCR Extraction
        console.log('🖼 Processing receipt with OCR...');
        const extractedData = await OCRProcessor.processCBEReceipt(req.file.path || req.file.buffer);

        // 2. Upload to Cloudinary for persistence
        let cloudinaryUrl = '';
        try {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'cbe_receipts',
                    public_id: `receipt_${booking.bookingNumber}_${Date.now()}`
                }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });

                if (req.file.buffer) {
                    uploadStream.end(req.file.buffer);
                } else if (req.file.path) {
                    // If using multer DiskStorage
                    cloudinary.uploader.upload(req.file.path).then(resolve).catch(reject);
                }
            });
            cloudinaryUrl = result.secure_url;
        } catch (cldErr) {
            console.error('Cloudinary upload failed:', cldErr);
        }

        // 3. Prevent Duplicates (Only if Transaction ID was found)
        if (extractedData.transactionID) {
            const existingPayment = await Payment.findOne({ gatewayTransactionID: extractedData.transactionID });
            if (existingPayment) {
                return res.status(400).json({ success: false, message: 'This transaction ID has already been used.' });
            }
        }

        // 4. Validation & Smart Review Logic
        // Fallback: If booking.totalPrice is 0 (old data), use trip price
        const requiredAmount = booking.totalPrice > 0 ? booking.totalPrice : (booking.tripID?.price || 0);
        const amountMatch = Math.abs(extractedData.amount - requiredAmount) < 2;

        const ownerName = (vehicle?.ownerDetails?.ownerName || "").toLowerCase();
        const ownerAccount = (vehicle?.ownerDetails?.bankDetails?.accountNumber || "").replace(/\s+/g, '');
        const extractedReceiver = (extractedData.receiverName || "").toLowerCase();
        const extractedAccount = (extractedData.accountNumber || "").replace(/\s+/g, '');

        console.log(`🔍 Validation Match Check:`);
        console.log(`Name: System(${ownerName}) vs Receipt(${extractedReceiver})`);
        console.log(`Account: System(${ownerAccount}) vs Receipt(${extractedAccount})`);

        // Stricter matching logic
        const nameMatch = extractedReceiver && ownerName &&
            (extractedReceiver.includes(ownerName) || ownerName.includes(extractedReceiver) ||
                ownerName.split(' ').some(part => part.length > 3 && extractedReceiver.includes(part)));

        const accountMatchStatus = extractedAccount && ownerAccount ? (extractedAccount === ownerAccount) : null;

        // A payment is solid if amount matches AND (name matches OR account matches)
        // If account matches exactly, we trust it highly.
        const isVerified = amountMatch && (accountMatchStatus === true || (accountMatchStatus === null && nameMatch));
        const isSuspicious = !isVerified || (extractedData.confidence < 70);

        if (!amountMatch) {
            return res.status(422).json({
                success: false,
                message: `Amount mismatch. Expected: ETB ${requiredAmount}, Detected: ETB ${extractedData.amount || 0}. Please ensure you transferred the correct amount.`,
                extracted: extractedData
            });
        }

        if (accountMatchStatus === false) {
            return res.status(422).json({
                success: false,
                message: `Account Number mismatch. Detected: ${extractedAccount}, Expected: ${ownerAccount}. Please send funds to the correct account.`,
                extracted: extractedData
            });
        }

        if (extractedData.confidence < 70) {
            return res.status(422).json({
                success: false,
                message: `Image quality too low (Confidence: ${Math.round(extractedData.confidence)}%). Please provide a clearer, brighter photo of the receipt.`,
                extracted: extractedData
            });
        }

        // If amount and account match, we are good.
        // If amount matches but account was null, we check name.
        if (!isVerified && !nameMatch && accountMatchStatus === null) {
            return res.status(422).json({
                success: false,
                message: `Receiver name mismatch. Receipt says "${extractedReceiver}", but owner name is "${ownerName}". Please check the recipient name.`,
                extracted: extractedData
            });
        }

        // 5. Finalize Payment
        const paymentData = {
            bookingID: booking._id,
            passengerID: req.user._id,
            tripID: booking.tripID?._id || booking.tripID,
            amount: extractedData.amount,
            paymentGateway: 'bank_transfer_receipt',
            paymentMethod: 'bank_transfer',
            paymentStatus: 'success',
            gatewayTransactionID: extractedData.transactionID,
            verifiedAt: new Date(),
            metadata: {
                extracted: extractedData,
                receipt_url: cloudinaryUrl,
                verificationMethod: 'OCR_Tesseract_SmartReview',
                flags: {
                    smartVerified: true,
                    confidenceScore: extractedData.confidence,
                    nameMatched: nameMatch
                }
            },
            createdBy: req.user._id
        };

        // Use findOneAndUpdate with upsert:true to handle re-uploads for the same booking
        const payment = await Payment.findOneAndUpdate(
            { bookingID: booking._id },
            { $set: paymentData },
            { new: true, upsert: true, runValidators: true }
        );

        if (payment) {
            booking.paymentID = payment._id;
            booking.paymentStatus = 'paid';
            booking.status = 'confirmed';
            await booking.save();
        }

        res.status(200).json({
            success: true,
            message: 'Receipt verified and booking confirmed successfully!',
            data: { payment, extracted: extractedData }
        });

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
};

/**
 * Get payment instructions for a booking (CBE details)
 */
export const getPaymentInstructions = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId).populate('tripID');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const vehicle = await Vehicle.findById(booking.tripID?.vehicle);
        if (!vehicle || !vehicle.ownerDetails) {
            return res.status(404).json({ success: false, message: 'Bank details for this vehicle are not configured' });
        }

        res.status(200).json({
            success: true,
            data: {
                amount: booking.totalPrice || booking.tripID?.price,
                bankName: vehicle.ownerDetails.bankDetails?.bankName || "Commercial Bank of Ethiopia (CBE)",
                accountNumber: vehicle.ownerDetails.bankDetails?.accountNumber,
                accountName: vehicle.ownerDetails.ownerName,
                instructions: `Please transfer ETB ${booking.totalPrice || booking.tripID?.price} to the account above. After payment, take a screenshot of the receipt and upload it here.`
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch payment instructions', error: error.message });
    }
};

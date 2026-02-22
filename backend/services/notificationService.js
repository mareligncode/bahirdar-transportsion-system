import Notification from '../models/Notification.js';
import User from '../models/Users.js';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Payment from '../models/Payment.js';
import { sendEmail } from '../utils/emailService.js';


class NotificationService {
    
    /**
     * Create a notification
     */
    static async createNotification(notificationData) {
        try {
            const notification = new Notification(notificationData);
            await notification.save();
            
            if (notification.channel === 'email' || notification.channel === 'all') {
                await this.sendEmailNotification(notification);
            }
            
            if (notification.channel === 'in_app' || notification.channel === 'all') {
                await this.sendInAppNotification(notification);
            }
            
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }
    
    /**
     * Send email notification with proper template
     */
    static async sendEmailNotification(notification) {
        try {
            const user = await User.findById(notification.userID);
            if (!user || !user.email) {
                throw new Error('User not found or email not available');
            }
            
            const template = this.getEmailTemplate(notification);
            
            await sendEmail({
                to: user.email,
                subject: template.subject,
                html: template.html,
                text: template.text
            });
            
            notification.status = 'sent';
            notification.sentAt = new Date();
            await notification.save();
            
        } catch (error) {
            console.error('Error sending email notification:', error);
            notification.status = 'failed';
            notification.errorMessage = error.message;
            await notification.save();
            throw error;
        }
    }
    
    /**
     * Send in-app notification via Socket.io
     */
    static async sendInAppNotification(notification) {
        try {
            const io = global.io; // Socket.io instance should be available globally
            
            if (io) {
                io.to(`user-${notification.userID}`).emit('notification', {
                    id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    priority: notification.priority,
                    createdAt: notification.createdAt,
                    metadata: notification.metadata
                });
            }
            
            notification.status = 'delivered';
            notification.deliveredAt = new Date();
            await notification.save();
            
        } catch (error) {
            console.error('Error sending in-app notification:', error);
            notification.status = 'failed';
            notification.errorMessage = error.message;
            await notification.save();
            throw error;
        }
    }
    
    /**
     * Get email template based on notification type
     */
    static getEmailTemplate(notification) {
        // The user data should be populated when the notification is created
        // But we'll use the metadata.userName if available, otherwise fall back to User model
        const userName = notification.metadata?.userName || 'Valued Customer';
        
        switch (notification.type) {
            case 'payment_success':
                return this.getPaymentSuccessTemplate(notification);
            case 'payment_failed':
                return this.getPaymentFailedTemplate(notification);
            case 'trip_update':
                return this.getTripUpdateTemplate(notification);
            case 'trip_cancellation':
                return this.getTripCancellationTemplate(notification);
            case 'trip_delay':
                return this.getTripDelayTemplate(notification);
            case 'trip_reminder':
                return this.getTripReminderTemplate(notification);
            case 'booking_cancellation':
                return this.getBookingCancellationTemplate(notification);
            case 'refund_processed':
                return this.getRefundProcessedTemplate(notification);
            case 'driver_assignment':
                return this.getDriverAssignmentTemplate(notification);
            case 'driver_update':
                return this.getDriverUpdateTemplate(notification);
            case 'station_announcement':
                return this.getStationAnnouncementTemplate(notification);
            case 'system_alert':
                return this.getSystemAlertTemplate(notification);
            case 'promotional':
                return this.getPromotionalTemplate(notification);
            default:
                return this.getDefaultTemplate(notification);
        }
    }
    
    /**
     * Booking Confirmation Template
     */
    static getBookingConfirmationTemplate(notification) {
        const booking = notification.metadata.booking;
        const trip = notification.metadata.trip;
        
        return {
            subject: 'Booking Confirmed - Your Trip is Ready!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center;">
                        <h1>✓ Booking Confirmed</h1>
                        <p>Your trip is confirmed and ready to go!</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>Great news! Your booking has been confirmed successfully.</p>
                        
                        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Booking Details:</h3>
                            <p><strong>Booking Number:</strong> ${booking?.bookingNumber || 'N/A'}</p>
                            <p><strong>Ticket Number:</strong> ${booking?.ticketNumber || 'N/A'}</p>
                            <p><strong>Seat Number:</strong> ${booking?.seatNumber || 'N/A'}</p>
                            <p><strong>Passenger:</strong> ${notification.metadata.userName}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Information:</h3>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Arrival:</strong> ${trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Vehicle:</strong> ${trip?.vehicle?.plateNumber || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Important Information:</h3>
                            <ul>
                                <li>Please arrive at the station 30 minutes before departure</li>
                                <li>Bring your ID and ticket confirmation</li>
                                <li>Check-in opens 1 hour before departure</li>
                                <li>Seat assignments are final once confirmed</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard/bookings/${booking?._id}" 
                               style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                View Booking Details
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you have any questions or need assistance, please contact our customer support team.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

Your booking has been confirmed successfully!

Booking Details:
- Booking Number: ${notification.metadata.booking?.bookingNumber || 'N/A'}
- Ticket Number: ${notification.metadata.booking?.ticketNumber || 'N/A'}
- Seat Number: ${notification.metadata.booking?.seatNumber || 'N/A'}

Trip Information:
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}
- Arrival: ${notification.metadata.trip?.arrivalTime ? new Date(notification.metadata.trip.arrivalTime).toLocaleString() : 'N/A'}

Please arrive at the station 30 minutes before departure with your ID and ticket confirmation.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Payment Success Template
     */
    static getPaymentSuccessTemplate(notification) {
        const payment = notification.metadata.payment;
        const booking = notification.metadata.booking;
        
        return {
            subject: 'Payment Successful - Booking Confirmed!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center;">
                        <h1>✓ Payment Successful</h1>
                        <p>Your payment has been processed successfully!</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>Great news! Your payment has been processed successfully.</p>
                        
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Payment Details:</h3>
                            <p><strong>Amount Paid:</strong> ETB ${payment?.amount || 'N/A'}</p>
                            <p><strong>Payment Date:</strong> ${payment?.paymentDate ? new Date(payment.paymentDate).toLocaleString() : new Date().toLocaleString()}</p>
                            <p><strong>Transaction ID:</strong> ${payment?.gatewayTransactionID || 'N/A'}</p>
                            <p><strong>Payment Method:</strong> ${payment?.paymentMethod || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Booking Status:</h3>
                            <p><strong>Booking Number:</strong> ${booking?.bookingNumber || 'N/A'}</p>
                            <p><strong>Status:</strong> Confirmed</p>
                            <p><strong>Seat Number:</strong> ${booking?.seatNumber || 'N/A'}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard/bookings/${booking?._id}" 
                               style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                View Booking
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Your booking is now confirmed. Please keep this email for your records.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

Your payment has been processed successfully!

Payment Details:
- Amount Paid: ETB ${notification.metadata.payment?.amount || 'N/A'}
- Payment Date: ${notification.metadata.payment?.paymentDate ? new Date(notification.metadata.payment.paymentDate).toLocaleString() : new Date().toLocaleString()}
- Transaction ID: ${notification.metadata.payment?.gatewayTransactionID || 'N/A'}

Booking Status:
- Booking Number: ${notification.metadata.booking?.bookingNumber || 'N/A'}
- Status: Confirmed
- Seat Number: ${notification.metadata.booking?.seatNumber || 'N/A'}

Your booking is now confirmed. Please keep this email for your records.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Payment Failed Template
     */
    static getPaymentFailedTemplate(notification) {
        const payment = notification.metadata.payment;
        const booking = notification.metadata.booking;
        
        return {
            subject: 'Payment Failed - Please Try Again',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                        <h1>⚠ Payment Failed</h1>
                        <p>Your payment could not be processed</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We're sorry, but your payment could not be processed.</p>
                        
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Payment Details:</h3>
                            <p><strong>Amount:</strong> ETB ${payment?.amount || 'N/A'}</p>
                            <p><strong>Attempted:</strong> ${payment?.paymentDate ? new Date(payment.paymentDate).toLocaleString() : new Date().toLocaleString()}</p>
                            <p><strong>Transaction ID:</strong> ${payment?.gatewayTransactionID || 'N/A'}</p>
                            <p><strong>Reason:</strong> ${notification.metadata.reason || 'Payment processing failed'}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">What to Do Next:</h3>
                            <ul>
                                <li>Check your payment method and try again</li>
                                <li>Ensure you have sufficient funds</li>
                                <li>Contact your bank if the issue persists</li>
                                <li>Or contact our support team for assistance</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/booking/${booking?._id}/pay" 
                               style="display: inline-block; padding: 12px 24px; background-color: #e74c3c; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                Try Payment Again
                            </a>
                            <a href="${process.env.CLIENT_URL}/support" 
                               style="display: inline-block; padding: 12px 24px; background-color: #95a5a6; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-left: 10px;">
                                Contact Support
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Your booking is still pending. Please complete payment to confirm your reservation.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We're sorry, but your payment could not be processed.

Payment Details:
- Amount: ETB ${notification.metadata.payment?.amount || 'N/A'}
- Attempted: ${notification.metadata.payment?.paymentDate ? new Date(notification.metadata.payment.paymentDate).toLocaleString() : new Date().toLocaleString()}
- Transaction ID: ${notification.metadata.payment?.gatewayTransactionID || 'N/A'}
- Reason: ${notification.metadata.reason || 'Payment processing failed'}

What to Do Next:
- Check your payment method and try again
- Ensure you have sufficient funds
- Contact your bank if the issue persists
- Or contact our support team for assistance

Your booking is still pending. Please complete payment to confirm your reservation.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Trip Update Template
     */
    static getTripUpdateTemplate(notification) {
        const trip = notification.metadata.trip;
        
        return {
            subject: 'Trip Information Updated',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #f39c12; color: white; padding: 20px; text-align: center;">
                        <h1>ℹ Trip Updated</h1>
                        <p>Important information about your trip</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We have important updates regarding your upcoming trip.</p>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Details:</h3>
                            <p><strong>Trip Number:</strong> ${trip?.tripNumber || 'N/A'}</p>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Original Departure:</strong> ${trip?.originalDepartureTime ? new Date(trip.originalDepartureTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Updated Information:</h3>
                            <p><strong>New Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>New Arrival:</strong> ${trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Vehicle:</strong> ${trip?.vehicle?.plateNumber || 'N/A'}</p>
                            <p><strong>Driver:</strong> ${trip?.driver?.fullName || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Important:</h3>
                            <p>${notification.message}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            We apologize for any inconvenience. Please update your plans accordingly.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We have important updates regarding your upcoming trip.

Trip Details:
- Trip Number: ${notification.metadata.trip?.tripNumber || 'N/A'}
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Original Departure: ${notification.metadata.trip?.originalDepartureTime ? new Date(notification.metadata.trip.originalDepartureTime).toLocaleString() : 'N/A'}

Updated Information:
- New Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}
- New Arrival: ${notification.metadata.trip?.arrivalTime ? new Date(notification.metadata.trip.arrivalTime).toLocaleString() : 'N/A'}
- Vehicle: ${notification.metadata.trip?.vehicle?.plateNumber || 'N/A'}
- Driver: ${notification.metadata.trip?.driver?.fullName || 'N/A'}

Important: ${notification.message}

We apologize for any inconvenience. Please update your plans accordingly.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Trip Cancellation Template
     */
    static getTripCancellationTemplate(notification) {
        const trip = notification.metadata.trip;
        
        return {
            subject: 'Trip Cancelled - Refund Information',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                        <h1>❌ Trip Cancelled</h1>
                        <p>Your trip has been cancelled</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We regret to inform you that your trip has been cancelled.</p>
                        
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Cancelled Trip:</h3>
                            <p><strong>Trip Number:</strong> ${trip?.tripNumber || 'N/A'}</p>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Scheduled Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Cancellation Reason:</h3>
                            <p>${notification.metadata.reason || 'Operational reasons'}</p>
                        </div>
                        
                        <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Refund Information:</h3>
                            <p><strong>Refund Amount:</strong> ETB ${notification.metadata.refundAmount || 'To be determined'}</p>
                            <p><strong>Refund Method:</strong> Original payment method</p>
                            <p><strong>Processing Time:</strong> 5-7 business days</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard/bookings" 
                               style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                View Bookings
                            </a>
                            <a href="${process.env.CLIENT_URL}/support" 
                               style="display: inline-block; padding: 12px 24px; background-color: #95a5a6; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-left: 10px;">
                                Contact Support
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            We apologize for any inconvenience this may cause. Our support team is available to assist you with rebooking or any other questions.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We regret to inform you that your trip has been cancelled.

Cancelled Trip:
- Trip Number: ${notification.metadata.trip?.tripNumber || 'N/A'}
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Scheduled Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}

Cancellation Reason: ${notification.metadata.reason || 'Operational reasons'}

Refund Information:
- Refund Amount: ETB ${notification.metadata.refundAmount || 'To be determined'}
- Refund Method: Original payment method
- Processing Time: 5-7 business days

We apologize for any inconvenience this may cause. Our support team is available to assist you with rebooking or any other questions.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Trip Delay Template
     */
    static getTripDelayTemplate(notification) {
        const trip = notification.metadata.trip;
        
        return {
            subject: 'Trip Delayed - Updated Schedule',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #f39c12; color: white; padding: 20px; text-align: center;">
                        <h1>⏱ Trip Delayed</h1>
                        <p>Your trip has been delayed</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We regret to inform you that your trip has been delayed.</p>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Details:</h3>
                            <p><strong>Trip Number:</strong> ${trip?.tripNumber || 'N/A'}</p>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Original Departure:</strong> ${trip?.originalDepartureTime ? new Date(trip.originalDepartureTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">New Schedule:</h3>
                            <p><strong>Delayed Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Estimated Arrival:</strong> ${trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Delay Duration:</strong> ${notification.metadata.delayDuration || 'To be determined'}</p>
                        </div>
                        
                        <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Delay Reason:</h3>
                            <p>${notification.metadata.reason || 'Traffic conditions'}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard/bookings" 
                               style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                View Booking
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            We apologize for the inconvenience and appreciate your understanding. Please plan accordingly for the new departure time.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We regret to inform you that your trip has been delayed.

Trip Details:
- Trip Number: ${notification.metadata.trip?.tripNumber || 'N/A'}
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Original Departure: ${notification.metadata.trip?.originalDepartureTime ? new Date(notification.metadata.trip.originalDepartureTime).toLocaleString() : 'N/A'}

New Schedule:
- Delayed Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}
- Estimated Arrival: ${notification.metadata.trip?.arrivalTime ? new Date(notification.metadata.trip.arrivalTime).toLocaleString() : 'N/A'}
- Delay Duration: ${notification.metadata.delayDuration || 'To be determined'}

Delay Reason: ${notification.metadata.reason || 'Traffic conditions'}

We apologize for the inconvenience and appreciate your understanding. Please plan accordingly for the new departure time.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Trip Reminder Template
     */
    static getTripReminderTemplate(notification) {
        const trip = notification.metadata.trip;
        const booking = notification.metadata.booking;
        
        return {
            subject: 'Trip Reminder - Your Journey is Coming Up',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
                        <h1>⏰ Trip Reminder</h1>
                        <p>Your journey is coming up soon!</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>This is a friendly reminder about your upcoming trip.</p>
                        
                        <div style="background-color: #e8f5e9; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Information:</h3>
                            <p><strong>Booking Number:</strong> ${booking?.bookingNumber || 'N/A'}</p>
                            <p><strong>Ticket Number:</strong> ${booking?.ticketNumber || 'N/A'}</p>
                            <p><strong>Seat Number:</strong> ${booking?.seatNumber || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Journey Details:</h3>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Arrival:</strong> ${trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Vehicle:</strong> ${trip?.vehicle?.plateNumber || 'N/A'}</p>
                            <p><strong>Driver:</strong> ${trip?.driver?.fullName || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Important Reminders:</h3>
                            <ul>
                                <li>Arrive at the station 30 minutes before departure</li>
                                <li>Bring your ID and ticket confirmation</li>
                                <li>Check-in opens 1 hour before departure</li>
                                <li>Have your boarding pass ready</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL}/dashboard/bookings/${booking?._id}" 
                               style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                View Booking Details
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            We look forward to serving you. If you have any questions, please contact our support team.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

This is a friendly reminder about your upcoming trip.

Trip Information:
- Booking Number: ${notification.metadata.booking?.bookingNumber || 'N/A'}
- Ticket Number: ${notification.metadata.booking?.ticketNumber || 'N/A'}
- Seat Number: ${notification.metadata.booking?.seatNumber || 'N/A'}

Journey Details:
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}
- Arrival: ${notification.metadata.trip?.arrivalTime ? new Date(notification.metadata.trip.arrivalTime).toLocaleString() : 'N/A'}
- Vehicle: ${notification.metadata.trip?.vehicle?.plateNumber || 'N/A'}
- Driver: ${notification.metadata.trip?.driver?.fullName || 'N/A'}

Important Reminders:
- Arrive at the station 30 minutes before departure
- Bring your ID and ticket confirmation
- Check-in opens 1 hour before departure
- Have your boarding pass ready

We look forward to serving you. If you have any questions, please contact our support team.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Booking Cancellation Template
     */
    static getBookingCancellationTemplate(notification) {
        const booking = notification.metadata.booking;
        const trip = notification.metadata.trip;
        
        return {
            subject: 'Booking Cancelled - Refund Processed',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                        <h1>❌ Booking Cancelled</h1>
                        <p>Your booking has been cancelled</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>Your booking has been successfully cancelled.</p>
                        
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Cancelled Booking:</h3>
                            <p><strong>Booking Number:</strong> ${booking?.bookingNumber || 'N/A'}</p>
                            <p><strong>Ticket Number:</strong> ${booking?.ticketNumber || 'N/A'}</p>
                            <p><strong>Seat Number:</strong> ${booking?.seatNumber || 'N/A'}</p>
                            <p><strong>Booking Date:</strong> ${booking?.bookingDate ? new Date(booking.bookingDate).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Information:</h3>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Arrival:</strong> ${trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Refund Information:</h3>
                            <p><strong>Refund Amount:</strong> ETB ${notification.metadata.refundAmount || '0'}</p>
                            <p><strong>Refund Method:</strong> Original payment method</p>
                            <p><strong>Processing Time:</strong> 5-7 business days</p>
                            <p><strong>Cancellation Reason:</strong> ${notification.metadata.reason || 'Not specified'}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            We hope to serve you again in the future. If you have any questions, please contact our support team.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

Your booking has been successfully cancelled.

Cancelled Booking:
- Booking Number: ${notification.metadata.booking?.bookingNumber || 'N/A'}
- Ticket Number: ${notification.metadata.booking?.ticketNumber || 'N/A'}
- Seat Number: ${notification.metadata.booking?.seatNumber || 'N/A'}
- Booking Date: ${notification.metadata.booking?.bookingDate ? new Date(notification.metadata.booking.bookingDate).toLocaleString() : 'N/A'}

Trip Information:
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}
- Arrival: ${notification.metadata.trip?.arrivalTime ? new Date(notification.metadata.trip.arrivalTime).toLocaleString() : 'N/A'}

Refund Information:
- Refund Amount: ETB ${notification.metadata.refundAmount || '0'}
- Refund Method: Original payment method
- Processing Time: 5-7 business days
- Cancellation Reason: ${notification.metadata.reason || 'Not specified'}

We hope to serve you again in the future. If you have any questions, please contact our support team.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Refund Processed Template
     */
    static getRefundProcessedTemplate(notification) {
        const payment = notification.metadata.payment;
        const booking = notification.metadata.booking;
        
        return {
            subject: 'Refund Processed Successfully',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center;">
                        <h1>✓ Refund Processed</h1>
                        <p>Your refund has been processed</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>Your refund has been processed successfully.</p>
                        
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Refund Details:</h3>
                            <p><strong>Refund Amount:</strong> ETB ${payment?.refundAmount || 'N/A'}</p>
                            <p><strong>Refund Date:</strong> ${payment?.refundedAt ? new Date(payment.refundedAt).toLocaleString() : new Date().toLocaleString()}</p>
                            <p><strong>Original Payment:</strong> ETB ${payment?.amount || 'N/A'}</p>
                            <p><strong>Transaction ID:</strong> ${payment?.gatewayTransactionID || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Booking Information:</h3>
                            <p><strong>Booking Number:</strong> ${booking?.bookingNumber || 'N/A'}</p>
                            <p><strong>Ticket Number:</strong> ${booking?.ticketNumber || 'N/A'}</p>
                            <p><strong>Refund Reason:</strong> ${notification.metadata.reason || 'Not specified'}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Important Information:</h3>
                            <p>The refund will be credited back to your original payment method within 3-5 business days.</p>
                            <p>Please check your bank statement or payment method for confirmation.</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you don't see the refund within 5 business days, please contact our support team with your booking number.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

Your refund has been processed successfully.

Refund Details:
- Refund Amount: ETB ${notification.metadata.payment?.refundAmount || 'N/A'}
- Refund Date: ${notification.metadata.payment?.refundedAt ? new Date(notification.metadata.payment.refundedAt).toLocaleString() : new Date().toLocaleString()}
- Original Payment: ETB ${notification.metadata.payment?.amount || 'N/A'}
- Transaction ID: ${notification.metadata.payment?.gatewayTransactionID || 'N/A'}

Booking Information:
- Booking Number: ${notification.metadata.booking?.bookingNumber || 'N/A'}
- Ticket Number: ${notification.metadata.booking?.ticketNumber || 'N/A'}
- Refund Reason: ${notification.metadata.reason || 'Not specified'}

Important Information:
The refund will be credited back to your original payment method within 3-5 business days.
Please check your bank statement or payment method for confirmation.

If you don't see the refund within 5 business days, please contact our support team with your booking number.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Driver Assignment Template
     */
    static getDriverAssignmentTemplate(notification) {
        const trip = notification.metadata.trip;
        const driver = notification.metadata.driver;
        
        return {
            subject: 'Driver Assigned to Your Trip',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
                        <h1>👨‍✈️ Driver Assigned</h1>
                        <p>Your driver has been assigned</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>Your trip now has a driver assigned.</p>
                        
                        <div style="background-color: #e8f5e9; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Driver Information:</h3>
                            <p><strong>Driver Name:</strong> ${driver?.fullName || 'N/A'}</p>
                            <p><strong>License Number:</strong> ${driver?.licenseNumber || 'N/A'}</p>
                            <p><strong>Contact Number:</strong> ${driver?.phoneNumber || 'N/A'}</p>
                            <p><strong>Experience:</strong> ${driver?.experience || 'N/A'} years</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Details:</h3>
                            <p><strong>Trip Number:</strong> ${trip?.tripNumber || 'N/A'}</p>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Vehicle:</strong> ${trip?.vehicle?.plateNumber || 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Safety Information:</h3>
                            <ul>
                                <li>All our drivers are fully licensed and insured</li>
                                <li>Regular vehicle maintenance and safety checks</li>
                                <li>GPS tracking for your safety and convenience</li>
                                <li>Emergency contact available 24/7</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Your safety is our top priority. If you have any concerns, please contact our support team.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

Your trip now has a driver assigned.

Driver Information:
- Driver Name: ${notification.metadata.driver?.fullName || 'N/A'}
- License Number: ${notification.metadata.driver?.licenseNumber || 'N/A'}
- Contact Number: ${notification.metadata.driver?.phoneNumber || 'N/A'}
- Experience: ${notification.metadata.driver?.experience || 'N/A'} years

Trip Details:
- Trip Number: ${notification.metadata.trip?.tripNumber || 'N/A'}
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}
- Vehicle: ${notification.metadata.trip?.vehicle?.plateNumber || 'N/A'}

Safety Information:
- All our drivers are fully licensed and insured
- Regular vehicle maintenance and safety checks
- GPS tracking for your safety and convenience
- Emergency contact available 24/7

Your safety is our top priority. If you have any concerns, please contact our support team.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Driver Update Template
     */
    static getDriverUpdateTemplate(notification) {
        const trip = notification.metadata.trip;
        const driver = notification.metadata.driver;
        
        return {
            subject: 'Driver Information Updated',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #f39c12; color: white; padding: 20px; text-align: center;">
                        <h1>ℹ Driver Updated</h1>
                        <p>Driver information has been updated</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>There has been an update to your driver information.</p>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Updated Driver Information:</h3>
                            <p><strong>Driver Name:</strong> ${driver?.fullName || 'N/A'}</p>
                            <p><strong>License Number:</strong> ${driver?.licenseNumber || 'N/A'}</p>
                            <p><strong>Contact Number:</strong> ${driver?.phoneNumber || 'N/A'}</p>
                            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Trip Details:</h3>
                            <p><strong>Trip Number:</strong> ${trip?.tripNumber || 'N/A'}</p>
                            <p><strong>From:</strong> ${trip?.origin?.stationName || 'N/A'}</p>
                            <p><strong>To:</strong> ${trip?.destination?.stationName || 'N/A'}</p>
                            <p><strong>Departure:</strong> ${trip?.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        
                        <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Update Reason:</h3>
                            <p>${notification.metadata.reason || 'Driver scheduling update'}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            All our drivers are fully licensed and insured. Your safety remains our top priority.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

There has been an update to your driver information.

Updated Driver Information:
- Driver Name: ${notification.metadata.driver?.fullName || 'N/A'}
- License Number: ${notification.metadata.driver?.licenseNumber || 'N/A'}
- Contact Number: ${notification.metadata.driver?.phoneNumber || 'N/A'}
- Updated: ${new Date().toLocaleString()}

Trip Details:
- Trip Number: ${notification.metadata.trip?.tripNumber || 'N/A'}
- From: ${notification.metadata.trip?.origin?.stationName || 'N/A'}
- To: ${notification.metadata.trip?.destination?.stationName || 'N/A'}
- Departure: ${notification.metadata.trip?.departureTime ? new Date(notification.metadata.trip.departureTime).toLocaleString() : 'N/A'}

Update Reason: ${notification.metadata.reason || 'Driver scheduling update'}

All our drivers are fully licensed and insured. Your safety remains our top priority.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Station Announcement Template
     */
    static getStationAnnouncementTemplate(notification) {
        const station = notification.metadata.station;
        
        return {
            subject: 'Station Announcement - Important Information',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #9b59b6; color: white; padding: 20px; text-align: center;">
                        <h1>📢 Station Announcement</h1>
                        <p>Important information from ${station?.stationName || 'our station'}</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We have an important announcement from ${station?.stationName || 'our station'}.</p>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Announcement Details:</h3>
                            <p><strong>Station:</strong> ${station?.stationName || 'N/A'}</p>
                            <p><strong>Location:</strong> ${station?.location || 'N/A'}</p>
                            <p><strong>Announcement:</strong> ${notification.title}</p>
                            <p><strong>Posted:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Message:</h3>
                            <p>${notification.message}</p>
                        </div>
                        
                        ${notification.metadata.actionURL ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${notification.metadata.actionURL}" 
                                   style="display: inline-block; padding: 12px 24px; background-color: #9b59b6; 
                                          color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    ${notification.metadata.actionText || 'Learn More'}
                                </a>
                            </div>
                        ` : ''}
                        
                        <p style="color: #666; font-size: 14px;">
                            For more information, please contact the station directly or visit our website.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We have an important announcement from ${notification.metadata.station?.stationName || 'our station'}.

Announcement Details:
- Station: ${notification.metadata.station?.stationName || 'N/A'}
- Location: ${notification.metadata.station?.location || 'N/A'}
- Announcement: ${notification.title}
- Posted: ${new Date().toLocaleString()}

Message: ${notification.message}

${notification.metadata.actionURL ? `For more information, visit: ${notification.metadata.actionURL}` : ''}

For more information, please contact the station directly or visit our website.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * System Alert Template
     */
    static getSystemAlertTemplate(notification) {
        return {
            subject: 'System Alert - Important Notice',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                        <h1>⚠ System Alert</h1>
                        <p>Important system notice</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We have an important system alert to share with you.</p>
                        
                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Alert Details:</h3>
                            <p><strong>Alert Type:</strong> ${notification.title}</p>
                            <p><strong>Priority:</strong> ${notification.priority}</p>
                            <p><strong>Issued:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Alert Message:</h3>
                            <p>${notification.message}</p>
                        </div>
                        
                        ${notification.metadata.actionURL ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${notification.metadata.actionURL}" 
                                   style="display: inline-block; padding: 12px 24px; background-color: #e74c3c; 
                                          color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    ${notification.metadata.actionText || 'Take Action'}
                                </a>
                            </div>
                        ` : ''}
                        
                        <p style="color: #666; font-size: 14px;">
                            If you have any questions or concerns, please contact our support team immediately.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We have an important system alert to share with you.

Alert Details:
- Alert Type: ${notification.title}
- Priority: ${notification.priority}
- Issued: ${new Date().toLocaleString()}

Alert Message: ${notification.message}

${notification.metadata.actionURL ? `For more information, visit: ${notification.metadata.actionURL}` : ''}

If you have any questions or concerns, please contact our support team immediately.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Promotional Template
     */
    static getPromotionalTemplate(notification) {
        return {
            subject: 'Special Offer Just for You!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #e67e22; color: white; padding: 20px; text-align: center;">
                        <h1>🎉 Special Offer</h1>
                        <p>Exclusive promotion for you</p>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName},</h2>
                        <p>We have a special offer just for you!</p>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Special Offer:</h3>
                            <p><strong>Offer:</strong> ${notification.title}</p>
                            <p><strong>Details:</strong> ${notification.message}</p>
                            <p><strong>Valid Until:</strong> ${notification.expiresAt ? new Date(notification.expiresAt).toLocaleString() : 'Not specified'}</p>
                        </div>
                        
                        <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">How to Redeem:</h3>
                            <p>${notification.metadata.redeemInstructions || 'Visit our website or contact customer service to redeem this offer.'}</p>
                        </div>
                        
                        ${notification.metadata.actionURL ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${notification.metadata.actionURL}" 
                                   style="display: inline-block; padding: 12px 24px; background-color: #e67e22; 
                                          color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                                    ${notification.metadata.actionText || 'Get This Offer'}
                                </a>
                            </div>
                        ` : ''}
                        
                        <div style="background-color: #f8d7da; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Terms & Conditions:</h3>
                            <p>${notification.metadata.terms || 'Standard terms and conditions apply. Offer subject to availability.'}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            Don't miss out on this exclusive offer! For more information, contact our support team.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName},

We have a special offer just for you!

Special Offer:
- Offer: ${notification.title}
- Details: ${notification.message}
- Valid Until: ${notification.expiresAt ? new Date(notification.expiresAt).toLocaleString() : 'Not specified'}

How to Redeem: ${notification.metadata.redeemInstructions || 'Visit our website or contact customer service to redeem this offer.'}

${notification.metadata.actionURL ? `To get this offer, visit: ${notification.metadata.actionURL}` : ''}

Terms & Conditions: ${notification.metadata.terms || 'Standard terms and conditions apply. Offer subject to availability.'}

Don't miss out on this exclusive offer! For more information, contact our support team.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Default Template
     */
    static getDefaultTemplate(notification) {
        return {
            subject: notification.title || 'Notification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                    <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
                        <h1>Notification</h1>
                    </div>
                    <div style="padding: 30px; background-color: white;">
                        <h2>Hello ${notification.metadata.userName || 'User'},</h2>
                        <p>${notification.message}</p>
                        
                        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Notification Details:</h3>
                            <p><strong>Type:</strong> ${notification.type}</p>
                            <p><strong>Priority:</strong> ${notification.priority}</p>
                            <p><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            If you have any questions, please contact our support team.
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Hello ${notification.metadata.userName || 'User'},

${notification.message}

Notification Details:
- Type: ${notification.type}
- Priority: ${notification.priority}
- Sent: ${new Date().toLocaleString()}

If you have any questions, please contact our support team.

Best regards,
Bahir Dar Transport System Team`
        };
    }
    
    /**
     * Get user notifications
     */
    static async getUserNotifications(userID, options = {}) {
        const { page = 1, limit = 20, type, status, priority } = options;
        
        const query = { userID };
        
        if (type) query.type = type;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        
        const skip = (page - 1) * limit;
        
        const notifications = await Notification.find(query)
            .populate('userID', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Notification.countDocuments(query);
        
        return {
            notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        };
    }
    
    /**
     * Mark notification as read
     */
    static async markAsRead(notificationID, userID) {
        const notification = await Notification.findOne({
            _id: notificationID,
            userID: userID
        });
        
        if (!notification) {
            throw new Error('Notification not found');
        }
        
        return await notification.markAsRead();
    }
    
    /**
     * Send notification to multiple users
     */
    static async sendToMultipleUsers(notificationData, userIds) {
        const notifications = [];
        
        for (const userID of userIds) {
            try {
                const notification = await this.createNotification({
                    ...notificationData,
                    userID
                });
                notifications.push(notification);
            } catch (error) {
                console.error(`Failed to send notification to user ${userID}:`, error);
            }
        }
        
        return notifications;
    }
}

export default NotificationService;
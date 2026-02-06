import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
    notificationID: {
        type: String,
        unique: true,
        trim: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true
    },
    type: {
        type: String,
        enum: [
            'booking_confirmation',
            'payment_success',
            'payment_failed',
            'trip_update',
            'trip_cancellation',
            'trip_delay',
            'trip_reminder',
            'booking_cancellation',
            'refund_processed',
            'driver_assignment',
            'driver_update',
            'station_announcement',
            'system_alert',
            'promotional',
            'welcome',
            'password_reset',
            'email_verification'
        ],
        required: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'in_app', 'push', 'all'],
        default: 'in_app'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'archived'],
        default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    metadata: {
        bookingID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        },
        tripID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip'
        },
        paymentID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        vehicleID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle'
        },
        stationID: String,
        actionURL: String,
        actionText: String,
        data: Object
    },
    retryCount: {
        type: Number,
        default: 0,
        max: 3
    },
    errorMessage: String,
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save middleware to generate notification ID
notificationSchema.pre('save', function (next) {
    if (!this.notificationID) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.notificationID = `NOTIF-${timestamp}-${random}`;
    }
    next();
});

// Virtual for getting user details
notificationSchema.virtual('user', {
    ref: 'User',
    localField: 'userID',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting booking details
notificationSchema.virtual('booking', {
    ref: 'Booking',
    localField: 'metadata.bookingID',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting trip details
notificationSchema.virtual('trip', {
    ref: 'Trip',
    localField: 'metadata.tripID',
    foreignField: '_id',
    justOne: true
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function () {
    return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for checking if notification can be retried
notificationSchema.virtual('canRetry').get(function () {
    return this.status === 'failed' && this.retryCount < 3;
});

// Indexes
notificationSchema.index({ notificationID: 1 }, { unique: true });
notificationSchema.index({ userID: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ channel: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'metadata.bookingID': 1 });
notificationSchema.index({ 'metadata.tripID': 1 });
notificationSchema.index({ 'metadata.paymentID': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete expired notifications

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
};

// Method to retry sending
notificationSchema.methods.retry = function () {
    if (this.canRetry) {
        this.status = 'pending';
        this.retryCount += 1;
        this.errorMessage = undefined;
        return this.save();
    }
    return Promise.reject(new Error('Max retry attempts reached'));
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
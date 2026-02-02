// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    bookingNumber: {
        type: String,
        unique: true,
        trim: true
    },
    passengerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tripID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    vehicleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    seats: [{
        seatNumber: {
            type: Number,
            required: true,
            min: [1, 'Seat number must be at least 1']
        },
        passengerName: String,
        ageGroup: {
            type: String,
            enum: ['adult', 'child', 'infant'],
            default: 'adult'
        },
        specialNeeds: String
    }],
    totalPassengers: {
        type: Number,
        required: true,
        min: [1, 'At least one passenger is required'],
        default: 1
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'no_show', 'completed'],
        default: 'confirmed'
    },
    cancellationReason: String,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationDate: Date,
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed'],
        default: 'none'
    },
    ticketNumber: {
        type: String,
        unique: true
    },
    boardingPass: String, // QR code URL or PDF URL
    specialRequests: String,
    checkedIn: {
        type: Boolean,
        default: false
    },
    checkedInAt: Date,
    boardingTime: Date,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Pre-save middleware to generate booking and ticket numbers
bookingSchema.pre('save', function (next) {
    if (!this.bookingNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 8).toUpperCase();
        this.bookingNumber = `BK-${year}${month}-${random}`;
    }

    if (!this.ticketNumber) {
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.ticketNumber = `TKT-${random}`;
    }

    next();
});

// Virtual for getting passenger details
bookingSchema.virtual('passenger', {
    ref: 'User',
    localField: 'passengerID',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting trip details
bookingSchema.virtual('trip', {
    ref: 'Trip',
    localField: 'tripID',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting vehicle details
bookingSchema.virtual('vehicle', {
    ref: 'Vehicle',
    localField: 'vehicleID',
    foreignField: '_id',
    justOne: true
});

// Virtual for calculating if booking can be cancelled
bookingSchema.virtual('canBeCancelled').get(async function () {
    const trip = await mongoose.model('Trip').findById(this.tripID);
    if (!trip) return false;

    const now = new Date();
    const hoursUntilDeparture = (trip.departureTime - now) / (1000 * 60 * 60);

    return this.status === 'confirmed' &&
        hoursUntilDeparture > trip.cancellationPolicy.hoursBeforeDeparture;
});

// Virtual for calculating refund amount
bookingSchema.virtual('calculatedRefund').get(async function () {
    const trip = await mongoose.model('Trip').findById(this.tripID);
    if (!trip || !trip.cancellationPolicy) return 0;

    const now = new Date();
    const hoursUntilDeparture = (trip.departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture > trip.cancellationPolicy.hoursBeforeDeparture) {
        return (this.totalAmount * trip.cancellationPolicy.refundPercentage) / 100;
    }
    return 0;
});

// Indexes
bookingSchema.index({ bookingNumber: 1 }, { unique: true });
bookingSchema.index({ ticketNumber: 1 }, { unique: true });
bookingSchema.index({ passengerID: 1 });
bookingSchema.index({ tripID: 1 });
bookingSchema.index({ vehicleID: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ 'seats.seatNumber': 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
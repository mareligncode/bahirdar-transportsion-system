import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    bookingNumber: {
        type: String,
        unique: true
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
        ref: 'Vehicle',
        required: true
    },
    seatNumber: {
        type: Number,
        required: true,
        min: 1
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'refunded'],
        default: 'pending'
    },
    cancellationReason: String,
    refundAmount: {
        type: Number,
        default: 0
    },
    ticketNumber: {
        type: String,
        unique: true
    },
    boardingPass: String, // QR code URL
    specialRequests: String,
    passengerDetails: {
        fullName: String,
        phoneNumber: String,
        email: String,
        emergencyContact: String
    },
    checkedIn: {
        type: Boolean,
        default: false
    },
    checkedInAt: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
bookingSchema.index({ passengerID: 1 });
bookingSchema.index({ tripID: 1 });
bookingSchema.index({ vehicleID: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });

// Generate booking number and ticket number
bookingSchema.pre('save', async function (next) {
    if (!this.bookingNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('Booking').countDocuments();
        this.bookingNumber = `BK${year}${month}${(count + 1).toString().padStart(6, '0')}`;
    }
    
    if (!this.ticketNumber) {
        this.ticketNumber = `TKT${Date.now().toString(36).toUpperCase()}`;
    }
    
    next();
});

// Pre-find middleware for population
bookingSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'passengerID',
        select: 'fullName phoneNumber email'
    }).populate({
        path: 'tripID',
        select: 'tripNumber origin destination departureTime arrivalTime price'
    }).populate({
        path: 'vehicleID',
        select: 'plateNumber carType totalCapacity'
    }).populate({
        path: 'createdBy',
        select: 'fullName'
    });

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
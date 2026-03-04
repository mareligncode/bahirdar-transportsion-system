
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
    // Change from single seatNumber to array of seatNumbers
    seatNumbers: [{
        type: Number,
        required: true,
        min: 1
    }],
    // Keep for backward compatibility
    seatNumber: {
        type: Number,
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
        unique: true,
        sparse: true // Allow multiple nulls for group bookings
    },
    // New field for group ticket
    groupTicketNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    boardingPass: String, // QR code URL
    specialRequests: String,
    passengerDetails: {
        fullName: String,
        phoneNumber: String,
        email: String,
        emergencyContact: String
    },
    // For group bookings
    isGroupBooking: {
        type: Boolean,
        default: false
    },
    groupBookingId: {
        type: String, // Shared ID for all seats in the same group
        sparse: true
    },
    seatCount: {
        type: Number,
        default: 1
    },
    paymentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    pricePerSeat: {
        type: Number,
        default: 0
    },
    batchTotalPrice: {
        type: Number,
        default: 0
    },
    checkedIn: {
        type: Boolean,
        default: false
    },
    checkedInAt: Date,
    checkedInSeats: [{
        seatNumber: Number,
        checkedInAt: Date
    }],
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
bookingSchema.index({ groupBookingId: 1 });

// Generate booking number and ticket number
bookingSchema.pre('save', async function (next) {
    if (!this.bookingNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('Booking').countDocuments();
        this.bookingNumber = `BK${year}${month}${(count + 1).toString().padStart(6, '0')}`;
    }

    // Generate group ticket number for group bookings
    if (this.isGroupBooking && !this.groupTicketNumber) {
        this.groupTicketNumber = `GTK${Date.now().toString(36).toUpperCase()}`;
    }

    // Set seatNumber for backward compatibility
    if (this.seatNumbers && this.seatNumbers.length > 0 && !this.seatNumber) {
        this.seatNumber = this.seatNumbers[0];
    }

    // Set seat count
    if (this.seatNumbers) {
        this.seatCount = this.seatNumbers.length;
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

//130
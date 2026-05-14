import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
    bookingID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    passengerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tripID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    currency: {
        type: String,
        default: 'ETB',
        enum: ['ETB', 'USD']
    },
    paymentGateway: {
        type: String,
        required: true,
        enum: ['chapa', 'telebirr', 'cbe_birr', 'cash', 'bank_transfer_receipt'],
        default: 'chapa'
    },
    gatewayTransactionID: {
        type: String,
        sparse: true // Allows multiple nulls
    },
    chapaReference: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['mobile_money', 'bank_transfer', 'card', 'chapa', 'cash']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'success', 'under_review', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    checkoutUrl: {
        type: String
    },
    gatewayResponse: {
        type: Object // Store full response from Chapa
    },
    paymentDate: {
        type: Date
    },
    verifiedAt: {
        type: Date
    },
    refundedAt: {
        type: Date
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    reasonForFailure: {
        type: String
    },
    frontendUrl: {
        type: String
    },
    metadata: {
        type: Object,
        default: {}
    },
    txRef: {
        type: String,
    },            // your generated reference
    chapaTransactionId: {
        type: String
    },// chapa id (returned after success)

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
paymentSchema.virtual('booking', {
    ref: 'Booking',
    localField: 'bookingID',
    foreignField: '_id',
    justOne: true
});

paymentSchema.virtual('passenger', {
    ref: 'User',
    localField: 'passengerID',
    foreignField: '_id',
    justOne: true
});

paymentSchema.virtual('trip', {
    ref: 'Trip',
    localField: 'tripID',
    foreignField: '_id',
    justOne: true
});

// Indexes
paymentSchema.index({ bookingID: 1 }, { unique: true });
paymentSchema.index({ chapaReference: 1 });
paymentSchema.index({ passengerID: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware to set tripID from booking
paymentSchema.pre('save', async function (next) {
    if (!this.tripID && this.bookingID) {
        try {
            const Booking = mongoose.model('Booking');
            const booking = await Booking.findById(this.bookingID).select('tripID');
            if (booking) {
                this.tripID = booking.tripID;
            }
        } catch (error) {
            console.error('Error setting tripID:', error);
        }
    }
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
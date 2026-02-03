// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    paymentNumber: {
        type: String,
        required: true,
        unique: true
    },
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
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    paymentMethod: {
        type: String,
        enum: ['chapa', 'telebirr', 'cbe_birr', 'cash', 'card', 'bank_transfer'],
        required: true
    },
    transactionID: String,
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    refundDate: Date,
    gatewayResponse: Object,
    receiptURL: String,
    notes: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ bookingID: 1 });
paymentSchema.index({ transactionID: 1 });
paymentSchema.index({ passengerID: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: 1 });

// Generate payment number
paymentSchema.pre('save', async function (next) {
    if (!this.paymentNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await mongoose.model('Payment').countDocuments();
        this.paymentNumber = `PMT${year}${month}${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
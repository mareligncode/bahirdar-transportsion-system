// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    paymentNumber: {
        type: String,
        required: true,
        unique: true
    paymentReference: {
        type: String,
        unique: true,
        trim: true
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
    tripID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'ETB',
        enum: ['ETB', 'USD']
    },
    paymentMethod: {
        type: String,
        enum: ['chapa', 'telebirr', 'cbe_birr', 'cash', 'bank_transfer', 'card', 'wallet'],
        default: 'cash'
    },
    paymentGateway: {
        type: String,
        enum: ['chapa', 'telebirr', 'cbe', 'mock'], // mock for testing
        default: 'mock'
    },
    transactionID: {
        type: String,
        unique: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'],
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
    processedAt: Date,
    failedAt: Date,
    refundedAt: Date,
    gatewayTransactionID: String,
    gatewayResponse: Object,
    receiptURL: String,
    invoiceNumber: String,
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    netAmount: {
        type: Number,
        required: true,
        min: 0
    },
    payerDetails: {
        fullName: String,
        email: String,
        phoneNumber: String,
        paymentMethodLastFour: String
    },
    refundDetails: {
        refundReference: String,
        refundAmount: Number,
        refundReason: String,
        refundedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gatewayRefundID: String
    },
    metadata: Object,
    isTest: {
        type: Boolean,
        default: false
    },
    createdBy: {
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
// Pre-save middleware to generate references
paymentSchema.pre('save', function (next) {
    if (!this.paymentReference) {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.paymentReference = `PAY-${timestamp}-${random}`;
    }

    if (!this.transactionID) {
        const random = Math.random().toString(36).substr(2, 10).toUpperCase();
        this.transactionID = `TXN-${Date.now().toString(36)}-${random}`;
    }

    if (!this.invoiceNumber) {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.invoiceNumber = `INV-${year}${month}-${seq}`;
    }

    // Calculate net amount
    this.netAmount = this.amount + this.taxAmount + this.serviceCharge - this.discountAmount;

    next();
});

// Virtual for getting booking details
paymentSchema.virtual('booking', {
    ref: 'Booking',
    localField: 'bookingID',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting passenger details
paymentSchema.virtual('passenger', {
    ref: 'User',
    localField: 'passengerID',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting trip details
paymentSchema.virtual('trip', {
    ref: 'Trip',
    localField: 'tripID',
    foreignField: '_id',
    justOne: true
});

// Virtual for checking if payment is refundable
paymentSchema.virtual('isRefundable').get(function () {
    const now = new Date();
    const paymentAge = (now - this.paymentDate) / (1000 * 60 * 60 * 24); // days

    return this.paymentStatus === 'success' &&
        paymentAge <= 30 && // Within 30 days
        this.refundDetails.refundAmount === undefined;
});

// Indexes
paymentSchema.index({ paymentReference: 1 }, { unique: true });
paymentSchema.index({ transactionID: 1 }, { unique: true });
paymentSchema.index({ bookingID: 1 });
paymentSchema.index({ passengerID: 1 });
paymentSchema.index({ tripID: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ paymentGateway: 1 });
paymentSchema.index({ gatewayTransactionID: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
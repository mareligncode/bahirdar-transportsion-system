// models/Vehicle.js
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    plateNumber: {
        type: String,
        required: [true, 'Plate number is required'],
        uppercase: true,
        trim: true
    },
    carType: {
        type: String,
        required: [true, 'Car type is required'],
        enum: ['coaster', 'bus', 'minibus', 'aba dulla', 'van', 'other'],
        default: 'coaster'
    },
    totalCapacity: {
        type: Number,
        required: [true, 'Total capacity is required'],
        min: [1, 'Capacity must be at least 1'],
        max: [100, 'Capacity cannot exceed 100']
    },
    currentStatus: {
        type: String,
        enum: ['active', 'maintenance', 'inactive', 'on_trip', 'available'],
        default: 'available'
    },
    driverID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    stationID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: [true, 'Station is required']
    },
    make: {
        type: String,
        required: [true, 'Vehicle make is required']
    },
    model: {
        type: String,
        required: [true, 'Vehicle model is required']
    },
    year: {
        type: Number,
        min: [1980, 'Year must be 1980 or later'],
        max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    color: {
        type: String,
        default: 'white'
    },
    insuranceExpiry: {
        type: Date,
        required: [true, 'Insurance expiry date is required']
    },
    lastServiceDate: {
        type: Date,
        default: null
    },
    nextServiceDate: {
        type: Date,
        default: null
    },
    maintenanceLog: [{
        date: {
            type: Date,
            default: Date.now
        },
        description: String,
        cost: Number,
        mileage: Number,
        servicedBy: String,
        notes: String
    }],
    mileage: {
        type: Number,
        default: 0,
        min: 0
    },
    fuelType: {
        type: String,
        enum: ['diesel', 'petrol', 'electric', 'hybrid'],
        default: 'diesel'
    },
    features: [{
        type: String,
        enum: ['ac', 'wifi', 'entertainment', 'charging_port', 'toilet', 'refreshments']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
vehicleSchema.index({ plateNumber: 1 }, { unique: true });
vehicleSchema.index({ stationID: 1 });
vehicleSchema.index({ driverID: 1 });
vehicleSchema.index({ currentStatus: 1 });
vehicleSchema.index({ carType: 1 });
vehicleSchema.index({ insuranceExpiry: 1 });
vehicleSchema.index({ nextServiceDate: 1 });

// Pre-save middleware
vehicleSchema.pre('save', function (next) {
    if (this.plateNumber) {
        this.plateNumber = this.plateNumber.toUpperCase().replace(/\s+/g, '');
    }
    next();
});

// Add population for station
vehicleSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'stationID',
        select: 'stationCode stationName location.city'
    });
    next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
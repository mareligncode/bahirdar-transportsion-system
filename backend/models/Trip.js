// models/Trip.js
import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    tripNumber: {
        type: String,
       // required: true,
        unique: true,
        //uppercase: true
    },
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
    },
    departureTime: {
        type: Date,
        required: true
    },
    arrivalTime: {
        type: Date,
        required: true
    },
    vehicleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    driverID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    availableSeats: {
        type: Number,
        required: true,
        min: 0
    },
    totalSeats: {
        type: Number,
        required: true,
        min: 1
    },
    tripStatus: {
        type: String,
        enum: ['scheduled', 'boarding', 'ongoing', 'completed', 'cancelled', 'delayed'],
        default: 'scheduled'
    },
    stationID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: true
    },
    routePoints: [{
        type: String,
        trim: true
    }],
    estimatedDuration: {
        type: Number, // in minutes
        required: true
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
tripSchema.index({ departureTime: 1 });
tripSchema.index({ origin: 1, destination: 1 });
tripSchema.index({ vehicleID: 1 });
tripSchema.index({ driverID: 1 });
tripSchema.index({ tripStatus: 1 });
tripSchema.index({ stationID: 1 });

// Pre-save to generate trip number
tripSchema.pre('save', async function (next) {
    if (!this.tripNumber) {
        const count = await mongoose.model('Trip').countDocuments();
        this.tripNumber = `TRIP${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
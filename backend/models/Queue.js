import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
    station: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: [true, 'Station is required']
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: [true, 'Destination station is required']
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required']
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Driver is required']
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['waiting', 'loading', 'on_trip', 'cancelled', 'maintenance'],
        default: 'waiting'
    },
    queuePosition: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique vehicle in queue per station (at a given time)
// Only one 'waiting' or 'loading' entry per vehicle can exist
queueSchema.index({ vehicle: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: { $in: ['waiting', 'loading'] } }
});

// Index for efficient sorting by position per station AND destination route
queueSchema.index({ station: 1, destination: 1, queuePosition: 1 });

const Queue = mongoose.model('Queue', queueSchema);
export default Queue;

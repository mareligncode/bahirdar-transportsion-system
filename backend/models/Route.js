import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
    origin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: [true, 'Origin station is required']
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station',
        required: [true, 'Destination station is required']
    },
    routeName: {
        type: String,
        required: true,
        trim: true
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: 0
    },
    estimatedDuration: {
        type: String,
        required: true
    },
    distance: {
        type: Number, // In km
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for unique routes between stations
routeSchema.index({ origin: 1, destination: 1 }, { unique: true });

const Route = mongoose.model('Route', routeSchema);

export default Route;

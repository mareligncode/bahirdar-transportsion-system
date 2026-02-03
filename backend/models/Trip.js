import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    origin: {
        type: String,
        required: [true, 'Origin is required'],
        trim: true
    },
    destination: {
        type: String,
        required: [true, 'Destination is required'],
        trim: true
    },
    departureTime: {
        type: Date,
        required: [true, 'Departure time is required']
    },
    arrivalTime: {
        type: Date
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    availableSeats: {
        type: Number,
        required: true,
        min: [0, 'Available seats cannot be negative'],
        default: 0
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: [1, 'Total seats must be at least 1']
    },
    vehicleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    driverID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function (driverId) {
                const user = await mongoose.model('User').findById(driverId);
                return user && user.role === 'driver';
            },
            message: 'Driver ID must reference a valid driver user'
        }
    },
    stationID: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Station",
        required: true
    },
    tripStatus: {
        type: String,
        enum: ['scheduled', 'boarding', 'ongoing', 'completed', 'cancelled', 'delayed'],
        default: 'scheduled'
    },
    routePoints: [{
        city: String,
        arrivalTime: Date,
        departureTime: Date,
        stopDuration: Number // in minutes
    }],
    estimatedDuration: {
        type: Number, // in minutes
        required: true
    },
    distance: {
        type: Number, // in kilometers
        min: 0
    },
    amenities: [{
        type: String,
        enum: ['ac', 'wifi', 'entertainment', 'charging_port', 'toilet', 'refreshments']
    }],
    notes: String,
    cancellationPolicy: {
        refundPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        hoursBeforeDeparture: {
            type: Number,
            min: 0,
            default: 24
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

tripSchema.pre('save', function (next) {
    if (!this.tripCode) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.tripCode = `TRIP-${year}${month}${day}-${random}`;
    }
    next();
});

tripSchema.virtual('isPast').get(function () {
    return this.departureTime < new Date();
});

tripSchema.virtual('isAvailableForBooking').get(function () {
    const now = new Date();
    const hoursUntilDeparture = (this.departureTime - now) / (1000 * 60 * 60);
    return this.availableSeats > 0 &&
        this.tripStatus === 'scheduled' &&
        hoursUntilDeparture > 1; // Can book up to 1 hour before departure
});

tripSchema.index({ departureTime: 1 });
tripSchema.index({ origin: 1, destination: 1 });
tripSchema.index({ tripStatus: 1 });
tripSchema.index({ stationID: 1 });
tripSchema.index({ vehicleID: 1 });
tripSchema.index({ driverID: 1 });
tripSchema.index({ 'routePoints.city': 1 });
tripSchema.index({ createdBy: 1 });
tripSchema.index({ isActive: 1 });

tripSchema.pre('save', function (next) {
    if (this.availableSeats > this.totalSeats) {
        this.availableSeats = this.totalSeats;
    }
    next();
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
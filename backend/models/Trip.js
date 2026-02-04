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
import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    tripNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
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
    departureTime: {
        type: Date,
        required: [true, 'Departure time is required']
    },
    arrivalTime: {
        type: Date,
        required: [true, 'Arrival time is required']
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
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [1, 'Price must be at least 1']
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
        min: [0, 'Available seats cannot be negative'],
        default: 0
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: [1, 'Total seats must be at least 1']
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
    routePoints: [{
        type: String,
        trim: true
    }],
    estimatedDuration: {
        type: Number, // in minutes
        required: [true, 'Estimated duration is required'],
        min: [15, 'Duration must be at least 15 minutes']
    },
    notes: String,
    distance: {
        type: Number, // in kilometers
        min: 0
    },
    amenities: [{
        type: String,
        default: ''
    },
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
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

// Virtual for confirmed bookings count
tripSchema.virtual('confirmedBookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'tripID',
    match: { status: 'confirmed' },
    count: true
});

// Indexes
tripSchema.index({ departureTime: 1 });
tripSchema.index({ origin: 1, destination: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ tripStatus: 1 });
tripSchema.index({ station: 1 });
tripSchema.index({ isActive: 1 });
tripSchema.index({ departureTime: 1, tripStatus: 1 });
tripSchema.index({ price: 1 });

// Generate trip number before save
tripSchema.pre('save', async function (next) {
    if (!this.tripNumber) {
        const date = new Date();
        const prefix = 'TRP';
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const count = await mongoose.model('Trip').countDocuments({
            departureTime: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        this.tripNumber = `${prefix}${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
    }

    // Calculate available seats if not set
    if (!this.availableSeats && this.totalSeats) {
        this.availableSeats = this.totalSeats;
    }

    next();
});

// Pre-find middleware for population
tripSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'origin destination',
        select: 'stationCode stationName location city'
    }).populate({
        path: 'vehicle',
        select: 'plateNumber carType totalCapacity currentStatus'
    }).populate({
        path: 'driver',
        select: 'fullName phoneNumber licenseNumber'
    }).populate({
        path: 'station',
        select: 'stationCode stationName'
    });

    next();
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
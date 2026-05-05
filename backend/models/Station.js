import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
    stationCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    stationName: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    coordinates: {
        lat: { type: Number, default: 11.5742 },
        lng: { type: Number, default: 37.3614 }
    },
    contactPhone: {
        type: String,
        required: true
    },
    contactEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    manager: {
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

// Indexes for efficient queries
stationSchema.index({ stationCode: 1 });
stationSchema.index({ city: 1 });
stationSchema.index({ manager: 1 });
stationSchema.index({ isActive: 1 });

const Station = mongoose.model('Station', stationSchema);

export default Station;
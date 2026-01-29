import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    // Basic Vehicle Information
    plateNumber: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    vehicleName: { 
        type: String, 
        required: true 
    },
    carType: { 
        type: String, 
        enum: ['bus', 'coaster', 'aba_dulla', 'minibus', 'van', 'other'], 
        required: true 
    },
    totalCapacity: { 
        type: Number, 
        required: true,
        min: 1,
        max: 100
    },
    
    // Vehicle Status
    currentStatus: { 
        type: String, 
        enum: ['active', 'maintenance', 'inactive', 'on_trip', 'available', 'not_available'], 
        default: 'active' 
    },
    
    // Driver Information
    driver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    
    // Car Owner Information
    ownerDetails: {
        fullName: { 
            type: String, 
            required: true 
        },
        phoneNumber: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String,
            lowercase: true,
            trim: true
        },
        address: String,
        idNumber: String, // Kebele ID or other identification
        idType: {
            type: String,
            enum: ['kebele_id', 'passport', 'driver_license', 'other']
        }
    },
    
    // Bank Account Information
    bankAccount: {
        accountNumber: { 
            type: String, 
            required: true 
        },
        accountHolderName: { 
            type: String, 
            required: true 
        },
        bankName: { 
            type: String, 
            required: true,
            enum: ['CBE', 'Awash Bank', 'Dashen Bank', 'Abyssinia Bank', 'NIB', 'BoA', 'Other']
        },
        branchName: String,
        accountType: {
            type: String,
            enum: ['saving', 'current', 'checking']
        }
    },
    
    // Station Information
    station: { 
        type: String, 
        required: true 
    },
    stationCode: String,
    
    // Vehicle Specifications
    color: String,
    modelYear: { 
        type: Number,
        min: 1990,
        max: new Date().getFullYear() + 1
    },
    manufacturer: String,
    fuelType: {
        type: String,
        enum: ['diesel', 'petrol', 'hybrid', 'electric']
    },
    
    // Insurance Information
    insurance: {
        company: String,
        policyNumber: String,
        expiryDate: Date,
        coverageType: String
    },
    
    // Maintenance Information
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceLog: [{
        date: { type: Date, default: Date.now },
        description: String,
        cost: { type: Number, default: 0 },
        performedBy: String,
        odometerReading: Number,
        type: {
            type: String,
            enum: ['regular', 'repair', 'inspection', 'emergency']
        }
    }],
    
    // Financial Information
    commissionRate: { 
        type: Number, 
        default: 10,
        min: 0,
        max: 100 
    }, // Percentage for owner
    
    // Documents
    documents: [{
        name: String,
        documentType: {
            type: String,
            enum: ['registration', 'insurance', 'license', 'inspection', 'other']
        },
        fileUrl: String,
        expiryDate: Date,
        uploadDate: { type: Date, default: Date.now }
    }],
    
    // Additional Information
    notes: String,
    
    // Audit Trail
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for driver details
vehicleSchema.virtual('driverDetails', {
    ref: 'User',
    localField: 'driver',
    foreignField: '_id',
    justOne: true
});

// Indexes for faster queries
vehicleSchema.index({ plateNumber: 1 }, { unique: true });
vehicleSchema.index({ driver: 1 });
vehicleSchema.index({ station: 1 });
vehicleSchema.index({ currentStatus: 1 });
vehicleSchema.index({ 'ownerDetails.phoneNumber': 1 });
vehicleSchema.index({ createdBy: 1 });
vehicleSchema.index({ 'bankAccount.accountNumber': 1 });

// Pre-save middleware
vehicleSchema.pre('save', function(next) {
    // Ensure plate number is uppercase
    if (this.plateNumber) {
        this.plateNumber = this.plateNumber.toUpperCase().replace(/\s+/g, '');
    }
    next();
});

export default mongoose.model('Vehicle', vehicleSchema);
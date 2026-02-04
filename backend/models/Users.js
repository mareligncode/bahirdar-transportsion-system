import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        validate: {
            validator: function (value) {
                // If password is already hashed, skip regex
                if (value.startsWith('$2b$')) return true;

                // Validate only plain password
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(value);
            },
            message:
                'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
        }
    },

    role: {
        type: String,
        enum: ['passenger', 'driver', 'station_admin', 'super_admin'],
        default: 'passenger'
    },
    emergencyContact: {
        type: String,
        default: ''
    },
    licenseNumber: {
        type: String,
        default: ''
    },
    stationID: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    refreshToken: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    passwordResetAttempts: {
        type: Number,
        default: 0
    },
    lastPasswordReset: {
        type: Date,
        default: null
    }
},
    
    {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
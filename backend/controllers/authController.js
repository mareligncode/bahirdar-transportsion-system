import User from '../models/Users.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwtUtils.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/emailService.js';
import crypto from 'crypto';

export const register = async (req, res) => {
    try {
        const { fullName, email, phoneNumber, password } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phoneNumber }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        const user = new User({
            fullName,
            email,
            phoneNumber,
            password,
            role: 'passenger' 
        });

        await user.save();

        const tokens = generateTokens(user);

        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: user.toJSON(),
                tokens
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Save refresh token and update last login
        user.refreshToken = tokens.refreshToken;
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                tokens
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Find user with this refresh token
        const user = await User.findOne({
            _id: decoded.id,
            refreshToken: refreshToken
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or account is inactive'
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token in database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                tokens
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: error.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Find user with this refresh token and clear it
        await User.findOneAndUpdate(
            { refreshToken: refreshToken },
            { $set: { refreshToken: '' } }
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.toJSON()
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber, emergencyContact } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields if provided
        if (fullName) user.fullName = fullName;
        if (phoneNumber) {
            // Check if phone number is already taken by another user
            const existingUser = await User.findOne({
                phoneNumber,
                _id: { $ne: userId }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already in use'
                });
            }
            user.phoneNumber = phoneNumber;
        }
        if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await user.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};



// 1. Request Password Reset
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if user not found (security measure)
            return res.json({
                success: true,
                message: 'If your email is registered, you will receive a password reset link'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Account is deactivated. Please contact support'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const resetTokenExpiry = Date.now() + 15 * 60 * 1000;

        // Set token expiry (15 minutes from now)
        const resetTokenExpiry = Date.now() + 15 * 60 * 1000;

        // Save token to user
        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = resetTokenExpiry;
        user.passwordResetAttempts = 0;
        await user.save();

        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken, user.fullName);

        res.json({
            success: true,
            message: 'Password reset link has been sent to your email',
            data: {
                email: user.email, // Optional: mask email for frontend display
                expiresIn: '15 minutes'
            }
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request',
            error: error.message
        });
    }
};

// 2. Validate Reset Token
export const validateResetToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is required'
            });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check reset attempts
        if (user.passwordResetAttempts >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Too many reset attempts. Please request a new reset link'
            });
        }

        res.json({
            success: true,
            message: 'Reset token is valid',
            data: {
                email: user.email,
                fullName: user.fullName
            }
        });
    } catch (error) {
        console.error('Validate reset token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate reset token',
            error: error.message
        });
    }
};

// 3. Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check reset attempts
        if (user.passwordResetAttempts >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Too many reset attempts. Please request a new reset link'
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as old password'
            });
        }

        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        user.passwordResetAttempts = 0;
        user.lastPasswordReset = new Date();

        // Invalidate all refresh tokens (optional security measure)
        user.refreshToken = '';

        await user.save();

        // Send password changed email
        try {
            await sendPasswordChangedEmail(user.email, user.fullName);
        } catch (emailError) {
            console.warn('Failed to send password changed email:', emailError);
            // Continue even if email fails
        }

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
};

// 4. Increment Reset Attempts (helper function)
export const incrementResetAttempts = async (token) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        await User.findOneAndUpdate(
            { passwordResetToken: hashedToken },
            { $inc: { passwordResetAttempts: 1 } }
        );
    } catch (error) {
        console.error('Error incrementing reset attempts:', error);
    }
};
// utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Email Configuration Check:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Missing');



const transporter = nodemailer.createTransport({
    service: 'gmail',
// Log to verify environment variables are loaded
console.log('Email Configuration Check:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing');


// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify connection
transporter.verify((error) => {
    if (error) {
        console.error('Email transporter error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

export const sendPasswordResetEmail = async (email, resetToken, userName) => {
    try {
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const expiryTime = process.env.PASSWORD_RESET_EXPIRY || '15 minutes';

        const mailOptions = {
            from: `"Bahir Dar Transport System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - Bahir Dar Transport System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
                        <h1>Bahir Dar Transport System</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f8f9fa;">
                        <h2>Hello ${userName},</h2>
                        <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
                        
                        <div style="background-color: white; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
                            <p><strong>Reset your password by clicking the link below:</strong></p>
                            <a href="${resetLink}" 
                               style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                                      color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;">
                                Reset Password
                            </a>
                            <p style="color: #666; font-size: 12px; margin-top: 10px;">
                                This link will expire in ${expiryTime}
                            </p>
                        </div>
                        
                        <p>Alternatively, you can copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 4px;">
                            ${resetLink}
                        </p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
                            <p><strong>Important Security Tips:</strong></p>
                            <ul style="padding-left: 20px;">
                                <li>Never share your password with anyone</li>
                                <li>Make sure you're on the official Bahir Dar Transport System website</li>
                                <li>Use a strong, unique password</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 30px;">If you didn't request this, please contact our support team immediately.</p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            `,
            text: `Hello ${userName},\n\nWe received a request to reset your password. Please use the following link to reset your password:\n\n${resetLink}\n\nThis link will expire in ${expiryTime}.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nBahir Dar Transport System Team`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

export const sendPasswordChangedEmail = async (email, userName) => {
    try {
        const mailOptions = {
            from: `"Bahir Dar Transport System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Changed Successfully - Bahir Dar Transport System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center;">
                        <h1>Password Changed Successfully</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f8f9fa;">
                        <h2>Hello ${userName},</h2>
                        <p>Your password has been successfully changed.</p>
                        
                        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; 
                                    padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p><strong>✓ Password change confirmed at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <p>If you did not make this change, please contact our support team immediately.</p>
                        
                        <div style="margin-top: 30px; padding: 15px; background-color: #f8d7da; 
                                    border: 1px solid #f5c6cb; border-radius: 4px;">
                            <p><strong>Security Notice:</strong> For your security:</p>
                            <ul>
                                <li>Do not share your new password with anyone</li>
                                <li>Use a different password for each service</li>
                                <li>Enable two-factor authentication if available</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL}/login" 
                               style="color: #3498db; text-decoration: none;">
                                Click here to login with your new password
                            </a>
                        </p>
                    </div>
                    <div style="background-color: #ecf0f1; padding: 15px; text-align: center; color: #7f8c8d;">
                        <p>© ${new Date().getFullYear()} Bahir Dar Transport System</p>
                    </div>
                </div>
            `,
            text: `Hello ${userName},\n\nYour password has been successfully changed.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nBahir Dar Transport System Team`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password changed email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password changed email:', error);
        throw new Error('Failed to send password changed email');
    }
};

export default transporter;
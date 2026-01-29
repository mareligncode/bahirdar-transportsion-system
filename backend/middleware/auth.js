import { verifyAccessToken } from '../utils/jwtUtils.js';
import User from '../models/Users.js';

export const authMiddleware = (requiredRoles = []) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const token = authHeader.split(' ')[1];
            const decoded = verifyAccessToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            const user = await User.findById(decoded.id);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or account is inactive'
                });
            }

            if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
    };
};



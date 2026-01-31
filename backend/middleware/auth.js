import { verifyAccessToken } from '../utils/jwtUtils.js';
import User from '../models/Users.js';
export const authMiddleware = (requiredRoles = []) => {
    return async (req, res, next) => {
        try {
            console.log('Required roles:', requiredRoles); 
            console.log('Auth header:', req.headers.authorization); 

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

            console.log('User role from DB:', user.role); // Add this
            console.log('User role type:', typeof user.role); // Add this

            if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
                console.log('Role check failed. User role:', user.role, 'Required:', requiredRoles); // Add this
                return res.status(403).json({
                    success: false,
                    message: `User role ${user.role} is not authorized to access this route`
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


export const protect = async (req, res, next) => {
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

        req.user = user;
        next();
    } catch (error) {
        console.error('Protect middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('🔐 AUTHORIZE MIDDLEWARE CALLED');
        console.log('req.user exists?', !!req.user);

        if (!req.user) {
            console.log('ERROR: req.user is not set! Did protect middleware run?');
            return res.status(401).json({
                success: false,
                message: 'Not authenticated - User object not found'
            });
        }

        let flattenedRoles = roles;
        if (roles.length === 1 && Array.isArray(roles[0])) {
            flattenedRoles = roles[0];
        }

        console.log('User role:', req.user.role);
        console.log('Required roles (flattened):', flattenedRoles);
        console.log('Role check:', flattenedRoles.includes(req.user.role));

        if (!flattenedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route. Required: ${flattenedRoles.join(', ')}`
            });
        }

        console.log('✅ Authorization passed');
        next();
    };
};
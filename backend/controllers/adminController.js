import User from '../models/Users.js';

export const changeUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;

        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can change user roles'
            });
        }

        const validRoles = ['passenger', 'driver', 'station_admin', 'super_admin'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Valid roles are: passenger, driver, station_admin, super_admin'
            });
        }

        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (userToUpdate.email === process.env.SUPER_ADMIN_EMAIL && req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify the initial super admin account'
            });
        }

        userToUpdate.role = newRole;

        if (newRole === 'driver') {
            const { licenseNumber } = req.body;
            if (!licenseNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'License number is required for driver role'
                });
            }
            userToUpdate.licenseNumber = licenseNumber;
            
            //leul


        if (req.body.stationID) userToUpdate.stationID = req.body.stationID;
        }

        if (newRole === 'station_admin') {
            const { stationID } = req.body;
            if (!stationID) {
                return res.status(400).json({
                    success: false,
                    message: 'Station ID is required for station admin role'
                });
            }
            userToUpdate.stationID = stationID;
        }

        await userToUpdate.save();

        res.json({
            success: true,
            message: `User role changed to ${newRole} successfully`,
            data: {
                user: userToUpdate.toJSON()
            }
        });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change user role',
            error: error.message
        });
    }
};

export const assignPassengerToDriver = async (req, res) => {
    try {
        const { passengerId, licenseNumber, stationID } = req.body;

        if (req.user.role !== 'station_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only station admin can assign driver roles'
            });
        }

        const passenger = await User.findById(passengerId);
        if (!passenger) {
            return res.status(404).json({
                success: false,
                message: 'Passenger not found'
            });
        }

        if (passenger.role !== 'passenger') {
            return res.status(400).json({
                success: false,
                message: 'User is not a passenger'
            });
        }

        passenger.role = 'driver';
        passenger.licenseNumber = licenseNumber;
        passenger.stationID = stationID || req.user.stationID; // Use provided station or admin's station
        await passenger.save();

        res.json({
            success: true,
            message: 'Passenger assigned as driver successfully',
            data: {
                user: passenger.toJSON()
            }
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign driver role',
            error: error.message
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can view all users'
            });
        }

        const users = await User.find({}, '-password -refreshToken')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                users,
                total: users.length
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
};

export const getStationUsers = async (req, res) => {
    try {
        if (req.user.role !== 'station_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only station admin can view station users'
            });
        }

        const stationID = req.user.stationID;
        if (!stationID) {
            return res.status(400).json({
                success: false,
                message: 'Station admin does not have a station assigned'
            });
        }

        const users = await User.find({
            $or: [
                { stationID: stationID },
                { role: 'passenger' } // Passengers don't have station ID
            ],
            _id: { $ne: req.user._id } // Exclude self
        }, '-password -refreshToken')
            .sort({ role: 1, createdAt: -1 });

        res.json({
            success: true,
            data: {
                users,
                total: users.length
            }
        });
    } catch (error) {
        console.error('Get station users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get station users',
            error: error.message
        });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!['super_admin', 'station_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only admin users can toggle user status'
            });
        }

        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (req.user.role === 'station_admin') {
            if (!['passenger', 'driver'].includes(userToUpdate.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Station admin can only manage passengers and drivers'
                });
            }


            //leul

            // if (userToUpdate.stationID !== req.user.stationID) {
            //     return res.status(403).json({
            //         success: false,
            //         message: 'Cannot manage users from other stations'
            //     });
            // }
        }

        if (userToUpdate.email === process.env.SUPER_ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                message: 'Cannot deactivate the initial super admin account'
            });
        }

        userToUpdate.isActive = !userToUpdate.isActive;
        await userToUpdate.save();

        res.json({
            success: true,
            message: `User ${userToUpdate.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                user: userToUpdate.toJSON()
            }
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user status',
            error: error.message
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        let user;

        if (req.user.role === 'super_admin') {
            user = await User.findById(id, '-password -refreshToken');
        }
        else if (req.user.role === 'station_admin') {
            user = await User.findOne({
                _id: id,
                stationID: req.user.stationID
            }, '-password -refreshToken');
        }
        else if (req.user._id.toString() === id) {
            user = await User.findById(id, '-password -refreshToken');
        }
        else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
};
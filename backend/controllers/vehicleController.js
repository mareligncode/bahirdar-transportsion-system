import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js'
import mongoose from 'mongoose'

export const createVehicle = async (req, res) => {
    try {
        const {
            plateNumber,
            carType,
            totalCapacity,
            stationID,  // Now expects Station ObjectId
            make,
            model,
            year,
            color,
            insuranceExpiry,
            driverID,
            fuelType,
            features
        } = req.body;

        // Validate station exists and is active
        const station = await Station.findById(stationID);
        if (!station) {
            return res.status(400).json({
                success: false,
                message: 'Station not found'
            });
        }

        if (!station.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Station is inactive'
            });
        }

        // Check if vehicle already exists
        const existingVehicle = await Vehicle.findOne({ plateNumber });
        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle with this plate number already exists'
            });
        }

        // Validate driver (if provided)
        if (driverID) {
            const driver = await User.findOne({
                _id: driverID,
                role: 'driver',
                isActive: true
            });
            if (!driver) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid driver ID or driver is not active'
                });
            }
        }

        // Create new vehicle
        const vehicle = new Vehicle({
            plateNumber,
            carType,
            totalCapacity,
            stationID,
            make,
            model,
            year,
            color,
            insuranceExpiry: new Date(insuranceExpiry),
            driverID,
            fuelType,
            features,
            createdBy: req.user._id,
            currentStatus: driverID ? 'active' : 'available'
        });

        await vehicle.save();

        // Populate station and driver details
        await vehicle.populate([
            {
                path: 'stationID',
                select: 'stationCode stationName location.city'
            },
            {
                path: 'driverID',
                select: 'fullName email phoneNumber'
            }
        ]);

        res.status(201).json({
            success: true,
            message: 'Vehicle created successfully',
            data: { vehicle }
        });
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create vehicle',
            error: error.message
        });
    }
};


export const getAllVehicles = async (req, res) => {
    try {

        const {
            stationID,
            carType,
            status,
            driverID,
            page = 1,
            limit = 10,
            search
        } = req.query;

        const query = { isActive: true };

        // FIXED: Add ObjectId validation with proper error handling
        if (req.user.role === 'station_admin' && req.user.stationID) {
            try {
                // Validate if stationID is a proper MongoDB ObjectId
                if (mongoose.Types.ObjectId.isValid(req.user.stationID)) {
                    // Convert to ObjectId to ensure proper casting
                    query.stationID = new mongoose.Types.ObjectId(req.user.stationID);
                } else {
                    console.warn(`Station admin ${req.user._id} has invalid stationID: ${req.user.stationID}`);
                    // For invalid stationID, don't filter - return vehicles from all stations
                    // OR return empty array with informative message
                }
            } catch (validationError) {
                console.warn('StationID validation error:', validationError.message);
                // Continue without station filtering on validation error
            }
        }
        else if (stationID && req.user.role === 'super_admin') {
            try {
                if (mongoose.Types.ObjectId.isValid(stationID)) {
                    query.stationID = new mongoose.Types.ObjectId(stationID);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid station ID format. Station ID must be a valid MongoDB ObjectId.'
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid station ID',
                    error: error.message
                });
            }
        }

        // Apply other filters
        if (carType) query.carType = carType;
        if (status) query.currentStatus = status;
        if (driverID) {
            try {
                if (mongoose.Types.ObjectId.isValid(driverID)) {
                    query.driverID = new mongoose.Types.ObjectId(driverID);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid driver ID format'
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid driver ID',
                    error: error.message
                });
            }
        }

        // Search functionality
        if (search) {
            query.$or = [
                { plateNumber: { $regex: search, $options: 'i' } },
                { make: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Count documents with the same query
        const total = await Vehicle.countDocuments(query);

        // Fetch vehicles with population
        const vehicles = await Vehicle.find(query)
            .populate([
                {
                    path: 'stationID',
                    select: 'stationCode stationName location.city'
                },
                {
                    path: 'driverID',
                    select: 'fullName email phoneNumber'
                },
                {
                    path: 'createdBy',
                    select: 'fullName email'
                }
            ])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Prepare response
        const response = {
            success: true,
            data: { vehicles },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };

        // Add warning if station admin has invalid stationID
        if (req.user.role === 'station_admin' && req.user.stationID &&
            !mongoose.Types.ObjectId.isValid(req.user.stationID)) {
            response.warning = 'Station admin is not assigned to a valid station. Showing all available vehicles.';
        }

        res.json(response);

    } catch (error) {
        console.error('Get vehicles error details:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?._id,
            role: req.user?.role,
            stationID: req.user?.stationID
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
export const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findById(id)
            .populate([
                {
                    path: 'stationID',
                    select: 'stationCode stationName location.city contactPhone'
                },
                {
                    path: 'driverID',
                    select: 'fullName email phoneNumber licenseNumber'
                },
                {
                    path: 'createdBy',
                    select: 'fullName email'
                },
                {
                    path: 'updatedBy',
                    select: 'fullName email'
                }
            ]);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check if station_admin can access this vehicle
        if (req.user.role === 'station_admin' &&
            vehicle.stationID &&
            vehicle.stationID._id.toString() !== req.user.stationID?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Vehicle belongs to another station'
            });
        }

        res.json({
            success: true,
            data: { vehicle }
        });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle',
            error: error.message
        });
    }
};

export const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find vehicle
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' &&
            vehicle.stationID.toString() !== req.user.stationID?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Cannot update vehicle from another station'
            });
        }

        // If updating station, validate it exists
        if (updateData.stationID && updateData.stationID !== vehicle.stationID.toString()) {
            const newStation = await Station.findById(updateData.stationID);
            if (!newStation) {
                return res.status(400).json({
                    success: false,
                    message: 'Station not found'
                });
            }

            if (!newStation.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Station is inactive'
                });
            }

            // Only super_admin can change vehicle station
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admin can change vehicle station'
                });
            }
        }

        // If updating driver, validate
        if (updateData.driverID && updateData.driverID !== vehicle.driverID?.toString()) {
            const driver = await User.findOne({
                _id: updateData.driverID,
                role: 'driver',
                isActive: true
            });
            if (!driver) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid driver ID or driver is not active'
                });
            }
        }

        // Update vehicle
        Object.assign(vehicle, updateData);
        vehicle.updatedBy = req.user._id;

        await vehicle.save();

        // Populate updated data
        await vehicle.populate([
            {
                path: 'stationID',
                select: 'stationCode stationName location.city'
            },
            {
                path: 'driverID',
                select: 'fullName email phoneNumber'
            }
        ]);

        res.json({
            success: true,
            message: 'Vehicle updated successfully',
            data: { vehicle }
        });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle',
            error: error.message
        });
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' && vehicle.stationID !== req.user.stationID) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Cannot delete vehicle from another station'
            });
        }

        // Check if vehicle is currently on a trip
        if (vehicle.currentStatus === 'on_trip') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete vehicle while it is on a trip'
            });
        }

        // Soft delete (deactivate)
        vehicle.isActive = false;
        vehicle.currentStatus = 'inactive';
        vehicle.updatedBy = req.user._id;
        await vehicle.save();

        res.json({
            success: true,
            message: 'Vehicle deactivated successfully'
        });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vehicle',
            error: error.message
        });
    }
};

export const getAvailableVehicles = async (req, res) => {
    try {
        const {
            stationID,
            carType,
            minCapacity,
            tripDate = new Date()
        } = req.query;

        const query = {
            isActive: true,
            currentStatus: 'available',
            insuranceExpiry: { $gt: new Date() }
        };

        if (stationID) query.stationID = stationID;
        if (carType) query.carType = carType;
        if (minCapacity) query.totalCapacity = { $gte: parseInt(minCapacity) };

        // Check next service date
        query.$or = [
            { nextServiceDate: null },
            { nextServiceDate: { $gt: new Date(tripDate) } }
        ];

        const vehicles = await Vehicle.find(query)
            .populate('driverID', 'fullName phoneNumber licenseNumber')
            .select('plateNumber carType totalCapacity make model color features')
            .sort({ totalCapacity: 1 });

        res.json({
            success: true,
            data: { vehicles },
            count: vehicles.length
        });
    } catch (error) {
        console.error('Get available vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available vehicles',
            error: error.message
        });
    }
};

export const assignDriver = async (req, res) => {
    try {
        const { vehicleId, driverId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' && vehicle.stationID !== req.user.stationID) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const driver = await User.findOne({
            _id: driverId,
            role: 'driver',
            isActive: true
        });
        if (!driver) {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver or driver is not active'
            });
        }

        // Check if driver is already assigned to another vehicle
        const existingAssignment = await Vehicle.findOne({
            driverID: driverId,
            currentStatus: { $in: ['active', 'available', 'on_trip'] }
        });
        if (existingAssignment && existingAssignment._id.toString() !== vehicleId) {
            return res.status(400).json({
                success: false,
                message: `Driver is already assigned to vehicle ${existingAssignment.plateNumber}`
            });
        }

        // Update assignment
        vehicle.driverID = driverId;
        vehicle.currentStatus = 'active';
        vehicle.updatedBy = req.user._id;
        await vehicle.save();

        await vehicle.populate('driverID', 'fullName email phoneNumber licenseNumber');

        res.json({
            success: true,
            message: 'Driver assigned successfully',
            data: { vehicle }
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign driver',
            error: error.message
        });
    }
};

export const removeDriver = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' && vehicle.stationID !== req.user.stationID) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!vehicle.driverID) {
            return res.status(400).json({
                success: false,
                message: 'No driver assigned to this vehicle'
            });
        }

        // Check if vehicle is on a trip
        if (vehicle.currentStatus === 'on_trip') {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove driver while vehicle is on a trip'
            });
        }

        // Remove driver
        vehicle.driverID = null;
        vehicle.currentStatus = 'available';
        vehicle.updatedBy = req.user._id;
        await vehicle.save();

        res.json({
            success: true,
            message: 'Driver removed successfully',
            data: { vehicle }
        });
    } catch (error) {
        console.error('Remove driver error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove driver',
            error: error.message
        });
    }
};

export const updateVehicleStatus = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['active', 'maintenance', 'inactive', 'on_trip', 'available'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' && vehicle.stationID !== req.user.stationID) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Special checks for status changes
        if (status === 'maintenance') {
            vehicle.maintenanceLog.push({
                date: new Date(),
                description: notes || 'Vehicle sent for maintenance',
                servicedBy: req.user.fullName
            });
        }

        vehicle.currentStatus = status;
        vehicle.updatedBy = req.user._id;
        await vehicle.save();

        res.json({
            success: true,
            message: `Vehicle status updated to ${status}`,
            data: { vehicle }
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle status',
            error: error.message
        });
    }
};

export const addMaintenanceRecord = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const {
            description,
            cost,
            mileage,
            servicedBy,
            notes
        } = req.body;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' && vehicle.stationID !== req.user.stationID) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Add maintenance record
        vehicle.maintenanceLog.push({
            date: new Date(),
            description,
            cost: parseFloat(cost),
            mileage: parseInt(mileage),
            servicedBy: servicedBy || req.user.fullName,
            notes
        });

        // Update mileage if provided
        if (mileage && parseInt(mileage) > vehicle.mileage) {
            vehicle.mileage = parseInt(mileage);
        }

        // Set next service date (3 months from now as default)
        const nextService = new Date();
        nextService.setMonth(nextService.getMonth() + 3);
        vehicle.nextServiceDate = nextService;
        vehicle.lastServiceDate = new Date();

        vehicle.updatedBy = req.user._id;
        await vehicle.save();

        res.json({
            success: true,
            message: 'Maintenance record added successfully',
            data: {
                vehicle,
                maintenanceRecord: vehicle.maintenanceLog[vehicle.maintenanceLog.length - 1]
            }
        });
    } catch (error) {
        console.error('Add maintenance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add maintenance record',
            error: error.message
        });
    }
};

export const getInsuranceExpiring = async (req, res) => {
    try {
        const { days = 30 } = req.query; // Default: vehicles expiring in next 30 days

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + parseInt(days));

        const vehicles = await Vehicle.find({
            isActive: true,
            insuranceExpiry: {
                $gte: new Date(),
                $lte: cutoffDate
            }
        })
            .select('plateNumber carType insuranceExpiry stationID driverID currentStatus')
            .populate('driverID', 'fullName phoneNumber')
            .sort({ insuranceExpiry: 1 });

        res.json({
            success: true,
            data: { vehicles },
            count: vehicles.length,
            warning: `Showing vehicles with insurance expiring within ${days} days`
        });
    } catch (error) {
        console.error('Get insurance expiring error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles with expiring insurance',
            error: error.message
        });
    }
};
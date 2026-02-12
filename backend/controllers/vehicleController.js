import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js'
import mongoose from 'mongoose'
import cloudinary from '../config/cloudinary.js'
import upload from '../utils/multerConfig.js'
import NotificationService from '../services/notificationService.js';

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
            search,
            hasImages, // New filter: true/false to filter vehicles with/without images
            sortBy = 'createdAt',
            sortOrder = 'desc'
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
                }
            } catch (validationError) {
                console.warn('StationID validation error:', validationError.message);
            }
        }
        else if (stationID && req.user.role === 'super_admin') {
            try {
                if (mongoose.Types.ObjectId.isValid(stationID)) {
                    query.stationID = new mongoose.Types.ObjectId(stationID);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid station ID format'
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

        // Filter by image presence
        if (hasImages === 'true') {
            query.images = { $exists: true, $ne: [] }; // Vehicles with images
        } else if (hasImages === 'false') {
            query.$or = [
                { images: { $exists: false } },
                { images: { $size: 0 } }
            ]; // Vehicles without images
        }

        // Search functionality
        if (search) {
            query.$or = [
                { plateNumber: { $regex: search, $options: 'i' } },
                { make: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { 'stationID.stationName': { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Determine sort order
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sortBy] = sortDirection;

        // Count documents with the same query
        const total = await Vehicle.countDocuments(query);

        // Fetch vehicles with population
        const vehicles = await Vehicle.find(query)
            .populate([
                {
                    path: 'stationID',
                    select: 'stationCode stationName location.city contactPhone'
                },
                {
                    path: 'driverID',
                    select: 'fullName email phoneNumber licenseNumber profilePicture'
                },
                {
                    path: 'createdBy',
                    select: 'fullName email'
                }
            ])
            .select('-maintenanceLog') // Exclude large maintenance log by default
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // Use lean() for better performance

        // Enhance vehicle data with image info
        const enhancedVehicles = vehicles.map(vehicle => ({
            ...vehicle,
            imagesCount: vehicle.images ? vehicle.images.length : 0,
            hasImages: vehicle.images && vehicle.images.length > 0,
            primaryImage: vehicle.images && vehicle.images.find(img => img.isPrimary),
            thumbnail: vehicle.thumbnailImage || (vehicle.images && vehicle.images[0] ? vehicle.images[0].url : null)
        }));

        // Prepare response
        const response = {
            success: true,
            data: { vehicles: enhancedVehicles },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            filters: {
                stationID: stationID || 'all',
                carType: carType || 'all',
                status: status || 'all',
                hasImages: hasImages || 'all',
                search: search || 'none'
            }
        };

        // Add warning if station admin has invalid stationID
        if (req.user.role === 'station_admin' && req.user.stationID &&
            !mongoose.Types.ObjectId.isValid(req.user.stationID)) {
            response.warning = 'Station admin is not assigned to a valid station. Showing all available vehicles.';
        }

        res.json(response);

    } catch (error) {
        console.error('Get vehicles error:', error);
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

        // Validate vehicle ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vehicle ID format'
            });
        }

        // Get vehicle with ALL populated data
        const vehicle = await Vehicle.findById(id)
            .populate([
                {
                    path: 'stationID',
                    select: 'stationCode stationName location address contactPhone email manager operatingHours isActive createdAt'
                },
                {
                    path: 'driverID',
                    select: 'fullName email phoneNumber licenseNumber profilePicture dateOfBirth address isActive'
                },
                {
                    path: 'createdBy',
                    select: 'fullName email role'
                },
                {
                    path: 'updatedBy',
                    select: 'fullName email role'
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

        // Convert vehicle to plain object and add additional computed fields
        const vehicleData = vehicle.toObject();

        // Add image statistics
        if (vehicleData.images && vehicleData.images.length > 0) {
            vehicleData.imageStats = {
                totalImages: vehicleData.images.length,
                primaryImage: vehicleData.images.find(img => img.isPrimary),
                thumbnail: vehicleData.thumbnailImage || vehicleData.images[0]?.url,
                imagesByType: vehicleData.images.reduce((acc, img) => {
                    const fileType = img.fileType?.split('/')[1] || 'unknown';
                    acc[fileType] = (acc[fileType] || 0) + 1;
                    return acc;
                }, {})
            };
        } else {
            vehicleData.imageStats = {
                totalImages: 0,
                primaryImage: null,
                thumbnail: null,
                imagesByType: {}
            };
        }

        // Add insurance status
        if (vehicleData.insuranceExpiry) {
            const today = new Date();
            const expiryDate = new Date(vehicleData.insuranceExpiry);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            vehicleData.insuranceStatus = {
                expiryDate: vehicleData.insuranceExpiry,
                isExpired: expiryDate < today,
                daysUntilExpiry: daysUntilExpiry,
                status: expiryDate < today ? 'expired' :
                    daysUntilExpiry <= 30 ? 'expiring_soon' : 'valid'
            };
        }

        // Add service status
        if (vehicleData.nextServiceDate) {
            const today = new Date();
            const nextService = new Date(vehicleData.nextServiceDate);
            const daysUntilService = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24));

            vehicleData.serviceStatus = {
                nextServiceDate: vehicleData.nextServiceDate,
                lastServiceDate: vehicleData.lastServiceDate,
                daysUntilService: daysUntilService,
                status: daysUntilService <= 7 ? 'due_soon' :
                    daysUntilService <= 0 ? 'overdue' : 'scheduled'
            };
        }

        // Add maintenance summary
        if (vehicleData.maintenanceLog && vehicleData.maintenanceLog.length > 0) {
            vehicleData.maintenanceSummary = {
                totalRecords: vehicleData.maintenanceLog.length,
                lastMaintenance: vehicleData.maintenanceLog[vehicleData.maintenanceLog.length - 1],
                totalCost: vehicleData.maintenanceLog.reduce((sum, record) => sum + (record.cost || 0), 0)
            };
        }

        res.json({
            success: true,
            message: 'Vehicle retrieved successfully',
            data: {
                vehicle: vehicleData
            }
        });
    } catch (error) {
        console.error('Get vehicle by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const getVehicleWithImages = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findById(id)
            .select('plateNumber make model carType color images thumbnailImage')
            .populate([
                {
                    path: 'stationID',
                    select: 'stationCode stationName location.city'
                },
                {
                    path: 'driverID',
                    select: 'fullName phoneNumber'
                }
            ]);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin' &&
            vehicle.stationID &&
            vehicle.stationID._id.toString() !== req.user.stationID?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: {
                vehicleId: vehicle._id,
                plateNumber: vehicle.plateNumber,
                make: vehicle.make,
                model: vehicle.model,
                carType: vehicle.carType,
                color: vehicle.color,
                station: vehicle.stationID,
                driver: vehicle.driverID,
                thumbnailImage: vehicle.thumbnailImage,
                images: vehicle.images || [],
                totalImages: vehicle.images ? vehicle.images.length : 0,
                primaryImage: vehicle.images ? vehicle.images.find(img => img.isPrimary) : null
            }
        });

    } catch (error) {
        console.error('Get vehicle with images error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle images',
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

        // Send driver update notification if driver was changed
        if (updateData.driverID && updateData.driverID !== vehicle.driverID?.toString()) {
            try {
                const driver = await User.findById(updateData.driverID);
                const notificationData = {
                    userID: updateData.driverID,
                    title: 'Vehicle Assignment Updated',
                    message: `You have been assigned to vehicle ${vehicle.plateNumber}. Please review your new assignment details.`,
                    type: 'driver_update',
                    channel: 'all',
                    priority: 'medium',
                    metadata: {
                        userName: driver.fullName,
                        vehicle: {
                            plateNumber: vehicle.plateNumber,
                            carType: vehicle.carType,
                            model: vehicle.model,
                            year: vehicle.year
                        },
                        station: {
                            stationName: vehicle.stationID?.stationName,
                            location: vehicle.stationID?.location
                        },
                        actionURL: `${process.env.CLIENT_URL}/dashboard/vehicle/${vehicle._id}`,
                        actionText: 'View Vehicle Details'
                    }
                };

                await NotificationService.createNotification(notificationData);
            } catch (notificationError) {
                console.error('Failed to send driver update notification:', notificationError);
            }
        }
//end of notification changes
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

        // Send notification to driver about assignment
        try {
            const notificationData = {
                userID: driverId,
                title: 'New Vehicle Assignment - Ready for Service!',
                message: `You have been assigned to vehicle ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model}). Please review the vehicle details and prepare for service.`,
                type: 'driver_assignment',
                channel: 'all',
                priority: 'medium',
                metadata: {
                    userName: driver.fullName,
                    vehicle: {
                        plateNumber: vehicle.plateNumber,
                        make: vehicle.make,
                        model: vehicle.model,
                        carType: vehicle.carType,
                        color: vehicle.color,
                        totalCapacity: vehicle.totalCapacity
                    },
                    station: {
                        stationName: vehicle.stationID?.stationName,
                        location: vehicle.stationID?.location
                    },
                    assignment: {
                        assignedBy: req.user.fullName,
                        assignedAt: new Date(),
                        status: 'active'
                    },
                    actionURL: `${process.env.CLIENT_URL}/dashboard/vehicles/${vehicle._id}`,
                    actionText: 'View Vehicle Details'
                }
            };

            await NotificationService.createNotification(notificationData);
        } catch (notificationError) {
            console.error('Failed to send driver assignment notification:', notificationError);
        }
        // end notification changes

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
export const uploadVehicleImages = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (req.user.role === 'station_admin' &&
            vehicle.stationID.toString() !== req.user.stationID?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Cannot upload images for vehicle from another station'
            });
        }

        const uploadMiddleware = upload.array('images', 5);

        uploadMiddleware(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Upload failed',
                    error: err.message
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            const uploadedImages = [];

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];

                try {
                    const result = await new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: process.env.CLOUDINARY_FOLDER || 'transport_system/vehicles',
                                public_id: `vehicle_${vehicleId}_${Date.now()}_${i}`,
                                resource_type: 'auto'
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );

                        stream.end(file.buffer);
                    });

                    const imageData = {
                        url: result.secure_url,
                        publicId: result.public_id,
                        fileName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: file.size,
                        isPrimary: vehicle.images.length === 0 && i === 0 // First image becomes primary
                    };

                    uploadedImages.push(imageData);
                    vehicle.images.push(imageData);

                } catch (cloudinaryError) {
                    console.error('Cloudinary upload error:', cloudinaryError);
                    continue;
                }
            }

            await vehicle.save();

            res.json({
                success: true,
                message: `${uploadedImages.length} image(s) uploaded successfully`,
                data: {
                    vehicleId: vehicle._id,
                    uploadedImages,
                    totalImages: vehicle.images.length
                }
            });
        });

    } catch (error) {
        console.error('Upload vehicle images error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: error.message
        });
    }
};
export const setPrimaryImage = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { imageUrl } = req.body;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (req.user.role === 'station_admin' &&
            vehicle.stationID.toString() !== req.user.stationID?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const imageExists = vehicle.images.find(img => img.url === imageUrl);
        if (!imageExists) {
            return res.status(404).json({
                success: false,
                message: 'Image not found for this vehicle'
            });
        }

        vehicle.images.forEach(img => {
            img.isPrimary = img.url === imageUrl;
        });

        vehicle.thumbnailImage = imageUrl;

        await vehicle.save();

        res.json({
            success: true,
            message: 'Primary image set successfully',
            data: {
                primaryImage: imageUrl,
                vehicleId: vehicle._id
            }
        });

    } catch (error) {
        console.error('Set primary image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set primary image',
            error: error.message
        });
    }
};

export const removeVehicleImage = async (req, res) => {
    try {
        const { vehicleId, imageUrl } = req.params;

        // Decode URL parameter
        const decodedImageUrl = decodeURIComponent(imageUrl);

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (req.user.role === 'station_admin' &&
            vehicle.stationID.toString() !== req.user.stationID?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const imageIndex = vehicle.images.findIndex(img => img.url === decodedImageUrl);
        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        const imageToRemove = vehicle.images[imageIndex];

        // Delete from Cloudinary
        if (imageToRemove.publicId) {
            try {
                await cloudinary.uploader.destroy(imageToRemove.publicId);
            } catch (cloudinaryError) {
                console.warn('Failed to delete from Cloudinary:', cloudinaryError.message);
            }
        }

        vehicle.images.splice(imageIndex, 1);

        // Update thumbnail
        if (vehicle.thumbnailImage === decodedImageUrl) {
            const newPrimary = vehicle.images.find(img => img.isPrimary) ||
                (vehicle.images.length > 0 ? vehicle.images[0] : null);
            vehicle.thumbnailImage = newPrimary ? newPrimary.url : null;
        }

        await vehicle.save();

        res.json({
            success: true,
            message: 'Image removed successfully',
            data: {
                vehicleId: vehicle._id,
                remainingImages: vehicle.images.length
            }
        });

    } catch (error) {
        console.error('Remove vehicle image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};

export const getVehicleImages = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId).select('images thumbnailImage plateNumber make model');
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            data: {
                vehicleId: vehicle._id,
                plateNumber: vehicle.plateNumber,
                make: vehicle.make,
                model: vehicle.model,
                thumbnailImage: vehicle.thumbnailImage,
                images: vehicle.images,
                totalImages: vehicle.images.length,
                primaryImage: vehicle.images.find(img => img.isPrimary)
            }
        });

    } catch (error) {
        console.error('Get vehicle images error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vehicle images',
            error: error.message
        });
    }
};
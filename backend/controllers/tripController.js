import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js';

// Create a new trip
export const createTrip = async (req, res) => {
    try {
        const {
            origin, destination, departureTime, arrivalTime,
            vehicleID, driverID, price, totalSeats, stationID,
            routePoints, estimatedDuration, notes
        } = req.body;

        // Check vehicle exists
        const vehicle = await Vehicle.findById(vehicleID);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Check driver exists and is driver
        const driver = await User.findById(driverID);
        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Check stations exist
        const [originStation, destinationStation] = await Promise.all([
            Station.findById(origin),
            Station.findById(destination)
        ]);

        if (!originStation || !destinationStation) {
            return res.status(404).json({ message: 'Station not found' });
        }

        // Check vehicle capacity
        if (vehicle.totalCapacity < totalSeats) {
            return res.status(400).json({
                message: `Vehicle capacity is ${vehicle.totalCapacity}, requested ${totalSeats} seats`
            });
        }

        // Create trip
        const trip = new Trip({
            origin,
            destination,
            departureTime,
            arrivalTime,
            vehicle: vehicleID,
            driver: driverID,
            price,
            availableSeats: totalSeats,
            totalSeats,
            station: stationID,
            routePoints: routePoints || [],
            estimatedDuration,
            notes,
            createdBy: req.user.id
        });

        await trip.save();

        // Populate and return
        const populatedTrip = await Trip.findById(trip._id)
            // .populate('origin', 'stationName city')
            // .populate('destination', 'stationName city')
            // .populate('vehicleID', 'plateNumber carType totalCapacity')
            // .populate('driverID', 'fullName phoneNumber')
            // .populate('stationID', 'stationName')
        // .populate('createdBy', 'fullName');
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicle', 'plateNumber carType totalCapacity')
            .populate('driver', 'fullName phoneNumber')
            .populate('station', 'stationName')
            .populate('createdBy', 'fullName');


        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            data: populatedTrip
        });

    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating trip',
            error: error.message
        });
    }
};

// Get all trips
export const getAllTrips = async (req, res) => {
    try {
        const { status, origin, destination, page = 1, limit = 20 } = req.query;

        // Build query based on user role
        let query = {};

        // Station admin can only see their station's trips
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (station) {
                query.stationID = station._id;
            }
        }

        // Driver can only see their trips
        if (req.user.role === 'driver') {
            query.driverID = req.user.id;
        }

        // Passengers can only see available trips
        if (req.user.role === 'passenger') {
            query.isActive = true;
            query.tripStatus = { $in: ['scheduled', 'boarding'] };
            query.availableSeats = { $gt: 0 };
            query.departureTime = { $gt: new Date() };
        }

        // Add filters
        if (status && status !== 'all') {
            query.tripStatus = status;
        }

        if (origin) {
            query.origin = origin;
        }

        if (destination) {
            query.destination = destination;
        }

        const skip = (page - 1) * limit;

        const trips = await Trip.find(query)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicle', 'plateNumber carType')
            .populate('driver', 'fullName')
            .populate('station', 'stationName')
            .sort({ departureTime: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Trip.countDocuments(query);

        res.status(200).json({
            success: true,
            count: trips.length,
            total,
            data: trips
        });

    } catch (error) {
        console.error('Get all trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trips',
            error: error.message
        });
    }
};

// Get single trip by ID
export const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('origin', 'stationName city location')
            .populate('destination', 'stationName city location')
            .populate('vehicle', 'plateNumber carType totalCapacity color')
            .populate('driver', 'fullName phoneNumber licenseNumber')
            .populate('station', 'stationName location')
            .populate('createdBy', 'fullName');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !trip.stationID.equals(station._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this trip'
                });
            }
        }

        if (req.user.role === 'driver') {
            if (!trip.driverID.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this trip'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: trip
        });

    } catch (error) {
        console.error('Get trip by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trip',
            error: error.message
        });
    }
};

// Update trip
export const updateTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (!station || !trip.station.equals(station._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        // Update trip fields
        const updates = req.body;

        // Handle seat updates
        if (updates.totalSeats) {
            const vehicle = await Vehicle.findById(trip.vehicle);
            if (vehicle.totalCapacity < updates.totalSeats) {
                return res.status(400).json({
                    success: false,
                    message: `Vehicle capacity is ${vehicle.totalCapacity}`
                });
            }

            // Update available seats
            const seatDifference = updates.totalSeats - trip.totalSeats;
            updates.availableSeats = trip.availableSeats + seatDifference;
        }

        // Update the trip
        Object.keys(updates).forEach(key => {
            trip[key] = updates[key];
        });

        await trip.save();

        // Get updated trip with populated data
        const updatedTrip = await Trip.findById(trip._id)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicle', 'plateNumber carType')
            .populate('driver', 'fullName')
            .populate('station', 'stationName');

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully',
            data: updatedTrip
        });

    } catch (error) {
        console.error('Update trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating trip',
            error: error.message
        });
    }
};

// Delete trip
export const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (!station || !trip.station.equals(station._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this trip'
                });
            }
        }

        await trip.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Trip deleted successfully'
        });

    } catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting trip',
            error: error.message
        });
    }
};

// Search trips for passengers
export const searchTrips = async (req, res) => {
    try {
        const { origin, destination, date } = req.query;

        if (!origin || !destination || !date) {
            return res.status(400).json({
                success: false,
                message: 'Origin, destination, and date are required'
            });
        }

        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

        const query = {
            origin,
            destination,
            departureTime: { $gte: startOfDay, $lte: endOfDay },
            tripStatus: { $in: ['scheduled', 'boarding'] },
            isActive: true,
            availableSeats: { $gt: 0 }
        };

        const trips = await Trip.find(query)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicle', 'plateNumber carType totalCapacity')
            .populate('driver', 'fullName')
            .populate('station', 'stationName')
            .sort({ departureTime: 1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: trips
        });

    } catch (error) {
        console.error('Search trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching trips',
            error: error.message
        });
    }
};

// Update trip status
export const updateTripStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check driver can only update their own trips
        if (req.user.role === 'driver') {
            if (!trip.driverID.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        // Check station admin permissions
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (!station || !trip.stationID.equals(station._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        // Update status
        trip.tripStatus = status;
        await trip.save();

        res.status(200).json({
            success: true,
            message: `Trip status updated to ${status}`,
            data: trip
        });

    } catch (error) {
        console.error('Update trip status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating trip status',
            error: error.message
        });
    }
};

// Get driver's assigned trips
export const getDriverTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ driverID: req.user.id })
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicleID', 'plateNumber carType')
            .populate('stationID', 'stationName')
            .sort({ departureTime: 1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: trips
        });

    } catch (error) {
        console.error('Get driver trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching driver trips',
            error: error.message
        });
    }
};

// Toggle trip active status
export const toggleTripActive = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (!station || !trip.stationID.equals(station._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        trip.isActive = !trip.isActive;
        await trip.save();

        res.status(200).json({
            success: true,
            message: `Trip ${trip.isActive ? 'activated' : 'deactivated'}`,
            data: trip
        });

    } catch (error) {
        console.error('Toggle trip active error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling trip status',
            error: error.message
        });
    }
};
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js';
export const createTrip = async (req, res) => {
    try {
        const {
            origin,
            destination,
            departureTime,
            arrivalTime,
            vehicleID,
            driverID,
            price,
            totalSeats,
            stationID,
            routePoints,
            estimatedDuration,
            notes
        } = req.body;

        const vehicle = await Vehicle.findById(vehicleID);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const driver = await User.findById(driverID);
        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const [originStation, destinationStation] = await Promise.all([
            Station.findById(origin),
            Station.findById(destination)
        ]);

        if (!originStation || !destinationStation) {
            return res.status(404).json({ message: 'Station not found' });
        }

        if (vehicle.totalCapacity < totalSeats) {
            return res.status(400).json({
                message: `Vehicle capacity is ${vehicle.totalCapacity}, requested ${totalSeats} seats`
            });
        }

        const trip = new Trip({
            origin,
            destination,
            departureTime,
            arrivalTime,
            vehicleID,
            driverID,
            price,
            availableSeats: totalSeats,
            totalSeats,
            stationID,
            routePoints: routePoints || [],
            estimatedDuration,
            notes,
            createdBy: req.user.id
        });

        await trip.save();

        const populatedTrip = await Trip.findById(trip._id)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .populate('driverID', 'fullName phoneNumber')
            .populate('stationID', 'stationName')
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

export const getAllTrips = async (req, res) => {
    try {
        const { status, origin, destination, page = 1, limit = 20 } = req.query;

        let query = {};

        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (station) {
                query.stationID = station._id;
            }
        }

        if (req.user.role === 'driver') {
            query.driverID = req.user.id;
        }
        if (req.user.role === 'passenger') {
            query.isActive = true;
            query.tripStatus = { $in: ['scheduled', 'boarding'] };
            query.availableSeats = { $gt: 0 };
            query.departureTime = { $gt: new Date() };
        }

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
            .populate('vehicleID', 'plateNumber carType')
            .populate('driverID', 'fullName')
            .populate('stationID', 'stationName')
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

export const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('origin', 'stationName city location')
            .populate('destination', 'stationName city location')
            .populate('vehicleID', 'plateNumber carType totalCapacity color')
            .populate('driverID', 'fullName phoneNumber licenseNumber')
            .populate('stationID', 'stationName location')
            .populate('createdBy', 'fullName');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

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

export const updateTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (!station || !trip.stationID.equals(station._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        const updates = req.body;
        if (updates.totalSeats) {
            const vehicle = await Vehicle.findById(trip.vehicleID);
            if (vehicle.totalCapacity < updates.totalSeats) {
                return res.status(400).json({
                    success: false,
                    message: `Vehicle capacity is ${vehicle.totalCapacity}`
                });
            }

            const seatDifference = updates.totalSeats - trip.totalSeats;
            updates.availableSeats = trip.availableSeats + seatDifference;
        }

        Object.keys(updates).forEach(key => {
            trip[key] = updates[key];
        });

        await trip.save();

        const updatedTrip = await Trip.findById(trip._id)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicleID', 'plateNumber carType')
            .populate('driverID', 'fullName')
            .populate('stationID', 'stationName');

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

export const deleteTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (!station || !trip.stationID.equals(station._id)) {
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
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .populate('driverID', 'fullName')
            .populate('stationID', 'stationName')
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

        if (req.user.role === 'driver') {
            if (!trip.driverID.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

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
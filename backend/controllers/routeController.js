import Route from '../models/Route.js';
import Station from '../models/Station.js';

export const createRoute = async (req, res) => {
    try {
        const { origin, destination, routeName, basePrice, estimatedDuration, distance } = req.body;

        // Check if stations exist
        const [originStation, destinationStation] = await Promise.all([
            Station.findById(origin),
            Station.findById(destination)
        ]);

        if (!originStation || !destinationStation) {
            return res.status(404).json({ success: false, message: 'Origin or Destination station not found' });
        }

        if (req.user.role === 'station_admin') {
            if (origin !== req.user.stationID.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Station admins can only create routes starting from their own station'
                });
            }
        }

        const route = new Route({
            origin,
            destination,
            routeName,
            basePrice,
            estimatedDuration,
            distance,
            createdBy: req.user.id
        });

        await route.save();

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: route
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A route between these two stations already exists.'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllRoutes = async (req, res) => {
    try {
        const { origin } = req.query;
        let query = {};

        if (origin) {
            query.origin = origin;
        }

        // If Station Admin, only show routes starting from their station
        if (req.user.role === 'station_admin') {
            query.origin = req.user.stationID;
        }

        const routes = await Route.find(query)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city');

        res.status(200).json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city');

        if (!route) {
            return res.status(404).json({ success: false, message: 'Route not found' });
        }

        // If Station Admin, verify it's their station
        if (req.user.role === 'station_admin' && route.origin._id.toString() !== req.user.stationID.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view routes from other stations' });
        }

        res.status(200).json({ success: true, data: route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!route) {
            return res.status(404).json({ success: false, message: 'Route not found' });
        }

        // If Station Admin, verify it's their station
        if (req.user.role === 'station_admin' && route.origin.toString() !== req.user.stationID.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update routes from other stations' });
        }

        res.status(200).json({ success: true, message: 'Route updated', data: route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        // If Station Admin, verify it's their station
        if (req.user.role === 'station_admin' && route.origin.toString() !== req.user.stationID.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete routes from other stations' });
        }

        await Route.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

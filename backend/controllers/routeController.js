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

        res.status(200).json({ success: true, message: 'Route updated', data: route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) return res.status(404).json({ message: 'Not found' });
        res.status(200).json({ success: true, message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

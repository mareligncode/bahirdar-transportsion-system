import Station from '../models/Station.js';
import User from '../models/Users.js';
import { validationResult } from 'express-validator';

export const createStation = async (req, res) => {
    try {
        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if station code already exists
        const existingStation = await Station.findOne({ stationCode: req.body.stationCode });
        if (existingStation) {
            return res.status(400).json({ message: 'Station code already exists' });
        }

        // Check if manager exists and is a station admin
        if (req.body.manager) {
            const manager = await User.findById(req.body.manager);
            if (!manager || manager.role !== 'station_admin') {
                return res.status(400).json({ message: 'Manager must be a station admin' });
            }
        }

        const station = new Station(req.body);

        await station.save();

        res.status(201).json({
            message: 'Station created successfully',
            station
        });
    } catch (error) {
        console.error('Create station error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getStations = async (req, res) => {
    try {
        const { city, isActive, page = 1, limit = 10 } = req.query;
        const query = {};

        // Apply filters
        if (city) query.city = city;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (page - 1) * limit;

        const stations = await Station.find(query)
            .populate('manager', 'fullName email phoneNumber')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Station.countDocuments(query);

        res.status(200).json({
            stations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalStations: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get stations error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getStationById = async (req, res) => {
    try {
        const station = await Station.findById(req.params.id)
            .populate('manager', 'fullName email phoneNumber');

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        res.status(200).json({ station });
    } catch (error) {
        console.error('Get station by ID error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateStation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;

        // Check if station code is being updated and is unique
        if (req.body.stationCode) {
            const existingStation = await Station.findOne({
                stationCode: req.body.stationCode,
                _id: { $ne: id }
            });
            if (existingStation) {
                return res.status(400).json({ message: 'Station code already exists' });
            }
        }

        // Check if manager exists and is a station admin
        if (req.body.manager) {
            const manager = await User.findById(req.body.manager);
            if (!manager || manager.role !== 'station_admin') {
                return res.status(400).json({ message: 'Manager must be a station admin' });
            }
        }

        const station = await Station.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        ).populate('manager', 'fullName email phoneNumber');

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        res.status(200).json({
            message: 'Station updated successfully',
            station
        });
    } catch (error) {
        console.error('Update station error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteStation = async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }


        await station.deleteOne();

        res.status(200).json({ message: 'Station deleted successfully' });
    } catch (error) {
        console.error('Delete station error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deactivateStation = async (req, res) => {
    try {
        const station = await Station.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        res.status(200).json({
            message: 'Station deactivated successfully',
            station
        });
    } catch (error) {
        console.error('Deactivate station error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const activateStation = async (req, res) => {
    try {
        const station = await Station.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        res.status(200).json({
            message: 'Station activated successfully',
            station
        });
    } catch (error) {
        console.error('Activate station error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getActiveStations = async (req, res) => {
    try {
        const stations = await Station.find({ isActive: true })
            .select('_id stationCode stationName city location')
            .sort({ stationName: 1 });

        res.status(200).json({ stations });
    } catch (error) {
        console.error('Get active stations error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
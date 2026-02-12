import Station from '../models/Station.js';
import User from '../models/Users.js';
import { validationResult } from 'express-validator';
import NotificationService from '../services/notificationService.js';

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
        if (!req.body.manager) {
            return res.status(400).json({ message: 'Manager is required' });
        }
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

        // Send station update notification to all users
        try {
            // Get all active users to send notification to
            const targetUsers = await User.find({ isActive: true });

            // Send notifications to all users
            await Promise.all(
                targetUsers.map(user =>
                    NotificationService.createNotification({
                        userID: user._id,
                        title: 'Station Information Updated',
                        message: `Station ${station.stationName} information has been updated. Please check the latest details.`,
                        type: 'station_update',
                        channel: 'all',
                        priority: 'medium',
                        metadata: {
                            station: {
                                stationName: station.stationName,
                                stationCode: station.stationCode,
                                city: station.city,
                                address: station.address
                            },
                            actionURL: `${process.env.CLIENT_URL}/stations/${station._id}`,
                            actionText: 'View Station Details'
                        }
                    })
                )
            );

        } catch (notificationError) {
            console.error('Failed to send station update notification:', notificationError);
        }
        // end of notification changes
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
// from this to the end are new changes related to station announcements
export const createStationAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, priority, audience, expiresAt } = req.body;

        // Validate required fields
        if (!title || !message || !priority || !audience) {
            return res.status(400).json({
                success: false,
                message: "Title, message, priority and audience are required"
            });
        }

        const station = await Station.findById(id);
        if (!station) {
            return res.status(404).json({
                success: false,
                message: "Station not found"
            });
        }

        // Check permissions
        if (!req.user ||
            (req.user.role !== "station_admin" && req.user.role !== "super_admin")) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to create announcements"
            });
        }

        // Validate priority
        const validPriorities = ["low", "medium", "high", "urgent"];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: `Invalid priority. Valid priorities: ${validPriorities.join(", ")}`
            });
        }

        // Validate audience
        const validAudiences = ["all", "passengers", "drivers", "staff"];
        if (!validAudiences.includes(audience)) {
            return res.status(400).json({
                success: false,
                message: `Invalid audience. Valid audiences: ${validAudiences.join(", ")}`
            });
        }

        // 🔥 IMPORTANT FIX — ensure announcements array exists
        if (!station.announcements) {
            station.announcements = [];
        }

        const announcement = {
            title,
            message,
            priority,
            audience,
            createdBy: req.user._id,
            createdAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null
        };

        station.announcements.push(announcement);
        await station.save();

        // ===============================
        // Send Notifications (Safe Mode)
        // ===============================
        try {
            let query = { isActive: true };

            switch (audience) {
                case "all":
                    query.role = { $in: ["passenger", "driver", "station_admin"] };
                    break;
                case "passengers":
                    query.role = "passenger";
                    break;
                case "drivers":
                    query.role = "driver";
                    break;
                case "staff":
                    query.role = { $in: ["station_admin", "driver"] };
                    break;
            }

            const targetUsers = await User.find(query);

            // Send notifications in parallel (faster)
            await Promise.all(
                targetUsers.map(user =>
                    NotificationService.createNotification({
                        userID: user._id,
                        title: `Announcement from ${station.stationName}`,
                        message: title,
                        type: "station_announcement",
                        channel: "all",
                        priority,
                        metadata: {
                            station: {
                                stationName: station.stationName,
                                stationCode: station.stationCode,
                                city: station.city
                            },
                            announcement
                        }
                    })
                )
            );

        } catch (notificationError) {
            console.error("Notification error:", notificationError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: station.announcements[station.announcements.length - 1]
        });

    } catch (error) {
        console.error("Create station announcement error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create announcement",
            error: error.message
        });
    }
};


export const getStationAnnouncements = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const station = await Station.findById(id);
        if (!station) {
            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }

        // ✅ Ensure announcements array exists
        const announcementsArray = station.announcements || [];

        // Filter announcements (exclude expired ones)
        const now = new Date();
        const activeAnnouncements = announcementsArray.filter(announcement =>
            !announcement.expiresAt || announcement.expiresAt > now
        );

        // Sort by priority and date
        const sortedAnnouncements = activeAnnouncements.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const skip = (page - 1) * limit;
        const paginatedAnnouncements = sortedAnnouncements.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                station: {
                    _id: station._id,
                    stationName: station.stationName,
                    stationCode: station.stationCode,
                    city: station.city
                },
                announcements: paginatedAnnouncements,
                total: sortedAnnouncements.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(sortedAnnouncements.length / limit)
            }
        });

    } catch (error) {
        console.error('Get station announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch announcements',
            error: error.message
        });
    }
};


export const deleteStationAnnouncement = async (req, res) => {
    try {
        const { id, announcementId } = req.params;

        const station = await Station.findById(id);
        if (!station) {
            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'station_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete announcements'
            });
        }

        // Find and remove announcement
        const announcementIndex = station.announcements.findIndex(
            announcement => announcement._id.toString() === announcementId
        );

        if (announcementIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        station.announcements.splice(announcementIndex, 1);
        await station.save();

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });

    } catch (error) {
        console.error('Delete station announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete announcement',
            error: error.message
        });
    }
};

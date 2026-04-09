import Queue from '../models/Queue.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import User from '../models/Users.js';
import Route from '../models/Route.js';
import QueueAutomator from '../services/queueAutomator.js';
import NotificationService from '../services/notificationService.js';

/**
 * Join the station queue (FOR A SPECIFIC DESTINATION)
 */
export const joinQueue = async (req, res) => {
    try {
        const { stationID, destinationID, routeID, vehicleID, driverID, notes } = req.body;

        let finalDestinationID = destinationID;

        // SMART LOGIC: If routeID is provided, automatically find the destination
        if (routeID && !finalDestinationID) {
            const route = await Route.findById(routeID);
            if (!route) {
                return res.status(404).json({ success: false, message: 'Route not found' });
            }
            finalDestinationID = route.destination;
        }

        if (!finalDestinationID) {
            return res.status(400).json({ success: false, message: 'Destination is required' });
        }

        // Check if vehicle exists
        const vehicle = await Vehicle.findById(vehicleID);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check if vehicle is already in ANY queue (waiting or loading)
        const activeQueue = await Queue.findOne({
            vehicle: vehicleID,
            status: { $in: ['waiting', 'loading'] }
        });

        if (activeQueue) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is already active in a queue'
            });
        }

        // Get current max position for THIS SPECIFIC ROUTE (Station -> Destination)
        const lastInQueue = await Queue.findOne({
            station: stationID,
            destination: finalDestinationID,
            route: routeID,
            status: { $in: ['waiting', 'loading'] }
        }).sort({ queuePosition: -1 });

        const newPosition = lastInQueue ? lastInQueue.queuePosition + 1 : 1;

        const queueItem = new Queue({
            station: stationID,
            destination: finalDestinationID,
            route: routeID,
            vehicle: vehicleID,
            driver: driverID,
            queuePosition: newPosition,
            notes,
            createdBy: req.user.id
        });

        await queueItem.save();

        // Update vehicle status
        vehicle.currentStatus = 'available';
        vehicle.stationID = stationID;
        await vehicle.save();

        const populatedQueue = await Queue.findById(queueItem._id)
            .populate('vehicle', 'plateNumber carType')
            .populate('driver', 'fullName phoneNumber')
            .populate('station', 'stationName')
            .populate('destination', 'stationName');

        // Real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('new-queue-entry', {
                stationID,
                destinationID,
                data: populatedQueue
            });
        }

        // SMART AUTOMATION: If this is the FIRST vehicle in the queue and there is no active trip,
        // automatically trigger the creation of the first trip.
        if (newPosition === 1 && routeID) {
            console.log(`🚀 Route ${routeID} has its first queue entry. Attempting to start the trip...`);
            QueueAutomator.triggerNextTrip(routeID, stationID, req.user.id)
                .catch(err => console.error('Initial Automation Error:', err));
        }

        res.status(201).json({
            success: true,
            message: 'Joined route queue successfully',
            data: populatedQueue
        });

    } catch (error) {
        console.error('Join queue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join queue',
            error: error.message
        });
    }
};

/**
 * Get vehicles waiting for a specific destination from a station
 */
export const getQueueByStation = async (req, res) => {
    try {
        const { stationID } = req.params;
        const { destinationID } = req.query; // Optional filter by destination

        let query = {
            station: stationID,
            status: { $in: ['waiting', 'loading'] }
        };

        if (destinationID) {
            query.destination = destinationID;
        }

        const queue = await Queue.find(query)
            .populate('vehicle', 'plateNumber carType totalCapacity make model')
            .populate('driver', 'fullName phoneNumber licenseNumber')
            .populate('destination', 'stationName city')
            .sort({ queuePosition: 1 });

        res.json({
            success: true,
            data: queue,
            count: queue.length
        });

    } catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch queue',
            error: error.message
        });
    }
};

/**
 * Remove a vehicle from the route queue
 */
export const leaveQueue = async (req, res) => {
    try {
        const { queueID } = req.params;
        const { reason } = req.body;

        const queueItem = await Queue.findById(queueID);
        if (!queueItem) {
            return res.status(404).json({
                success: false,
                message: 'Queue entry not found'
            });
        }

        const oldPosition = queueItem.queuePosition;
        const stationID = queueItem.station;
        const destinationID = queueItem.destination;

        queueItem.status = 'cancelled';
        queueItem.notes = reason || 'Left queue manually';
        await queueItem.save();

        // ONLY shift positions for vehicles in the SAME ROUTE
        await Queue.updateMany(
            {
                station: stationID,
                destination: destinationID,
                status: 'waiting',
                queuePosition: { $gt: oldPosition }
            },
            { $inc: { queuePosition: -1 } }
        );

        await Vehicle.findByIdAndUpdate(queueItem.vehicle, { currentStatus: 'available' });

        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('queue-updated', { stationID, destinationID });
        }

        res.json({
            success: true,
            message: 'Left route queue successfully'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get the next vehicle for a specific route
 */
export const getNextVehicle = async (req, res) => {
    try {
        const { stationID } = req.params;
        const { destinationID } = req.query;

        if (!destinationID) {
            return res.status(400).json({ message: 'Destination is required for route-based turn' });
        }

        const nextEntry = await Queue.findOne({
            station: stationID,
            destination: destinationID,
            status: 'waiting'
        })
            .populate('vehicle', 'plateNumber carType totalCapacity')
            .populate('driver', 'fullName phoneNumber')
            .sort({ queuePosition: 1 });

        if (!nextEntry) {
            return res.status(404).json({ message: 'No vehicles in queue for this route' });
        }

        res.json({ success: true, data: nextEntry });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Reorder the queue within a specific route
 */
export const reorderQueue = async (req, res) => {
    try {
        const { queueID } = req.params;
        const { newPosition } = req.body;

        const queueItem = await Queue.findById(queueID);
        if (!queueItem) return res.status(404).json({ message: 'Not found' });

        const oldPosition = queueItem.queuePosition;
        const { station, destination } = queueItem;

        if (newPosition === oldPosition) return res.json({ success: true });

        if (newPosition < oldPosition) {
            await Queue.updateMany(
                {
                    station,
                    destination,
                    status: 'waiting',
                    queuePosition: { $gte: newPosition, $lt: oldPosition }
                },
                { $inc: { queuePosition: 1 } }
            );
        } else {
            await Queue.updateMany(
                {
                    station,
                    destination,
                    status: 'waiting',
                    queuePosition: { $gt: oldPosition, $lte: newPosition }
                },
                { $inc: { queuePosition: -1 } }
            );
        }

        queueItem.queuePosition = newPosition;
        await queueItem.save();

        const io = req.app.get('io');
        if (io) {
            io.to('admin-room').emit('queue-updated', { stationID: station, destinationID: destination });
        }

        res.json({ success: true, message: 'Queue reordered for the route' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

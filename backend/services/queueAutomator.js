import Queue from '../models/Queue.js';
import Trip from '../models/Trip.js';
import Route from '../models/Route.js';
import Vehicle from '../models/Vehicle.js';
import NotificationService from './notificationService.js';

class QueueAutomator {
    /**
     * Process the next vehicle in the queue for a specific route
     * @param {string} routeID - The ID of the route
     * @param {string} stationID - The ID of the station starting the trip
     * @param {string} createdBy - The ID of the admin/user triggering this (or system ID)
     */
    static async processNextInQueue(routeID, stationID, createdBy) {
        try {
            // 1. Check if a trip is already active for this route (boarding or scheduled)
            const activeTrip = await Trip.findOne({
                route: routeID,
                tripStatus: { $in: ['scheduled', 'boarding'] },
                isActive: true
            });

            if (activeTrip) {
                console.log(`Route ${routeID} already has an active trip. Skipping automation.`);
                return { success: false, message: 'Existing active trip found' };
            }

            // 2. Get the next vehicle in the queue for this route
            const nextInLine = await Queue.findOne({
                route: routeID,
                station: stationID,
                status: 'waiting'
            }).sort({ queuePosition: 1 })
                .populate('vehicle')
                .populate('driver');

            if (!nextInLine) {
                console.log(`No vehicles waiting in queue for route ${routeID}.`);
                return { success: false, message: 'Queue is empty' };
            }

            // 3. Get Route Details
            const routeDetails = await Route.findById(routeID);
            if (!routeDetails) return { success: false, message: 'Route not found' };

            // 4. Create the Trip automatically
            const departureTime = new Date();
            departureTime.setMinutes(departureTime.getMinutes() + 15); // Default 15 mins from now for boarding

            const arrivalTime = new Date(departureTime);
            // Default estimated duration if not specified in route
            const duration = routeDetails.estimatedDuration ? parseInt(routeDetails.estimatedDuration) : 120; // default 2 hours
            arrivalTime.setMinutes(arrivalTime.getMinutes() + duration);

            const trip = new Trip({
                route: routeID,
                origin: routeDetails.origin,
                destination: routeDetails.destination,
                departureTime,
                arrivalTime,
                vehicle: nextInLine.vehicle._id,
                driver: nextInLine.driver._id,
                price: routeDetails.basePrice,
                availableSeats: nextInLine.vehicle.totalCapacity,
                totalSeats: nextInLine.vehicle.totalCapacity,
                station: stationID,
                estimatedDuration: duration,
                tripStatus: 'boarding', // Start directly in boarding status so passengers can book
                createdBy: createdBy || routeDetails.createdBy
            });

            // Generate trip number (simplified for now, can be improved)
            const count = await Trip.countDocuments();
            trip.tripNumber = `TRP-${Date.now().toString().slice(-6)}-${count + 1}`;

            await trip.save();

            // 5. Update Queue Entry Status
            nextInLine.status = 'loading'; // Changed from waiting to loading
            await nextInLine.save();

            // 6. Update Vehicle Status
            await Vehicle.findByIdAndUpdate(nextInLine.vehicle._id, {
                currentStatus: 'boarding'
            });

            // 7. Notify Driver
            try {
                await NotificationService.createNotification({
                    userID: nextInLine.driver._id,
                    title: 'Your Turn: Trip Started!',
                    message: `You have been automatically assigned to a trip from ${routeDetails.routeName}. Loading has started.`,
                    type: 'driver_assignment',
                    priority: 'high',
                    channel: 'all',
                    metadata: {
                        tripID: trip._id,
                        tripNumber: trip.tripNumber,
                        route: routeDetails.routeName,
                        vehicle: nextInLine.vehicle.plateNumber
                    }
                });
            } catch (notifyErr) {
                console.error('Failed to notify driver:', notifyErr);
            }

            console.log(`Successfully automated trip creation for vehicle ${nextInLine.vehicle.plateNumber}`);

            return { success: true, trip };

        } catch (error) {
            console.error('Queue Automation Error:', error);
            throw error;
        }
    }

    /**
     * Triggered when a trip is completed or cancelled, or when explicitly started by admin
     */
    static async triggerNextTrip(routeID, stationID, createdBy) {
        return await this.processNextInQueue(routeID, stationID, createdBy);
    }
}

export default QueueAutomator;

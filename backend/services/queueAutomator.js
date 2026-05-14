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
            // 1. Check if a trip is already active for this route TODAY with available seats
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            console.log(`[QueueAutomator] Checking route ${routeID} at station ${stationID}`);
            console.log(`[QueueAutomator] Today range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
            const query = {
                route: routeID,
                tripStatus: { $in: ['scheduled', 'boarding'] },
                isActive: true,
                availableSeats: { $gt: 0 },
                departureTime: { $gte: startOfDay, $lte: endOfDay }
            };
            console.log(`[QueueAutomator] Active trip query: ${JSON.stringify(query)}`);
            const activeTripWithSeats = await Trip.findOne(query);

            if (activeTripWithSeats) {
                console.log(`[QueueAutomator] Route ${routeID} already has an active trip ${activeTripWithSeats._id}. Skipping.`);
                return { success: false, message: 'Existing active trip with seats found' };
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
                console.log(`[QueueAutomator] No 'waiting' vehicles found for route ${routeID} at station ${stationID}.`);
                // Check if any exists with DIFFERENT status
                const otherStatus = await Queue.find({ route: routeID, station: stationID });
                console.log(`[QueueAutomator] DEBUG: Found ${otherStatus.length} total entries for this route. Statuses: ${otherStatus.map(o => o.status).join(', ')}`);
                return { success: false, message: 'Queue is empty' };
            }

            console.log(`[QueueAutomator] Found vehicle ${nextInLine.vehicle?.plateNumber} in queue. Driver: ${nextInLine.driver?.fullName}`);
            if (!nextInLine.driver) {
                console.error(`[QueueAutomator] ERROR: Driver missing for queue entry ${nextInLine._id}`);
                return { success: false, message: 'Driver missing' };
            }

            // 3. Get Route Details
            const routeDetails = await Route.findById(routeID);
            if (!routeDetails) return { success: false, message: 'Route not found' };

            // 4. Create the Trip automatically
            const departureTime = new Date();
            departureTime.setMinutes(departureTime.getMinutes() + 50); // Default 50 mins from now for boarding

            const arrivalTime = new Date(departureTime);

            // IMPROVED DURATION PARSING: Handle strings like "2h 30m" or "150"
            let duration = 120; // Default 2 hours
            if (routeDetails.estimatedDuration) {
                const rawDuration = routeDetails.estimatedDuration.toString();
                if (rawDuration.includes('h')) {
                    const hours = parseInt(rawDuration.split('h')[0]) || 0;
                    const mins = parseInt(rawDuration.split('h')[1]) || 0;
                    duration = (hours * 60) + mins;
                } else {
                    duration = parseInt(rawDuration) || 120;
                }
            }

            // Ensure it meets the minimum validation of 15 minutes defined in Trip model
            if (duration < 15) {
                console.warn(`[QueueAutomator] duration ${duration} is too low. Adjusting to 15 mins minimum.`);
                duration = 15;
            }

            arrivalTime.setMinutes(arrivalTime.getMinutes() + duration);

            // Robust capacity and price fallbacks
            const finalCapacity = nextInLine.vehicle?.totalCapacity || 30;
            const finalPrice = routeDetails.basePrice || 100;
            const systemCreator = routeDetails.createdBy || nextInLine.driver?._id || nextInLine.driver;

            const trip = new Trip({
                route: routeID,
                origin: routeDetails.origin,
                destination: routeDetails.destination,
                departureTime,
                arrivalTime,
                vehicle: nextInLine.vehicle?._id || nextInLine.vehicle,
                driver: nextInLine.driver?._id || nextInLine.driver,
                price: finalPrice,
                availableSeats: finalCapacity,
                totalSeats: finalCapacity,
                station: stationID,
                estimatedDuration: duration,
                tripStatus: 'boarding', // Start directly in boarding status so passengers can book
                isActive: true,
                createdBy: systemCreator
            });

            // Generate trip number (simplified for now, can be improved)
            const count = await Trip.countDocuments();
            trip.tripNumber = `TRP-${Date.now().toString().slice(-6)}-${count + 1}`;

            try {
                await trip.save();
                console.log(`[QueueAutomator] SUCCESS: Trip ${trip.tripNumber} created!`);
            } catch (saveErr) {
                console.error(`[QueueAutomator] SAVE ERROR for trip:`, saveErr.message);
                if (saveErr.errors) {
                    Object.keys(saveErr.errors).forEach(key => {
                        console.error(` - Field '${key}': ${saveErr.errors[key].message}`);
                    });
                }
                throw saveErr;
            }

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

    /**
     * Path: backend/services/queueAutomator.js
     * Automatically re-queues a vehicle at its ORIGIN station when a trip is completed.
     * @param {Object} trip - The trip that was just completed
     */
    static async reQueueVehicle(trip) {
        try {
            if (!trip || !trip.origin || !trip.route || !trip.vehicle) {
                console.error('[QueueAutomator] Invalid trip data for re-queuing:', trip?._id);
                return { success: false, message: 'Invalid trip data' };
            }

            console.log(`[QueueAutomator] Resetting vehicle ${trip.vehicle?._id || trip.vehicle} back to Origin Queue at ${trip.origin?._id || trip.origin}`);

            const originID = trip.origin?._id || trip.origin;
            const routeID = trip.route?._id || trip.route;
            const vehicleID = trip.vehicle?._id || trip.vehicle;
            const driverID = trip.driver?._id || trip.driver;
            const destinationID = trip.destination?._id || trip.destination;

            // 1. Prevent duplicate entries at the origin
            const existing = await Queue.findOne({
                vehicle: vehicleID,
                station: originID,
                status: { $in: ['waiting', 'loading'] }
            });

            if (existing) {
                console.log(`[QueueAutomator] Vehicle already in queue at Origin ${originID}`);
                return { success: false, message: 'Already in origin queue' };
            }

            // 2. Calculate next position at the origin
            const lastEntry = await Queue.findOne({
                station: originID,
                route: routeID,
                status: 'waiting'
            }).sort({ queuePosition: -1 });

            const nextPosition = lastEntry ? lastEntry.queuePosition + 1 : 1;

            // 3. Create new Queue Entry at ORIGIN
            const newQueueEntry = new Queue({
                station: originID,
                destination: destinationID,
                route: routeID,
                vehicle: vehicleID,
                driver: driverID,
                queuePosition: nextPosition,
                status: 'waiting',
                createdBy: driverID
            });

            await newQueueEntry.save();
            console.log(`[QueueAutomator] SUCCESS: Vehicle ${vehicleID} is reset to Origin Queue (Pos: ${nextPosition})`);

            // 4. Trigger the next trip at the origin station immediately
            this.triggerNextTrip(routeID, originID, driverID).catch(err => {
                console.error('[QueueAutomator] Auto-trigger after reset failed:', err);
            });

            return { success: true, queueEntry: newQueueEntry };

        } catch (error) {
            console.error('[QueueAutomator] Origin Re-Queue Error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default QueueAutomator;

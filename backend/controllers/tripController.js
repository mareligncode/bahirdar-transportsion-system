import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js';
import Booking from '../models/Booking.js';
import NotificationService from '../services/notificationService.js';
import Queue from '../models/Queue.js';
import QueueAutomator from '../services/queueAutomator.js';

export const createTrip = async (req, res) => {
    try {
        const {
            origin, destination, departureTime, arrivalTime,
            vehicleID, driverID, price, totalSeats, stationID,
            routePoints, estimatedDuration, notes, queueID
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

        // Update vehicle status
        vehicle.currentStatus = 'on_trip';
        await vehicle.save();

        // Handle Queue Update if part of a queue
        if (queueID) {
            const queueEntry = await Queue.findById(queueID);
            if (queueEntry) {
                const oldPosition = queueEntry.queuePosition;
                const stationIDOfQueue = queueEntry.station;
                const destinationIDOfQueue = queueEntry.destination;

                queueEntry.status = 'on_trip';
                await queueEntry.save();

                // Shift everyone else in this specific route queue up one position
                await Queue.updateMany(
                    {
                        station: stationIDOfQueue,
                        destination: destinationIDOfQueue,
                        status: 'waiting',
                        queuePosition: { $gt: oldPosition }
                    },
                    { $inc: { queuePosition: -1 } }
                );

                const io = req.app.get('io');
                if (io) {
                    io.to('admin-room').emit('queue-updated', {
                        stationID: stationIDOfQueue,
                        destinationID: destinationIDOfQueue
                    });
                }
            }
        }

        // Populate and return
        const populatedTrip = await Trip.findById(trip._id)
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



export const getAllTrips = async (req, res) => {
    try {
        const { status, origin, destination, page = 1, limit = 20 } = req.query;

        // Build query based on user role
        let query = {};

        // Station admin can only see their station's trips
        if (req.user.role === 'station_admin') {
            if (req.user.stationID) {
                query.station = req.user.stationID;
            } else {
                console.warn(`Station admin ${req.user._id} has no stationID assigned`);
                // For unassigned station admin, return empty result to prevent unauthorized access
                query.station = new mongoose.Types.ObjectId('000000000000000000000000');
            }
        }

        // Driver can only see their trips
        if (req.user.role === 'driver') {

            //leul
            query.driver = req.user.id;
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
            if (req.user.stationID && trip.station && !trip.station.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this trip'
                });
            }
        }

        if (req.user.role === 'driver') {

            //leul
            if (!trip.driver.equals(req.user.id)) {
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

        // // Check permissions
        // if (req.user.role === 'station_admin') {
        //     const station = await Station.findOne({ manager: req.user._id });
        //     if (!station || !trip.station.equals(station._id)) {
        //         return res.status(403).json({
        //             success: false,
        //             message: 'Not authorized to update this trip'
        //         });
        //     }
        // }

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

        // Send notifications to affected passengers for trip updates
        try {
            console.log('🔍 Starting trip update notifications for trip:', trip._id);
            console.log('📋 Trip details:', {
                tripNumber: trip.tripNumber,
                origin: trip.origin?.stationName,
                destination: trip.destination?.stationName,
                departureTime: trip.departureTime,
                arrivalTime: trip.arrivalTime
            });

            // Get all bookings for this trip
            const bookings = await Booking.find({ tripID: trip._id })
                .populate('passengerID', 'fullName email phoneNumber');

            console.log('🎫 Found bookings for trip:', bookings.length);
            console.log('Bookings details:', bookings.map(b => ({
                bookingId: b._id,
                bookingNumber: b.bookingNumber,
                passengerId: b.passengerID?._id,
                passengerName: b.passengerID?.fullName,
                passengerEmail: b.passengerID?.email
            })));

            // Send notifications to all affected passengers (use Promise.all for better performance)
            if (bookings.length > 0) {
                console.log('📧 Sending notifications to', bookings.length, 'passengers...');

                const notificationPromises = bookings.map(async (booking, index) => {
                    try {
                        console.log(`📤 Processing notification for booking ${index + 1}/${bookings.length}:`, {
                            bookingId: booking._id,
                            passengerId: booking.passengerID?._id,
                            passengerName: booking.passengerID?.fullName
                        });

                        if (!booking.passengerID) {
                            console.log(`❌ Skipping booking ${booking._id} - no passengerID`);
                            return;
                        }

                        if (!booking.passengerID.email) {
                            console.log(`❌ Skipping booking ${booking._id} - no email for passenger ${booking.passengerID.fullName}`);
                            return;
                        }

                        const passengerNotificationData = {
                            userID: booking.passengerID._id,
                            title: 'Trip Information Updated',
                            message: `Trip ${trip.tripNumber} from ${trip.origin?.stationName} to ${trip.destination?.stationName} has been updated. Please check the latest information.`,
                            type: 'trip_update',
                            channel: 'all',
                            priority: 'medium',
                            metadata: {
                                userName: booking.passengerID.fullName,
                                booking: {
                                    _id: booking._id,
                                    bookingNumber: booking.bookingNumber,
                                    ticketNumber: booking.ticketNumber,
                                    seatNumber: booking.seatNumber
                                },
                                trip: {
                                    tripNumber: trip.tripNumber,
                                    origin: trip.origin?.stationName,
                                    destination: trip.destination?.stationName,
                                    departureTime: trip.departureTime,
                                    arrivalTime: trip.arrivalTime,
                                    status: trip.tripStatus,
                                    originalDepartureTime: booking.createdAt // Use booking creation time as original
                                },
                                vehicle: {
                                    plateNumber: trip.vehicle?.plateNumber,
                                    carType: trip.vehicle?.carType
                                },
                                driver: {
                                    fullName: trip.driver?.fullName,
                                    phoneNumber: trip.driver?.phoneNumber
                                },
                                actionURL: `${process.env.CLIENT_URL}/dashboard/bookings/${booking._id}`,
                                actionText: 'View Booking Details'
                            }
                        };

                        console.log(`📨 Creating notification for passenger ${booking.passengerID.fullName}...`);
                        const notification = await NotificationService.createNotification(passengerNotificationData);
                        console.log(`✅ Notification created successfully for ${booking.passengerID.fullName}:`, {
                            notificationId: notification._id,
                            status: notification.status
                        });

                    } catch (individualError) {
                        console.error(`❌ Failed to send notification for booking ${booking._id}:`, {
                            bookingId: booking._id,
                            passengerName: booking.passengerID?.fullName,
                            error: individualError.message,
                            stack: individualError.stack
                        });
                        throw individualError; // Re-throw to see which specific notification failed
                    }
                });

                await Promise.all(notificationPromises);
                console.log('🎉 All trip update notifications sent successfully!');

            } else {
                console.log('ℹ️ No bookings found for this trip - no notifications needed');
            }
        } catch (notificationError) {
            console.error('🚨 CRITICAL ERROR - Failed to send trip update notifications:', {
                error: notificationError.message,
                stack: notificationError.stack,
                tripId: trip._id,
                tripNumber: trip.tripNumber
            });
        }
        //end of notfication changes
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
            if (!req.user.stationID || !trip.station.equals(req.user.stationID)) {
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
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        const query = {
            origin,
            destination,
            departureTime: { $gte: startOfDay, $lte: endOfDay },
            tripStatus: { $in: ['scheduled', 'boarding'] },
            isActive: true,
            availableSeats: { $gt: 0 }
        };

        console.log('🔍 Executing Trip Search Query:', JSON.stringify(query, null, 2));

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

export const updateTripStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const trip = await Trip.findById(req.params.id)
            .populate('origin', 'stationName city')
            .populate('destination', 'stationName city')
            .populate('vehicle', 'plateNumber carType')
            .populate('driver', 'fullName phoneNumber')
            .populate('station', 'stationName');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check permissions
        if (req.user.role === 'driver') {
            if (!trip.driver || (trip.driver._id ? !trip.driver._id.equals(req.user.id) : !trip.driver.equals(req.user.id))) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        if (req.user.role === 'station_admin') {
            if (!req.user.stationID || !trip.station || !trip.station._id.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this trip'
                });
            }
        }

        // 1. Update status and save IMMEDIATELY
        trip.tripStatus = status;
        await trip.save();

        // 2. Respond to the driver RIGHT AWAY - No more lag!
        res.status(200).json({
            success: true,
            message: `Trip status updated to ${status}`,
            data: trip
        });

        // 3. Side Effects (Run in background)
        setImmediate(async () => {
            try {
                // 🚗 Vehicle Status Sync
                if (['completed', 'cancelled'].includes(status)) {
                    await Vehicle.findByIdAndUpdate(trip.vehicle?._id || trip.vehicle, { currentStatus: 'available' });
                } else if (status === 'ongoing') {
                    await Vehicle.findByIdAndUpdate(trip.vehicle?._id || trip.vehicle, { currentStatus: 'on_trip' });
                }

                // 📧 Passenger Notifications
                const bookings = await Booking.find({ tripID: trip._id })
                    .populate('passengerID', 'fullName email phoneNumber');

                if (bookings.length > 0) {
                    let notificationBase = {
                        priority: 'high',
                        channel: 'all'
                    };

                    switch (status) {
                        case 'cancelled':
                            notificationBase = { ...notificationBase, title: 'Trip Cancelled', type: 'trip_cancellation', priority: 'urgent' };
                            break;
                        case 'delayed':
                            notificationBase = { ...notificationBase, title: 'Trip Delayed', type: 'trip_delay' };
                            break;
                        default:
                            notificationBase = { ...notificationBase, title: 'Trip Status Updated', type: 'trip_update', priority: 'medium' };
                    }

                    // Process notifications in parallel for speed
                    await Promise.all(bookings.map(async (booking) => {
                        if (!booking.passengerID) return;

                        const message = status === 'cancelled'
                            ? `Trip ${trip.tripNumber} from ${trip.origin?.stationName} to ${trip.destination?.stationName} has been cancelled.`
                            : status === 'delayed'
                                ? `Trip ${trip.tripNumber} from ${trip.origin?.stationName} to ${trip.destination?.stationName} has been delayed.`
                                : `Trip ${trip.tripNumber} status has been updated to ${status}.`;

                        return NotificationService.createNotification({
                            userID: booking.passengerID._id,
                            title: notificationBase.title,
                            message,
                            type: notificationBase.type,
                            channel: notificationBase.channel,
                            priority: notificationBase.priority,
                            metadata: {
                                userName: booking.passengerID.fullName,
                                booking: {
                                    bookingNumber: booking.bookingNumber,
                                    ticketNumber: booking.ticketNumber,
                                    seatNumber: booking.seatNumber
                                },
                                trip: {
                                    tripNumber: trip.tripNumber,
                                    origin: trip.origin?.stationName,
                                    destination: trip.destination?.stationName,
                                    departureTime: trip.departureTime,
                                    arrivalTime: trip.arrivalTime,
                                    status
                                },
                                vehicle: {
                                    plateNumber: trip.vehicle?.plateNumber,
                                    carType: trip.vehicle?.carType
                                },
                                driver: {
                                    fullName: trip.driver?.fullName,
                                    phoneNumber: trip.driver?.phoneNumber
                                },
                                actionURL: `${process.env.CLIENT_URL}/dashboard/bookings/${booking._id}`,
                                actionText: 'View Booking Details'
                            }
                        }).catch(err => console.error(`Failed to notify passenger ${booking.passengerID._id}:`, err));
                    }));
                }

                // 🚀 Queue Automation & Circular Logic
                if (status === 'ongoing') {
                    // Update queue status to on_trip when trip starts
                    await Queue.updateMany(
                        { vehicle: trip.vehicle?._id || trip.vehicle, status: 'loading' },
                        { status: 'on_trip' }
                    );
                }

                if (status === 'completed') {
                    // 🚀 Run re-queuing in background so driver gets success message instantly
                    setImmediate(async () => {
                        try {
                            await Queue.deleteMany({ vehicle: trip.vehicle?._id || trip.vehicle, status: { $in: ['loading', 'on_trip'] } });
                            await QueueAutomator.reQueueVehicle(trip);
                        } catch (err) {
                            console.error('[QueueAutomator] Background re-queue failed:', err);
                        }
                    });
                }

                if (['ongoing', 'completed', 'cancelled'].includes(status) && trip.route) {
                    await QueueAutomator.triggerNextTrip(trip.route, trip.station?._id || trip.station, req.user.id);
                }
            } catch (bgErr) {
                console.error('CRITICAL: Background status update processing failed:', bgErr);
            }
        });

    } catch (error) {
        console.error('Update trip status error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error updating trip status',
                error: error.message
            });
        }
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
            if (!req.user.stationID || !trip.station.equals(req.user.stationID)) {
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
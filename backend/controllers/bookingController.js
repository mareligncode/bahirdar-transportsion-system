import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js';
import NotificationService from '../services/notificationService.js';
import QueueAutomator from '../services/queueAutomator.js';
import mongoose from 'mongoose';

export const createBooking = async (req, res) => {
    try {
        const {
            tripID, seatNumber, specialRequests,
            passengerDetails, boardingPass
        } = req.body;
        const trip = await Trip.findById(tripID);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }
        if (trip.tripStatus !== 'scheduled' && trip.tripStatus !== 'boarding') {
            return res.status(400).json({
                success: false,
                message: 'Trip is not available for booking'
            });
        }

        if (trip.availableSeats <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No available seats for this trip'
            });
        }
        if (seatNumber < 1 || seatNumber > trip.totalSeats) {
            return res.status(400).json({
                success: false,
                message: `Seat number must be between 1 and ${trip.totalSeats}`
            });
        }
        const existingBooking = await Booking.findOne({
            tripID,
            seatNumber,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: `Seat ${seatNumber} is already booked`
            });
        }
        // Note: Removed restriction that prevented users from booking multiple seats per trip
        // This allows users to book multiple seats for family/group travel
        // The system now only prevents booking the same specific seat number twice


        // const existingPassengerBooking = await Booking.findOne({
        //     tripID,
        //     passengerID: req.user.id,
        //     status: { $in: ['pending', 'confirmed'] }
        // });

        // if (existingPassengerBooking) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'You already have a booking for this trip'
        //     });
        // }

        const booking = new Booking({
            passengerID: req.user._id || req.user.id,
            tripID: trip._id,
            vehicleID: trip.vehicle?._id || trip.vehicle,
            seatNumber,
            specialRequests,
            passengerDetails: passengerDetails || {
                fullName: req.user.fullName,
                phoneNumber: req.user.phoneNumber,
                email: req.user.email,
                emergencyContact: req.user.emergencyContact
            },
            totalPrice: trip.price,
            pricePerSeat: trip.price,
            boardingPass,
            createdBy: req.user._id || req.user.id
        });

        trip.availableSeats -= 1;
        await trip.save();

        // 🚀 AUTO-MANIFEST: If the trip is now full, automatically trigger the next one in queue
        if (trip.availableSeats === 0 && trip.route) {
            console.log(`🚀 Trip ${trip.tripNumber} is now full. Triggering next vehicle for route ${trip.route}...`);
            QueueAutomator.triggerNextTrip(trip.route, trip.station, req.user.id)
                .catch(err => console.error('Auto-Manifest Error:', err));
        }

        await booking.save();
        // Send booking confirmation notification
        try {
            const vehicle = await Vehicle.findById(trip.vehicle);
            const notificationData = {
                userID: req.user.id,
                title: 'Booking Created - Action Required!',
                message: `Booking ${booking.bookingNumber} created. To confirm your seat, please pay ETB ${trip.price} to CBE Account: ${vehicle?.ownerDetails?.bankDetails?.accountNumber} (${vehicle?.ownerDetails?.ownerName}).`,
                type: 'booking_confirmation',
                channel: 'all',
                priority: 'high',
                metadata: {
                    userName: req.user.fullName,
                    paymentInfo: {
                        amount: trip.price,
                        accountNumber: vehicle?.ownerDetails?.bankDetails?.accountNumber,
                        accountName: vehicle?.ownerDetails?.ownerName
                    },
                    booking: {
                        bookingNumber: booking.bookingNumber,
                        seatNumber: booking.seatNumber
                    },
                    actionURL: `${process.env.CLIENT_URL}/dashboard/bookings/${booking._id}/pay`,
                    actionText: 'Upload Receipt'
                }
            };

            await NotificationService.createNotification(notificationData);
        } catch (notificationError) {
            console.error('Failed to send booking confirmation notification:', notificationError);
        }
        //upto this point
        const populatedBooking = await Booking.findById(booking._id)
            .populate('passengerID', 'fullName phoneNumber email')
            .populate('tripID', 'tripNumber origin destination departureTime arrivalTime price')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .populate('createdBy', 'fullName');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: populatedBooking
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
};
///ssssssss

export const getAllBookings = async (req, res) => {
    try {
        const { status, tripID, passengerID, page = 1, limit = 20 } = req.query;

        // Build query based on user role
        let query = {};

        // Station admin can only see their station's bookings
        if (req.user.role === 'station_admin') {
            if (req.user.stationID) {
                query.stationID = req.user.stationID;
            } else {
                console.warn(`Station admin ${req.user._id} has no stationID assigned`);
                // For unassigned station admin, return empty result to prevent unauthorized access
                query.stationID = new mongoose.Types.ObjectId('000000000000000000000000');
            }
        }

        // Driver can only see their trip bookings
        if (req.user.role === 'driver') {
            query.driverID = req.user.id;
        }

        // Passengers can only see their own bookings
        if (req.user.role === 'passenger') {
            query.passengerID = req.user.id;
        }

        // Add filters
        if (status && status !== 'all') {
            query.status = status;
        }

        if (tripID) {
            query.tripID = tripID;
        }

        if (passengerID) {
            query.passengerID = passengerID;
        }

        const skip = (page - 1) * limit;

        const bookings = await Booking.find(query)
            .populate('passengerID', 'fullName phoneNumber email')
            .populate('tripID', 'tripNumber origin destination departureTime arrivalTime price')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .populate('createdBy', 'fullName')
            .sort({ bookingDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            count: bookings.length,
            total,
            data: bookings
        });

    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('passengerID', 'fullName phoneNumber email emergencyContact')
            .populate({
                path: 'tripID',
                populate: [
                    { path: 'origin', select: 'stationName city' },
                    { path: 'destination', select: 'stationName city' },
                    { path: 'vehicle', select: 'plateNumber carType totalCapacity' },
                    { path: 'driver', select: 'fullName phoneNumber licenseNumber' },
                    { path: 'station', select: 'stationName location' }
                ]
            })
            .populate('vehicleID', 'plateNumber carType totalCapacity color')
            .populate('createdBy', 'fullName');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            if (req.user.stationID && !booking.tripID.station.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this booking'
                });
            }
        }

        if (req.user.role === 'driver') {
            if (!booking.tripID.driver.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this booking'
                });
            }
        }

        if (req.user.role === 'passenger') {
            if (!booking.passengerID.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this booking'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error('Get booking by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
};

export const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            if (req.user.stationID && !booking.tripID.station.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this booking'
                });
            }
        }

        if (req.user.role === 'passenger') {
            if (!booking.passengerID.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this booking'
                });
            }
        }

        // Cannot update confirmed bookings except for special requests
        if (booking.status === 'confirmed' && req.user.role === 'passenger') {
            if (req.body.specialRequests) {
                booking.specialRequests = req.body.specialRequests;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot modify confirmed bookings'
                });
            }
        }

        // Update booking fields
        const updates = req.body;

        // Handle seat changes
        if (updates.seatNumber && updates.seatNumber !== booking.seatNumber) {
            // Check if new seat is available
            const existingBooking = await Booking.findOne({
                tripID: booking.tripID,
                seatNumber: updates.seatNumber,
                status: { $in: ['pending', 'confirmed'] },
                _id: { $ne: booking._id }
            });

            if (existingBooking) {
                return res.status(400).json({
                    success: false,
                    message: `Seat ${updates.seatNumber} is already booked`
                });
            }

            booking.seatNumber = updates.seatNumber;
        }

        // Update other fields
        Object.keys(updates).forEach(key => {
            if (key !== 'seatNumber') {
                booking[key] = updates[key];
            }
        });

        await booking.save();

        // Send booking modification notification
        try {
            const notificationData = {
                userID: booking.passengerID,
                title: 'Booking Updated Successfully',
                message: `Your booking ${booking.bookingNumber} has been updated. Please review the changes in your booking details.`,
                type: 'booking_modification',
                channel: 'all',
                priority: 'medium',
                metadata: {
                    userName: booking.passengerDetails?.fullName || 'Valued Customer',
                    booking: {
                        bookingNumber: booking.bookingNumber,
                        ticketNumber: booking.ticketNumber,
                        seatNumber: booking.seatNumber
                    },
                    trip: {
                        tripNumber: booking.tripID?.tripNumber,
                        origin: booking.tripID?.origin?.stationName,
                        destination: booking.tripID?.destination?.stationName,
                        departureTime: booking.tripID?.departureTime,
                        arrivalTime: booking.tripID?.arrivalTime
                    },
                    changes: Object.keys(updates).map(key => ({
                        field: key,
                        value: updates[key]
                    })),
                    actionURL: `${process.env.CLIENT_URL}/dashboard/bookings/${booking._id}`,
                    actionText: 'View Updated Booking'
                }
            };

            await NotificationService.createNotification(notificationData);
        } catch (notificationError) {
            console.error('Failed to send booking modification notification:', notificationError);
        }
        //end of notfication changes
        // Get updated booking with populated data
        const updatedBooking = await Booking.findById(booking._id)
            .populate('passengerID', 'fullName phoneNumber email')
            .populate('tripID', 'tripNumber origin destination departureTime arrivalTime price')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .populate('createdBy', 'fullName');

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: updatedBooking
        });

    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
};

export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            if (req.user.stationID && !booking.tripID.station.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this booking'
                });
            }
        }

        if (req.user.role === 'passenger') {
            if (!booking.passengerID.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this booking'
                });
            }
        }

        // Check if booking can be cancelled
        const trip = await Trip.findById(booking.tripID);
        const timeUntilDeparture = trip.departureTime - new Date();
        const hoursUntilDeparture = timeUntilDeparture / (1000 * 60 * 60);

        if (hoursUntilDeparture < 2 && booking.status === 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel booking within 2 hours of departure'
            });
        }

        // CRITICAL FIX: Calculate the actual number of seats being cancelled
        let seatsToRelease = 0;

        if (booking.seatNumbers && Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0) {
            // Group booking with multiple seats
            seatsToRelease = booking.seatNumbers.length;
            console.log(`📊 Cancelling group booking with ${seatsToRelease} seats:`, booking.seatNumbers);
        } else if (booking.seatNumber) {
            // Single seat booking
            seatsToRelease = 1;
            console.log(`📊 Cancelling single seat booking: seat ${booking.seatNumber}`);
        } else if (booking.seatCount) {
            // Fallback to seatCount field
            seatsToRelease = booking.seatCount;
        }

        // Make sure we have a valid number
        if (seatsToRelease === 0) {
            seatsToRelease = 1; // Default to 1 if we can't determine
        }

        // Update trip available seats (add back ALL cancelled seats)
        trip.availableSeats += seatsToRelease;
        await trip.save();

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: `Booking cancelled successfully. ${seatsToRelease} seat(s) released.`
        });

    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const { status, cancellationReason, refundAmount } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // ... permission checks ...

        // Validate status transitions
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled', 'no_show'],
            'cancelled': [],
            'completed': [],
            'no_show': [],
            'refunded': []
        };

        if (!validTransitions[booking.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${booking.status} to ${status}`
            });
        }

        // Handle cancellation
        if (status === 'cancelled') {
            if (!cancellationReason) {
                return res.status(400).json({
                    success: false,
                    message: 'Cancellation reason is required'
                });
            }

            // Calculate seats to release
            let seatsToRelease = 0;
            if (booking.seatNumbers && booking.seatNumbers.length > 0) {
                seatsToRelease = booking.seatNumbers.length;
            } else if (booking.seatNumber) {
                seatsToRelease = 1;
            } else if (booking.seatCount) {
                seatsToRelease = booking.seatCount;
            }

            if (seatsToRelease === 0) seatsToRelease = 1;

            // Update trip available seats
            const trip = await Trip.findById(booking.tripID);
            trip.availableSeats += seatsToRelease;
            await trip.save();

            console.log(`✅ Released ${seatsToRelease} seats for trip ${trip._id}`);
        }

        // Handle refund
        if (status === 'refunded') {
            if (!refundAmount || refundAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid refund amount is required'
                });
            }
        }

        // Update booking
        booking.status = status;
        if (cancellationReason) booking.cancellationReason = cancellationReason;
        if (refundAmount) booking.refundAmount = refundAmount;

        await booking.save();

        // Send notification
        if (status === 'cancelled') {
            try {
                const seatsReleased = booking.seatNumbers?.length || booking.seatCount || 1;
                const notificationData = {
                    userID: booking.passengerID,
                    title: 'Booking Cancelled',
                    message: `Your booking ${booking.bookingNumber} has been cancelled. ${seatsReleased} seat(s) released.`,
                    type: 'booking_cancellation',
                    channel: 'all',
                    priority: 'high',
                    metadata: {
                        userName: booking.passengerDetails?.fullName || 'Valued Customer',
                        booking: {
                            bookingNumber: booking.bookingNumber,
                            ticketNumber: booking.ticketNumber,
                            seatNumber: booking.seatNumber,
                            seatNumbers: booking.seatNumbers,
                            seatCount: seatsReleased
                        },
                        trip: {
                            tripNumber: booking.tripID?.tripNumber,
                            origin: booking.tripID?.origin?.stationName,
                            destination: booking.tripID?.destination?.stationName
                        },
                        cancellation: {
                            reason: cancellationReason,
                            seatsReleased: seatsReleased,
                            cancelledAt: new Date()
                        }
                    }
                };

                await NotificationService.createNotification(notificationData);
            } catch (notificationError) {
                console.error('Failed to send booking cancellation notification:', notificationError);
            }
        }

        res.status(200).json({
            success: true,
            message: `Booking status updated to ${status}`,
            data: booking
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message
        });
    }
};
export const checkInPassenger = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            if (req.user.stationID && !booking.tripID.station.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to check-in this passenger'
                });
            }
        }

        // Check if booking is confirmed
        if (booking.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Only confirmed bookings can be checked in'
            });
        }

        // Check if trip has departed
        const trip = await Trip.findById(booking.tripID);
        if (new Date() > trip.departureTime) {
            return res.status(400).json({
                success: false,
                message: 'Trip has already departed'
            });
        }

        // Update check-in status
        booking.checkedIn = true;
        booking.checkedInAt = new Date();
        await booking.save();

        res.status(200).json({
            success: true,
            message: 'Passenger checked in successfully',
            data: booking
        });

    } catch (error) {
        console.error('Check-in passenger error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking in passenger',
            error: error.message
        });
    }
};

export const getPassengerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ passengerID: req.user.id })
            .populate('tripID', 'tripNumber origin destination departureTime arrivalTime price')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .sort({ bookingDate: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error('Get passenger bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching passenger bookings',
            error: error.message
        });
    }
};

export const getTripBookings = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.tripId);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check permissions
        if (req.user.role === 'station_admin') {
            if (req.user.stationID && !trip.station.equals(req.user.stationID)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view bookings for this trip'
                });
            }
        }

        if (req.user.role === 'driver') {
            if (!trip.driver.equals(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view bookings for this trip'
                });
            }
        }

        const bookings = await Booking.find({ tripID: trip._id })
            .populate('passengerID', 'fullName phoneNumber email')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .sort({ seatNumber: 1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error('Get trip bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trip bookings',
            error: error.message
        });
    }
};



export const createBatchBooking = async (req, res) => {
    try {
        const { tripID, seats, specialRequests, passengerDetails } = req.body;

        // Validate required fields
        if (!tripID || !seats || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Trip ID and seats array are required'
            });
        }

        if (seats.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 seats can be booked at once'
            });
        }

        // Validate trip and availability
        const trip = await Trip.findById(tripID);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (trip.tripStatus !== 'scheduled' && trip.tripStatus !== 'boarding') {
            return res.status(400).json({
                success: false,
                message: 'Trip is not available for booking'
            });
        }

        if (trip.availableSeats < seats.length) {
            return res.status(400).json({
                success: false,
                message: `Not enough seats available. Requested: ${seats.length}, Available: ${trip.availableSeats}`
            });
        }

        // Extract seat numbers
        const seatNumbers = seats.map(s => s.seatNumber);

        // Check seat number range
        for (const seat of seats) {
            if (seat.seatNumber < 1 || seat.seatNumber > trip.totalSeats) {
                return res.status(400).json({
                    success: false,
                    message: `Seat number ${seat.seatNumber} is invalid. Must be between 1 and ${trip.totalSeats}`
                });
            }
        }

        // Check for duplicate seat numbers in the request
        const uniqueSeats = new Set(seatNumbers);
        if (uniqueSeats.size !== seatNumbers.length) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate seat numbers found in the request'
            });
        }

        // Check seat availability for all requested seats
        // We need to check if ANY of the requested seats are already booked
        const existingBookings = await Booking.find({
            tripID,
            $or: [
                { seatNumber: { $in: seatNumbers } },
                { seatNumbers: { $in: seatNumbers } }
            ],
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBookings.length > 0) {
            // Find which specific seats are already booked
            const bookedSeats = new Set();
            existingBookings.forEach(booking => {
                if (booking.seatNumbers && booking.seatNumbers.length > 0) {
                    booking.seatNumbers.forEach(seat => {
                        if (seatNumbers.includes(seat)) {
                            bookedSeats.add(seat);
                        }
                    });
                } else if (booking.seatNumber && seatNumbers.includes(booking.seatNumber)) {
                    bookedSeats.add(booking.seatNumber);
                }
            });

            if (bookedSeats.size > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Seats ${Array.from(bookedSeats).join(', ')} are already booked`
                });
            }
        }

        // Calculate total amount for all seats
        const totalAmount = trip.price * seats.length;
        const pricePerSeat = trip.price;

        // Generate a unique group booking ID
        const groupBookingId = `GRP-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

        // Generate a unique booking number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const randomStr = Math.random().toString(36).substring(2, 8);
        const bookingNumber = `BK${year}${month}${day}${randomStr}`;

        // Generate a group ticket number
        const groupTicketNumber = `GTK${Date.now().toString(36).toUpperCase()}`;

        // Create a SINGLE booking with multiple seats
        const booking = new Booking({
            passengerID: req.user.id,
            tripID,
            vehicleID: trip.vehicle,
            seatNumbers: seatNumbers, // Array of all seats
            seatNumber: seatNumbers[0], // For backward compatibility
            bookingNumber,
            ticketNumber: groupTicketNumber, // Use group ticket number
            isGroupBooking: seats.length > 1,
            groupBookingId: seats.length > 1 ? groupBookingId : undefined,
            seatCount: seats.length,
            specialRequests: specialRequests || seats[0]?.specialRequests,
            passengerDetails: passengerDetails || {
                fullName: req.user.fullName,
                phoneNumber: req.user.phoneNumber,
                email: req.user.email,
                emergencyContact: req.user.emergencyContact
            },
            totalPrice: totalAmount,
            pricePerSeat: pricePerSeat,
            batchTotalPrice: totalAmount,
            status: 'pending',
            paymentStatus: 'pending',
            createdBy: req.user.id
        });

        await booking.save();

        // Update trip available seats
        trip.availableSeats -= seats.length;
        await trip.save();

        // 🚀 AUTO-MANIFEST: If the trip is now full, automatically trigger the next one in queue
        if (trip.availableSeats === 0 && trip.route) {
            console.log(`🚀 Trip ${trip.tripNumber} (Batch) is now full. Triggering next vehicle for route ${trip.route}...`);
            QueueAutomator.triggerNextTrip(trip.route, trip.station, req.user.id)
                .catch(err => console.error('Auto-Manifest Error (Batch):', err));
        }

        // Send booking confirmation notification
        try {
            const notificationData = {
                userID: req.user.id,
                title: seats.length > 1 ? 'Multiple Seats Booked Successfully' : 'Booking Confirmed',
                message: seats.length > 1
                    ? `Your booking for seats ${seatNumbers.join(', ')} has been created successfully. Please proceed to payment to confirm your reservation.`
                    : `Your booking for seat ${seatNumbers[0]} has been created successfully. Please proceed to payment to confirm your reservation.`,
                type: 'booking_confirmation',
                channel: 'all',
                priority: 'medium',
                metadata: {
                    userName: req.user.fullName,
                    booking: {
                        bookingNumber: booking.bookingNumber,
                        ticketNumber: booking.groupTicketNumber || booking.ticketNumber,
                        seatNumbers: booking.seatNumbers,
                        seatCount: booking.seatCount,
                        totalPrice: booking.totalPrice
                    },
                    trip: {
                        tripNumber: trip.tripNumber,
                        origin: trip.origin?.stationName,
                        destination: trip.destination?.stationName,
                        departureTime: trip.departureTime,
                        arrivalTime: trip.arrivalTime
                    },
                    vehicle: {
                        plateNumber: trip.vehicle?.plateNumber,
                        carType: trip.vehicle?.carType
                    },
                    actionURL: `${process.env.CLIENT_URL}/dashboard/bookings/${booking._id}/pay`,
                    actionText: 'Complete Payment'
                }
            };

            await NotificationService.createNotification(notificationData);
        } catch (notificationError) {
            console.error('Failed to send booking confirmation notification:', notificationError);
        }

        // Populate and return the booking
        const populatedBooking = await Booking.findById(booking._id)
            .populate('passengerID', 'fullName phoneNumber email')
            .populate('tripID', 'tripNumber origin destination departureTime arrivalTime price')
            .populate('vehicleID', 'plateNumber carType totalCapacity')
            .populate('createdBy', 'fullName');

        // Return as array for compatibility with frontend
        res.status(201).json({
            success: true,
            message: `${seats.length} seats booked successfully`,
            data: [populatedBooking] // Return as array with one item
        });

    } catch (error) {
        console.error('Create batch booking error:', error);

        if (error.code === 11000 && error.keyPattern?.bookingNumber) {
            return res.status(400).json({
                success: false,
                message: 'Booking number conflict. Please try again.',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Error creating batch booking'
        });
    }
};


export const getBookedSeatsForTrip = async (req, res) => {
    try {
        const { tripId } = req.params;

        // Verify trip exists
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Find all non-cancelled bookings for this trip
        // Only select seat numbers, no passenger info
        const bookings = await Booking.find({
            tripID: tripId,
            status: { $in: ['pending', 'confirmed'] }
        }).select('seatNumber seatNumbers -_id');

        // Extract all booked seat numbers into a Set to avoid duplicates
        const bookedSeats = new Set();

        bookings.forEach(booking => {
            // Handle both single seat and multiple seat bookings
            if (booking.seatNumbers && booking.seatNumbers.length > 0) {
                booking.seatNumbers.forEach(seat => bookedSeats.add(seat));
            } else if (booking.seatNumber) {
                bookedSeats.add(booking.seatNumber);
            }
        });

        // Convert Set to sorted array
        const bookedSeatsArray = Array.from(bookedSeats).sort((a, b) => a - b);

        console.log(`📊 Found ${bookedSeatsArray.length} booked seats for trip ${tripId}:`, bookedSeatsArray);

        // Return just the array of booked seat numbers (no passenger info)
        res.status(200).json({
            success: true,
            data: bookedSeatsArray
        });

    } catch (error) {
        console.error('Get booked seats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booked seats',
            error: error.message
        });
    }
};


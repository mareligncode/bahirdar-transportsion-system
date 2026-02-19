import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/Users.js';
import Station from '../models/Station.js';
import NotificationService from '../services/notificationService.js';

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
            passengerID: req.user.id,
            tripID: trip._id,
            vehicleID: trip.vehicle,
            seatNumber,
            specialRequests,
            passengerDetails: passengerDetails || {
                fullName: req.user.fullName,
                phoneNumber: req.user.phoneNumber,
                email: req.user.email,
                emergencyContact: req.user.emergencyContact
            },
            boardingPass,
            createdBy: req.user.id
        });

        trip.availableSeats -= 1;
        await trip.save();

        await booking.save();
        // Send booking confirmation notification
        try {
            const notificationData = {
                userID: req.user.id,
                title: 'Booking Confirmed - Your Trip is Ready!',
                message: `Your booking ${booking.bookingNumber} has been created successfully. Please proceed to payment to confirm your reservation.`,
                type: 'booking_confirmation',
                channel: 'all', // Send both email and in-app notification
                priority: 'medium',
                metadata: {
                    userName: req.user.fullName,
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

export const getAllBookings = async (req, res) => {
    try {
        const { status, tripID, passengerID, page = 1, limit = 20 } = req.query;

        // Build query based on user role
        let query = {};

        // Station admin can only see their station's bookings
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ manager: req.user._id });
            if (station) {
                query.stationID = station._id;
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
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !booking.tripID.station.equals(station._id)) {
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
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !booking.tripID.station.equals(station._id)) {
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
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !booking.tripID.station.equals(station._id)) {
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

        // Update trip available seats
        trip.availableSeats += 1;
        await trip.save();

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
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

        // Check permissions
        if (req.user.role === 'station_admin') {
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !booking.tripID.station.equals(station._id)) {
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

            // Update trip available seats
            const trip = await Trip.findById(booking.tripID);
            trip.availableSeats += 1;
            await trip.save();
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

        // Send booking cancellation notification if booking was cancelled
        if (status === 'cancelled') {
            try {
                const notificationData = {
                    userID: booking.passengerID,
                    title: 'Booking Cancelled - Refund Information',
                    message: `Your booking ${booking.bookingNumber} has been cancelled. ${cancellationReason ? `Reason: ${cancellationReason}` : 'Please contact support for more information.'}`,
                    type: 'booking_cancellation',
                    channel: 'all',
                    priority: 'high',
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
                        cancellation: {
                            reason: cancellationReason,
                            refundAmount: refundAmount || 0,
                            cancelledAt: new Date()
                        },
                        actionURL: `${process.env.CLIENT_URL}/dashboard/bookings`,
                        actionText: 'View Booking History'
                    }
                };

                await NotificationService.createNotification(notificationData);
            } catch (notificationError) {
                console.error('Failed to send booking cancellation notification:', notificationError);
            }
        }
        //end of notfication changes

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
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !booking.tripID.station.equals(station._id)) {
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
            const station = await Station.findOne({ managerID: req.user.id });
            if (station && !trip.station.equals(station._id)) {
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
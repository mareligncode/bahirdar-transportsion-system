import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/Users.js';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import Route from '../models/Route.js';
import mongoose from 'mongoose';

export const getDashboardStats = async (req, res) => {
    try {
        const { stationId } = req.query;
        let effectiveStationId = stationId;
        let matchQuery = {};

        if (req.user.role === 'station_admin') {
            effectiveStationId = req.user.stationID.toString();
        }

        if (effectiveStationId) {
            const tripsAtStation = await Trip.find({ origin: effectiveStationId }).select('_id');
            const tripIds = tripsAtStation.map(t => t._id);
            matchQuery.tripID = { $in: tripIds };
        }

        const [
            totalUsers,
            totalVehicles,
            totalStations,
            totalRoutes,
            totalBookings,
            totalRevenue
        ] = await Promise.all([
            User.countDocuments(),
            Vehicle.countDocuments(),
            Station.countDocuments(),
            Route.countDocuments(),
            Booking.countDocuments(matchQuery),
            Payment.aggregate([
                {
                    $lookup: {
                        from: 'bookings',
                        localField: 'bookingID',
                        foreignField: '_id',
                        as: 'booking'
                    }
                },
                { $unwind: '$booking' },
                {
                    $match: {
                        paymentStatus: 'success',
                        ...(effectiveStationId ? { 'booking.tripID': { $in: await getTripIdsByStation(effectiveStationId) } } : {})
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                vehicles: totalVehicles,
                stations: totalStations,
                routes: totalRoutes,
                bookings: totalBookings,
                revenue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTripIdsByStation = async (stationId) => {
    const trips = await Trip.find({ origin: stationId }).select('_id');
    return trips.map(t => t._id);
};

export const getRevenueReport = async (req, res) => {
    try {
        let { period = 'month', stationId } = req.query;

        if (req.user.role === 'station_admin') {
            stationId = req.user.stationID.toString();
        }

        let groupBy = {
            $dateToString: { format: "%Y-%m", date: "$createdAt" }
        };

        if (period === 'day') {
            groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        } else if (period === 'year') {
            groupBy = { $dateToString: { format: "%Y", date: "$createdAt" } };
        }

        const matchStage = { paymentStatus: 'success' };

        const pipeline = [
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'bookingID',
                    foreignField: '_id',
                    as: 'booking'
                }
            },
            { $unwind: '$booking' }
        ];

        if (stationId) {
            const tripIds = await getTripIdsByStation(stationId);
            pipeline.push({ $match: { 'booking.tripID': { $in: tripIds } } });
        }

        pipeline.push(
            { $match: matchStage },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        );

        const revenueData = await Payment.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: revenueData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookingStats = async (req, res) => {
    try {
        const { stationId } = req.query;
        let effectiveStationId = stationId;
        let matchQuery = {};

        if (req.user.role === 'station_admin') {
            effectiveStationId = req.user.stationID.toString();
        }

        if (effectiveStationId) {
            const tripIds = await getTripIdsByStation(effectiveStationId);
            matchQuery.tripID = { $in: tripIds };
        }

        const stats = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const trends = await Booking.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                statusDistribution: stats,
                dailyTrends: trends
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStationPerformance = async (req, res) => {
    try {
        let matchQuery = {};
        if (req.user.role === 'station_admin') {
            matchQuery = { 'trip.origin': new mongoose.Types.ObjectId(req.user.stationID) };
        }

        const stats = await Booking.aggregate([
            {
                $lookup: {
                    from: 'trips',
                    localField: 'tripID',
                    foreignField: '_id',
                    as: 'trip'
                }
            },
            { $unwind: '$trip' },
            { $match: matchQuery },
            {
                $group: {
                    _id: '$trip.origin',
                    totalBookings: { $sum: 1 },
                    revenue: { $sum: '$totalPrice' }
                }
            },
            {
                $lookup: {
                    from: 'stations',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'station'
                }
            },
            { $unwind: '$station' },
            {
                $project: {
                    _id: 1,
                    name: '$station.stationName',
                    city: '$station.city',
                    totalBookings: 1,
                    revenue: 1
                }
            },
            { $sort: { totalBookings: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStationsControl = async (req, res) => {
    try {
        const stations = await Station.find().select('name location city');
        res.status(200).json({
            success: true,
            data: stations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        let { stationId } = req.query;
        let bookingMatch = {};

        if (req.user.role === 'station_admin') {
            stationId = req.user.stationID.toString();
        }

        if (stationId) {
            const tripIds = await getTripIdsByStation(stationId);
            bookingMatch.tripID = { $in: tripIds };
        }

        const [recentBookings, recentPayments] = await Promise.all([
            Booking.find(bookingMatch).sort({ createdAt: -1 }).limit(10).populate('passengerID tripID'),
            Payment.find().sort({ createdAt: -1 }).limit(10).populate('passengerID')
        ]);

        res.status(200).json({
            success: true,
            data: {
                bookings: recentBookings,
                payments: recentPayments
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

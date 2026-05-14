import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import dotenv from 'dotenv'

dotenv.config()
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import http from 'http'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import initSuperAdmin from './config/initSuperAdmin.js'
import authRoutes from './routes/authRoutes.js'
import stationRoutes from './routes/stationRoutes.js'
import vehicleRoutes from './routes/vehicleRoutes.js'
import connectDB from './config/database.js'
import tripRoutes from './routes/tripRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import queueRoutes from './routes/queueRoutes.js'
import routeRoutes from './routes/routeRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import LocationSimulator from './services/locationSimulator.js';

connectDB()
initSuperAdmin()

const PORT = process.env.PORT || 5000
const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const allowedOrigins = [
    "https://bahirdar-transportsion-system-et.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://bahirdar-transportsion-system.onrender.com",
    "https://bahirdar-transportsion-system-frontend.onrender.com"
].filter(Boolean);

const checkOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
    }
    // Allow all in production for now if needed to fix all problems
    return callback(null, true);
};

const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            return callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["ngrok-skip-browser-warning"]
    }
});

global.io = io;
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-user-room', (userID) => {
        socket.join(`user-${userID}`);
        console.log(`User ${userID} joined room user-${userID}`);
    });

    socket.on('join-trip', (tripID) => {
        socket.join(`trip-${tripID}`);
        console.log(`Socket ${socket.id} joined trip room: trip-${tripID}`);
    });

    socket.on('update-location', async (data) => {
        const { tripId, latitude, longitude } = data;

        if (!tripId || !latitude || !longitude) return;

        // Broadcast to specific trip room (for passengers following a specific bus)
        io.to(`trip-${tripId}`).emit('location-broadcast', {
            latitude,
            longitude,
            timestamp: new Date()
        });

        // Broadcast to Public Live Map
        io.emit('trip-location-update', {
            tripId,
            coordinates: [latitude, longitude],
            isGPS: true,
            timestamp: new Date()
        });

        // PERSIST the real-time status to the database (and vehicle location)
        try {
            await mongoose.model('Trip').findByIdAndUpdate(tripId, {
                currentCoordinates: { lat: latitude, lng: longitude },
                isRealtimeTracking: true,
                lastGpsUpdate: new Date()
            });
        } catch (err) {
            console.error('Failed to update trip GPS status:', err);
        }

        try {
            await mongoose.model('Vehicle').findByIdAndUpdate(vehicleID, {
                lastKnownLocation: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                locationUpdatedAt: new Date()
            });
        } catch (err) {
            console.error('Failed to save last known location:', err);
        }
    });

    socket.on('join-public-map', () => {
        socket.join('public-live-map');
        console.log(`Socket ${socket.id} joined public live map`);
    });

    socket.on('join-admin-room', (userID) => {
        socket.join('admin-room');
        console.log(`Admin ${userID} joined admin room`);
    });

    socket.on('leave-room', (room) => {
        socket.leave(room);
        console.log(`User left room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow raw ngrok/socket connections
    crossOriginResourcePolicy: false
}));
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after an hour'
    }
});

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in development
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma', 'Expires', 'ngrok-skip-browser-warning']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use('/api', generalLimiter);
// app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes)
app.use('/api/notifications', notificationRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/reports', reportRoutes);
app.set('io', io);

app.get("/", (req, res) => {
    res.send("Bahir Dar Transport System API is running ...")
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Socket.io enabled for real-time notifications`)

    // Start Live Location Simulation
    const simulator = new LocationSimulator(io);
    simulator.start();
});


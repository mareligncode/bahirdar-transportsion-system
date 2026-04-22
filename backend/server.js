import express from 'express'
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
connectDB()
initSuperAdmin()

const PORT = process.env.PORT || 5000
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
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
        const { tripID, vehicleID, latitude, longitude, speed } = data;

        if (!tripID || !latitude || !longitude) return;

        io.to(`trip-${tripID}`).emit('location-broadcast', {
            vehicleID,
            latitude,
            longitude,
            speed,
            timestamp: new Date()
        });
        io.to('public-live-map').emit('public-location-update', {
            vehicleID,
            latitude,
            longitude,
            timestamp: new Date()
        });

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

app.use(helmet());
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
    limit: 10, 
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after an hour'
    }
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.set('io', io);

app.get("/", (req, res) => {
    res.send("Bahir Dar Transport System API is running ...")
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Socket.io enabled for real-time notifications`)
});


import express from 'express'
import cors from 'cors'
import initSuperAdmin from './config/initSuperAdmin.js'
import authRoutes from './routes/authRoutes.js'
import stationRoutes from './routes/stationRoutes.js'
import vehicleRoutes from './routes/vehicleRoutes.js'
import connectDB from './config/database.js'
import tripRoutes from './routes/tripRoutes.js'
connectDB()
initSuperAdmin()
const PORT = 5000
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/station', stationRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/trip',tripRoutes)

app.get("/", (req, res) => {
    res.send("server runinig ...")
})
app.listen(PORT, () => {
    console.log(`server runing http://localhost:${PORT}`)
})


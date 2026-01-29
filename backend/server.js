import express from 'express'
import cors from 'cors'
import initSuperAdmin from './config/initSuperAdmin.js'
import authRoutes from './routes/authRoutes.js'
import connectDB from './config/database.js'
connectDB()
initSuperAdmin()
const PORT = 5000
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);


app.listen(PORT, () => {
    console.log(`server runing http://localhost:${PORT}`)
})


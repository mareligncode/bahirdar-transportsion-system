import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
const connectdb = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI)
        console.log("databse connected")
    } catch (error) {
        console.log("database connection fail", error.message)
    }
}
export default connectdb

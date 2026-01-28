import express from 'express'
import cors from 'cors'
const app = express()
import connectdb from './config/database.js'
const PORT = 5000
connectdb()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))
app.get("/", (req,res) => {
    res.send("wellcome")
    
})
app.listen(PORT, () => {
    console.log(`server runing http://localhost:${PORT}`)
})


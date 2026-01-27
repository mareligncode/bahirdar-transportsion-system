import express from 'express'
import cors from 'cors'
const app = express()
const PORT=5000
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))
app.get("/", (req,res) => {
    res.send("wellcome")
    
})
app.listen(PORT, () => {
    console.log(`server runing on the port http://localhost:${PORT}`)
})
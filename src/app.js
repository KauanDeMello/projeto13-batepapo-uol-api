import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"

// Server 
const app = express()

// Setup
app.use(express.json())
app.use(cors())

// Database Setup
let db;
const mongoClient = new MongoClient("mongodb://localhost:27017/BatePapoUol")
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
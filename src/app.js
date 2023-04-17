import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"


// Server 
const app = express()

// Setup
app.use(express.json())
app.use(cors())
dotenv.config()

// Database Setup
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


// Joi Schema
const nameSchema = joi.string().trim().required()


// POST /participants
app.post('/participants', async (req, res) => {
    const { name } = req.body;
  
    
    const { error } = nameSchema.validate(name)
    if (error) {
      return res.status(422).json({ message: "O campo 'name' é obrigatório e deve ser uma string não vazia." })
    }
  
    
    const participantExists = await db.collection('participante').findOne({ name })
    if (participantExists) {
      return res.status(409).json({ message: "O nome escolhido já está em uso." })
    }
  
    
    const newParticipant = {
      name,
      lastStatus: Date.now()
    }
    await db.collection('participante').insertOne(newParticipant)
  
   
    const newMessage = {
      from: name,
      to: 'Todos',
      text: 'entra na sala...',
      type: 'status',
      time: dayjs().format('HH:mm:ss')
    }
    await db.collection('mensagem').insertOne(newMessage)
  
    
    return res.status(201).send()
  })

// Port Server
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))